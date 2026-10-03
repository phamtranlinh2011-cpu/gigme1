import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  pullThreshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  pullThreshold = 70,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggeredHapticRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    // Only pull when at the top of the page / scroll container
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop <= 2) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
      triggeredHapticRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || disabled || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      // Damped pull curve (diminishing return pull)
      const damped = Math.min(diff * 0.45, pullThreshold * 1.5);
      setPullDistance(damped);

      // Trigger tactile haptic when threshold reached
      if (damped >= pullThreshold && !triggeredHapticRef.current) {
        triggerHaptic('medium');
        triggeredHapticRef.current = true;
      } else if (damped < pullThreshold && triggeredHapticRef.current) {
        triggeredHapticRef.current = false;
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current || disabled) return;
    isPullingRef.current = false;

    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic('success');
      setPullDistance(pullThreshold * 0.85);

      try {
        await Promise.resolve(onRefresh());
      } catch (err) {
        console.warn('Pull-to-refresh action error:', err);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 400);
      }
    } else {
      setPullDistance(0);
    }
  };

  const isReached = pullDistance >= pullThreshold;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full"
    >
      {/* Pull indicator banner */}
      <div
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? Math.min(pullDistance / pullThreshold, 1) : 0,
        }}
        className="overflow-hidden transition-all duration-150 ease-out flex items-center justify-center w-full select-none pointer-events-none"
      >
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#12233B]/90 border border-[#C5E5EC]/30 shadow-lg text-xs font-bold backdrop-blur-md">
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 text-[#E0FAEB] animate-spin" />
              <span className="text-[#E0FAEB] font-mono">Đang cập nhật việc làm mới...</span>
            </>
          ) : (
            <>
              <ArrowDown
                className={`w-4 h-4 text-[#C5E5EC] transition-transform duration-200 ${
                  isReached ? 'rotate-180 text-[#E0FAEB]' : ''
                }`}
              />
              <span className={isReached ? 'text-[#E0FAEB]' : 'text-[#C5E5EC]'}>
                {isReached ? 'Thả tay để làm mới ⚡' : 'Kéo xuống để làm mới'}
              </span>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};
