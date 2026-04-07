// 1. IMPORTANTE: O Polyfill deve ser a PRIMEIRA linha para o Supabase funcionar no celular
import 'react-native-url-polyfill/auto'; 

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importação das Telas
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/RegisterScreen';
import VitrineScreen from './src/screens/VitrineScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AdminScreen from './src/screens/AdminScreen';
import ClosetScreen from './src/screens/ClosetScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login" 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Vitrine" component={VitrineScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        <Stack.Screen name="Closet" component={ClosetScreen} />
        
        {/* 2. ADICIONADO: A rota para a tela de Admin agora existe para o sistema */}
        <Stack.Screen name="Admin" component={AdminScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}