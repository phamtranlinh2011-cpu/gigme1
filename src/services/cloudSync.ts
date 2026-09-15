import {
  GigEntity,
  BidEntity,
  ChatMessageEntity,
  UserEntity,
  MarketplaceItemEntity,
  WalletTransactionEntity,
  SafeWalkSessionEntity,
} from '../types';

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
  // Test direct connection to real cloud server
  async testConnection(): Promise<CloudConnectionStatus> {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      return {
        connected: true,
        status: 'CONNECTED',
        message: `Đã kết nối máy chủ Cloud GigMe thời gian thực thành công. Đồng bộ dữ liệu đa thiết bị tức thì.`,
        docCount: (data.stats?.gigsCount || 0) + (data.stats?.usersCount || 0),
        serverInfo: data.server,
      };
    } catch (err: any) {
      console.warn('Test connection error:', err?.message);
      return {
        connected: false,
        status: 'OFFLINE',
        message: 'Máy chủ Cloud đang ngoại tuyến. Hệ thống đang bảo lưu dữ liệu cục bộ an toàn.',
      };
    }
  },

  // GIGS: Lưu và đồng bộ thời gian thực
  async saveGig(gig: GigEntity): Promise<void> {
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
            message: 'Đã kết nối máy chủ Cloud GigMe (Realtime SSE)',
            docCount: list.length,
          });
        }
      } catch {
        // ignore
      }
    };

    fetchLatest();

    // SSE Realtime events
    const unsubSave = realtimeManager.on('gig_saved', () => fetchLatest());
    const unsubDel = realtimeManager.on('gig_deleted', () => fetchLatest());

    // Polling fallback every 6 seconds for remote syncing
    const interval = setInterval(fetchLatest, 6000);

    return () => {
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
    const unsubReg = realtimeManager.on('user_registered', () => fetchLatest());
    const unsubUpd = realtimeManager.on('user_updated', () => fetchLatest());
    const interval = setInterval(fetchLatest, 8000);

    return () => {
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
};
