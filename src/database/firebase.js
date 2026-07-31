import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket || 'dressc0de.firebasestorage.app',
  messagingSenderId: extra.firebaseMessagingSenderId || '818084037811',
  appId: extra.firebaseAppId || '1:818084037811:web:eecf7bf925b83f1f35dcc6',
  measurementId: extra.firebaseMeasurementId || 'G-NK06DF0KJW',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
