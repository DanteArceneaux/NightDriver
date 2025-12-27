import React, { useState, useEffect, useCallback } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CardConfig {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  resizable?: boolean;
  collapsible?: boolean;
}

interface DraggableCardGridProps {
  cards: CardConfig[];
  storageKey?: string;
  className?: string;
  onOrderChange?: (newOrder: string[]) => void;
}

interface CardState {
  id: string;
  height: number;
  collapsed: boolean;
  maximized: boolean;
}

export function DraggableCardGrid({
  cards,
  storageKey = 'card-grid-layout',
  className,
  onOrderChange,
}: DraggableCardGridProps) {
  // Initialize order from localStorage or default
  const [order, setOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${storageKey}-order`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return cards.map(c => c.id);
      }
    }
    return cards.map(c => c.id);
  });

  // Initialize card states from localStorage
  const [cardStates, setCardStates] = useState<Record<string, CardState>>(() => {
    const saved = localStorage.getItem(`${storageKey}-states`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  // Sync order with cards if new cards are added
  useEffect(() => {
    const cardIds = cards.map(c => c.id);
    const newOrder = order.filter(id => cardIds.includes(id));
    const missingIds = cardIds.filter(id => !order.includes(id));
    if (missingIds.length > 0 || newOrder.length !== order.length) {
      setOrder([...newOrder, ...missingIds]);
    }
  }, [cards, order]);

  // Save order to localStorage
  useEffect(() => {
    localStorage.setItem(`${storageKey}-order`, JSON.stringify(order));
    onOrderChange?.(order);
  }, [order, storageKey, onOrderChange]);

  // Save card states to localStorage
  useEffect(() => {
    localStorage.setItem(`${storageKey}-states`, JSON.stringify(cardStates));
  }, [cardStates, storageKey]);

  // Get sorted cards based on order
  const sortedCards = order
    .map(id => cards.find(c => c.id === id))
    .filter((c): c is CardConfig => c !== undefined);

  // Update card height
  const updateCardHeight = useCallback((cardId: string, height: number) => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], id: cardId, height, collapsed: prev[cardId]?.collapsed ?? false, maximized: false },
    }));
  }, []);

  // Toggle collapsed
  const toggleCollapsed = useCallback((cardId: string) => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: { 
        ...prev[cardId], 
        id: cardId, 
        collapsed: !prev[cardId]?.collapsed,
        height: prev[cardId]?.height ?? 300,
        maximized: false,
      },
    }));
  }, []);

  // Toggle maximized
  const toggleMaximized = useCallback((cardId: string) => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: { 
        ...prev[cardId], 
        id: cardId, 
        maximized: !prev[cardId]?.maximized,
        height: prev[cardId]?.height ?? 300,
        collapsed: false,
      },
    }));
  }, []);

  return (
    <Reorder.Group
      axis="y"
      values={order}
      onReorder={setOrder}
      className={cn('flex flex-col gap-4', className)}
    >
      {sortedCards.map((card) => {
        const state = cardStates[card.id];
        const height = state?.height ?? card.defaultHeight ?? 300;
        const isCollapsed = state?.collapsed ?? false;
        const isMaximized = state?.maximized ?? false;

        return (
          <ReorderableCard
            key={card.id}
            card={card}
            height={height}
            isCollapsed={isCollapsed}
            isMaximized={isMaximized}
            onHeightChange={(h) => updateCardHeight(card.id, h)}
            onToggleCollapse={() => toggleCollapsed(card.id)}
            onToggleMaximize={() => toggleMaximized(card.id)}
            minHeight={card.minHeight ?? 150}
            maxHeight={card.maxHeight ?? 800}
          />
        );
      })}
    </Reorder.Group>
  );
}

interface ReorderableCardProps {
  card: CardConfig;
  height: number;
  isCollapsed: boolean;
  isMaximized: boolean;
  onHeightChange: (height: number) => void;
  onToggleCollapse: () => void;
  onToggleMaximize: () => void;
  minHeight: number;
  maxHeight: number;
}

function ReorderableCard({
  card,
  height,
  isCollapsed,
  isMaximized,
  onHeightChange,
  onToggleCollapse,
  onToggleMaximize,
  minHeight,
  maxHeight,
}: ReorderableCardProps) {
  const dragControls = useDragControls();
  const [isResizing, setIsResizing] = useState(false);
  const [localHeight, setLocalHeight] = useState(height);

  // Sync local height with prop
  useEffect(() => {
    setLocalHeight(height);
  }, [height]);

  // Handle resize
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startHeight = localHeight;

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + deltaY));
      setLocalHeight(newHeight);
    };

    const handleEnd = () => {
      setIsResizing(false);
      onHeightChange(localHeight);
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleEnd);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleEnd);
  }, [localHeight, minHeight, maxHeight, onHeightChange]);

  const cardHeight = isCollapsed ? 'auto' : isMaximized ? 'calc(100vh - 200px)' : `${localHeight}px`;

  return (
    <Reorder.Item
      value={card.id}
      dragListener={false}
      dragControls={dragControls}
      className="relative"
      whileDrag={{ scale: 1.02, zIndex: 50 }}
    >
      <motion.div
        className={cn(
          'rounded-2xl overflow-hidden',
          'bg-glass-dark/60 backdrop-blur-xl border border-white/10',
          'shadow-xl transition-shadow',
          isResizing && 'select-none'
        )}
        style={{ height: cardHeight }}
        layout
      >
        {/* Header with drag handle */}
        <div
          className={cn(
            'flex items-center justify-between px-4 py-2 border-b border-white/10',
            'bg-gradient-to-r from-theme-primary/10 to-theme-secondary/10',
            'cursor-grab active:cursor-grabbing'
          )}
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-white/40" />
            {card.icon}
            <span className="font-semibold text-white text-sm">{card.title}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {card.collapsible !== false && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              >
                <motion.div
                  animate={{ rotate: isCollapsed ? 180 : 0 }}
                  className="w-4 h-4 text-white/60"
                >
                  ▼
                </motion.div>
              </button>
            )}
            {card.resizable !== false && (
              <button
                onClick={onToggleMaximize}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? (
                  <Minimize2 className="w-4 h-4 text-white/60" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-white/60" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <motion.div
          className={cn('w-full overflow-hidden', isCollapsed && 'hidden')}
          style={{ height: isCollapsed ? 0 : 'calc(100% - 44px)' }}
          animate={{ opacity: isCollapsed ? 0 : 1 }}
        >
          {card.content}
        </motion.div>

        {/* Resize handle */}
        {card.resizable !== false && !isCollapsed && !isMaximized && (
          <div
            className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize group"
            onPointerDown={handleResizeStart}
          >
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-white/20 group-hover:bg-theme-primary/50 transition-colors" />
          </div>
        )}
      </motion.div>
    </Reorder.Item>
  );
}

export default DraggableCardGrid;

