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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fundo simulando o Ambient Glow */}
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
            
            {/* Cabeçalho com Logo Original e Título */}
            <View style={styles.header}>
              <Image source={require('../../logo-def-dresscode.png')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.subtitle}>Crie sua conta</Text>
            </View>

            {/* Glassmorphism Card de Registro */}
            <View style={styles.glassCard}>
              
              {/* Campo Nome */}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-outline" size={22} color="#978d9d" />
                <TextInput 
                  style={styles.input} 
                  placeholder="Nome" 
                  placeholderTextColor="#978d9d" 
                  value={nome} 
                  onChangeText={setNome} 
                />
              </View>

              {/* Campo Username */}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="at" size={22} color="#978d9d" />
                <TextInput 
                  style={styles.input} 
                  placeholder="Username" 
                  placeholderTextColor="#978d9d" 
                  value={username} 
                  onChangeText={handleUsernameChange} 
                  autoCapitalize="none" 
                />
              </View>

              {/* Campo Email */}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={22} color="#978d9d" />
                <TextInput 
                  style={styles.input} 
                  placeholder="E-mail" 
                  placeholderTextColor="#978d9d" 
                  value={email} 
                  onChangeText={setEmail} 
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                />
              </View>

              {/* Campo Senha */}
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
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <MaterialCommunityIcons 
                    name={showPass ? 'eye-off-outline' : 'eye-outline'} 
                    size={22} 
                    color="#978d9d" 
                  />
                </TouchableOpacity>
              </View>

              {/* Botão Criar Conta */}
              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleRegister} 
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#ba7ef4" /> : <Text style={styles.buttonText}>CRIAR CONTA</Text>}
              </TouchableOpacity>
            </View>

            {/* Link de Rodapé (Retorno para o Login) */}
            <View style={styles.footerContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.mutedText}>Já tem conta? <Text style={styles.linkText}>Login</Text></Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#131313' 
  },
  flex: { 
    flex: 1 
  },
  scrollContent: { 
    flexGrow: 1, 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 80, 
    paddingBottom: 40 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 32,
    width: '100%',
  },
  logo: { 
    width: 150, 
    height: 150, 
    marginBottom: 8 
  },
  subtitle: {
    color: '#e5e2e1',
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 1,
  },
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#4b0082',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    height: 52, 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    marginBottom: 16, 
  },
  input: { 
    flex: 1, 
    color: '#e5e2e1', 
    marginLeft: 12, 
    fontSize: 16,
  },
  button: { 
    backgroundColor: '#4b0082', 
    borderColor: 'rgba(221,183,255,0.2)',
    borderWidth: 1,
    height: 52, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: '100%', 
    marginTop: 8,
  },
  buttonDisabled: { 
    opacity: 0.7 
  },
  buttonText: { 
    color: '#ba7ef4', 
    fontSize: 15, 
    fontWeight: 'bold', 
    letterSpacing: 1,
  },
  footerContainer: { 
    alignItems: 'center', 
    marginTop: 24, 
  },
  mutedText: {
    color: '#978d9d',
    fontSize: 15,
  },
  linkText: { 
    color: '#ddb7ff', 
    fontSize: 15,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});