import React from 'react';
import { ShieldCheck, GraduationCap, SmartphoneNfc } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useGigMe } from '../context/GigMeContext';

export type VerificationType = 'BOTH' | 'CCCD' | 'STUDENT';

interface VerifiedIdentityBadgeProps {
  type?: VerificationType;
  school?: string;
  faculty?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  isCccdVerified?: boolean;
  isStudentVerified?: boolean;
  interactive?: boolean;
  onBadgeClick?: () => void;
  className?: string;
}

export const VerifiedIdentityBadge: React.FC<VerifiedIdentityBadgeProps> = ({
  type = 'BOTH',
  school,
  faculty,
  size = 'sm',
  showText = true,
  isCccdVerified = true,
  isStudentVerified = true,
  interactive = false,
  onBadgeClick,
  className = '',
}) => {
  const { language } = useGigMe();
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  // Determine which verification badge to show
  const hasBoth = isCccdVerified && isStudentVerified;
  const hasOnlyCccd = isCccdVerified && !isStudentVerified;
  const hasOnlyStudent = isStudentVerified && !isCccdVerified;

  if (!isCccdVerified && !isStudentVerified) {
    return null;
  }

  const campusText = school ? `${school}${faculty ? ` • ${faculty}` : ''}` : '';

  const handleClick = (e: React.MouseEvent) => {
    if (interactive && onBadgeClick) {
      e.stopPropagation();
      triggerHaptic('light');
      onBadgeClick();
    }
  };

  // 1. Both CCCD and Student Verified
  if (hasBoth || type === 'BOTH') {
    return (
      <span
        onClick={handleClick}
        className={`inline-flex items-center space-x-1 font-bold rounded-full border shadow-sm ${
          isSm
            ? 'px-2 py-0.5 text-[10px]'
            : isLg
            ? 'px-3 py-1 text-xs'
            : 'px-2.5 py-0.5 text-[11px]'
        } bg-gradient-to-r from-emerald-500/20 via-sky-500/25 to-teal-500/20 text-[#E0FAEB] border-emerald-400/40 select-none ${
          interactive ? 'cursor-pointer hover:border-emerald-400 hover:scale-105 active:scale-95 transition' : ''
        } ${className}`}
        title={
          language === 'vi'
            ? `Đã xác thực CCCD gắn chip (Bộ Công An C06) và Thẻ SV/Email chính quy trường ${campusText || 'Đại học'}`
            : `Verified NFC Chip ID Card and Student ID at ${campusText || 'University'}`
        }
      >
        <span className="flex items-center text-emerald-400">
          <SmartphoneNfc className={isSm ? 'w-3 h-3' : isLg ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <GraduationCap className={`-ml-0.5 ${isSm ? 'w-3 h-3' : isLg ? 'w-3.5 h-3.5' : 'w-3 h-3'} text-sky-400`} />
          <ShieldCheck className={`-ml-0.5 fill-emerald-400 text-[#0E1B2E] ${isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
        </span>
        {showText && (
          <span className="truncate max-w-[150px] sm:max-w-[200px] tracking-tight">
            {campusText
              ? `${language === 'vi' ? 'CCCD & ' : 'ID & '}${campusText} ✓`
              : language === 'vi' ? 'Đã Xác Thực CCCD / Thẻ SV ✓' : 'ID & Student Verified ✓'}
          </span>
        )}
      </span>
    );
  }

  // 2. Only CCCD Chip Verified
  if (hasOnlyCccd || type === 'CCCD') {
    return (
      <span
        onClick={handleClick}
        className={`inline-flex items-center space-x-1 font-bold rounded-full border shadow-sm ${
          isSm
            ? 'px-2 py-0.5 text-[10px]'
            : isLg
            ? 'px-3 py-1 text-xs'
            : 'px-2.5 py-0.5 text-[11px]'
        } bg-gradient-to-r from-teal-500/20 via-emerald-600/25 to-teal-500/20 text-emerald-300 border-emerald-400/40 select-none ${
          interactive ? 'cursor-pointer hover:border-emerald-400 hover:scale-105 active:scale-95 transition' : ''
        } ${className}`}
        title={
          language === 'vi'
            ? 'Đã xác thực Căn cước công dân gắn chip NFC (Chuẩn C06 Bộ Công An)'
            : 'National ID Chip NFC Verified'
        }
      >
        <span className="flex items-center text-emerald-400">
          <SmartphoneNfc className={isSm ? 'w-3 h-3' : isLg ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <ShieldCheck className={`-ml-0.5 fill-emerald-400 text-[#0E1B2E] ${isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
        </span>
        {showText && (
          <span className="truncate max-w-[130px] sm:max-w-[160px] tracking-tight">
            {language === 'vi' ? 'Đã Xác Thực CCCD Chip ✓' : 'Chip ID Verified ✓'}
          </span>
        )}
      </span>
    );
  }

  // 3. Only Student Card / Email Verified
  return (
    <span
      onClick={handleClick}
      className={`inline-flex items-center space-x-1 font-bold rounded-full border shadow-sm ${
        isSm
          ? 'px-2 py-0.5 text-[10px]'
          : isLg
          ? 'px-3 py-1 text-xs'
          : 'px-2.5 py-0.5 text-[11px]'
      } bg-gradient-to-r from-sky-500/20 via-blue-600/25 to-cyan-500/20 text-sky-300 border-sky-400/40 select-none ${
        interactive ? 'cursor-pointer hover:border-sky-400 hover:scale-105 active:scale-95 transition' : ''
      } ${className}`}
      title={
        language === 'vi'
          ? `Sinh viên chính quy trường ${school || 'Đại học'} đã xác thực qua Cổng trường / Thẻ SV`
          : `Student verified at ${school || 'University'} via portal / student ID`
      }
    >
      <span className="flex items-center text-sky-400">
        <GraduationCap className={isSm ? 'w-3 h-3' : isLg ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <ShieldCheck className={`-ml-1 fill-sky-400 text-[#0E1B2E] ${isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
      </span>
      {showText && (
        <span className="truncate max-w-[130px] sm:max-w-[160px] tracking-tight">
          {school ? `${school} ✓` : language === 'vi' ? 'Đã Xác Thực Thẻ SV ✓' : 'Student Verified ✓'}
        </span>
      )}
    </span>
  );
};
