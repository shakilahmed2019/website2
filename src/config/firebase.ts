import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Analytics, getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyC0gtmWZciJJn0tjvRoixxHJSBoplJ8uYc',
  authDomain: 'tanvirs-science-square.firebaseapp.com',
  projectId: 'tanvirs-science-square',
  storageBucket: 'tanvirs-science-square.firebasestorage.app',
  messagingSenderId: '834978536463',
  appId: '1:834978536463:web:ca8498e909d3b71cc1d77a',
  measurementId: 'G-97WLE8F9GY',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  void isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}
