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

// Função utilitária para exibir alertas de forma híbrida (Web + Mobile)
const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
    if (buttons && buttons[0] && buttons[0].onPress) {
      buttons[0].onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Campos de entrada
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');

  // ── CONTROLE DA ANIMAÇÃO DO CARD ──────────────────────────────────────────
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

  // Interpolações de design
  const logoSize = animValue.interpolate({ inputRange: [0, 1], outputRange: [180, 120] });
  const logoTranslateY = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const loginOpacity = animValue.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0] });
  const registerOpacity = animValue.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1] });
  
  // Animação horizontal fluida adaptada tanto para Mobile quanto para Web
  const loginTranslateX = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -350] });
  const registerTranslateX = animValue.interpolate({ inputRange: [0, 1], outputRange: [350, 0] });

  // ── LÓGICA DE LOGIN COM FIREBASE ──────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return showAlert('Atenção', 'Preencha e-mail e senha.');
    }
    setLoading(true);

    try {
      // 1. Autentica no Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;

      // 2. Busca dados cadastrais estendidos da coleção 'users' no Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        signIn(userDoc.data()); // Atualiza o Contexto Global e libera as rotas do App
      } else {
        showAlert('Erro', 'Perfil do usuário não encontrado no banco.');
      }
    } catch (e) {
      console.log('Erro ao autenticar:', e);
      showAlert('Acesso Negado', 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  // ── LÓGICA DE CADASTRO COM FIREBASE ────────────────────────────────────────
  const handleRegister = async () => {
    if (!nome.trim() || !username.trim() || !email.trim() || !password.trim()) {
      return showAlert('Erro', 'Preencha todos os campos.');
    }
    setLoading(true);
    const cleanedUsername = username.trim().toLowerCase();

    try {
      // 1. Verifica se o username escolhido já pertence a outro usuário
      const q = query(collection(db, 'users'), where('username', '==', cleanedUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setLoading(false);
        return showAlert('Erro', 'Este Username já está em uso.');
      }

      // 2. Cria o registro de Login e Senha no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;

      // 3. Grava o documento NoSQL com as informações do usuário
      const userData = {
        uid: user.uid,
        nome: nome.trim(),
        username: cleanedUsername,
        email: email.trim().toLowerCase(),
        role: 'user',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      showAlert('Sucesso!', 'Sua conta DressCode foi criada com sucesso.', [
        { text: 'Fazer Login', onPress: toggleMode }
      ]);
    } catch (e) {
      console.log('Erro ao cadastrar:', e);
      showAlert('Erro', 'Falha ao registrar conta ou e-mail já em uso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#131313', '#2c0050', '#131313']} style={StyleSheet.absoluteFillObject} opacity={0.6} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, width: '100%' }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>

            <View style={styles.responsiveWrapper}>
              
              {/* HEADER / LOGO */}
              <Animated.View style={[styles.header, { transform: [{ translateY: logoTranslateY }] }]}>
                <Animated.Image
                  source={require('../../logo-def-dresscode.png')}
                  style={{ width: logoSize, height: logoSize }}
                  resizeMode="contain"
                />
              </Animated.View>

              {/* CARD DE AUTENTICAÇÃO */}
              <View style={styles.authBox}>
                
                {/* FORMULÁRIO DE LOGIN */}
                <Animated.View
                  style={[styles.card, { opacity: loginOpacity, transform: [{ translateX: loginTranslateX }] }]}
                  pointerEvents={isRegisterMode ? 'none' : 'auto'}
                >
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="email-outline" size={20} color="#978d9d" />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#978d9d"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color="#978d9d" />
                    <TextInput
                      style={styles.input}
                      placeholder="Senha"
                      placeholderTextColor="#978d9d"
                      secureTextEntry={!showPass}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      <MaterialCommunityIcons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#978d9d" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={() => showAlert('Recuperar Senha', 'Insira seu e-mail para receber as instruções de redefinição.')}>
                    <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.mainBtn} onPress={handleLogin} disabled={loading}>
                    {loading ? <ActivityIndicator color="#4a0080" /> : <Text style={styles.btnText}>ENTRAR</Text>}
                  </TouchableOpacity>
                </Animated.View>

                {/* FORMULÁRIO DE CADASTRO */}
                <Animated.View
                  style={[styles.card, styles.absoluteCard, { opacity: registerOpacity, transform: [{ translateX: registerTranslateX }] }]}
                  pointerEvents={isRegisterMode ? 'auto' : 'none'}
                >
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

              {/* FOOTER - BOTÃO DE ALTERNÂNCIA */}
              <View style={styles.footer}>
                <TouchableOpacity onPress={toggleMode}>
                  <Text style={styles.toggleText}>
                    {isRegisterMode ? "Já tem conta? " : "Novo por aqui? "}
                    <Text style={styles.toggleBold}>{isRegisterMode ? "Login" : "Registre-se"}</Text>
                  </Text>
                </TouchableOpacity>
              </View>

            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── ESTILOS RESPONSIVOS E ADAPTADOS PARA WEB E MOBILE ───────────────────────
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
  // Wrapper que limita a largura máxima na Web / PC mantendo o design centralizado
  responsiveWrapper: {
    width: '100%',
    maxWidth: 440,
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
    minHeight: 380,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden', // Evita barras de rolagem indesejadas na Web durante a animação
  },
  card: {
    backgroundColor: '#160d22',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
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
    borderColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    color: '#e5e2e1',
    marginLeft: 10,
    fontSize: 15,
    outlineStyle: 'none', // Remove a borda azul padrão de foco dos navegadores Web
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
    cursor: 'pointer', // Adiciona o cursor de clique do mouse na Web
  },
  btnText: {
    color: '#4a0080',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 24,
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