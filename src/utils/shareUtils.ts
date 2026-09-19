// Tiện ích chia sẻ 1 chạm Story Facebook / TikTok / Instagram kèm link tải ứng dụng GigMe
export interface ShareStoryParams {
  type: 'TIP' | 'BADGE' | 'LEADERBOARD';
  title: string;
  amount?: number;
  badgeName?: string;
  badgeIcon?: string;
  userName: string;
  schoolName?: string;
  note?: string;
}

export const getAppInstallUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://gigme.app';
};

export const generateShareStoryText = (params: ShareStoryParams): {
  headline: string;
  caption: string;
  hashtags: string;
  fullMessage: string;
  installUrl: string;
} => {
  const installUrl = getAppInstallUrl();
  const hashtags = '#GigMe #CampusGig #KiemTienSinhVien #SmartEscrow #SinhVienKhoiNghiep';

  if (params.type === 'TIP') {
    const formattedAmount = (params.amount || 0).toLocaleString('vi-VN');
    const headline = `🎉 Nhận Tip Thưởng +${formattedAmount}đ trên GigMe!`;
    const caption = `Vừa được khách hàng gửi tiền tip siêu ấm áp trên GigMe cho đơn việc campus! Giải ngân tức thì qua Smart Escrow. 🚀`;
    const fullMessage = `${headline}\n\n${caption}\n\n👉 Cài đặt và kiếm tiền cùng mình tại: ${installUrl}\n\n${hashtags}`;
    return { headline, caption, hashtags, fullMessage, installUrl };
  }

  if (params.type === 'LEADERBOARD') {
    const headline = `🏆 Top Bảng Xếp Hạng Trợ Thủ Campus GigMe!`;
    const caption = `${params.userName} vừa vinh dự lọt top Trợ Thủ Xuất Sắc Campus ${params.schoolName || ''} với giải thưởng tháng siêu đỉnh! 🚀`;
    const fullMessage = `${headline}\n\n${caption}\n\n👉 Tham gia nhận kèo và đua top cùng sinh viên toàn thành: ${installUrl}\n\n${hashtags}`;
    return { headline, caption, hashtags, fullMessage, installUrl };
  }

  // BADGE
  const badge = params.badgeName || 'Xuất Sắc Campus';
  const icon = params.badgeIcon || '🌟';
  const headline = `🎖️ Mở Khóa Huy Hiệu ${icon} ${badge}!`;
  const caption = `${params.userName} vừa đạt danh hiệu "${badge}" trên GigMe nhờ chuỗi hoàn thành công việc uy tín 100%! 🚀`;
  const fullMessage = `${headline}\n\n${caption}\n\n👉 Kết nối nhận kèo và xây dựng hồ sơ sinh viên tại: ${installUrl}\n\n${hashtags}`;
  return { headline, caption, hashtags, fullMessage, installUrl };
};

export const shareToPlatform = async (
  platform: 'NATIVE' | 'FACEBOOK' | 'TIKTOK' | 'INSTAGRAM' | 'COPY',
  params: ShareStoryParams
): Promise<{ success: boolean; method: string }> => {
  const { headline, caption, fullMessage, installUrl } = generateShareStoryText(params);

  // 1. Native Web Share API (Nếu thiết bị hỗ trợ chia sẻ trực tiếp lên app Facebook, TikTok, Instagram Story)
  if (platform === 'NATIVE') {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: headline,
          text: `${caption}\n👉 Cài đặt app tại: ${installUrl}`,
          url: installUrl,
        });
        return { success: true, method: 'WEB_SHARE' };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { success: false, method: 'USER_CANCELLED' };
        }
      }
    }
  }

  // 2. Facebook Story / Feed Share
  if (platform === 'FACEBOOK') {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      installUrl
    )}&quote=${encodeURIComponent(fullMessage)}`;
    if (typeof window !== 'undefined') {
      window.open(fbUrl, '_blank', 'width=600,height=500,location=no,menubar=no');
    }
    return { success: true, method: 'FACEBOOK' };
  }

  // 3. Instagram Story (Clipboard + deep-link hoặc web)
  if (platform === 'INSTAGRAM') {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(fullMessage);
    }
    if (typeof window !== 'undefined') {
      // Thử mở app instagram nếu trên mobile
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = 'instagram://story';
        setTimeout(() => {
          window.open('https://www.instagram.com', '_blank');
        }, 1200);
      } else {
        window.open('https://www.instagram.com', '_blank');
      }
    }
    return { success: true, method: 'INSTAGRAM' };
  }

  // 4. TikTok Story / Video (Sao chép caption & mở TikTok)
  if (platform === 'TIKTOK') {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(fullMessage);
    }
    if (typeof window !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = 'snssdk1233://'; // TikTok URL scheme
        setTimeout(() => {
          window.open('https://www.tiktok.com', '_blank');
        }, 1200);
      } else {
        window.open('https://www.tiktok.com', '_blank');
      }
    }
    return { success: true, method: 'TIKTOK' };
  }

  // 5. Copy Link & Text
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(fullMessage);
  }
  return { success: true, method: 'COPY' };
};
