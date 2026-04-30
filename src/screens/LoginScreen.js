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
import { supabase } from '../database/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

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
          signIn(userObj); 
        } else {
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>

            {/* Cabeçalho com a Logo Original */}
            <View style={styles.header}>
              <Image
                source={require('../../logo-def-dresscode.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Glassmorphism Card */}
            <View style={styles.glassCard}>
              
              {/* Campo Email */}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={22} color="#978d9d" />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#978d9d"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Campo Senha */}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={22} color="#978d9d" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
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

              {/* Botão de Entrar */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#4a0080" />
                ) : (
                  <Text style={styles.buttonText}>ENTRAR</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Links de Rodapé */}
            <View style={styles.footerContainer}>
              <TouchableOpacity onPress={() => Alert.alert('Em breve', 'Recuperação de senha disponível em breve!')}>
                <Text style={styles.linkText}>Esqueceu sua senha?</Text>
              </TouchableOpacity>

              <View style={styles.registerContainer}>
                <Text style={styles.mutedText}>Novo por aqui? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.linkRegister}>Registre-se</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
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
  flexContainer: { 
    flex: 1 
  },
  innerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 24,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 40,
    width: '100%',
  },
  logo: { 
    width: 180, 
    height: 180, 
    marginBottom: 10 
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
    backgroundColor: '#ddb7ff', 
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
    color: '#4a0080', 
    fontSize: 16, 
    fontWeight: 'bold', 
    letterSpacing: 1,
  },
  footerContainer: { 
    alignItems: 'center', 
    marginTop: 32, 
  },
  linkText: { 
    color: '#ddb7ff', 
    fontSize: 14,
    marginBottom: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mutedText: {
    color: '#978d9d',
    fontSize: 14,
  },
  linkRegister: { 
    color: '#ddb7ff', 
    fontSize: 14, 
    fontWeight: 'bold', 
  },
});