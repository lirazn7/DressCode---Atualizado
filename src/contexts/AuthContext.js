import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../database/firebase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      const storageUser = await AsyncStorage.getItem('@dresscode_session');
      if (storageUser) {
        const parsed = JSON.parse(storageUser);
        setUser(parsed);

        if (parsed?.uid) {
          try {
            const userSnap = await getDoc(doc(db, 'users', parsed.uid));
            if (userSnap.exists()) {
              const freshData = userSnap.data();
              setUser(freshData);
              await AsyncStorage.setItem('@dresscode_session', JSON.stringify(freshData));
            }
          } catch (e) {
            console.log('Erro ao atualizar sessão:', e);
          }
        }
      }
      setLoadingContext(false);
    };
    loadStorageData();
  }, []);

  const signIn = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem('@dresscode_session', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    if (!user?.uid) return;
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        const freshData = userSnap.data();
        setUser(freshData);
        await AsyncStorage.setItem('@dresscode_session', JSON.stringify(freshData));
      }
    } catch (e) {
      console.log('Erro ao atualizar usuário:', e);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.log('Erro no logout Firebase:', e);
    }
    setUser(null);
    await AsyncStorage.removeItem('@dresscode_session');
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, refreshUser, loadingContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
