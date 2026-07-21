import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// ── IMPORTAÇÕES DO FIREBASE ────────────────────────────────────────────────
import { auth, db } from '../database/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';

// INJEÇÃO ROBUSTA DA FONTE DE ÍCONES PARA O NAVEGADOR
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const iconFontStyles = `
    @font-face {
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype');
      font-family: 'MaterialCommunityIcons';
    }
  `;
  const style = document.createElement('style');
  style.type = 'text/css';
  if (style.styleSheet) {
    style.styleSheet.cssText = iconFontStyles;
  } else {
    style.appendChild(document.createTextNode(iconFontStyles));
  }
  document.head.appendChild(style);
}

// Alerta Híbrido (Web + Mobile)
const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
    if (buttons && buttons[0] && buttons[0].onPress) {
      buttons[0].onPress();
    }
  } else {
    alert(`${title}: ${message}`);
  }
};

export default function LoginScreen({ navigation }) {
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

  const logoSize = animValue.interpolate({ inputRange: [0, 1], outputRange: [160, 110] });
  const logoTranslateY = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const loginOpacity = animValue.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0] });
  const registerOpacity = animValue.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1] });
  const loginTranslateX = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -320] });
  const registerTranslateX = animValue.interpolate({ inputRange: [0, 1], outputRange: [320, 0] });

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return showAlert('Atenção', 'Preencha e-mail e senha.');
    }
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        signIn(userDoc.data());
      } else {
        showAlert('Erro', 'Perfil não encontrado no banco.');
      }
    } catch (e) {
      console.log(e);
      showAlert('Acesso Negado', 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!nome.trim() || !username.trim() || !email.trim() || !password.trim()) {
      return showAlert('Erro', 'Preencha todos os campos.');
    }
    setLoading(true);
    const cleanedUsername = username.trim().toLowerCase();

    try {
      const q = query(collection(db, 'users'), where('username', '==', cleanedUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setLoading(false);
        return showAlert('Erro', 'Username já cadastrado.');
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

      showAlert('Sucesso!', 'Conta criada com sucesso!', [
        { text: 'Fazer Login', onPress: toggleMode }
      ]);
    } catch (e) {
      console.log(e);
      showAlert('Erro', 'Falha ao registrar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#131313', '#2c0050', '#131313']} style={StyleSheet.absoluteFillObject} opacity={0.6} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1, width: '100%' }}
      >
        <View style={styles.inner}>
          <View style={styles.responsiveWrapper}>
            
            {/* LOGO */}
            <Animated.View style={[styles.header, { transform: [{ translateY: logoTranslateY }] }]}>
              <Animated.Image
                source={require('../../logo-def-dresscode.png')}
                style={{ width: logoSize, height: logoSize }}
                resizeMode="contain"
              />
            </Animated.View>

            {/* AUTH CARD */}
            <View style={styles.authBox}>
              
              {/* LOGIN */}
              <Animated.View
                style={[styles.card, { opacity: loginOpacity, transform: [{ translateX: loginTranslateX }] }]}
                pointerEvents={isRegisterMode ? 'none' : 'auto'}
              >
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="email-outline" size={22} color="#978d9d" />
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
                  <MaterialCommunityIcons name="lock-outline" size={22} color="#978d9d" />
                  <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    placeholderTextColor="#978d9d"
                    secureTextEntry={!showPass}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable onPress={() => setShowPass(!showPass)} hitSlop={10} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name={showPass ? "eye-off-outline" : "eye-outline"} size={22} color="#978d9d" />
                  </Pressable>
                </View>

                <Pressable onPress={() => showAlert('Recuperar', 'Instruções enviadas para seu e-mail.')} hitSlop={10}>
                  <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [styles.mainBtn, pressed && { opacity: 0.8 }]} 
                  onPress={handleLogin} 
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#4a0080" /> : <Text style={styles.btnText}>ENTRAR</Text>}
                </Pressable>
              </Animated.View>

              {/* CADASTRO */}
              <Animated.View
                style={[styles.card, styles.absoluteCard, { opacity: registerOpacity, transform: [{ translateX: registerTranslateX }] }]}
                pointerEvents={isRegisterMode ? 'auto' : 'none'}
              >
                <LinearGradient colors={['rgba(221,183,255,0.1)', 'transparent']} style={styles.glowOverlay} />

                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="account-outline" size={22} color="#978d9d" />
                  <TextInput style={styles.input} placeholder="Nome Completo" placeholderTextColor="#978d9d" value={nome} onChangeText={setNome} />
                </View>

                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="at" size={22} color="#978d9d" />
                  <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#978d9d" value={username} onChangeText={setUsername} autoCapitalize="none" />
                </View>

                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="email-outline" size={22} color="#978d9d" />
                  <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#978d9d" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                </View>

                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={22} color="#978d9d" />
                  <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#978d9d" secureTextEntry value={password} onChangeText={setPassword} />
                </View>

                <Pressable 
                  style={({ pressed }) => [styles.mainBtn, { backgroundColor: '#ba7ef4' }, pressed && { opacity: 0.8 }]} 
                  onPress={handleRegister} 
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnText, { color: '#fff' }]}>CRIAR CONTA</Text>}
                </Pressable>
              </Animated.View>

            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Pressable onPress={toggleMode} hitSlop={15}>
                <Text style={styles.toggleText}>
                  {isRegisterMode ? "Já tem conta? " : "Novo por aqui? "}
                  <Text style={styles.toggleBold}>{isRegisterMode ? "Login" : "Registre-se"}</Text>
                </Text>
              </Pressable>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    zIndex: 10,
    marginBottom: 10,
  },
  authBox: {
    width: '100%',
    minHeight: 360,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#160d22',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4,
  },
  absoluteCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    paddingHorizontal: 15,
    height: 52,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  input: {
    flex: 1,
    color: '#e5e2e1',
    marginLeft: 10,
    fontSize: 15,
    outlineStyle: 'none',
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
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    cursor: 'pointer',
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
});