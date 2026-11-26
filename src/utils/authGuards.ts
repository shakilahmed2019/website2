import { auth } from '../lib/firebase';
import { UserProfile } from '../types/lms';

/**
 * Verifies admin privilege across both hydrated profile state and the active
 * Firebase Auth SDK session so client-side state tampering alone cannot expose
 * admin controls. Authoritative enforcement still lives in Firestore rules.
 */
export function isVerifiedAdminUser(currentUser: UserProfile | null): boolean {
  if (!currentUser || currentUser.role !== 'admin') {
    return false;
  }
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.emailVerified) {
    return false;
  }
  return fbUser.uid === currentUser.id;
}
