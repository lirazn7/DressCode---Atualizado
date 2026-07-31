import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from './src/screens/SearchScreen';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import StylistChat from './src/components/StylistChat';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import VitrineScreen from './src/screens/VitrineScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ClosetScreen from './src/screens/ClosetScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AdminScreen from './src/screens/AdminScreen';
import SetUsernameScreen from './src/screens/SetUsernameScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Vitrine" component={VitrineScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Closet" component={ClosetScreen} />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="SetUsername" component={SetUsernameScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
      </Stack.Navigator>
      <StylistChat />
    </>
  );
}

function Routes() {
  const { user, loadingContext } = useAuth();

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

export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
