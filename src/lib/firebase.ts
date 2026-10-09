import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  applyActionCode,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  initializeFirestore,
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
  FirestoreError,
  arrayUnion
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  GigEntity, 
  UserEntity, 
  ChatMessageEntity, 
  WalletTransactionEntity,
  BidEntity,
  MarketplaceItemEntity,
  SystemMaintenanceConfig,
  FirestoreNotificationEntity,
  VoipCallEntity,
  FriendRequestEntity,
  GigDraftEntity
} from '../types';

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with databaseId and experimentalForceLongPolling
// This prevents 10-second backend timeout warnings and ensures instant connectivity across proxies/iframes/mobile
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

// ==================== FIREBASE AUTH EMAIL VERIFICATION ====================
export async function sendFirebaseVerificationEmail(user?: FirebaseUser | null): Promise<{ success: boolean; error?: string }> {
  try {
    const targetUser = user || auth.currentUser;
    if (!targetUser) {
      return { success: false, error: 'Chưa đăng nhập Firebase Auth!' };
    }
    const actionCodeSettings = {
      url: typeof window !== 'undefined' ? `${window.location.origin}/?verified=true` : 'https://gigme.vn/?verified=true',
      handleCodeInApp: true,
    };
    await sendEmailVerification(targetUser, actionCodeSettings);
    return { success: true };
  } catch (err: any) {
    console.warn('Firebase sendEmailVerification notice:', err?.code, err?.message);
    return { success: false, error: err?.message || 'Không thể gửi email xác thực Firebase' };
  }
}

export async function reloadFirebaseUser(): Promise<{ isVerified: boolean; user: FirebaseUser | null; error?: string }> {
  try {
    if (!auth.currentUser) {
      return { isVerified: false, user: null };
    }
    await auth.currentUser.reload();
    return { isVerified: !!auth.currentUser.emailVerified, user: auth.currentUser };
  } catch (err: any) {
    console.warn('Firebase reload notice:', err?.message);
    return { isVerified: false, user: auth.currentUser, error: err?.message };
  }
}

export async function applyFirebaseActionCode(actionCode: string): Promise<{ success: boolean; error?: string }> {
  try {
    await applyActionCode(auth, actionCode);
    if (auth.currentUser) {
      await auth.currentUser.reload();
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Firebase applyActionCode notice:', err?.message);
    return { success: false, error: err?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn' };
  }
}

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  applyActionCode,
  onAuthStateChanged,
  type FirebaseUser
};

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

// Validate Connection to Firestore at boot with safe timeout
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('connection timeout')), 3500)
    );
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      timeoutPromise
    ]);
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('connection timeout'))) {
      console.warn('Firebase Firestore is operating in local/offline fallback mode.');
    } else {
      console.log('Firebase Firestore connection responded.');
    }
    return false;
  }
}

// ==================== FIRESTORE SYNC HELPERS ====================

