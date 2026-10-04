import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Language, Translations, translations } from '../utils/i18n';
import { triggerHaptic } from '../utils/haptics';

export const LANGUAGE_STORAGE_KEY = 'gigme_app_lang';

export type TranslationKey = keyof Translations | string;

export interface LanguageContextType {
  language: Language;
  isEnglish: boolean;
  isVietnamese: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, fallback?: string) => string;
  currentDictionary: Translations;
  formatCurrency: (amount: number) => string;
  translateNotification: (title: string, message: string) => { title: string; message: string };
}

const COMMON_PHRASE_TRANSLATIONS: Record<string, string> = {
  'Hủy': 'Cancel',
  'Hủy Bỏ': 'Cancel',
  'Hủy bỏ': 'Cancel',
  'Đóng': 'Close',
  'Xác nhận': 'Confirm',
  'Xác Nhận': 'Confirm',
  'Tiếp tục': 'Continue',
  'Tiếp Theo': 'Next',
  'Quay lại': 'Back',
  'Quay Lại': 'Back',
  'Lưu': 'Save',
  'Lưu Thay Đổi': 'Save Changes',
  'Lưu thay đổi': 'Save Changes',
  'Đang tải...': 'Loading...',
  'Thành công': 'Success',
  'Thành Công': 'Success',
  'Lỗi': 'Error',
  'Cảnh báo': 'Warning',
  'Cảnh Báo': 'Warning',
  'Tìm kiếm': 'Search',
  'Tìm Kiếm': 'Search',
  'Bộ lọc': 'Filters',
  'Tất cả': 'All',
  'Tất Cả': 'All',
  'Nạp tiền': 'Deposit',
  'Nạp Tiền': 'Deposit',
  'Rút tiền': 'Withdraw',
  'Rút Tiền': 'Withdraw',
  'Ví tiền': 'Wallet',
  'Ví Tiền': 'Wallet',
  'Hồ sơ': 'Profile',
  'Hồ Sơ': 'Profile',
  'Tin nhắn': 'Chat',
  'Tin Nhắn': 'Messages',
  'Trang chủ': 'Home',
  'Trang Chủ': 'Home',
  'Đăng việc': 'Post Gig',
  'Đăng Việc': 'Post Gig',
  'Chi tiết': 'Details',
  'Chi Tiết': 'Details',
  'Xem chi tiết': 'View Details',
  'Xem Chi Tiết': 'View Details',
  'Nhận việc ngay': 'Apply Now',
  'Nhận Việc Ngay': 'Apply Now',
  'Chấp nhận': 'Accept',
  'Từ chối': 'Decline',
  'Đã nghiệm thu': 'Completed',
  'Đang tiến hành': 'In Progress',
  'Chờ duyệt': 'Pending',
  'Đã hủy': 'Cancelled',
  'Xóa': 'Delete',
  'Chỉnh sửa': 'Edit',
  'Chỉnh Sửa': 'Edit',
  'Đăng xuất': 'Log Out',
  'Đăng Xuất': 'Log Out',
  'Đăng nhập': 'Log In',
  'Đăng Nhập': 'Log In',
  'Đăng ký': 'Sign Up',
  'Đăng Ký': 'Sign Up',
  'Số dư khả dụng': 'Available Balance',
  'Số Dư Khả Dụng': 'Available Balance',
  'Ký quỹ bảo vệ': 'Escrow Protected',
  'Đang Tạm Giữ Escrow': 'Held in Escrow',
  'Thù lao': 'Reward',
  'Hạn chót': 'Deadline',
  'Khoảng cách': 'Distance',
  'Ứng viên': 'Applicants',
  'Đấu thầu': 'Auction',
  'Đấu giá': 'Auction',
  'Bảo mật': 'Security',
  'Bảo Mật': 'Security',
  'Xác thực': 'Verification',
  'Xác Thực': 'Verification',
  'Sinh viên': 'Student',
  'Chế độ ngoại tuyến': 'Offline Mode',
  'Cài đặt ứng dụng': 'Install App',
  'Tải APK': 'Download APK',
  'Hỗ trợ': 'Support',
  'Điều khoản': 'Terms',
  'Quy tắc Campus': 'Campus Rules',
  'Luật 18 điều': '18 Campus Laws',
  'Bộ luật': 'Campus Law',
  'Chợ KTX': 'Dorm Market',
  'Điểm uy tín': 'TrustScore',
  'Hạng ELO': 'ELO Rank',
  'Sao Kê': 'Statement',
  'Sao kê': 'Statement',
  'Xuất PDF/Excel': 'Export PDF/Excel',
  'Chưa liên kết': 'Not linked',
  'Đã liên kết': 'Linked',
  'Đã nối': 'Connected',
  'Chưa nối': 'Not linked',
  'Thiết lập': 'Setup',
  'Quản lý': 'Manage',
  'Mã PIN': 'PIN Code',
  'Giao dịch ví': 'Wallet Transaction',
  'Không có giao dịch': 'No transactions',
  'Thêm Bạn': 'Add Friend',
  'Thêm bạn': 'Add Friend',
  'Đang Trực Tuyến': 'Online Now',
  'Trực tuyến': 'Online',
  'Ngoại tuyến': 'Offline',
  'Gửi': 'Send',
  'Gửi tin nhắn': 'Send Message',
  'Nhập tin nhắn...': 'Type a message...',
  'Chụp ảnh': 'Take Photo',
  'Chọn ảnh': 'Choose Photo',
  'Sao chép': 'Copy',
  'Đã sao chép': 'Copied',
  'Chia sẻ': 'Share',
  'Báo cáo': 'Report',
  'Mật khẩu': 'Password',
  'Số điện thoại': 'Phone Number',
  'Họ và tên': 'Full Name',
  'Tên': 'First Name',
  'Họ và tên đệm': 'Last Name',
  'Giới tính': 'Gender',
  'Ngày sinh': 'Date of Birth',
  'Nam': 'Male',
  'Nữ': 'Female',
  'Quên mật khẩu?': 'Forgot password?',
  'Quên mật khẩu': 'Forgot password',
  'Gửi mã OTP': 'Send OTP',
  'Xác nhận OTP': 'Verify OTP',
  'Đổi mật khẩu': 'Change Password',
  'Xác thực sinh trắc học': 'Biometric Authentication',
  'Đăng nhập bằng SĐT': 'Login with Phone',
  'Soạn SMS xác thực': 'Send SMS Verification',
  'Quay lại Đăng nhập': 'Back to Login',
  'Chưa có tài khoản?': "Don't have an account?",
  'Đã có tài khoản?': 'Already have an account?',
  'Đăng ký ngay': 'Sign up now',
  'Đăng nhập ngay': 'Log in now',
  'Tải ứng dụng ngay': 'Install app now',
  'Cài đặt ngay': 'Install now',
  'Xem ngay': 'View now',
  'Hoàn thành': 'Completed',
  'Bắt đầu': 'Start',
  'Kết thúc': 'End',
  'Đồng ý': 'Agree',
  'Tôi đồng ý': 'I agree',
};

