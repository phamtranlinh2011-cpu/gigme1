import React from 'react';
import { ShieldCheck, GraduationCap } from 'lucide-react';

interface VerifiedEduBadgeProps {
  school?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const VerifiedEduBadge: React.FC<VerifiedEduBadgeProps> = ({
  school,
  size = 'sm',
  showText = true,
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <span
      className={`inline-flex items-center space-x-1 font-bold rounded-full border shadow-sm ${
        isSm
          ? 'px-2 py-0.5 text-[10px]'
          : isLg
          ? 'px-3 py-1 text-xs'
          : 'px-2.5 py-0.5 text-[11px]'
      } bg-gradient-to-r from-sky-500/20 via-blue-600/25 to-cyan-500/20 text-sky-300 border-sky-400/40`}
      title={`Sinh viên chính quy trường ${school || 'Đại học'} đã xác thực qua email .edu.vn`}
    >
      <span className="flex items-center text-sky-400">
        <GraduationCap className={isSm ? 'w-3 h-3' : isLg ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <ShieldCheck className={`-ml-1 fill-sky-400 text-[#0E1B2E] ${isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
      </span>
      {showText && (
        <span className="truncate max-w-[120px] sm:max-w-[160px]">
          {school ? `${school} ✓` : 'Sinh Viên .edu.vn ✓'}
        </span>
      )}
    </span>
  );
};
