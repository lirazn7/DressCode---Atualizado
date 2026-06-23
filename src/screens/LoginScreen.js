import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Image,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, ActivityIndicator, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// ── IMPORTAÇÕES DO FIREBASE ────────────────────────────────────────────────
import { auth, db } from '../database/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
  const { signIn } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Campos
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');

  const animValue = useRef(new Animated.Value(0)).current;

  const toggleMode = () => {
    const toValue = isRegisterMode ? 0 : 1;
    Animated.spring(animValue, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
    setIsRegisterMode(!isRegisterMode);
  };

  const logoSize = animValue.interpolate({ inputRange: [0, 1], outputRange: [180, 120] });
  const logoTranslateY = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const loginOpacity = animValue.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0] });
  const registerOpacity = animValue.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1] });
  const loginTranslateX = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  const registerTranslateX = animValue.interpolate({ inputRange: [0, 1], outputRange: [width, 0] });

  // ── LOGICA DE LOGIN COM FIREBASE ──────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return Alert.alert('Atenção', 'Preencha e-mail e senha.');
    setLoading(true);
    
    try {
      // 1. Autentica e-mail e senha no serviço Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;

      // 2. Busca os dados complementares do perfil no Firestore usando o UID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        // Envia os dados completos do usuário para o seu Contexto Global do App
        signIn(userDoc.data());
      } else {
        Alert.alert('Erro', 'Perfil do usuário não encontrado no banco.');
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Acesso Negado', 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  // ── LÓGICA DE REGISTRO INTEGRADA NO MESMO CARD ────────────────────────────
  const handleRegister = async () => {
    if (!nome.trim() || !username.trim() || !email.trim() || !password.trim()) {
      return Alert.alert('Erro', 'Preencha todos os campos.');
    }
    setLoading(true);
    const cleanedUsername = username.trim().toLowerCase();

    try {
      // Verifica disponibilidade do username
      const q = query(collection(db, 'users'), where('username', '==', cleanedUsername));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setLoading(false);
        return Alert.alert('Erro', 'Username já cadastrado.');
      }

      // Cria credencial de login
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;

      // Salva documento do usuário
      const userData = { uid: user.uid, nome: nome.trim(), username: cleanedUsername, email: email.trim().toLowerCase(), role: 'user' };
      await setDoc(doc(db, 'users', user.uid), userData);

      Alert.alert('Sucesso!', 'Sua conta DressCode foi criada.', [{ text: 'Fazer Login', onPress: toggleMode }]);
    } catch (e) {
      console.log(e);
      Alert.alert('Erro', 'Falha ao registrar conta ou e-mail em uso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#131313', '#2c0050', '#131313']} style={StyleSheet.absoluteFillObject} opacity={0.6} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>

            <Animated.View style={[styles.header, { transform: [{ translateY: logoTranslateY }] }]}>
              <Animated.Image source={require('../../logo-def-dresscode.png')} style={{ width: logoSize, height: logoSize }} resizeMode="contain" />
            </Animated.View>

            <View style={styles.authBox}>
              {/* FORMULÁRIO DE LOGIN */}
              <Animated.View style={[styles.card, { opacity: loginOpacity, transform: [{ translateX: loginTranslateX }] }]} pointerEvents={isRegisterMode ? 'none' : 'auto'}>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="email-outline" size={20} color="#978d9d" />
                  <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#978d9d" value={email} onChangeText={setEmail} autoCapitalize="none" />
                </View>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#978d9d" />
                  <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#978d9d" secureTextEntry={!showPass} value={password} onChangeText={setPassword} />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <MaterialCommunityIcons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#978d9d" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Recuperar', 'Função disponível em breve!')}>
                  <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mainBtn} onPress={handleLogin} disabled={loading}>
                  {loading ? <ActivityIndicator color="#4a0080" /> : <Text style={styles.btnText}>ENTRAR</Text>}
                </TouchableOpacity>
              </Animated.View>

              {/* FORMULÁRIO DE REGISTRO */}
              <Animated.View style={[styles.card, styles.absoluteCard, { opacity: registerOpacity, transform: [{ translateX: registerTranslateX }] }]} pointerEvents={isRegisterMode ? 'auto' : 'none'}>
                <LinearGradient colors={['rgba(221,183,255,0.1)', 'transparent']} style={styles.glowOverlay} />
                <View style={styles.inputWrapper}>
                   <MaterialCommunityIcons name="account-outline" size={20} color="#978d9d" />
                   <TextInput style={styles.input} placeholder="Nome Completo" placeholderTextColor="#978d9d" value={nome} onChangeText={setNome} />
                </View>
                <View style={styles.inputWrapper}>
                   <MaterialCommunityIcons name="at" size={20} color="#978d9d" />
                   <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#978d9d" value={username} onChangeText={setUsername} autoCapitalize="none" />
                </View>
                <View style={styles.inputWrapper}>
                   <MaterialCommunityIcons name="email-outline" size={20} color="#978d9d" />
                   <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#978d9d" value={email} onChangeText={setEmail} autoCapitalize="none" />
                </View>
                <View style={styles.inputWrapper}>
                   <MaterialCommunityIcons name="lock-outline" size={20} color="#978d9d" />
                   <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#978d9d" secureTextEntry value={password} onChangeText={setPassword} />
                </View>
                <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#ba7ef4' }]} onPress={handleRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnText, { color: '#fff' }]}>CRIAR CONTA</Text>}
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity onPress={toggleMode}>
                <Text style={styles.toggleText}>
                  {isRegisterMode ? "Já tem conta? " : "Novo por aqui? "}
                  <Text style={styles.toggleBold}>{isRegisterMode ? "Login" : "Registre-se"}</Text>
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

// ... Manter os mesmos Styles originais do seu LoginScreen.js
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 25 },
  header: { alignItems: 'center', zIndex: 10, marginBottom: 20 },
  authBox: { width: '100%', height: 400, justifyContent: 'center' },
  card: { backgroundColor: '#160d22', borderColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderRadius: 20, padding: 25, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 0 },
  absoluteCard: { position: 'absolute', top: 0, height: '100%' },
  glowOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 20, opacity: 0.2 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#160d22', borderRadius: 12, paddingHorizontal: 15, height: 52, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  input: { flex: 1, color: '#e5e2e1', marginLeft: 10, fontSize: 15 },
  forgotText: { color: '#978d9d', fontSize: 13, textAlign: 'right', marginBottom: 15, textDecorationLine: 'underline' },
  mainBtn: { backgroundColor: '#ddb7ff', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  btnText: { color: '#4a0080', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  footer: { marginTop: 20, paddingBottom: 20 },
  toggleText: { color: '#978d9d', fontSize: 14 },
  toggleBold: { color: '#ddb7ff', fontWeight: 'bold' }
});