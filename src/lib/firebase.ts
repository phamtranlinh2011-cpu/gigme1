import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  FirestoreError
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  GigEntity, 
  UserEntity, 
  ChatMessageEntity, 
  WalletTransactionEntity,
  BidEntity,
  MarketplaceItemEntity,
  SafeWalkSessionEntity,
  SystemMaintenanceConfig
} from '../types';

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with databaseId as required
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Validate Connection to Firestore at boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is currently offline. Operating in local cache mode.');
    } else {
      console.log('Firebase Firestore connection established.');
    }
    return false;
  }
}

// ==================== FIRESTORE SYNC HELPERS ====================

// --- GIGS ---
export async function syncGigToCloud(gig: GigEntity): Promise<void> {
  const path = `gigs/${gig.id}`;
  try {
    // Sanitize any undefined values
    const cleanData = JSON.parse(JSON.stringify(gig));
    await setDoc(doc(db, 'gigs', gig.id), cleanData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteGigFromCloud(gigId: string): Promise<void> {
  const path = `gigs/${gigId}`;
  try {
    await deleteDoc(doc(db, 'gigs', gigId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeToGigs(
  onUpdate: (gigs: GigEntity[]) => void,
  onError?: (err: unknown) => void
) {
  const gigsRef = collection(db, 'gigs');
  return onSnapshot(
    gigsRef,
    (snapshot) => {
      const gigs: GigEntity[] = [];
      snapshot.forEach((doc) => {
        gigs.push(doc.data() as GigEntity);
      });
      onUpdate(gigs);
    },
    (err: FirestoreError) => {
      handleFirestoreError(err, OperationType.LIST, 'gigs');
      if (onError) onError(err);
    }
  );
}

// --- USERS ---
export async function syncUserToCloud(user: UserEntity): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(user));
    await setDoc(doc(db, 'users', user.id), cleanData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserFromCloud(userId: string): Promise<UserEntity | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserEntity;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function deleteUserFromCloud(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function findUserByContact(contact: string): Promise<UserEntity | null> {
  const trimmed = contact.trim().toLowerCase();
  try {
    const usersRef = collection(db, 'users');
    // Check by email
    const qEmail = query(usersRef, where('email', '==', trimmed));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      return snapEmail.docs[0].data() as UserEntity;
    }
    // Check by phone
    const qPhone = query(usersRef, where('phone', '==', contact.trim()));
    const snapPhone = await getDocs(qPhone);
    if (!snapPhone.empty) {
      return snapPhone.docs[0].data() as UserEntity;
    }
    return null;
  } catch (err) {
    console.warn('findUserByContact error:', err);
    return null;
  }
}

export function subscribeToUsers(
  onUpdate: (users: UserEntity[]) => void,
  onError?: (err: unknown) => void
) {
  const usersRef = collection(db, 'users');
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const users: UserEntity[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as UserEntity);
      });
      onUpdate(users);
    },
    (err: FirestoreError) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
      if (onError) onError(err);
    }
  );
}

// --- CHAT MESSAGES ---
export async function syncMessageToCloud(message: ChatMessageEntity): Promise<void> {
  const path = `messages/${message.id}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(message));
    await setDoc(doc(db, 'messages', message.id), cleanData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToMessages(
  gigId: string,
  onUpdate: (messages: ChatMessageEntity[]) => void,
  onError?: (err: unknown) => void
) {
  const messagesRef = collection(db, 'messages');
  return onSnapshot(
    messagesRef,
    (snapshot) => {
      const msgs: ChatMessageEntity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as ChatMessageEntity;
        if (data.gigId === gigId) {
          msgs.push(data);
        }
      });
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      onUpdate(msgs);
    },
    (err: FirestoreError) => {
      handleFirestoreError(err, OperationType.LIST, `messages?gigId=${gigId}`);
      if (onError) onError(err);
    }
  );
}

// --- TRANSACTIONS ---
export async function syncTransactionToCloud(tx: WalletTransactionEntity): Promise<void> {
  const path = `transactions/${tx.id}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(tx));
    await setDoc(doc(db, 'transactions', tx.id), cleanData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToTransactions(
  userId: string,
  onUpdate: (transactions: WalletTransactionEntity[]) => void,
  onError?: (err: unknown) => void
) {
  const txRef = collection(db, 'transactions');
  return onSnapshot(
    txRef,
    (snapshot) => {
      const list: WalletTransactionEntity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as WalletTransactionEntity;
        if (data.userId === userId) {
          list.push(data);
        }
      });
      list.sort((a, b) => b.timestamp - a.timestamp);
      onUpdate(list);
    },
    (err: FirestoreError) => {
      handleFirestoreError(err, OperationType.LIST, `transactions?userId=${userId}`);
      if (onError) onError(err);
    }
  );
}

export function subscribeToAllTransactions(
  onUpdate: (transactions: WalletTransactionEntity[]) => void,
  onError?: (err: unknown) => void
) {
  const txRef = collection(db, 'transactions');
  return onSnapshot(
    txRef,
    (snapshot) => {
      const list: WalletTransactionEntity[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as WalletTransactionEntity);
      });
      list.sort((a, b) => b.timestamp - a.timestamp);
      onUpdate(list);
    },
    (err: FirestoreError) => {
      handleFirestoreError(err, OperationType.LIST, 'transactions');
      if (onError) onError(err);
    }
  );
}

