import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

import { auth, db } from '../database/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { handleGoogleSignIn, useGoogleAuthRequest } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const [, , promptAsync] = useGoogleAuthRequest();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');

  // Motion do card: translada para o lado e faz fade ao trocar Login/Registro
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Motion pós-login: card some, logo desce/aumenta pro centro, depois some e o loader aparece
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const headerLayoutRef = useRef(null);

  const handleHeaderLayout = (e) => {
    headerLayoutRef.current = e.nativeEvent.layout;
  };

  const runWelcomeTransition = (userData) => {
    const layout = headerLayoutRef.current;
    // Calcula o quanto a logo precisa descer para ficar centralizada verticalmente na tela
    const targetTranslateY = layout
      ? (SCREEN_HEIGHT / 2) - (layout.y + layout.height / 2)
      : SCREEN_HEIGHT * 0.3;

    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(logoTranslateY, { toValue: targetTranslateY, duration: 700, useNativeDriver: true }),
      Animated.timing(logoScale, { toValue: 1.7, duration: 700, useNativeDriver: true }),
    ]).start(() => {
      // Segura a logo grande e centralizada por alguns segundos
      setTimeout(() => {
        Animated.timing(logoOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
          setShowLoader(true);
          Animated.timing(loaderOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
            setTimeout(() => signIn(userData), 500);
          });
        });
      }, 1400);
    });
  };

  const toggleMode = () => {
    const direction = isRegisterMode ? 1 : -1; // saindo do registro volta pra direita, indo pro registro sai pra esquerda

    Animated.parallel([
      Animated.timing(slideAnim, { toValue: direction * 40, duration: 160, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setIsRegisterMode(!isRegisterMode);
      slideAnim.setValue(direction * -40);

      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Atenção', 'Preencha e-mail e senha.');
    }
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        runWelcomeTransition(userDoc.data());
      } else {
        Alert.alert('Erro', 'Perfil não encontrado no banco.');
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Acesso Negado', 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const userData = await handleGoogleSignIn(promptAsync);
      if (userData) runWelcomeTransition(userData);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = async () => {
    if (!nome.trim() || !username.trim() || !email.trim() || !password.trim()) {
      return Alert.alert('Erro', 'Preencha todos os campos.');
    }
    setLoading(true);
    const cleanedUsername = username.trim().toLowerCase();

    try {
      const q = query(collection(db, 'users'), where('username', '==', cleanedUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setLoading(false);
        return Alert.alert('Erro', 'Username já cadastrado.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;

      const userData = {
        uid: user.uid,
        nome: nome.trim(),
        username: cleanedUsername,
        email: email.trim().toLowerCase(),
        role: 'user',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      Alert.alert('Sucesso!', 'Conta criada com sucesso!', [
        { text: 'Fazer Login', onPress: toggleMode }
      ]);
    } catch (e) {
      console.log(e);
      Alert.alert('Erro', 'Falha ao registrar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.responsiveContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient colors={['#131313', '#2c0050', '#131313']} style={StyleSheet.absoluteFillObject} opacity={0.6} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <View style={styles.inner}>

            <Animated.View
              style={[
                styles.header,
                { transform: [{ translateY: logoTranslateY }, { scale: logoScale }], opacity: logoOpacity }
              ]}
              onLayout={handleHeaderLayout}
            >
              <Image
                source={require('../../logo-def-dresscode.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View style={[styles.card, { opacity: cardOpacity }]}>
              <Animated.View style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}>
                {!isRegisterMode ? (
                  <View style={styles.formContainer}>
                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="email-outline" size={20} color="#978d9d" style={styles.iconStyle} />
                      <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#978d9d"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>

                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="lock-outline" size={20} color="#978d9d" style={styles.iconStyle} />
                      <TextInput
                        style={styles.input}
                        placeholder="Senha"
                        placeholderTextColor="#978d9d"
                        secureTextEntry={!showPass}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 6 }}>
                        <MaterialCommunityIcons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#978d9d" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={handleForgotPassword}>
                      <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.mainBtn} onPress={handleLogin} disabled={loading}>
                      {loading ? <ActivityIndicator color="#4a0080" /> : <Text style={styles.btnText}>ENTRAR</Text>}
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerLabel}>ou</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={loading}>
                      <MaterialCommunityIcons name="google" size={20} color="#e5e2e1" />
                      <Text style={styles.googleBtnText}>Continuar com Google</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.formContainer}>
                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="account-outline" size={20} color="#978d9d" style={styles.iconStyle} />
                      <TextInput style={styles.input} placeholder="Nome Completo" placeholderTextColor="#978d9d" value={nome} onChangeText={setNome} />
                    </View>

                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="at" size={20} color="#978d9d" style={styles.iconStyle} />
                      <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#978d9d" value={username} onChangeText={setUsername} autoCapitalize="none" />
                    </View>

                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="email-outline" size={20} color="#978d9d" style={styles.iconStyle} />
                      <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#978d9d" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                    </View>

                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="lock-outline" size={20} color="#978d9d" style={styles.iconStyle} />
                      <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#978d9d" secureTextEntry value={password} onChangeText={setPassword} />
                    </View>

                    <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#ba7ef4' }]} onPress={handleRegister} disabled={loading}>
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnText, { color: '#fff' }]}>CRIAR CONTA</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.footer, { opacity: cardOpacity }]}>
              <TouchableOpacity onPress={toggleMode}>
                <Text style={styles.toggleText}>
                  {isRegisterMode ? "Já tem conta? " : "Novo por aqui? "}
                  <Text style={styles.toggleBold}>{isRegisterMode ? "Login" : "Registre-se"}</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

          </View>
        </KeyboardAvoidingView>

        {showLoader && (
          <Animated.View style={[styles.loaderOverlay, { opacity: loaderOpacity }]}>
            <ActivityIndicator size="large" color="#ddb7ff" />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a050f', alignItems: 'center', justifyContent: 'center' },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#131313',
    position: 'relative',
    overflow: 'hidden',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  logoImage: {
    width: 160,
    height: 120,
  },
  card: {
    backgroundColor: '#160d22',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  formContainer: {
    width: '100%',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    opacity: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#160d22',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  iconStyle: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#e5e2e1',
    fontSize: 15,
  },
  forgotText: {
    color: '#978d9d',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 15,
    textDecorationLine: 'underline',
  },
  mainBtn: {
    backgroundColor: '#ddb7ff',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  btnText: {
    color: '#4a0080',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 20,
    paddingBottom: 20,
  },
  toggleText: {
    color: '#978d9d',
    fontSize: 14,
  },
  toggleBold: {
    color: '#ddb7ff',
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerLabel: {
    color: '#978d9d',
    fontSize: 12,
    marginHorizontal: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#131313',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 10,
  },
  googleBtnText: {
    color: '#e5e2e1',
    fontWeight: '600',
    fontSize: 14,
  },
});