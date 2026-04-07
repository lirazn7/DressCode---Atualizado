import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Cria o contexto
const AuthContext = createContext({});

// 2. Cria o Provedor (o guarda-chuva) que vai abraçar o app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);

  // Assim que o app abre, ele olha se tem alguém salvo no celular
  useEffect(() => {
    const loadStorageData = async () => {
      const storageUser = await AsyncStorage.getItem('@dresscode_session');
      if (storageUser) {
        setUser(JSON.parse(storageUser));
      }
      setLoadingContext(false);
    };
    loadStorageData();
  }, []);

  // Função para fazer login (salva no contexto e no celular)
  const signIn = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem('@dresscode_session', JSON.stringify(userData));
  };

  // Função para fazer logout (limpa tudo)
  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem('@dresscode_session');
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, loadingContext }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Cria um Hook personalizado (para facilitar o uso nas telas)
export const useAuth = () => {
  return useContext(AuthContext);
};