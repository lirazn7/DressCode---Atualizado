import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseInit } from './src/database/DatabaseInit';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/RegisterScreen';
import SetUsernameScreen from './src/screens/SetUsernameScreen';
import VitrineScreen from './src/screens/VitrineScreen';
import AdminScreen from './src/screens/AdminScreen';

const SESSION_KEY = '@dresscode_session';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [loggedUser, setLoggedUser]       = useState(null);
  // Usuário temporário enquanto aguarda definição do username
  const [pendingUser, setPendingUser]     = useState(null);

  // ── Inicialização ────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try { DatabaseInit(); } catch (e) { console.log('Erro banco:', e); }

      try {
        const saved = await AsyncStorage.getItem(SESSION_KEY);
        if (saved) {
          const user = JSON.parse(saved);
          setLoggedUser(user);
          setCurrentScreen('vitrine');
        } else {
          setCurrentScreen('login');
        }
      } catch (e) {
        setCurrentScreen('login');
      }
    };
    init();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleLogin = async (user) => {
    // Se o usuário não tem username, redireciona para criar um
    if (!user.username && user.role !== 'admin') {
      Alert.alert(
        'Bem-vindo! 👋',
        'Para continuar, você precisa criar um @username para sua conta DressCode.',
        [{ text: 'Criar agora', style: 'default' }]
      );
      setPendingUser(user);
      setCurrentScreen('setUsername');
      return;
    }

    // Login normal — salva sessão
    try { await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
    catch (e) { console.log('Erro ao salvar sessão:', e); }
    setLoggedUser(user);
    setCurrentScreen('vitrine');
  };

  // Chamado quando o usuário a define seu username na SetUsernameScreen
  const handleUsernameDefined = async (updatedUser) => {
    try { await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser)); }
    catch (e) { console.log('Erro ao salvar sessão:', e); }
    setPendingUser(null);
    setLoggedUser(updatedUser);
    setCurrentScreen('vitrine');
  };

  const handleLogout = async () => {
    try { await AsyncStorage.removeItem(SESSION_KEY); }
    catch (e) { console.log('Erro ao remover sessão:', e); }
    setLoggedUser(null);
    setPendingUser(null);
    setCurrentScreen('login');
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (currentScreen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#801C91" />
      </View>
    );
  }

  // ── Navegação ─────────────────────────────────────────────────────────────────
  return (
    <>
      {currentScreen === 'login' && (
        <LoginScreen
          onLogin={handleLogin}
          onGoToRegister={() => setCurrentScreen('register')}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterScreen onBack={() => setCurrentScreen('login')} />
      )}

      {currentScreen === 'setUsername' && (
        <SetUsernameScreen
          user={pendingUser}
          onDone={handleUsernameDefined}
        />
      )}

      {currentScreen === 'vitrine' && (
        <VitrineScreen
          onLogout={handleLogout}
          user={loggedUser}
          onOpenAdmin={() => setCurrentScreen('admin')}
        />
      )}

      {currentScreen === 'admin' && (
        <AdminScreen onBack={() => setCurrentScreen('vitrine')} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#350238',
    justifyContent: 'center',
    alignItems: 'center',
  },
});