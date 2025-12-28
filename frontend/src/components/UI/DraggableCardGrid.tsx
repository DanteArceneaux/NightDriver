import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Maximize2, Minimize2, Lock, Unlock, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SafeStorage } from '../../lib/safeStorage';

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
  allowScroll?: boolean; // If true, card content will scroll instead of clip
}

interface DraggableCardGridProps {
  cards: CardConfig[];
  storageKey?: string;
  className?: string;
  onOrderChange?: (newOrder: string[]) => void;
  showLayoutControls?: boolean; // Show lock/reset buttons
  externalLocked?: boolean; // Use external lock state (managed by parent)
  hideLockButton?: boolean; // Hide the lock button (when managed in header)
}

interface CardState {
  id: string;
  height: number;
  collapsed: boolean;
  maximized: boolean;
}

// Layout version - increment to reset user layouts when defaults change
const LAYOUT_VERSION = 2;

export function DraggableCardGrid({
  cards,
  storageKey = 'card-grid-layout',
  className,
  onOrderChange,
  showLayoutControls = true,
  externalLocked,
  hideLockButton = false,
}: DraggableCardGridProps) {
  // Lock/Edit mode state - use external if provided, otherwise manage internally
  const [internalLocked, setInternalLocked] = useState(() => {
    if (externalLocked !== undefined) return externalLocked;
    const saved = SafeStorage.getItem(`${storageKey}-locked`);
    return saved ? JSON.parse(saved) : true;
  });
  
  // Use external lock state if provided, otherwise use internal
  const isLocked = externalLocked !== undefined ? externalLocked : internalLocked;
  // Initialize order from localStorage or default (with version check)
  const [order, setOrder] = useState<string[]>(() => {
    const savedVersion = SafeStorage.getItem(`${storageKey}-version`);
    const currentVersion = LAYOUT_VERSION.toString();
    
    // Reset if version changed
    if (savedVersion !== currentVersion) {
      SafeStorage.removeItem(`${storageKey}-order`);
      SafeStorage.removeItem(`${storageKey}-states`);
      SafeStorage.setItem(`${storageKey}-version`, currentVersion);
      return cards.map(c => c.id);
    }
    
    const saved = SafeStorage.getItem(`${storageKey}-order`);
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
    const savedVersion = SafeStorage.getItem(`${storageKey}-version`);
    const currentVersion = LAYOUT_VERSION.toString();
    
    // Skip if version mismatch (already handled above)
    if (savedVersion !== currentVersion) {
      return {};
    }
    
    const saved = SafeStorage.getItem(`${storageKey}-states`);
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
    SafeStorage.setItem(`${storageKey}-order`, JSON.stringify(order));
    onOrderChange?.(order);
  }, [order, storageKey, onOrderChange]);

  // Save card states to localStorage
  useEffect(() => {
    SafeStorage.setItem(`${storageKey}-states`, JSON.stringify(cardStates));
  }, [cardStates, storageKey]);

  // Save lock state to localStorage (only if managing internally)
  useEffect(() => {
    if (externalLocked === undefined) {
      SafeStorage.setItem(`${storageKey}-locked`, JSON.stringify(internalLocked));
    }
  }, [internalLocked, storageKey, externalLocked]);

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

  // Reset layout to defaults
  const resetLayout = useCallback(() => {
    localStorage.removeItem(`${storageKey}-order`);
    localStorage.removeItem(`${storageKey}-states`);
    setOrder(cards.map(c => c.id));
    setCardStates({});
  }, [cards, storageKey]);

  // Apply preset
  const applyPreset = useCallback((preset: 'minimal' | 'balanced' | 'data-heavy') => {
    const newStates: Record<string, CardState> = {};
    
    switch (preset) {
      case 'minimal':
        // Map + Top Pick only, rest collapsed
        cards.forEach(card => {
          if (card.id === 'map') {
            newStates[card.id] = { id: card.id, height: 600, collapsed: false, maximized: false };
          } else if (card.id === 'top-pick') {
            newStates[card.id] = { id: card.id, height: card.defaultHeight ?? 300, collapsed: false, maximized: false };
          } else {
            newStates[card.id] = { id: card.id, height: card.defaultHeight ?? 300, collapsed: true, maximized: false };
          }
        });
        setOrder(['map', 'top-pick', ...cards.filter(c => c.id !== 'map' && c.id !== 'top-pick').map(c => c.id)]);
        break;
        
      case 'balanced':
        // Default sizes, standard order
        resetLayout();
        return;
        
      case 'data-heavy':
        // All expanded with generous heights
        cards.forEach(card => {
          newStates[card.id] = { 
            id: card.id, 
            height: Math.min((card.defaultHeight ?? 300) * 1.3, card.maxHeight ?? 800), 
            collapsed: false, 
            maximized: false 
          };
        });
        break;
    }
    
    setCardStates(newStates);
  }, [cards, resetLayout]);

  return (
    <div className="relative">
      {/* Layout Controls */}
      {showLayoutControls && (
        <div className="flex items-center justify-end gap-2 mb-4">
          {!hideLockButton && (
            <button
              onClick={() => setInternalLocked(!internalLocked)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                isLocked
                  ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                  : 'bg-neon-orange/20 text-neon-orange border border-neon-orange/50'
              )}
              aria-label={isLocked ? 'Unlock layout to edit' : 'Lock layout to prevent accidental changes'}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{isLocked ? 'Locked' : 'Editing'}</span>
            </button>
          )}
          
          {!isLocked && (
            <>
              <div className="h-4 w-px bg-white/20" />
              
              <button
                onClick={() => applyPreset('minimal')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Apply minimal layout preset"
              >
                Minimal
              </button>
              
              <button
                onClick={() => applyPreset('balanced')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Apply balanced layout preset"
              >
                Balanced
              </button>
              
              <button
                onClick={() => applyPreset('data-heavy')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Apply data-heavy layout preset"
              >
                Data
              </button>
              
              <div className="h-4 w-px bg-white/20" />
              
              <button
                onClick={resetLayout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 transition-colors"
                aria-label="Reset layout to defaults"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </>
          )}
        </div>
      )}
      
      <Reorder.Group
        axis="y"
        values={order}
        onReorder={isLocked ? () => {} : setOrder}
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
              isLocked={isLocked}
              onHeightChange={(h) => updateCardHeight(card.id, h)}
              onToggleCollapse={() => toggleCollapsed(card.id)}
              onToggleMaximize={() => toggleMaximized(card.id)}
              minHeight={card.minHeight ?? 150}
              maxHeight={card.maxHeight ?? 800}
            />
          );
        })}
      </Reorder.Group>
    </div>
  );
}

