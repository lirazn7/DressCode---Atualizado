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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import db from './database/DatabaseInit';

export default function RegisterScreen({ onBack }) {
  const [nome, setNome]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleRegister = () => {
    // Validação de campos vazios
    if (!nome.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('E-mail inválido', 'Digite um endereço de e-mail válido.');
      return;
    }

    // Validação de senha mínima
    if (password.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      db.runSync(
        'INSERT INTO users (nome, email, password) VALUES (?, ?, ?);',
        [nome.trim(), email.trim().toLowerCase(), password]
      );
      setLoading(false);
      Alert.alert('Conta criada!', 'Sua conta DressCode foi criada com sucesso.', [
        { text: 'Fazer Login', onPress: () => onBack() },
      ]);
    } catch (error) {
      setLoading(false);
      if (error.message && error.message.includes('UNIQUE')) {
        Alert.alert('E-mail já cadastrado', 'Já existe uma conta com esse e-mail.');
      } else {
        Alert.alert('Erro', 'Não foi possível criar a conta. Tente novamente.');
        console.log('Erro no registro:', error);
      }
    }
  };

  return (
    <LinearGradient
      colors={['#801C91', '#621763', '#350238']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.59 }}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.header}>
              <Image
                source={require('../logo-def-dresscode.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.subtitle}>Crie sua conta</Text>
            </View>

            {/* Formulário */}
            <View style={styles.form}>

              {/* Nome */}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-outline" size={24} color="#ffffff80" />
                <TextInput
                  style={styles.input}
                  placeholder="Nome completo"
                  placeholderTextColor="#ffffff80"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              {/* E-mail */}
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
                  returnKeyType="next"
                />
              </View>

              {/* Senha */}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={24} color="#ffffff80" />
                <TextInput
                  style={styles.input}
                  placeholder="Senha (mín. 6 caracteres)"
                  placeholderTextColor="#ffffff80"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <MaterialCommunityIcons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#ffffff80"
                  />
                </TouchableOpacity>
              </View>

              {/* Botão Registrar */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>CRIAR CONTA</Text>
                )}
              </TouchableOpacity>

              {/* Voltar */}
              <TouchableOpacity style={styles.backLink} onPress={onBack}>
                <Text style={styles.linkText}>
                  Já tem uma conta?{' '}
                  <Text style={styles.boldText}>Fazer login</Text>
                </Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 120,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff90',
    fontWeight: '500',
    letterSpacing: 0.5,
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
  backLink: {
    marginTop: 28,
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