// --- ALL CHAT MESSAGES ---
export function subscribeToAllMessages(
  onUpdate: (messages: ChatMessageEntity[]) => void,
  onError?: (err: unknown) => void
) {
  const messagesRef = collection(db, 'messages');
  return onSnapshot(
    messagesRef,
    (snapshot) => {
      const msgs: ChatMessageEntity[] = [];
      snapshot.forEach((doc) => {
        msgs.push(doc.data() as ChatMessageEntity);
      });
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      onUpdate(msgs);
    },
    (err: FirestoreError) => {
      handleFirestoreError(err, OperationType.LIST, 'messages');
      if (onError) onError(err);
    }
  );
}

// --- BIDS ---
export async function syncBidToCloud(bid: BidEntity): Promise<void> {
  const path = `bids/${bid.id}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(bid));
    await setDoc(doc(db, 'bids', bid.id), cleanData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToBids(
  onUpdate: (bids: BidEntity[]) => void,
  onError?: (err: unknown) => void
) {
  const bidsRef = collection(db, 'bids');
  return onSnapshot(
    bidsRef,
    (snapshot) => {
      const bids: BidEntity[] = [];
      snapshot.forEach((doc) => {
        bids.push(doc.data() as BidEntity);
      });
      bids.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(bids);
    },
    (err: FirestoreError) => {
      handleFirestoreError(err, OperationType.LIST, 'bids');
      if (onError) onError(err);
    }
  );
}

// --- MARKETPLACE ---
export async function syncMarketplaceItemToCloud(item: MarketplaceItemEntity): Promise<void> {
  const path = `marketplace/${item.id}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(item));
    await setDoc(doc(db, 'marketplace', item.id), cleanData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteMarketplaceItemFromCloud(itemId: string): Promise<void> {
  const path = `marketplace/${itemId}`;
  try {
    await deleteDoc(doc(db, 'marketplace', itemId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeToMarketplace(
  onUpdate: (items: MarketplaceItemEntity[]) => void,
  onError?: (err: unknown) => void
) {
  const marketRef = collection(db, 'marketplace');
  return onSnapshot(
    marketRef,
    (snapshot) => {
      const items: MarketplaceItemEntity[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as MarketplaceItemEntity);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(items);
    },
    (err: FirestoreError) => {
      handleFirestoreError(err, OperationType.LIST, 'marketplace');
      if (onError) onError(err);
    }
  );
}

// --- SAFE WALK ---
export async function syncSafeWalkToCloud(session: SafeWalkSessionEntity): Promise<void> {
  const path = `safewalk/${session.id}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(session));
    await setDoc(doc(db, 'safewalk', session.id), cleanData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToSafeWalk(
  onUpdate: (sessions: SafeWalkSessionEntity[]) => void,
  onError?: (err: unknown) => void
) {
  const safeWalkRef = collection(db, 'safewalk');
  return onSnapshot(
    safeWalkRef,
    (snapshot) => {
      const list: SafeWalkSessionEntity[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as SafeWalkSessionEntity);
      });
      onUpdate(list);
    },
    (err: FirestoreError) => {
      handleFirestoreError(err, OperationType.LIST, 'safewalk');
      if (onError) onError(err);
    }
  );
}

// --- ACID ATOMIC ESCROW TRANSACTION (Solves Race Conditions & Double-Spending) ---
export async function executeAtomicEscrowPayout(params: {
  gigId: string;
  clientId: string;
  freelancerId: string;
  gigPrice: number;
  tipAmount: number;
  platformFee: number;
  taxAmount: number;
  netPayoutToWorker: number;
  proofNote?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await runTransaction(db, async (transaction) => {
      const gigRef = doc(db, 'gigs', params.gigId);
      const gigSnap = await transaction.get(gigRef);

      if (!gigSnap.exists()) {
        throw new Error('Gig không tồn tại trên hệ thống!');
      }

      const gigData = gigSnap.data() as GigEntity;
      if (gigData.status === 'COMPLETED') {
        throw new Error('Đơn việc này đã được giải ngân trước đó! Không thể thanh toán lại (Double-Spending Blocked).');
      }
      if (gigData.status === 'CLIENT_REFUNDED') {
        throw new Error('Đơn việc này đã hoàn tiền cho khách hàng!');
      }

      // Read client and worker documents
      const clientRef = doc(db, 'users', params.clientId);
      const clientSnap = await transaction.get(clientRef);
      const clientData = clientSnap.exists() ? (clientSnap.data() as UserEntity) : null;

      const workerRef = doc(db, 'users', params.freelancerId);
      const workerSnap = await transaction.get(workerRef);
      const workerData = workerSnap.exists() ? (workerSnap.data() as UserEntity) : null;

      const now = Date.now();

      // 1. Update Gig status
      transaction.update(gigRef, {
        status: 'COMPLETED',
        completedAt: now,
        tipAmount: params.tipAmount,
        isWatermarkRemoved: true,
      });

      // 2. Update Client (Release escrow locked balance)
      if (clientData) {
        const newEscrowLocked = Math.max(0, (clientData.escrowLockedBalance || 0) - params.gigPrice);
        const newTotalSpent = (clientData.totalSpent || 0) + params.gigPrice + params.tipAmount;
        transaction.update(clientRef, {
          escrowLockedBalance: newEscrowLocked,
          totalSpent: newTotalSpent,
        });
      }

      // 3. Update Worker (Credit net payout and increment stats)
      if (workerData) {
        const newWalletBalance = (workerData.walletBalance || 0) + params.netPayoutToWorker;
        const newCompletedGigs = (workerData.completedGigs || 0) + 1;
        const newTrustScore = Math.min(850, (workerData.trustScore || 650) + 10);
        transaction.update(workerRef, {
          walletBalance: newWalletBalance,
          completedGigs: newCompletedGigs,
          trustScore: newTrustScore,
        });
      }

      // 4. Create Ledger Transaction Record for Worker Payout
      const txWorkerId = `TX-ESCROW-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const txWorkerRef = doc(db, 'transactions', txWorkerId);
      transaction.set(txWorkerRef, {
        id: txWorkerId,
        userId: params.freelancerId,
        type: 'ESCROW_PAYOUT',
        amount: params.netPayoutToWorker,
        direction: 'INCOMING',
        gigId: params.gigId,
        title: `Nhận thù lao Escrow gig #${params.gigId.slice(-6)}`,
        description: `Thù lao gốc: ${params.gigPrice.toLocaleString('vi-VN')}đ | Phí sàn & thuế: -${(params.platformFee + params.taxAmount).toLocaleString('vi-VN')}đ | Tip: +${params.tipAmount.toLocaleString('vi-VN')}đ`,
        timestamp: now,
        isSuccess: true,
      });
    });

    return { success: true };
  } catch (err: any) {
    console.error('Atomic Escrow Payout Failed:', err);
    return { success: false, error: err?.message || 'Giao dịch ký quỹ thất bại' };
  }
}

// System Settings & Maintenance Mode Synchronization
export async function updateMaintenanceInCloud(config: SystemMaintenanceConfig): Promise<void> {
  try {
    const docRef = doc(db, 'system_settings', 'maintenance');
    await setDoc(docRef, config, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system_settings/maintenance');
    throw error;
  }
}

export function subscribeToMaintenance(
  onUpdate: (config: SystemMaintenanceConfig) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const docRef = doc(db, 'system_settings', 'maintenance');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as SystemMaintenanceConfig);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'system_settings/maintenance');
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    if (onError) onError(err);
    return () => {};
  }
}


