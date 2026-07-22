import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from './src/screens/SearchScreen';

// 1. O nosso Guarda-Chuva (Contexto)
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// 2. Importação das Telas
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VitrineScreen from './src/screens/VitrineScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ClosetScreen from './src/screens/ClosetScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AdminScreen from './src/screens/AdminScreen';
import SetUsernameScreen from './src/screens/SetUsernameScreen';

const Stack = createNativeStackNavigator();

// 🧱 PACOTE 1: Telas Públicas (Sem Login)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// 🧱 PACOTE 2: Telas Privadas (Com Login)
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Vitrine" component={VitrineScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Closet" component={ClosetScreen} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="SetUsername" component={SetUsernameScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  );
}

// 🎼 O MAESTRO: Decide qual pacote mostrar
function Routes() {
  const { user, loadingContext } = useAuth();

  // Enquanto verifica o AsyncStorage, mostra uma telinha de carregamento para não piscar o Login
  if (loadingContext) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#5D1D7A' }}>
        <ActivityIndicator size="large" color="#ed85ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

// 🌐 O APP PRINCIPAL: Abraça tudo!
export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}