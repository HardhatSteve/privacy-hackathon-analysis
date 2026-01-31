import React, { useState } from 'react';
import { cn } from '../lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={cn(
          "absolute z-[100] w-64 p-3 bg-secondary border border-border rounded-xl text-xs font-medium text-foreground shadow-2xl animate-in fade-in zoom-in duration-200 pointer-events-none",
          positionClasses[position]
        )}>
          {content}
          <div className={cn(
            "absolute w-2 h-2 bg-secondary border-b border-r border-border transform rotate-45",
            position === 'top' && "bottom-[-5px] left-1/2 -translate-x-1/2 border-t-0 border-l-0",
            position === 'bottom' && "top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0 rotate-[225deg]",
          )} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;