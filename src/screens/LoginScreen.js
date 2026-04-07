import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../database/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o e-mail e a senha.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('E-mail inválido', 'Digite um endereço de e-mail válido.');
      return;
    }

    setLoading(true);

    try {
      // ── Buscar usuário na NUVEM (Supabase) ─────────────────────────
      const { data: result, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('password', password)
        .maybeSingle();

      setLoading(false);

      if (error) {
        throw error;
      }

      if (result) {
        const userObj = { ...result, role: result.role || 'user' };

        if (!result.username) {
          // Se não tem username, vamos ter que tratar o SetUsername de uma forma especial depois,
          // mas por enquanto deixa passar chamando o signIn.
          signIn(userObj); 
        } else {
          // Avisa o contexto! O React vai ver que você logou e vai trocar o AuthStack pelo AppStack sozinho!
          signIn(userObj); 
        }
      } else {
        Alert.alert('Acesso negado', 'E-mail ou senha incorretos.');
      }
    } catch (error) {
      setLoading(false);
      console.log('Erro no login:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar fazer login.');
    }
  };

  return (
    <LinearGradient
      colors={['#801C91', '#621763', '#350238']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.59 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>

            <View style={styles.header}>
              <Image
                source={require('../../logo-def-dresscode.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={24} color="#ffffff80" />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="#ffffff80"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={24} color="#ffffff80" />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#ffffff80"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <MaterialCommunityIcons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#ffffff80"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>ENTRAR</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footerContainer}>
                {/* NAVEGAÇÃO PARA REGISTRO */}
                <TouchableOpacity 
                  style={styles.link} 
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={styles.linkText}>
                    Não tem uma conta? <Text style={styles.boldText}>Registre-se</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.link}
                  onPress={() => Alert.alert('Em breve', 'Recuperação de senha disponível em breve!')}
                >
                  <Text style={styles.linkText}>
                    Esqueceu sua senha? <Text style={styles.boldText}>Clique aqui</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexContainer: { flex: 1 },
  innerContainer: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 30, paddingTop: 170 },
  header: { alignItems: 'center', marginBottom: 60, width: '100%' },
  logo: { width: 180, height: 180, marginBottom: 10 },
  form: { width: '100%', alignItems: 'center' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.3)', height: 60, borderRadius: 30, paddingHorizontal: 20, marginBottom: 15, width: '100%' },
  input: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16 },
  button: { backgroundColor: '#2d1454', height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 10, elevation: 5 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  footerContainer: { alignItems: 'center', width: '100%' },
  link: { marginTop: 25 },
  linkText: { color: '#ffffff80', fontSize: 14 },
  boldText: { color: '#fff', fontWeight: 'bold', textDecorationLine: 'underline' },
});