interface ReorderableCardProps {
  card: CardConfig;
  height: number;
  isCollapsed: boolean;
  isMaximized: boolean;
  isLocked: boolean;
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
  isLocked,
  onHeightChange,
  onToggleCollapse,
  onToggleMaximize,
  minHeight,
  maxHeight,
}: ReorderableCardProps) {
  const dragControls = useDragControls();
  const [isResizing, setIsResizing] = useState(false);
  const [localHeight, setLocalHeight] = useState(height);
  const heightRef = useRef(height); // Fix: Use ref to capture latest height

  // Sync local height with prop
  useEffect(() => {
    setLocalHeight(height);
    heightRef.current = height;
  }, [height]);

  // Handle resize with fixed persistence bug
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startHeight = heightRef.current;

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + deltaY));
      setLocalHeight(newHeight);
      heightRef.current = newHeight; // Update ref during resize
    };

    const handleEnd = () => {
      setIsResizing(false);
      onHeightChange(heightRef.current); // Use ref value, not closure
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleEnd);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleEnd);
  }, [minHeight, maxHeight, onHeightChange]);

  const cardHeight = isCollapsed ? 'auto' : isMaximized ? 'calc(100vh - 200px)' : `${localHeight}px`;
  
  // Determine overflow behavior based on card config
  const contentOverflow = card.allowScroll ? 'overflow-auto' : 'overflow-hidden';

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
          isResizing && 'select-none',
          isLocked && 'cursor-default'
        )}
        style={{ height: cardHeight }}
        layout
      >
        {/* Header with drag handle */}
        <div
          className={cn(
            'flex items-center justify-between px-4 py-2 border-b border-white/10',
            'bg-gradient-to-r from-theme-primary/10 to-theme-secondary/10',
            !isLocked && 'cursor-grab active:cursor-grabbing',
            isLocked && 'cursor-default'
          )}
          onPointerDown={(e) => !isLocked && dragControls.start(e)}
        >
          <div className="flex items-center gap-2">
            {!isLocked && <GripVertical className="w-4 h-4 text-white/40" />}
            {card.icon}
            <span className="font-semibold text-white text-sm">{card.title}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {card.collapsible !== false && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
                aria-label={isCollapsed ? `Expand ${card.title}` : `Collapse ${card.title}`}
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
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
                aria-label={isMaximized ? `Restore ${card.title}` : `Maximize ${card.title}`}
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
          className={cn('w-full', contentOverflow, isCollapsed && 'hidden')}
          style={{ height: isCollapsed ? 0 : 'calc(100% - 44px)' }}
          animate={{ opacity: isCollapsed ? 0 : 1 }}
        >
          {card.content}
        </motion.div>

        {/* Resize handle - hidden when locked */}
        {!isLocked && card.resizable !== false && !isCollapsed && !isMaximized && (
          <div
            className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize group"
            onPointerDown={handleResizeStart}
            aria-label={`Resize ${card.title}`}
          >
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-white/20 group-hover:bg-theme-primary/50 transition-colors" />
          </div>
        )}
      </motion.div>
    </Reorder.Item>
  );
}

export default DraggableCardGrid;

