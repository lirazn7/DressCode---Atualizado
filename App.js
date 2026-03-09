import React, { useState, useEffect } from 'react';
import { DatabaseInit } from './src/database/DatabaseInit';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/RegisterScreen';
import VitrineScreen from './src/screens/VitrineScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');

  // Inicializa o banco ao abrir o App
  useEffect(() => {
    try {
      DatabaseInit();
    } catch (error) {
      console.log("Erro ao iniciar banco:", error);
    }
  }, []);

  return (

    
    <>
      {currentScreen === 'login' && (
        <LoginScreen 
          onLogin={() => setCurrentScreen('vitrine')} 
          onGoToRegister={() => setCurrentScreen('register')} 
        />
      )}

      {currentScreen === 'register' && (
        <RegisterScreen 
          onBack={() => setCurrentScreen('login')} 
        />
      )}

      {currentScreen === 'vitrine' && (
        <VitrineScreen onLogout={() => setCurrentScreen('login')} />
      )}
    </>
  );
}