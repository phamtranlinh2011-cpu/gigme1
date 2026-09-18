// GigMe IndexedDB & Background Sync Engine
// Cho phép sinh viên nộp đơn xin việc ngay cả khi trong thang máy KTX hoặc dưới hầm gửi xe mất mạng 4G/Wifi
// Hệ thống tự động lưu vào IndexedDB và tự động gửi đi khi có sóng trở lại

export interface OfflineApplication {
  id: string;
  gigId: string;
  gigTitle: string;
  gigPrice: number;
  applicantId: string;
  applicantName: string;
  applicantPhone: string;
  note?: string;
  proposedBid?: number;
  createdAt: number;
  status: 'PENDING_OFFLINE' | 'SYNCED' | 'FAILED';
  retryCount: number;
}

const DB_NAME = 'gigme_offline_db_v1';
const STORE_NAME = 'offline_applications';
const LOCAL_STORAGE_FALLBACK_KEY = 'gigme_offline_applications_fallback';

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Fallback helpers with localStorage
function getFromLocalStorage(): OfflineApplication[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(items: OfflineApplication[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const offlineSyncManager = {
  /**
   * Thêm đơn xin việc vào hàng đợi ngoại tuyến IndexedDB
   */
  async queueApplication(data: {
    gigId: string;
    gigTitle: string;
    gigPrice: number;
    applicantId: string;
    applicantName: string;
    applicantPhone: string;
    note?: string;
    proposedBid?: number;
  }): Promise<OfflineApplication> {
    const item: OfflineApplication = {
      id: `off_app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      createdAt: Date.now(),
      status: 'PENDING_OFFLINE',
      retryCount: 0,
    };

    const db = await openDatabase();
    if (db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.add(item);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.warn('IndexedDB write error, using fallback:', err);
        const existing = getFromLocalStorage();
        saveToLocalStorage([item, ...existing]);
      }
    } else {
      const existing = getFromLocalStorage();
      saveToLocalStorage([item, ...existing]);
    }

    // Trigger Service Worker background sync registration if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await (registration as any).sync.register('gigme-sync-applications');
        }
      } catch {
        // Fallback to online event listener
      }
    }

    // Dispatch custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gigme_offline_queue_changed', { detail: item }));
    }

    return item;
  },

  /**
   * Lấy danh sách tất cả các đơn đang chờ gửi
   */
  async getQueuedApplications(): Promise<OfflineApplication[]> {
    const db = await openDatabase();
    if (db) {
      try {
        return await new Promise<OfflineApplication[]>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve(getFromLocalStorage());
        });
      } catch {
        return getFromLocalStorage();
      }
    }
    return getFromLocalStorage();
  },

  /**
   * Xóa đơn đã hoàn tất khỏi hàng đợi
   */
  async removeQueuedApplication(id: string): Promise<void> {
    const db = await openDatabase();
    if (db) {
      try {
        await new Promise<void>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      } catch {
        // ignore
      }
    }
    const filtered = getFromLocalStorage().filter((x) => x.id !== id);
    saveToLocalStorage(filtered);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gigme_offline_queue_changed'));
    }
  },

  /**
   * Đồng bộ toàn bộ các đơn đang chờ gửi khi phát hiện có mạng trở lại
   */
  async syncAllQueued(
    onSuccessCallback?: (app: OfflineApplication) => void
  ): Promise<number> {
    const items = await this.getQueuedApplications();
    if (items.length === 0) return 0;

    let syncedCount = 0;

    for (const item of items) {
      try {
        // Gửi đơn ứng tuyển lên máy chủ
        const res = await fetch('/api/gigs/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gigId: item.gigId,
            applicantId: item.applicantId,
            applicantName: item.applicantName,
            applicantPhone: item.applicantPhone,
            proposedBid: item.proposedBid || item.gigPrice,
            note: item.note || 'Đơn nộp tự động qua Background Sync IndexedDB',
            isOfflineSync: true,
          }),
        });

        if (res.ok || res.status === 200 || res.status === 201) {
          await this.removeQueuedApplication(item.id);
          syncedCount++;
          if (onSuccessCallback) {
            onSuccessCallback(item);
          }
        } else {
          // If server error, keep in queue for next reconnect
          console.warn('Sync delayed for item:', item.id);
        }
      } catch {
        // Still offline, stop loop
        break;
      }
    }

    return syncedCount;
  },
};
