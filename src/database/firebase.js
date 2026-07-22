import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants'; // Leitor oficial do Expo

// Puxa os dados que você colocou na aba "extra" do app.json
const { firebaseApiKey, firebaseAuthDomain, firebaseProjectId } = Constants.expoConfig.extra;

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: "dressc0de.firebasestorage.app",
  messagingSenderId: "818084037811",
  appId: "1:818084037811:web:eecf7bf925b83f1f35dcc6",
  measurementId: "G-NK06DF0KJW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);