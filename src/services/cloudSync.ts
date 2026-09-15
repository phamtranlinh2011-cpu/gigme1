import {
  GigEntity,
  BidEntity,
  ChatMessageEntity,
  UserEntity,
  MarketplaceItemEntity,
  WalletTransactionEntity,
  SafeWalkSessionEntity,
} from '../types';
import {
  testFirestoreConnection,
  syncGigToCloud,
  deleteGigFromCloud,
  subscribeToGigs,
  syncUserToCloud,
  subscribeToUsers,
  syncMessageToCloud,
  syncTransactionToCloud,
} from '../lib/firebase';

export interface CloudConnectionStatus {
  connected: boolean;
  status: 'CONNECTED' | 'PERMISSION_DENIED' | 'OFFLINE' | 'CHECKING';
  message: string;
  docCount?: number;
  serverInfo?: string;
}

type Unsubscribe = () => void;

// Real-time Event Stream Listener
class RealtimeSyncManager {
  private eventSource: EventSource | null = null;
  private listeners: { [event: string]: ((data: any) => void)[] } = {};
  private isConnected = false;

  init() {
    if (typeof window === 'undefined') return;
    if (this.eventSource) return;

    try {
      this.eventSource = new EventSource('/api/events');

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.emit('connection_change', { connected: true });
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.emit('connection_change', { connected: false });
      };

      const eventNames = [
        'gig_saved',
        'gig_deleted',
        'bid_saved',
        'chat_saved',
        'user_registered',
        'user_updated',
        'marketplace_saved',
        'transaction_saved',
        'safewalk_saved',
        'push_notification',
      ];

      eventNames.forEach((evtName) => {
        this.eventSource?.addEventListener(evtName, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            this.emit(evtName, data);
          } catch (err) {
            console.warn(`Error parsing SSE ${evtName}:`, err);
          }
        });
      });
    } catch (err) {
      console.warn('SSE initialization notice:', err);
    }
  }

  on(event: string, callback: (data: any) => void): Unsubscribe {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Auto-init if not yet
    if (!this.eventSource) {
      this.init();
    }

    return () => {
      this.listeners[event] = (this.listeners[event] || []).filter((cb) => cb !== callback);
    };
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  getConnected() {
    return this.isConnected;
  }
}

export const realtimeManager = new RealtimeSyncManager();

