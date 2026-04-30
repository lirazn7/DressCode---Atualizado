import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Image,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, ActivityIndicator, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../database/supabase';

const { width } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
  const { signIn } = useAuth();

  // ── ESTADOS ──
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Campos
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');

  // ── ANIMAÇÕES ──
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

  // Interpolações Logo
  const logoSize = animValue.interpolate({ inputRange: [0, 1], outputRange: [180, 120] });
  const logoTranslateY = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  
  // Interpolações Formulários (Opacidade e Deslize)
  const loginOpacity = animValue.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0] });
  const registerOpacity = animValue.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1] });
  const loginTranslateX = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  const registerTranslateX = animValue.interpolate({ inputRange: [0, 1], outputRange: [width, 0] });

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return Alert.alert('Atenção', 'Preencha e-mail e senha.');
    setLoading(true);
    try {
      const { data: result, error } = await supabase.from('users').select('*').eq('email', email.trim().toLowerCase()).eq('password', password).maybeSingle();
      if (result) signIn(result);
      else Alert.alert('Acesso Negado', 'E-mail ou senha incorretos.');
    } catch (e) { Alert.alert('Erro', 'Falha na conexão com o banco.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!nome || !username || !email || !password) return Alert.alert('Erro', 'Preencha todos os campos.');
    setLoading(true);
    try {
      const { error } = await supabase.from('users').insert([{ nome, username: username.toLowerCase(), email: email.toLowerCase(), password, role: 'user' }]);
      if (!error) {
        Alert.alert('Sucesso!', 'Sua conta DressCode foi criada.', [{ text: 'Fazer Login', onPress: toggleMode }]);
      } else throw error;
    } catch (e) { Alert.alert('Erro', 'Username ou E-mail já cadastrados.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient colors={['#131313', '#2c0050', '#131313']} style={StyleSheet.absoluteFillObject} opacity={0.6} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>

            {/* LOGO ANIMADA */}
            <Animated.View style={[styles.header, { transform: [{ translateY: logoTranslateY }] }]}>
              <Animated.Image
                source={require('../../logo-def-dresscode.png')}
                style={{ width: logoSize, height: logoSize }}
                resizeMode="contain"
              />
            </Animated.View>

            {/* AREA DOS FORMULÁRIOS */}
            <View style={styles.authBox}>
              
              {/* TELA DE LOGIN */}
              <Animated.View 
                style={[styles.card, { opacity: loginOpacity, transform: [{ translateX: loginTranslateX }] }]} 
                pointerEvents={isRegisterMode ? 'none' : 'auto'}
              >
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

              {/* TELA DE REGISTRO (Absolute para sobrepor o Login no mesmo lugar) */}
              <Animated.View 
                style={[styles.card, styles.absoluteCard, { opacity: registerOpacity, transform: [{ translateX: registerTranslateX }] }]} 
                pointerEvents={isRegisterMode ? 'auto' : 'none'}
              >
                {/* SOMBRA DEGRADÊ NEON (Apenas no Registro) */}
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

            {/* RODAPÉ FIXO ABAIXO DA CAIXA */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 25 },
  header: { alignItems: 'center', zIndex: 10, marginBottom: 20 },
  
  // Altura fixa para evitar que o rodapé suba
  authBox: { width: '100%', height: 400, justifyContent: 'center' },
  
  card: {
    backgroundColor: '#160d22',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 25,
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 0,
  },
  absoluteCard: { position: 'absolute', top: 0, height: '100%' },
  glowOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 20, opacity: 0.2 },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#160d22',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  input: { flex: 1, color: '#e5e2e1', marginLeft: 10, fontSize: 15 },
  
  forgotText: { 
    color: '#978d9d', 
    fontSize: 13, 
    textAlign: 'right', 
    marginBottom: 15, 
    textDecorationLine: 'underline' 
  },
  
  mainBtn: {
    backgroundColor: '#ddb7ff',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  btnText: { color: '#4a0080', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  
  footer: { marginTop: 20, paddingBottom: 20 },
  toggleText: { color: '#978d9d', fontSize: 14 },
  toggleBold: { color: '#ddb7ff', fontWeight: 'bold' }
});