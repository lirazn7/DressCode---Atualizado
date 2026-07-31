import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../database/firebase';

WebBrowser.maybeCompleteAuthSession();

const extra = Constants.expoConfig?.extra || {};
const GOOGLE_WEB_CLIENT_ID = extra.googleWebClientId;

export async function signInWithGoogleNative(idToken) {
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  return ensureUserProfile(userCredential.user);
}

export async function signInWithGoogleWeb() {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const userCredential = await signInWithPopup(auth, provider);
  return ensureUserProfile(userCredential.user);
}

async function ensureUserProfile(firebaseUser) {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data();
  }

  const email = firebaseUser.email || '';
  const baseUsername = email.split('@')[0]?.replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'user';
  const displayName = firebaseUser.displayName || baseUsername;

  const userData = {
    uid: firebaseUser.uid,
    nome: displayName,
    username: `${baseUsername}_${firebaseUser.uid.slice(0, 5)}`,
    email: email.toLowerCase(),
    role: 'user',
    avatar_url: firebaseUser.photoURL || null,
    createdAt: new Date().toISOString(),
  };

  await setDoc(userRef, userData);
  return userData;
}

export function useGoogleAuthRequest() {
  return Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_WEB_CLIENT_ID,
  });
}

export async function handleGoogleSignIn(promptAsync) {
  try {
    if (Platform.OS === 'web') {
      return await signInWithGoogleWeb();
    }

    if (!GOOGLE_WEB_CLIENT_ID) {
      Alert.alert(
        'Configuração necessária',
        'Adicione GOOGLE_WEB_CLIENT_ID no arquivo .env (Firebase Console > Authentication > Google > Web client ID).'
      );
      return null;
    }

    const result = await promptAsync();
    if (result?.type === 'success' && result.params?.id_token) {
      return await signInWithGoogleNative(result.params.id_token);
    }
    return null;
  } catch (error) {
    console.error('Google sign-in error:', error);
    Alert.alert('Erro', 'Não foi possível entrar com o Google. Tente novamente.');
    return null;
  }
}
