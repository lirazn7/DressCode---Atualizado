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
import db from '../database/DatabaseInit';

// ─── Credenciais de Admin ────────────────────────────────────────────────────
const ADMIN_EMAIL    = 'admin@dresscode.com';
const ADMIN_PASSWORD = 'Admin@2025';
// ─────────────────────────────────────────────────────────────────────────────

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ onLogin, onGoToRegister }) {
  const [identifier, setIdentifier] = useState(''); // e-mail ou @username
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleLogin = async () => {
    // ── 1. Validação de campos vazios ──────────────────────────────────────
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o e-mail (ou @username) e a senha.');
      return;
    }

    setLoading(true);

    try {
      const input = identifier.trim().toLowerCase();

      // ── 2. Verificar acesso de Admin (hardcoded) ───────────────────────
      if (
        input === ADMIN_EMAIL.toLowerCase() &&
        password === ADMIN_PASSWORD
      ) {
        setLoading(false);
        onLogin({ id: 0, nome: 'Admin', email: ADMIN_EMAIL, username: 'admin', role: 'admin' });
        return;
      }

      // ── 3. Determinar se o input é e-mail ou username ──────────────────
      let result = null;

      if (emailRegex.test(input)) {
        // Busca por e-mail
        result = db.getFirstSync(
          'SELECT * FROM users WHERE email = ? AND password = ? LIMIT 1;',
          [input, password]
        );
      } else {
        // Busca por username (remove @ se o usuário digitou com @)
        const usernameInput = input.startsWith('@') ? input.slice(1) : input;
        result = db.getFirstSync(
          'SELECT * FROM users WHERE username = ? AND password = ? LIMIT 1;',
          [usernameInput, password]
        );
      }

      setLoading(false);

      if (result) {
        onLogin({ ...result, role: 'user' });
      } else {
        Alert.alert('Acesso negado', 'E-mail, @username ou senha incorretos. Tente novamente.');
      }
    } catch (error) {
      setLoading(false);
      console.log('Erro no login:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar fazer login. Tente novamente.');
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

            {/* Logo e Cabeçalho */}
            <View style={styles.header}>
              <Image
                source={require('../../logo-def-dresscode.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Formulário */}
            <View style={styles.form}>

              {/* Campo de E-mail ou Username */}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-circle-outline" size={24} color="#ffffff80" />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail ou @username"
                  placeholderTextColor="#ffffff80"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>

              {/* Campo de Senha */}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={24} color="#ffffff80" />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#ffffff80"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <MaterialCommunityIcons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#ffffff80"
                  />
                </TouchableOpacity>
              </View>

              {/* Botão de Login */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>ENTRAR</Text>
                )}
              </TouchableOpacity>

              {/* Rodapé */}
              <View style={styles.footerContainer}>
                <TouchableOpacity style={styles.link} onPress={onGoToRegister}>
                  <Text style={styles.linkText}>
                    Não tem uma conta?{' '}
                    <Text style={styles.boldText}>Registre-se</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.link}
                  onPress={() => Alert.alert('Em breve', 'Recuperação de senha disponível em breve!')}
                >
                  <Text style={styles.linkText}>
                    Esqueceu sua senha?{' '}
                    <Text style={styles.boldText}>Clique aqui</Text>
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
  container: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 170,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
    width: '100%',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 10,
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 20,
    marginBottom: 15,
    width: '100%',
  },
  input: {
    flex: 1,
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2d1454',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  link: {
    marginTop: 25,
  },
  linkText: {
    color: '#ffffff80',
    fontSize: 14,
  },
  boldText: {
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
