import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Image,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ── IMPORTAÇÕES DO FIREBASE ────────────────────────────────────────────────
// Importamos o arquivo de conexão que configuramos e os métodos oficiais do Google
import { auth, db } from '../database/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;

export default function RegisterScreen({ navigation }) {
  const [nome, setNome]           = useState('');
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleUsernameChange = (text) => {
    const cleaned = text.replace(/[^a-zA-Z0-9._]/g, '');
    setUsername(cleaned);
  };

  const handleRegister = async () => {
    if (!nome.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    if (!usernameRegex.test(username.trim())) {
      Alert.alert('Username inválido', 'Use apenas letras, números, ponto ou underline.');
      return;
    }

    setLoading(true);
    const cleanedUsername = username.trim().toLowerCase();
    const cleanedEmail = email.trim().toLowerCase();

    try {
      // VALIDAÇÃO NOSQL: Como o Firestore não tem restrição "Unique" nativa por padrão,
      // nós fazemos uma busca rápida na coleção para ver se o username já existe.
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', cleanedUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setLoading(false);
        Alert.alert('Erro', 'Este Username já está em uso.');
        return;
      }

      // PASSO 1: Criar o usuário no Firebase Authentication (Segurança do Google)
      const userCredential = await createUserWithEmailAndPassword(auth, cleanedEmail, password);
      const user = userCredential.user;

      // PASSO 2: Salvar os dados complementares no Cloud Firestore usando o UID do usuário
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        nome: nome.trim(),
        username: cleanedUsername,
        email: cleanedEmail,
        role: 'user',
        createdAt: new Date().toISOString()
      });

      setLoading(false);
      Alert.alert('Sucesso!', 'Conta criada na infraestrutura do Google Cloud!', [
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      
    } catch (error) {
      setLoading(false);
      console.log('Erro do Firebase:', error.code);
      
      // Tratamento amigável de erros do Firebase Auth
      let msg = 'Erro ao criar conta na nuvem.';
      if (error.code === 'auth/email-already-in-use') msg = 'Este e-mail já está cadastrado.';
      if (error.code === 'auth/weak-password') msg = 'A senha deve ter pelo menos 6 caracteres.';
      if (error.code === 'auth/invalid-email') msg = 'Formato de e-mail inválido.';

      Alert.alert('Erro', msg);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.responsiveContainer}>
        <StatusBar barStyle="light-content" />
        
        <LinearGradient
          colors={['#131313', '#2c0050', '#131313']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          opacity={0.4}
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              <View style={styles.header}>
                <Image source={require('../../logo-def-dresscode.png')} style={styles.logo} resizeMode="contain" />
                <Text style={styles.subtitle}>Crie sua conta</Text>
              </View>

              <View style={styles.glassCard}>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="account-outline" size={22} color="#978d9d" />
                  <TextInput style={styles.input} placeholder="Nome" placeholderTextColor="#978d9d" value={nome} onChangeText={setNome} />
                </View>

                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="at" size={22} color="#978d9d" />
                  <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#978d9d" value={username} onChangeText={handleUsernameChange} autoCapitalize="none" />
                </View>

                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="email-outline" size={22} color="#978d9d" />
                  <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#978d9d" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>

                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={22} color="#978d9d" />
                  <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#978d9d" secureTextEntry={!showPass} value={password} onChangeText={setPassword} />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <MaterialCommunityIcons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={22} color="#978d9d" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color="#ba7ef4" /> : <Text style={styles.buttonText}>CRIAR CONTA</Text>}
                </TouchableOpacity>
              </View>

              <View style={styles.footerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={styles.mutedText}>Já tem conta? <Text style={styles.linkText}>Login</Text></Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

// ... Manter os mesmos Styles originais do seu RegisterScreen.js
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
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32, width: '100%' },
  logo: { width: 150, height: 150, marginBottom: 8 },
  subtitle: { color: '#e5e2e1', fontSize: 22, fontWeight: '500', letterSpacing: 1 },
  glassCard: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderRadius: 16, padding: 24, shadowColor: '#4b0082', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, height: 52, borderRadius: 8, paddingHorizontal: 16, marginBottom: 16 },
  input: { flex: 1, color: '#e5e2e1', marginLeft: 12, fontSize: 16 },
  button: { backgroundColor: '#4b0082', borderColor: 'rgba(221,183,255,0.2)', borderWidth: 1, height: 52, borderRadius: 8, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#ba7ef4', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  footerContainer: { alignItems: 'center', marginTop: 24 },
  mutedText: { color: '#978d9d', fontSize: 15 },
  linkText: { color: '#ddb7ff', fontSize: 15, fontWeight: 'bold', textDecorationLine: 'underline' }
});