const COMMON_NOTIFICATION_TRANSLATIONS: Record<string, { titleEn: string; messageEn?: string }> = {
  'Đã sao chép! 📋': { titleEn: 'Copied! 📋' },
  'Đã sao chép': { titleEn: 'Copied to clipboard' },
  'Xác thực CCCD thành công 🛡️': {
    titleEn: 'CCCD Verified Successfully 🛡️',
    messageEn: 'Successfully read and validated full CCCD chip biometric data matching standard C06.',
  },
  '👤 Face Liveness Thành Công!': {
    titleEn: '👤 Face Liveness Verified!',
    messageEn: 'Completed AI biometric face verification matching national standards.',
  },
  '🔔 Biến động số dư VietQR Open API': {
    titleEn: '🔔 VietQR Open API Balance Change',
  },
  'Nạp Tiền Thành Công!': {
    titleEn: 'Deposit Successful!',
    messageEn: 'Open API Webhook verified and credited your balance automatically.',
  },
  'Rút Tiền Thành Công!': {
    titleEn: 'Withdrawal Successful!',
    messageEn: 'Napas 247 disbursement transaction initiated successfully.',
  },
  'Giao diện tối mặc định': {
    titleEn: 'Default Dark Theme',
    messageEn: 'GigMe system is configured by default in Cyber Dark Mode.',
  },
  '🔇 Đã tắt toàn bộ âm thanh': {
    titleEn: '🔇 Muted all sounds',
    messageEn: 'System will run in silent mode.',
  },
  '🔊 Đã bật âm thanh Retro Cyber': {
    titleEn: '🔊 Retro Cyber sounds enabled',
    messageEn: 'Ready for interactive sound cues!',
  },
  'Giới hạn nạp tiền ⚠️': {
    titleEn: 'Deposit Limit Warning ⚠️',
  },
  'Thiếu SĐT ví': {
    titleEn: 'Missing e-wallet phone',
    messageEn: 'Please enter your registered e-wallet phone number.',
  },
  'Số tiền không hợp lệ': {
    titleEn: 'Invalid Amount',
    messageEn: 'Please enter a valid amount matching platform limits.',
  },
  '🎁 Hộp Quà Bí Ẩn Đã Mở!': {
    titleEn: '🎁 Mystery Box Opened!',
    messageEn: 'Congratulations! You received a 100% platform fee waiver voucher.',
  },
  'Chế độ ngoại tuyến': {
    titleEn: 'Offline Mode',
    messageEn: 'Cached offline data is active.',
  },
  'Cập nhật thành công': {
    titleEn: 'Update Successful',
  },
  'Đã đăng việc thành công': {
    titleEn: 'Gig Posted Successfully',
  },
  'Thành công': {
    titleEn: 'Success',
  },
  'Lỗi': {
    titleEn: 'Error',
  },
  'Cảnh báo': {
    titleEn: 'Warning',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'vi';
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) || localStorage.getItem('gigme_lang');
      if (saved === 'en' || saved === 'vi') return saved;
    } catch {}
    return 'vi';
  });

  // Sync document html lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.setAttribute('data-language', language);
    }
  }, [language]);

  // Synchronous and immediate language change
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      localStorage.setItem('gigme_lang', lang);
    } catch {}

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.setAttribute('data-language', lang);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gigme_language_changed', { detail: lang }));
    }
    triggerHaptic('light');
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  }, [language, setLanguage]);

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === LANGUAGE_STORAGE_KEY || e.key === 'gigme_lang') && e.newValue) {
        if (e.newValue === 'en' || e.newValue === 'vi') {
          setLanguageState(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Translation helper function
  const t = useCallback(
    (key: TranslationKey, fallback?: string): string => {
      const activeDict = translations[language] || translations.vi;
      if (activeDict && (activeDict as any)[key]) {
        return (activeDict as any)[key];
      }
      if (translations.vi && (translations.vi as any)[key]) {
        if (language === 'en' && translations.en && (translations.en as any)[key]) {
          return (translations.en as any)[key];
        }
        if (language === 'vi') {
          return (translations.vi as any)[key];
        }
      }
      // Check common phrase dictionary
      if (language === 'en' && COMMON_PHRASE_TRANSLATIONS[String(key)]) {
        return COMMON_PHRASE_TRANSLATIONS[String(key)];
      }
      return fallback || (language === 'en' ? COMMON_PHRASE_TRANSLATIONS[String(key)] || String(key) : String(key));
    },
    [language]
  );

  const currentDictionary = useMemo(() => {
    return translations[language] || translations.vi;
  }, [language]);

  // Currency formatting helper
  const formatCurrency = useCallback(
    (amount: number): string => {
      if (language === 'en') {
        return `${Number(amount || 0).toLocaleString('en-US')} VND`;
      }
      return `${Number(amount || 0).toLocaleString('vi-VN')} đ`;
    },
    [language]
  );

  // Auto-translate common notification phrases when English is selected
  const translateNotification = useCallback(
    (title: string, message: string): { title: string; message: string } => {
      if (language === 'vi') {
        return { title, message };
      }

      // Check direct dictionary match
      const matched = COMMON_NOTIFICATION_TRANSLATIONS[title];
      if (matched) {
        return {
          title: matched.titleEn,
          message: matched.messageEn || message,
        };
      }

      // Partial keyword translations for dynamic text
      let translatedTitle = title;
      let translatedMessage = message;

      if (title.includes('Đã sao chép')) {
        translatedTitle = 'Copied to clipboard 📋';
      } else if (title.includes('Thành công')) {
        translatedTitle = title.replace('Thành công', 'Success');
      } else if (title.includes('Lỗi')) {
        translatedTitle = title.replace('Lỗi', 'Error');
      } else if (title.includes('Cảnh báo')) {
        translatedTitle = title.replace('Cảnh báo', 'Warning');
      } else if (title.includes('Xác nhận')) {
        translatedTitle = title.replace('Xác nhận', 'Confirmed');
      }

      if (message.includes('số dư đã được nạp tự động')) {
        translatedMessage = 'Balance has been automatically credited to your account!';
      } else if (message.includes('Vui lòng nhập')) {
        translatedMessage = message.replace('Vui lòng nhập', 'Please enter');
      }

      return { title: translatedTitle, message: translatedMessage };
    },
    [language]
  );

  const contextValue = useMemo<LanguageContextType>(
    () => ({
      language,
      isEnglish: language === 'en',
      isVietnamese: language === 'vi',
      setLanguage,
      toggleLanguage,
      t,
      currentDictionary,
      formatCurrency,
      translateNotification,
    }),
    [language, setLanguage, toggleLanguage, t, currentDictionary, formatCurrency, translateNotification]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = (): LanguageContextType => {
  return useLanguage();
};