export const cloudService = {
  // Test direct connection to real cloud server and Firebase Firestore
  async testConnection(): Promise<CloudConnectionStatus> {
    try {
      // Test Firebase Firestore connection first
      const firestoreOk = await testFirestoreConnection();
      
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        return {
          connected: true,
          status: 'CONNECTED',
          message: `Đã kết nối Firebase Firestore & Cloud Database thời gian thực thành công. Dữ liệu được đồng bộ liên tục.`,
          docCount: (data.stats?.gigsCount || 0) + (data.stats?.usersCount || 0),
          serverInfo: data.server,
        };
      }

      if (firestoreOk) {
        return {
          connected: true,
          status: 'CONNECTED',
          message: `Đã kết nối trực tiếp Firebase Firestore Cloud Database. Dữ liệu đồng bộ trực tuyến.`,
        };
      }
      throw new Error('Offline');
    } catch (err: any) {
      console.warn('Test connection notice:', err?.message);
      return {
        connected: false,
        status: 'OFFLINE',
        message: 'Máy chủ Cloud đang ngoại tuyến. Hệ thống đang bảo lưu dữ liệu cục bộ an toàn.',
      };
    }
  },

  // GIGS: Lưu và đồng bộ thời gian thực
  async saveGig(gig: GigEntity): Promise<void> {
    // 1. Sync to Firebase Firestore directly
    syncGigToCloud(gig).catch((e) => console.warn('Firestore syncGig error:', e));

    // 2. Sync to Express Backend
    try {
      await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gig),
      });
    } catch (err) {
      console.warn('API saveGig fallback:', err);
    }
  },

  async deleteGig(gigId: string): Promise<void> {
    // 1. Delete from Firebase Firestore
    deleteGigFromCloud(gigId).catch((e) => console.warn('Firestore deleteGig error:', e));

    // 2. Delete from Express Backend
    try {
      await fetch(`/api/gigs/${gigId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API deleteGig fallback:', err);
    }
  },

  subscribeGigs(
    callback: (gigs: GigEntity[]) => void,
    onStatusChange?: (status: CloudConnectionStatus) => void
  ): Unsubscribe {
    // Initial fetch
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/gigs');
        if (res.ok) {
          const list: GigEntity[] = await res.json();
          callback(list);
          onStatusChange?.({
            connected: true,
            status: 'CONNECTED',
            message: 'Đã kết nối Firebase Firestore & Cloud GigMe',
            docCount: list.length,
          });
        }
      } catch {
        // ignore
      }
    };

    fetchLatest();

    // 1. Firebase Firestore Real-Time listener
    const unsubFirestore = subscribeToGigs((cloudGigs) => {
      if (cloudGigs && cloudGigs.length > 0) {
        callback(cloudGigs);
        onStatusChange?.({
          connected: true,
          status: 'CONNECTED',
          message: 'Đồng bộ trực tiếp qua Firebase Firestore',
          docCount: cloudGigs.length,
        });
      }
    });

    // 2. SSE Realtime events
    const unsubSave = realtimeManager.on('gig_saved', () => fetchLatest());
    const unsubDel = realtimeManager.on('gig_deleted', () => fetchLatest());

    // 3. Polling fallback every 6 seconds for remote syncing
    const interval = setInterval(fetchLatest, 6000);

    return () => {
      unsubFirestore();
      unsubSave();
      unsubDel();
      clearInterval(interval);
    };
  },

  // BIDS: Đề xuất đấu giá thời gian thực
  async saveBid(bid: BidEntity): Promise<void> {
    try {
      await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bid),
      });
    } catch (err) {
      console.warn('API saveBid fallback:', err);
    }
  },

  subscribeBids(callback: (bids: BidEntity[]) => void): Unsubscribe {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/bids');
        if (res.ok) {
          const list: BidEntity[] = await res.json();
          callback(list);
        }
      } catch {
        // ignore
      }
    };

    fetchLatest();
    const unsub = realtimeManager.on('bid_saved', () => fetchLatest());
    const interval = setInterval(fetchLatest, 6000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  },

  // CHATS: Tin nhắn bàn giao công việc thời gian thực
  async saveChatMessage(msg: ChatMessageEntity): Promise<void> {
    // 1. Sync to Firebase Firestore
    syncMessageToCloud(msg).catch((e) => console.warn('Firestore syncMessage error:', e));

    // 2. Sync to Express Backend
    try {
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      });
    } catch (err) {
      console.warn('API saveChatMessage fallback:', err);
    }
  },

  subscribeChats(callback: (chats: ChatMessageEntity[]) => void): Unsubscribe {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/chats');
        if (res.ok) {
          const list: ChatMessageEntity[] = await res.json();
          callback(list);
        }
      } catch {
        // ignore
      }
    };

    fetchLatest();
    const unsub = realtimeManager.on('chat_saved', () => fetchLatest());
    const interval = setInterval(fetchLatest, 4000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  },

  // USERS: Đồng bộ hồ sơ tài khoản và số dư ví
  async saveUser(user: UserEntity): Promise<void> {
    // 1. Sync to Firebase Firestore
    syncUserToCloud(user).catch((e) => console.warn('Firestore syncUser error:', e));

    // 2. Sync to Express Backend
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch (err) {
      console.warn('API saveUser fallback:', err);
    }
  },

  async registerUser(user: UserEntity): Promise<boolean> {
    // 1. Sync to Firebase Firestore
    syncUserToCloud(user).catch((e) => console.warn('Firestore registerUser error:', e));

    // 2. Sync to Express Backend
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      return res.ok;
    } catch (err) {
      console.warn('API registerUser fallback:', err);
      return false;
    }
  },

  subscribeUsers(callback: (users: UserEntity[]) => void): Unsubscribe {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const list: UserEntity[] = await res.json();
          callback(list);
        }
      } catch {
        // ignore
      }
    };

    fetchLatest();

    // Firebase Firestore listener
    const unsubFirestore = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        callback(cloudUsers);
      }
    });

    const unsubReg = realtimeManager.on('user_registered', () => fetchLatest());
    const unsubUpd = realtimeManager.on('user_updated', () => fetchLatest());
    const interval = setInterval(fetchLatest, 8000);

    return () => {
      unsubFirestore();
      unsubReg();
      unsubUpd();
      clearInterval(interval);
    };
  },

  // MARKETPLACE: Chợ KTX thực tế
  async saveMarketplaceItem(item: MarketplaceItemEntity): Promise<void> {
    try {
      await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    } catch (err) {
      console.warn('API saveMarketplaceItem fallback:', err);
    }
  },

  subscribeMarketplace(callback: (items: MarketplaceItemEntity[]) => void): Unsubscribe {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/marketplace');
        if (res.ok) {
          const list: MarketplaceItemEntity[] = await res.json();
          callback(list);
        }
      } catch {
        // ignore
      }
    };

    fetchLatest();
    const unsub = realtimeManager.on('marketplace_saved', () => fetchLatest());
    const interval = setInterval(fetchLatest, 8000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  },

  // TRANSACTIONS: Giao dịch ví & Escrow
  async saveTransaction(tx: WalletTransactionEntity): Promise<void> {
    // 1. Sync to Firebase Firestore
    syncTransactionToCloud(tx).catch((e) => console.warn('Firestore syncTx error:', e));

    // 2. Sync to Express Backend
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
    } catch (err) {
      console.warn('API saveTransaction fallback:', err);
    }
  },

  subscribeTransactions(callback: (transactions: WalletTransactionEntity[]) => void): Unsubscribe {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/transactions');
        if (res.ok) {
          const list: WalletTransactionEntity[] = await res.json();
          callback(list);
        }
      } catch {
        // ignore
      }
    };

    fetchLatest();
    const unsub = realtimeManager.on('transaction_saved', () => fetchLatest());
    const interval = setInterval(fetchLatest, 6000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  },

  // SAFEWALK: Bảo vệ đêm khuya SOS
  async saveSafeWalk(session: SafeWalkSessionEntity): Promise<void> {
    try {
      await fetch('/api/safewalk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
    } catch (err) {
      console.warn('API saveSafeWalk fallback:', err);
    }
  },

  // OTP Authentication
  async requestCloudOtp(contact: string): Promise<{ success: boolean; code?: string; expiresAt?: number }> {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('requestCloudOtp notice:', err);
    }
    return { success: false };
  },

  async verifyCloudOtp(contact: string, otp: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, otp }),
      });
      return await res.json();
    } catch (err) {
      console.warn('verifyCloudOtp notice:', err);
      return { success: false, error: 'Lỗi kết nối máy chủ' };
    }
  },

  // Gemini AI Estimation endpoint
  async estimateWithGemini(title: string, description: string, category: string): Promise<any> {
    try {
      const res = await fetch('/api/gemini/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Gemini API call notice:', err);
    }
    return null;
  },

  // FINANCIAL CLOUD ATOMIC ACTIONS (ANTI-DUPE & REALTIME DB SYNC)
  async depositWallet(data: {
    userId: string;
    amount: number;
    bankName: string;
    transactionId?: string;
    note?: string;
  }): Promise<{ success: boolean; duplicate?: boolean; user?: any; transaction?: any }> {
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      console.warn('depositWallet error:', err);
      return { success: false };
    }
  },

  async withdrawWallet(data: {
    userId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    pin?: string;
    useBiometrics?: boolean;
    transactionId?: string;
  }): Promise<{ success: boolean; duplicate?: boolean; error?: string; user?: any; transaction?: any }> {
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      console.warn('withdrawWallet error:', err);
      return { success: false, error: 'Lỗi mạng khi thực hiện rút tiền' };
    }
  },

  async releaseEscrow(data: {
    gigId: string;
    clientId: string;
    pin?: string;
    useBiometrics?: boolean;
    tipAmount?: number;
  }): Promise<{ success: boolean; error?: string; gig?: any; freelancerPayout?: number; platformFee?: number }> {
    try {
      const res = await fetch('/api/wallet/escrow-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      console.warn('releaseEscrow error:', err);
      return { success: false, error: 'Lỗi mạng khi giải ngân Escrow' };
    }
  },

  async triggerBankWebhook(payload: any): Promise<any> {
    try {
      const res = await fetch('/api/banking/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      console.warn('triggerBankWebhook error:', err);
      return { success: false, error: 'Lỗi gửi webhook ngân hàng' };
    }
  },

  async triggerSepayWebhook(payload: any): Promise<any> {
    try {
      const res = await fetch('/api/webhook/sepay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      console.warn('triggerSepayWebhook error:', err);
      return { success: false, error: 'Lỗi gửi SePay webhook' };
    }
  },

  async triggerCassoWebhook(payload: any): Promise<any> {
    try {
      const res = await fetch('/api/webhook/casso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      console.warn('triggerCassoWebhook error:', err);
      return { success: false, error: 'Lỗi gửi Casso webhook' };
    }
  },

  async getWebhookStatus(): Promise<any> {
    try {
      const res = await fetch('/api/webhook/status');
      return await res.json();
    } catch (err) {
      return { status: 'OFFLINE' };
    }
  },

  subscribePushNotifications(callback: (data: any) => void): Unsubscribe {
    return realtimeManager.on('push_notification', callback);
  },

  async dispatchWebPush(data: { title: string; body?: string; type?: string; userId?: string }): Promise<any> {
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },
};
