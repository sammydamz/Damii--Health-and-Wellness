'use client';

import { Firestore, doc, setDoc } from 'firebase/firestore';
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
