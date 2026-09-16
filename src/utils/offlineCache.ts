// PWA Offline Cache Manager for GigMe
// Tự động lưu trữ thông tin việc làm và số điện thoại liên lạc khẩn cấp khi người dùng xem chi tiết đơn hàng
import { GigEntity } from '../types';

export interface CachedOfflineGig {
  id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  clientName: string;
  clientPhone: string;
  latitude: number;
  longitude: number;
  deadline: string;
  description: string;
  status: string;
  freelancerName?: string;
  savedAt: number;
  offlineNotes?: string;
}

const OFFLINE_CACHE_KEY = 'gigme_offline_viewed_gigs_v1';

export const offlineCacheManager = {
  /**
   * Lưu gig vào bộ nhớ offline khi người dùng mở xem chi tiết
   */
  cacheGig: (gig: GigEntity, clientPhone = '0909120918') => {
    try {
      const existing = offlineCacheManager.getCachedGigs();
      const item: CachedOfflineGig = {
        id: gig.id,
        title: gig.title,
        price: gig.price,
        category: gig.category,
        location: gig.location || gig.locationName || 'Toàn campus',
        clientName: gig.clientName,
        clientPhone,
        latitude: gig.latitude,
        longitude: gig.longitude,
        deadline: gig.deadline || (gig.estimatedDurationMinutes ? `${gig.estimatedDurationMinutes} phút` : 'Trong ngày'),
        description: gig.description,
        status: gig.status,
        freelancerName: gig.freelancerName || undefined,
        savedAt: Date.now(),
        offlineNotes: 'Đã lưu đệm sẵn sàng xem trong thang máy hoặc khu vực mất sóng 4G/Wifi',
      };

      const filtered = existing.filter((g) => g.id !== gig.id);
      const updated = [item, ...filtered].slice(0, 30); // Lưu tối đa 30 đơn gần nhất
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Lỗi ghi đệm offline:', e);
    }
  },

  /**
   * Lấy danh sách các gig đã lưu đệm
   */
  getCachedGigs: (): CachedOfflineGig[] => {
    try {
      const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as CachedOfflineGig[];
    } catch {
      return [];
    }
  },

  /**
   * Lấy một gig cụ thể từ cache
   */
  getCachedGigById: (gigId: string): CachedOfflineGig | undefined => {
    const all = offlineCacheManager.getCachedGigs();
    return all.find((g) => g.id === gigId);
  },

  /**
   * Xóa một gig khỏi cache
   */
  removeCachedGig: (gigId: string) => {
    try {
      const existing = offlineCacheManager.getCachedGigs();
      const updated = existing.filter((g) => g.id !== gigId);
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Lỗi xóa cache offline:', e);
    }
  },
};
