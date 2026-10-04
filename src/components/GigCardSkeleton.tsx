import React from 'react';

interface GigCardSkeletonProps {
  isSnapCard?: boolean;
}

export const GigCardSkeleton: React.FC<GigCardSkeletonProps> = ({ isSnapCard = false }) => {
  return (
    <div
      className={`relative rounded-2xl p-4 flex flex-col justify-between border border-[#C5E5EC]/15 bg-[#0E1B2E] overflow-hidden ${
        isSnapCard
          ? 'scroll-snap-card snap-center sm:snap-start shrink-0 w-[84vw] max-w-[340px] sm:w-[320px] md:w-[340px] shadow-lg'
          : 'w-full'
      }`}
    >
      {/* Animated Shimmer Ray Overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />

      {/* Top Header Row */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-1.5">
            {/* Category badge skeleton */}
            <div className="h-5 w-24 rounded-md bg-[#162A45] animate-pulse" />
            {/* Urgency tag skeleton */}
            <div className="h-5 w-14 rounded-md bg-amber-500/20 animate-pulse hidden sm:block" />
          </div>
          {/* Distance pill skeleton */}
          <div className="h-5 w-16 rounded-md bg-[#3064AE]/20 border border-[#C5E5EC]/10 animate-pulse" />
        </div>

        {/* Title skeleton: 2 lines */}
        <div className="space-y-1.5 mb-2.5">
          <div className="h-4 w-4/5 rounded-md bg-[#1A3152] animate-pulse" />
          <div className="h-4 w-3/5 rounded-md bg-[#162A45] animate-pulse" />
        </div>

        {/* Client poster row skeleton */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-[#1A3152] animate-pulse shrink-0" />
          <div className="h-3.5 w-28 rounded-md bg-[#162A45] animate-pulse" />
          <div className="h-3.5 w-12 rounded-md bg-[#E0FAEB]/15 border border-[#E0FAEB]/20 animate-pulse" />
        </div>

        {/* Description snippet skeleton */}
        <div className="space-y-1.5 mb-4">
          <div className="h-3 w-full rounded-md bg-[#13243C] animate-pulse" />
          <div className="h-3 w-5/6 rounded-md bg-[#111F33] animate-pulse" />
        </div>
      </div>

      {/* Footer & Pricing Row */}
      <div className="pt-2.5 border-t border-[#C5E5EC]/10">
        <div className="flex items-center justify-between mb-2.5">
          {/* Duration badge skeleton */}
          <div className="h-4 w-20 rounded-md bg-[#13243C] animate-pulse" />
          {/* Workers needed badge skeleton */}
          <div className="h-4 w-16 rounded-md bg-[#13243C] animate-pulse" />
        </div>

        {/* Price & Action Button skeleton */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="h-2.5 w-12 rounded bg-[#C5E5EC]/20 mb-1 animate-pulse" />
            <div className="h-5 w-24 rounded-lg bg-emerald-500/20 border border-emerald-400/20 animate-pulse" />
          </div>
          <div className="h-8 w-20 rounded-xl bg-gradient-to-r from-[#3064AE]/40 to-[#417AC6]/30 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export const FlashGigsSkeleton: React.FC = () => {
  return (
    <div className="space-y-2.5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/30 animate-pulse" />
          <div className="h-4 w-40 rounded-md bg-[#162A45] animate-pulse" />
        </div>
        <div className="h-3 w-16 rounded-md bg-[#C5E5EC]/20 animate-pulse" />
      </div>
      <div className="scroll-snap-x snap-x snap-mandatory flex overflow-x-auto gap-3.5 pb-2 pt-1 touch-pan-x overscroll-x-contain scrollbar-none px-0.5">
        {[1, 2, 3].map((key) => (
          <GigCardSkeleton key={key} isSnapCard={true} />
        ))}
      </div>
    </div>
  );
};

interface GigListSkeletonProps {
  viewMode?: 'SNAP' | 'GRID';
  count?: number;
}

export const GigListSkeleton: React.FC<GigListSkeletonProps> = ({ viewMode = 'SNAP', count = 3 }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (viewMode === 'SNAP') {
    return (
      <div className="space-y-3 animate-fade-in">
        {/* Swipe hint skeleton */}
        <div className="flex items-center justify-between px-1">
          <div className="h-3 w-44 rounded-md bg-[#C5E5EC]/20 animate-pulse" />
          <div className="h-3 w-20 rounded-md bg-[#E0FAEB]/20 animate-pulse" />
        </div>

        {/* Horizontal scroll snap carousel of skeletons */}
        <div className="scroll-snap-x snap-x snap-mandatory flex overflow-x-auto gap-4 pb-4 pt-1 touch-pan-x overscroll-x-contain scrollbar-none px-0.5">
          {items.map((i) => (
            <GigCardSkeleton key={i} isSnapCard={true} />
          ))}
        </div>

        {/* Controller skeleton */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="h-7 w-20 rounded-xl bg-[#0E1B2E] border border-[#C5E5EC]/15 animate-pulse" />
          <div className="h-3 w-16 rounded-md bg-[#C5E5EC]/20 animate-pulse" />
          <div className="h-7 w-20 rounded-xl bg-[#0E1B2E] border border-[#C5E5EC]/15 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
      {items.map((i) => (
        <GigCardSkeleton key={i} isSnapCard={false} />
      ))}
    </div>
  );
};
