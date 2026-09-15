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
  FirestoreError
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { GigEntity, UserEntity, ChatMessageEntity, WalletTransactionEntity } from '../types';

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
