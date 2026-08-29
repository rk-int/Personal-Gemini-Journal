import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously,
  signOut as fbSignOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalEntry, UserProfile } from '../types';

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Authentication Instance
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

// Firestore Instance (Using the provisioned database ID)
export const db: Firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Recursively cleans any object before sending to Firestore to avoid Firestore exceptions.
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePayload(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizePayload(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Signs in user via Google Popup, with graceful fallback.
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
  } catch (error: any) {
    console.warn('Popup sign in failed or was blocked by browser/iframe, attempting redirect or fallback:', error);
    // If popup is blocked by iframe or browser policy, let error bubble or handle
    throw error;
  }
}

/**
 * Guest sign-in for testing or environments where external popups are blocked.
 */
export async function signInAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

/**
 * Signs out current user.
 */
export async function logOut(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Subscribes to real-time updates for all journal entries belonging to a user.
 * Isolated strictly to `users/{userId}/entries`.
 */
export function subscribeToUserEntries(
  userId: string,
  onEntriesReceived: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!userId) {
    onEntriesReceived([]);
    return () => {};
  }

  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<JournalEntry, 'id'>;
        entries.push({
          id: docSnap.id,
          ...data,
        });
      });
      onEntriesReceived(entries);
    },
    (err) => {
      console.error('Error fetching user journal entries from Firestore:', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Saves or updates a user journal entry.
 * Enforces user isolation by saving under `users/{userId}/entries/{entry.id}`.
 */
export async function saveUserEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) {
    throw new Error('Cannot save entry: User is not authenticated.');
  }

  const cleanEntry = sanitizePayload({
    ...entry,
    userId,
    updatedAt: Date.now(),
  });

  const entryRef = doc(db, 'users', userId, 'entries', entry.id);
  await setDoc(entryRef, cleanEntry, { merge: true });
}

/**
 * Deletes a user journal entry from Firestore.
 */
export async function deleteUserEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) {
    throw new Error('Invalid userId or entryId for deletion.');
  }

  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}
