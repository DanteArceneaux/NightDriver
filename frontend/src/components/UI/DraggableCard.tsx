import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { X, Minus, Maximize2, Minimize2, GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DraggableCardProps {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  isOpen: boolean;
  onClose: () => void;
  collapsible?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  className?: string;
  headerClassName?: string;
  zIndex?: number;
  onFocus?: () => void;
}

export function DraggableCard({
  children,
  title,
  icon,
  defaultPosition = { x: 0, y: 0 },
  defaultSize = { width: 320, height: 'auto' as any },
  minSize = { width: 200, height: 100 },
  maxSize = { width: 600, height: 800 },
  isOpen,
  onClose,
  collapsible = true,
  resizable = true,
  draggable = true,
  className,
  headerClassName,
  zIndex = 50,
  onFocus,
}: DraggableCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [, setIsDragging] = useState(false);
  const [, setIsResizing] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Reset position when card opens
  useEffect(() => {
    if (isOpen) {
      // Center the card on mobile
      if (window.innerWidth < 768) {
        setPosition({ x: 0, y: 0 });
      }
    }
  }, [isOpen]);

  // Handle drag end
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    setPosition(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y,
    }));
    setIsDragging(false);
  }, []);

  // Handle resize
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: typeof size.width === 'number' ? size.width : 320,
      height: typeof size.height === 'number' ? size.height : 200,
    };

    const handleResizeMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - resizeStartRef.current.x;
      const deltaY = moveEvent.clientY - resizeStartRef.current.y;
      
      const newWidth = Math.min(maxSize.width, Math.max(minSize.width, resizeStartRef.current.width + deltaX));
      const newHeight = Math.min(maxSize.height, Math.max(minSize.height, resizeStartRef.current.height + deltaY));
      
      setSize({ width: newWidth, height: newHeight });
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      document.removeEventListener('pointermove', handleResizeMove);
      document.removeEventListener('pointerup', handleResizeEnd);
    };

    document.addEventListener('pointermove', handleResizeMove);
    document.addEventListener('pointerup', handleResizeEnd);
  }, [size, minSize, maxSize]);

  // Toggle maximize
  const handleMaximize = useCallback(() => {
    if (isMaximized) {
      setSize(defaultSize);
      setPosition(defaultPosition);
    } else {
      setSize({ width: window.innerWidth - 32, height: window.innerHeight - 100 });
      setPosition({ x: 0, y: 0 });
    }
    setIsMaximized(!isMaximized);
  }, [isMaximized, defaultSize, defaultPosition]);

  if (!isOpen) return null;

  const cardStyle = {
    width: isMaximized ? '100%' : (typeof size.width === 'number' ? `${size.width}px` : size.width),
    height: isCollapsed ? 'auto' : (isMaximized ? '100%' : (typeof size.height === 'number' ? `${size.height}px` : size.height)),
    zIndex,
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'fixed bg-glass-dark/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl',
        'overflow-hidden flex flex-col',
        isMaximized && 'inset-4 !w-auto !h-auto',
        !isMaximized && 'max-w-[calc(100vw-16px)] max-h-[calc(100vh-100px)]',
        className
      )}
      style={cardStyle}
      initial={{ opacity: 0, scale: 0.9, x: position.x, y: position.y }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: isMaximized ? 0 : position.x,
        y: isMaximized ? 0 : position.y,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      drag={draggable && !isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onClick={onFocus}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {/* Header - Drag Handle */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 border-b border-white/10',
          'bg-gradient-to-r from-theme-primary/20 to-theme-secondary/20',
          draggable && 'cursor-grab active:cursor-grabbing',
          headerClassName
        )}
        onPointerDown={(e) => {
          if (draggable && !isMaximized) {
            dragControls.start(e);
          }
        }}
      >
        <div className="flex items-center gap-2">
          {draggable && !isMaximized && (
            <GripVertical className="w-4 h-4 text-white/40" />
          )}
          {icon}
          <h3 className="font-semibold text-white text-sm md:text-base truncate">
            {title}
          </h3>
        </div>
        
        <div className="flex items-center gap-1">
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <Minus className="w-4 h-4 text-white/60" />
            </button>
          )}
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
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white/60 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        className={cn(
          'flex-1 overflow-auto',
          isCollapsed && 'hidden'
        )}
        initial={false}
        animate={{ height: isCollapsed ? 0 : 'auto' }}
      >
        {children}
      </motion.div>

      {/* Resize Handle */}
      {resizable && !isMaximized && !isCollapsed && (
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
          onPointerDown={handleResizeStart}
        >
          <svg
            className="w-4 h-4 absolute bottom-1 right-1 text-white/30"
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

export default DraggableCard;

