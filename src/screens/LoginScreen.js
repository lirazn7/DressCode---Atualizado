import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

import { auth, db } from '../database/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
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
        signIn(userDoc.data());
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#131313', '#2c0050', '#131313']} style={StyleSheet.absoluteFillObject} opacity={0.6} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <View style={styles.inner}>
          
          <View style={styles.header}>
            <Image
              source={require('../../logo-def-dresscode.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.card}>
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

                <TouchableOpacity onPress={() => Alert.alert('Recuperar', 'Instruções enviadas para seu e-mail.')}>
                  <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mainBtn} onPress={handleLogin} disabled={loading}>
                  {loading ? <ActivityIndicator color="#4a0080" /> : <Text style={styles.btnText}>ENTRAR</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <LinearGradient colors={['rgba(221,183,255,0.1)', 'transparent']} style={styles.glowOverlay} />

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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
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
});