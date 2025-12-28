import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ResizableLayoutCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  cardId: string;
  defaultSize?: { width: string | number; height: string | number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  resizable?: boolean;
  draggable?: boolean;
  className?: string;
  onPositionChange?: (cardId: string, position: { x: number; y: number }) => void;
  onSizeChange?: (cardId: string, size: { width: number; height: number }) => void;
  order?: number;
  onOrderChange?: (cardId: string, newOrder: number) => void;
  showHeader?: boolean;
}

export function ResizableLayoutCard({
  children,
  title,
  icon,
  cardId,
  defaultSize = { width: '100%', height: 400 },
  minSize = { width: 200, height: 200 },
  maxSize = { width: 2000, height: 1200 },
  resizable = true,
  draggable = true,
  className,
  onSizeChange,
  showHeader = true,
}: ResizableLayoutCardProps) {
  const [size, setSize] = useState(defaultSize);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Load saved size from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('cockpit-layout');
    if (savedLayout) {
      try {
        const layout = JSON.parse(savedLayout);
        if (layout[cardId]?.size) {
          setSize(layout[cardId].size);
        }
      } catch (e) {
        console.error('Failed to load layout:', e);
      }
    }
  }, [cardId]);

  // Save size to localStorage
  const saveSize = useCallback((newSize: typeof size) => {
    const savedLayout = localStorage.getItem('cockpit-layout');
    const layout = savedLayout ? JSON.parse(savedLayout) : {};
    layout[cardId] = { ...layout[cardId], size: newSize };
    localStorage.setItem('cockpit-layout', JSON.stringify(layout));
    onSizeChange?.(cardId, { 
      width: typeof newSize.width === 'number' ? newSize.width : 0, 
      height: typeof newSize.height === 'number' ? newSize.height : 0 
    });
  }, [cardId, onSizeChange]);

  // Handle resize from bottom edge
  const handleResizeY = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startHeight = typeof size.height === 'number' ? size.height : cardRef.current?.offsetHeight || 400;

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.min(maxSize.height, Math.max(minSize.height, startHeight + deltaY));
      setSize(prev => ({ ...prev, height: newHeight }));
    };

    const handleEnd = () => {
      setIsResizing(false);
      saveSize(size);
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleEnd);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleEnd);
  }, [size, minSize.height, maxSize.height, saveSize]);

  // Handle resize from corner
  const handleResizeCorner = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: typeof size.width === 'number' ? size.width : cardRef.current?.offsetWidth || 400,
      height: typeof size.height === 'number' ? size.height : cardRef.current?.offsetHeight || 400,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - resizeStartRef.current.x;
      const deltaY = moveEvent.clientY - resizeStartRef.current.y;
      
      const newWidth = Math.min(maxSize.width, Math.max(minSize.width, resizeStartRef.current.width + deltaX));
      const newHeight = Math.min(maxSize.height, Math.max(minSize.height, resizeStartRef.current.height + deltaY));
      
      setSize({ width: newWidth, height: newHeight });
    };

    const handleEnd = () => {
      setIsResizing(false);
      saveSize(size);
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleEnd);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleEnd);
  }, [size, minSize, maxSize, saveSize]);

  // Toggle maximize
  const handleMaximize = useCallback(() => {
    if (isMaximized) {
      // Restore to previous size
      const savedLayout = localStorage.getItem('cockpit-layout');
      if (savedLayout) {
        const layout = JSON.parse(savedLayout);
        if (layout[cardId]?.size) {
          setSize(layout[cardId].size);
        } else {
          setSize(defaultSize);
        }
      } else {
        setSize(defaultSize);
      }
    } else {
      // Maximize to viewport
      setSize({ width: '100%', height: window.innerHeight - 200 });
    }
    setIsMaximized(!isMaximized);
  }, [isMaximized, cardId, defaultSize]);

  // Handle drag for reordering
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    setIsDragging(false);
    // If dragged significantly, we might want to reorder
    // For now, cards snap back - reordering is handled by parent
    console.log('Card drag ended:', cardId, info.offset);
  }, [cardId]);

  const cardStyle: React.CSSProperties = {
    width: typeof size.width === 'number' ? `${size.width}px` : size.width,
    height: typeof size.height === 'number' ? `${size.height}px` : size.height,
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'bg-glass-dark/60 backdrop-blur-xl border border-white/10',
        'shadow-2xl transition-shadow',
        isDragging && 'shadow-[0_0_30px_rgba(0,255,238,0.3)] z-50',
        isResizing && 'select-none',
        className
      )}
      style={cardStyle}
      layout
      layoutId={cardId}
      drag={draggable && !isResizing ? 'y' : false}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02, zIndex: 100 }}
    >
      {/* Optional Header with drag handle */}
      {showHeader && title && (
        <div
          className={cn(
            'flex items-center justify-between px-4 py-2 border-b border-white/10',
            'bg-gradient-to-r from-theme-primary/10 to-theme-secondary/10',
            draggable && 'cursor-grab active:cursor-grabbing'
          )}
          onPointerDown={(e) => {
            if (draggable) {
              dragControls.start(e);
            }
          }}
        >
          <div className="flex items-center gap-2">
            {draggable && (
              <GripVertical className="w-4 h-4 text-white/40" />
            )}
            {icon}
            <span className="font-semibold text-white text-sm">{title}</span>
          </div>
          
          {resizable && (
            <button
              onClick={handleMaximize}
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
      )}

      {/* Content */}
      <div className="w-full h-full">
        {children}
      </div>

      {/* Bottom resize handle */}
      {resizable && !isMaximized && (
        <div
          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize group"
          onPointerDown={handleResizeY}
        >
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-white/20 group-hover:bg-theme-primary/50 transition-colors" />
        </div>
      )}

      {/* Corner resize handle */}
      {resizable && !isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
          onPointerDown={handleResizeCorner}
        >
          <svg
            className="w-4 h-4 absolute bottom-1 right-1 text-white/30 hover:text-theme-primary/60 transition-colors"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

export default ResizableLayoutCard;