// --- GIGS ---
export async function syncGigToCloud(gig: GigEntity): Promise<void> {
  const path = `gigs/${gig.id}`;
  try {
    // Sanitize any undefined values, ensuring null fields explicitly overwrite previous values in Firestore
    const cleanData = JSON.parse(JSON.stringify(gig));
    if (gig.status === 'OPEN' || !gig.freelancerId) {
      cleanData.freelancerId = null;
      cleanData.freelancerName = null;
      cleanData.acceptedAt = null;
    }
    delete cleanData.isReverseAuction;
    delete cleanData.lowestBidPrice;
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

export async function fetchGigsFromCloud(): Promise<GigEntity[]> {
  try {
    const gigsRef = collection(db, 'gigs');
    const snapshot = await getDocs(gigsRef);
    const gigs: GigEntity[] = [];
    snapshot.forEach((doc) => {
      gigs.push(doc.data() as GigEntity);
    });
    return gigs;
  } catch (err) {
    console.warn('fetchGigsFromCloud error:', err);
    return [];
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

// --- TRANSACTIONS & SUBCOLLECTION ---
export async function syncTransactionToCloud(tx: WalletTransactionEntity): Promise<void> {
  const path = `transactions/${tx.id}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(tx));
    // 1. Write to root transactions collection
    await setDoc(doc(db, 'transactions', tx.id), cleanData, { merge: true });
    // 2. Write to user's dedicated sub-collection: users/{userId}/transactions/{txId}
    if (tx.userId) {
      await setDoc(doc(db, 'users', tx.userId, 'transactions', tx.id), cleanData, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Lắng nghe sub-collection 'transactions' của người dùng: users/{userId}/transactions
 * Kèm fallback tự động sang root 'transactions' collection
 */
export function subscribeToTransactions(
  userId: string,
  onUpdate: (transactions: WalletTransactionEntity[]) => void,
  onError?: (err: unknown) => void
) {
  const subRef = collection(db, 'users', userId, 'transactions');
  return onSnapshot(
    subRef,
    (snapshot) => {
      const list: WalletTransactionEntity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as WalletTransactionEntity;
        list.push(data);
      });

      // Nếu subcollection chưa có dữ liệu, fallback sang root transactions collection
      if (list.length === 0) {
        const rootRef = collection(db, 'transactions');
        getDocs(rootRef)
          .then((rootSnap) => {
            const rootList: WalletTransactionEntity[] = [];
            rootSnap.forEach((d) => {
              const data = d.data() as WalletTransactionEntity;
              if (data.userId === userId) {
                rootList.push(data);
              }
            });
            rootList.sort((a, b) => b.timestamp - a.timestamp);
            if (rootList.length > 0) {
              onUpdate(rootList);
            } else {
              onUpdate([]);
            }
          })
          .catch(() => onUpdate([]));
      } else {
        list.sort((a, b) => b.timestamp - a.timestamp);
        onUpdate(list);
      }
    },
    (err: FirestoreError) => {
      // Fallback khi subcollection gặp lỗi
      const rootRef = collection(db, 'transactions');
      getDocs(rootRef)
        .then((rootSnap) => {
          const rootList: WalletTransactionEntity[] = [];
          rootSnap.forEach((d) => {
            const data = d.data() as WalletTransactionEntity;
            if (data.userId === userId) {
              rootList.push(data);
            }
          });
          rootList.sort((a, b) => b.timestamp - a.timestamp);
          onUpdate(rootList);
        })
        .catch((fallbackErr) => {
          handleFirestoreError(err, OperationType.LIST, `users/${userId}/transactions`);
          if (onError) onError(fallbackErr || err);
        });
    }
  );
}

/**
 * Đọc trực tiếp danh sách giao dịch từ sub-collection users/{userId}/transactions một lần
 */
export async function fetchUserTransactionsFromFirestore(userId: string): Promise<WalletTransactionEntity[]> {
  try {
    const subRef = collection(db, 'users', userId, 'transactions');
    const snap = await getDocs(subRef);
    if (!snap.empty) {
      const list: WalletTransactionEntity[] = [];
      snap.forEach((d) => list.push(d.data() as WalletTransactionEntity));
      list.sort((a, b) => b.timestamp - a.timestamp);
      return list;
    }
    // Fallback sang root transactions
    const rootRef = collection(db, 'transactions');
    const rootSnap = await getDocs(rootRef);
    const list: WalletTransactionEntity[] = [];
    rootSnap.forEach((d) => {
      const data = d.data() as WalletTransactionEntity;
      if (data.userId === userId) list.push(data);
    });
    list.sort((a, b) => b.timestamp - a.timestamp);
    return list;
  } catch {
    return [];
  }
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

// ==================== REAL-TIME NOTIFICATIONS ====================
export async function sendNotificationToCloud(notification: FirestoreNotificationEntity): Promise<void> {
  const path = `notifications/${notification.id}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(notification));
    await setDoc(doc(db, 'notifications', notification.id), cleanData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToNotifications(
  onNotification: (notif: FirestoreNotificationEntity) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const notifsRef = collection(db, 'notifications');
    const startTime = Date.now();
    let isInitialSnapshot = true;

    return onSnapshot(
      notifsRef,
      (snapshot) => {
        if (isInitialSnapshot) {
          isInitialSnapshot = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as FirestoreNotificationEntity;
            if (!data.createdAt || data.createdAt >= startTime - 5000) {
              onNotification(data);
            }
          }
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    if (onError) onError(err);
    return () => {};
  }
}

// ==================== REAL-TIME VOIP & VIDEO CALL SIGNALING ====================
export async function createCloudCall(call: VoipCallEntity): Promise<void> {
  const path = `calls/${call.id}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(call));
    await setDoc(doc(db, 'calls', call.id), cleanData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateCloudCall(callId: string, updates: Partial<VoipCallEntity>): Promise<void> {
  const path = `calls/${callId}`;
  try {
    const cleanUpdates = JSON.parse(JSON.stringify(updates));
    await setDoc(doc(db, 'calls', callId), cleanUpdates, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToIncomingCalls(
  userId: string,
  onIncomingCall: (call: VoipCallEntity | null) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const callsRef = collection(db, 'calls');
    const q = query(
      callsRef,
      where('targetUserId', '==', userId),
      where('status', '==', 'RINGING')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          // Get the newest ringing call
          const validCalls: VoipCallEntity[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as VoipCallEntity;
            // Only accept calls initiated within the last 45 seconds
            if (data && data.timestamp && Date.now() - data.timestamp < 45000) {
              validCalls.push(data);
            }
          });
          validCalls.sort((a, b) => b.timestamp - a.timestamp);
          if (validCalls.length > 0) {
            onIncomingCall(validCalls[0]);
            return;
          }
        }
        onIncomingCall(null);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'calls');
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    if (onError) onError(err);
    return () => {};
  }
}

export function subscribeToCallSession(
  callId: string,
  onUpdate: (call: VoipCallEntity | null) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const docRef = doc(db, 'calls', callId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as VoipCallEntity);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `calls/${callId}`);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    if (onError) onError(err);
    return () => {};
  }
}

export async function addCallIceCandidate(
  callId: string,
  role: 'caller' | 'callee',
  candidate: { candidate: string; sdpMid?: string | null; sdpMLineIndex?: number | null }
): Promise<void> {
  const path = `calls/${callId}`;
  try {
    const field = role === 'caller' ? 'callerCandidates' : 'calleeCandidates';
    await setDoc(
      doc(db, 'calls', callId),
      {
        [field]: arrayUnion(candidate),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ==================== WEBRTC STUN/TURN ICE CONFIGURATION ====================
export const DEFAULT_ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // Google Public STUN
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Twilio & Mozilla Fallback STUN
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' },
    // OpenRelay Metered TURN Servers (UDP/TCP/TLS) for Symmetric NAT & Firewall Traversal
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
        'turns:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelay',
      credential: 'openrelay',
    },
  ],
  iceCandidatePoolSize: 10,
};

// ==================== REAL-TIME MUTUAL FRIEND REQUESTS ====================
export async function createCloudFriendRequest(req: FriendRequestEntity): Promise<void> {
  const path = `friend_requests/${req.id}`;
  try {
    const cleanData = JSON.parse(JSON.stringify(req));
    await setDoc(doc(db, 'friend_requests', req.id), cleanData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateCloudFriendRequest(
  reqId: string,
  updates: Partial<FriendRequestEntity>
): Promise<void> {
  const path = `friend_requests/${reqId}`;
  try {
    const cleanUpdates = JSON.parse(JSON.stringify(updates));
    await setDoc(doc(db, 'friend_requests', reqId), cleanUpdates, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function addFriendPairInCloud(userAId: string, userBId: string): Promise<void> {
  try {
    const userARef = doc(db, 'users', userAId);
    const userBRef = doc(db, 'users', userBId);
    await updateDoc(userARef, { friendIds: arrayUnion(userBId) }).catch(() => {});
    await updateDoc(userBRef, { friendIds: arrayUnion(userAId) }).catch(() => {});
  } catch (err) {
    console.warn('addFriendPairInCloud warning:', err);
  }
}

export async function sendCloudNotification(
  userId: string,
  title: string,
  message: string,
  type: 'NEW_GIG' | 'STATUS_UPDATE' | 'INFO' = 'INFO'
): Promise<void> {
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    await setDoc(doc(db, 'notifications', notifId), {
      id: notifId,
      userId,
      title,
      message,
      type,
      createdAt: Date.now(),
    });
  } catch (err) {
    console.warn('sendCloudNotification warning:', err);
  }
}

export function subscribeToFriendRequests(
  userId: string,
  onUpdate: (requests: FriendRequestEntity[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const requestsRef = collection(db, 'friend_requests');
    const q = query(
      requestsRef,
      where('receiverId', '==', userId),
      where('status', 'in', ['pending', 'PENDING'])
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: FriendRequestEntity[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as FriendRequestEntity);
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'friend_requests');
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    if (onError) onError(err);
    return () => {};
  }
}

export function subscribeToSentFriendRequests(
  userId: string,
  onUpdate: (requests: FriendRequestEntity[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const requestsRef = collection(db, 'friend_requests');
    const q = query(
      requestsRef,
      where('senderId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: FriendRequestEntity[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as FriendRequestEntity);
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'friend_requests');
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    if (onError) onError(err);
    return () => {};
  }
}

// ==================== AUTO-SAVED GIG POSTING DRAFTS ====================
const DRAFT_LOCAL_PREFIX = 'gigme_create_gig_draft_';

export async function saveGigDraftToCloud(userId: string, draft: Partial<GigDraftEntity>): Promise<void> {
  const path = `gig_drafts/${userId}`;
  const cleanData: GigDraftEntity = {
    userId,
    updatedAt: Date.now(),
    step: draft.step || 1,
    title: draft.title || '',
    description: draft.description || '',
    category: draft.category || '',
    customCategory: draft.customCategory || '',
    price: draft.price || 60000,
    attachedImage: draft.attachedImage || '',
    isFlash: !!draft.isFlash,
    isBoosted: !!draft.isBoosted,
    isRecurringWeekly: !!draft.isRecurringWeekly,
    totalWorkersNeeded: draft.totalWorkersNeeded || 1,
    estimatedDurationMinutes: draft.estimatedDurationMinutes || 30,
    locationName: draft.locationName || '',
    distanceMeters: draft.distanceMeters || 150,
  };

  // 1. Save locally first for instant offline fallback
  try {
    localStorage.setItem(`${DRAFT_LOCAL_PREFIX}${userId}`, JSON.stringify(cleanData));
  } catch (e) {
    console.warn('Could not save draft to localStorage:', e);
  }

  // 2. Synchronize to Firestore
  try {
    const sanitized = JSON.parse(JSON.stringify(cleanData));
    await setDoc(doc(db, 'gig_drafts', userId), sanitized, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getGigDraftFromCloud(userId: string): Promise<GigDraftEntity | null> {
  const path = `gig_drafts/${userId}`;
  // 1. Try reading from Firestore
  try {
    const snap = await getDoc(doc(db, 'gig_drafts', userId));
    if (snap.exists()) {
      const data = snap.data() as GigDraftEntity;
      try {
        localStorage.setItem(`${DRAFT_LOCAL_PREFIX}${userId}`, JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }

  // 2. Fallback to local storage if offline or not yet synced
  try {
    const local = localStorage.getItem(`${DRAFT_LOCAL_PREFIX}${userId}`);
    if (local) {
      return JSON.parse(local) as GigDraftEntity;
    }
  } catch (e) {
    console.warn('Could not parse local draft:', e);
  }

  return null;
}

export async function deleteGigDraftFromCloud(userId: string): Promise<void> {
  const path = `gig_drafts/${userId}`;
  // 1. Remove from local storage
  try {
    localStorage.removeItem(`${DRAFT_LOCAL_PREFIX}${userId}`);
  } catch {}

  // 2. Remove from Firestore
  try {
    await deleteDoc(doc(db, 'gig_drafts', userId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}



