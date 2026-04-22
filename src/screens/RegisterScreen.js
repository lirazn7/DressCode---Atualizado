import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Image,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 1. TROCA DO DB LOCAL PARA O SUPABASE
import { supabase } from '../database/supabase'; 

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

  // 2. A FUNÇÃO AGORA É ASYNC (assíncrona) PORQUE VAI CONVERSAR COM A INTERNET
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

    try {
      // 3. ENVIANDO DADOS PARA O SUPABASE
      const { data, error } = await supabase
        .from('users')
        .insert([
          { 
            nome: nome.trim(), 
            email: email.trim().toLowerCase(), 
            password: password, 
            username: username.trim().toLowerCase() 
          }
        ]);

      if (error) {
        // O Supabase retorna erros detalhados. Se houver erro, cai aqui.
        throw error; 
      }

      setLoading(false);
      Alert.alert('Sucesso!', 'Conta criada na nuvem!', [
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      
    } catch (error) {
      setLoading(false);
      // Se o erro for de dado duplicado (código 23505 no PostgreSQL)
      const msg = error.code === '23505' ? 'E-mail ou Username já em uso.' : 'Erro ao criar conta na nuvem.';
      console.log('Erro do Supabase:', error);
      Alert.alert('Erro', msg);
    }
  };

  return (
    <LinearGradient colors={['#801C91', '#621763', '#350238']} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Se der erro na imagem, certifique-se que o caminho está correto: '../logo-def-dresscode.png' ou '../../logo...' */}
            <Image source={require('../logo-def-dresscode.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.subtitle}>Crie sua conta</Text>
            
            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-outline" size={24} color="#ffffff80" />
                <TextInput style={styles.input} placeholder="Nome" placeholderTextColor="#ffffff80" value={nome} onChangeText={setNome} />
              </View>

              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="at" size={24} color="#ffffff80" />
                <TextInput style={styles.input} placeholder="username" placeholderTextColor="#ffffff80" value={username} onChangeText={handleUsernameChange} autoCapitalize="none" />
              </View>

              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={24} color="#ffffff80" />
                <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#ffffff80" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={24} color="#ffffff80" />
                <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#ffffff80" secureTextEntry={!showPass} value={password} onChangeText={setPassword} />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <MaterialCommunityIcons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={22} color="#ffffff80" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>CRIAR CONTA</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
                <Text style={styles.linkText}>Já tem conta? <Text style={styles.boldText}>Login</Text></Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 100, paddingBottom: 40 },
  logo: { width: 130, height: 130, marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#ffffff90', fontWeight: '500', marginBottom: 30 },
  form: { width: '100%', alignItems: 'center' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.3)', height: 60, borderRadius: 30, paddingHorizontal: 20, marginBottom: 15, width: '100%' },
  input: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16 },
  button: { backgroundColor: '#2d1454', height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backLink: { marginTop: 28 },
  linkText: { color: '#ffffff80', fontSize: 14 },
  boldText: { color: '#fff', fontWeight: 'bold', textDecorationLine: 'underline' },
});