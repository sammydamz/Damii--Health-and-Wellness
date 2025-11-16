'use client';

import { 
  Firestore, 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Creates a user profile document in Firestore.
 * @param firestore - The Firestore instance.
 * @param user - The Firebase Auth user object.
 * @param additionalData - Additional data to include in the profile.
 */
export async function createUserProfile(
  firestore: Firestore,
  user: User,
  additionalData: { username: string }
) {
  if (!user) return;

  const userRef = doc(firestore, `users/${user.uid}`);
  const userData = {
    id: user.uid,
    email: user.email,
    username: additionalData.username || user.displayName || 'Anonymous',
    registrationDate: new Date().toISOString(),
  };

  return setDoc(userRef, userData, { merge: true }).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: userRef.path,
        operation: 'create',
        requestResourceData: userData,
      })
    );
    // Re-throw the original error if you need to handle it further up the call stack
    throw error;
  });
}

/**
 * Save a mood log entry for a user
 * @param firestore - Firestore instance
 * @param userId - User ID
 * @param moodData - Mood log data (mood level, activities, date)
 */
export async function saveMoodLog(
  firestore: Firestore,
  userId: string,
  moodData: {
    mood: number; // 1-5 scale
    activities: string[];
    date: string; // ISO date string
    notes?: string;
  }
) {
  const moodLogRef = collection(firestore, `users/${userId}/moodLogs`);
  
  const logEntry = {
    ...moodData,
    timestamp: Timestamp.now(),
    createdAt: new Date().toISOString(),
  };

  return addDoc(moodLogRef, logEntry).catch(error => {
    console.error('Error saving mood log:', error);
    throw error;
  });
}

/**
 * Get mood logs for a user within a date range
 * @param firestore - Firestore instance
 * @param userId - User ID
 * @param startDate - Start date (optional)
 * @param endDate - End date (optional)
 * @param limitCount - Maximum number of logs to retrieve
 */
export async function getMoodLogs(
  firestore: Firestore,
  userId: string,
  startDate?: string,
  endDate?: string,
  limitCount: number = 30
) {
  const moodLogsRef = collection(firestore, `users/${userId}/moodLogs`);
  
  let q = query(
    moodLogsRef,
    orderBy('date', 'desc'),
    limit(limitCount)
  );

  if (startDate && endDate) {
    q = query(
      moodLogsRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Save a chat message
 * @param firestore - Firestore instance
 * @param userId - User ID
 * @param message - Message object with role and content
 */
export async function saveChatMessage(
  firestore: Firestore,
  userId: string,
  message: {
    role: 'user' | 'assistant';
    content: string;
  }
) {
  const chatRef = collection(firestore, `users/${userId}/chatHistory`);
  
  const messageEntry = {
    ...message,
    timestamp: Timestamp.now(),
    createdAt: new Date().toISOString(),
  };

  return addDoc(chatRef, messageEntry).catch(error => {
    console.error('Error saving chat message:', error);
    throw error;
  });
}

/**
 * Get chat history for a user
 * @param firestore - Firestore instance
 * @param userId - User ID
 * @param limitCount - Maximum number of messages to retrieve
 */
export async function getChatHistory(
  firestore: Firestore,
  userId: string,
  limitCount: number = 50
) {
  const chatRef = collection(firestore, `users/${userId}/chatHistory`);
  
  const q = query(
    chatRef,
    orderBy('timestamp', 'asc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Update user profile information
 * @param firestore - Firestore instance
 * @param userId - User ID
 * @param updates - Fields to update
 */
export async function updateUserProfile(
  firestore: Firestore,
  userId: string,
  updates: {
    username?: string;
    interests?: string[];
    goals?: string[];
  }
) {
  const userRef = doc(firestore, `users/${userId}`);
  
  return updateDoc(userRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  }).catch(error => {
    console.error('Error updating user profile:', error);
    throw error;
  });
}

/**
 * Get user profile
 * @param firestore - Firestore instance
 * @param userId - User ID
 */
export async function getUserProfile(
  firestore: Firestore,
  userId: string
) {
  const userRef = doc(firestore, `users/${userId}`);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}
