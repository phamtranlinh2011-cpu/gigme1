import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface BirthDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // Format: DD/MM/YYYY
  onSelectDate: (formattedDate: string) => void;
  language?: 'vi' | 'en';
}

export const BirthDatePickerModal: React.FC<BirthDatePickerModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  language = 'vi',
}) => {
  const currentYear = new Date().getFullYear();
  const minYear = 1940;

  // Parse existing date or default to 2003 (typical student age)
  const parseInitialDate = () => {
    if (selectedDate && selectedDate.includes('/')) {
      const parts = selectedDate.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y >= minYear && y <= currentYear) {
          return { day: d, month: m, year: y };
        }
      }
    }
    return { day: 15, month: 7, year: 2003 }; // Default 15/08/2003
  };

  const initial = parseInitialDate();
  const [activeYear, setActiveYear] = useState<number>(initial.year);
  const [activeMonth, setActiveMonth] = useState<number>(initial.month); // 0-indexed (0 = Tháng 1)
  const [activeDay, setActiveDay] = useState<number>(initial.day);

  useEffect(() => {
    if (isOpen) {
      const parsed = parseInitialDate();
      setActiveYear(parsed.year);
      setActiveMonth(parsed.month);
      setActiveDay(parsed.day);
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  // Month names
  const monthNamesVi = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
  ];
  const monthNames = language === 'vi' ? monthNamesVi : monthNamesEn;

  // Days of week
  const weekDaysVi = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const weekDaysEn = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const weekDays = language === 'vi' ? weekDaysVi : weekDaysEn;

  // Calculate days in active month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get starting day of week for the 1st of this month (0: Sunday, 1: Monday, ... 6: Saturday)
  // Adjusted for Monday start (0: Mon ... 6: Sun)
  const getStartDayOfWeek = (year: number, month: number) => {
    const rawDay = new Date(year, month, 1).getDay();
    return rawDay === 0 ? 6 : rawDay - 1;
  };

  const daysInMonth = getDaysInMonth(activeYear, activeMonth);
  const startDayOffset = getStartDayOfWeek(activeYear, activeMonth);

  // Year list from currentYear down to minYear
  const yearsList: number[] = [];
  for (let y = currentYear; y >= minYear; y--) {
    yearsList.push(y);
  }

  const handlePrevMonth = () => {
    if (activeMonth === 0) {
      setActiveMonth(11);
      setActiveYear((prev) => Math.max(minYear, prev - 1));
    } else {
      setActiveMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (activeMonth === 11) {
      if (activeYear < currentYear) {
        setActiveMonth(0);
        setActiveYear((prev) => prev + 1);
      }
    } else {
      setActiveMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (dayNum: number) => {
    setActiveDay(dayNum);
    const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const monthStr = activeMonth + 1 < 10 ? `0${activeMonth + 1}` : `${activeMonth + 1}`;
    const result = `${dayStr}/${monthStr}/${activeYear}`;
    onSelectDate(result);
    onClose();
  };

  const handleConfirm = () => {
    const validDay = Math.min(activeDay, daysInMonth);
    const dayStr = validDay < 10 ? `0${validDay}` : `${validDay}`;
    const monthStr = activeMonth + 1 < 10 ? `0${activeMonth + 1}` : `${activeMonth + 1}`;
    const result = `${dayStr}/${monthStr}/${activeYear}`;
    onSelectDate(result);
    onClose();
  };

  // Preset student age shortcuts
  const selectQuickAge = (age: number) => {
    const targetYear = currentYear - age;
    setActiveYear(targetYear);
    setActiveMonth(0); // Tháng 1
    setActiveDay(1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#0B1728] border border-[#C5E5EC]/30 shadow-2xl p-4 text-white relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C5E5EC]/15 flex items-center justify-center text-[#C5E5EC]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'vi' ? 'Chọn Ngày Sinh' : 'Select Date of Birth'}
              </h3>
              <p className="text-[11px] text-[#C5E5EC]/70">
                {language === 'vi' ? 'Lướt chọn năm & tháng dễ dàng' : 'Pick month, year & day'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Student Age Presets */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-[#C5E5EC]/60 whitespace-nowrap text-[10px]">
            {language === 'vi' ? 'Nhanh:' : 'Quick:'}
          </span>
          {[18, 19, 20, 21, 22, 23, 24].map((age) => (
            <button
              key={age}
              type="button"
              onClick={() => selectQuickAge(age)}
              className={`px-2 py-0.5 rounded-md font-medium transition whitespace-nowrap ${
                currentYear - activeYear === age
                  ? 'bg-[#C5E5EC] text-[#061426] font-bold shadow-sm'
                  : 'bg-[#152844] text-[#C5E5EC]/80 hover:bg-[#1f375a]'
              }`}
            >
              {age} {language === 'vi' ? 'tuổi' : 'yo'}
            </button>
          ))}
        </div>

        {/* Month & Year Selectors */}
        <div className="mt-3 flex items-center justify-between gap-2 p-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-[#C5E5EC] hover:bg-white/10 transition"
            title="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            {/* Month Select */}
            <select
              value={activeMonth}
              onChange={(e) => setActiveMonth(parseInt(e.target.value, 10))}
              className="bg-[#0B1728] border border-[#C5E5EC]/30 text-white text-xs font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#C5E5EC]"
            >
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx} className="bg-[#0B1728] text-white">
                  {name}
                </option>
              ))}
            </select>

            {/* Year Select */}
            <select
              value={activeYear}
              onChange={(e) => setActiveYear(parseInt(e.target.value, 10))}
              className="bg-[#0B1728] border border-[#C5E5EC]/30 text-white text-xs font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#C5E5EC]"
            >
              {yearsList.map((yr) => (
                <option key={yr} value={yr} className="bg-[#0B1728] text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-[#C5E5EC] hover:bg-white/10 transition"
            title="Tháng sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Week Days Header */}
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#C5E5EC]/70">
          {weekDays.map((d, i) => (
            <div key={i} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1 mt-1">
          {/* Empty cells before start of month */}
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isSelected = activeDay === dayNum;
            return (
              <button
                key={`day-${dayNum}`}
                type="button"
                onClick={() => handleSelectDay(dayNum)}
                className={`h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-[#C5E5EC] text-[#061426] font-extrabold shadow-md scale-105'
                    : 'text-slate-200 hover:bg-[#C5E5EC]/20 hover:text-white'
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {/* Footer Display & Confirmation */}
        <div className="mt-4 pt-3 border-t border-[#C5E5EC]/20 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-[#C5E5EC]/70">
              {language === 'vi' ? 'Đã chọn: ' : 'Selected: '}
            </span>
            <span className="font-mono font-bold text-[#C5E5EC]">
              {activeDay < 10 ? `0${activeDay}` : activeDay}/
              {activeMonth + 1 < 10 ? `0${activeMonth + 1}` : activeMonth + 1}/
              {activeYear}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 transition"
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#C5E5EC] text-[#061426] hover:bg-white flex items-center gap-1 transition shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              {language === 'vi' ? 'Xác nhận' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
