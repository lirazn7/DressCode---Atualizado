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

const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;

export default function SetUsernameScreen({ user, onDone }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleUsernameChange = (text) => {
    const cleaned = text.replace(/[^a-zA-Z0-9._]/g, '');
    setUsername(cleaned);
  };

  const handleSave = () => {
    if (!username.trim()) {
      Alert.alert('Atenção', 'Por favor, escolha um @username.');
      return;
    }

    if (!usernameRegex.test(username.trim())) {
      Alert.alert(
        'Username inválido',
        'O username deve ter entre 3 e 30 caracteres e pode conter apenas letras, números, ponto (.) e underline (_).'
      );
      return;
    }

    setLoading(true);

    try {
      db.runSync(
        'UPDATE users SET username = ? WHERE id = ?;',
        [username.trim().toLowerCase(), user.id]
      );
      setLoading(false);
      // Retorna o usuário atualizado com o novo username
      onDone({ ...user, username: username.trim().toLowerCase() });
    } catch (error) {
      setLoading(false);
      if (error.message && error.message.includes('UNIQUE')) {
        Alert.alert('Username indisponível', 'Esse @username já está em uso. Escolha outro.');
      } else {
        Alert.alert('Erro', 'Não foi possível salvar o username. Tente novamente.');
        console.log('Erro ao salvar username:', error);
      }
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
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>

            {/* Logo */}
            <Image
              source={require('../../logo-def-dresscode.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            {/* Título */}
            <Text style={styles.title}>Escolha seu @username</Text>
            <Text style={styles.subtitle}>
              Crie um username único para sua conta.{'\n'}
              Você poderá usá-lo para fazer login.
            </Text>

            {/* Dica de formato */}
            <View style={styles.hintBox}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#ed85ff" />
              <Text style={styles.hintText}>
                Letras, números, ponto (.) e underline (_). Mín. 3 caracteres.
              </Text>
            </View>

            {/* Campo username */}
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="at" size={24} color="#ffffff80" />
              <TextInput
                style={styles.input}
                placeholder="seu.username"
                placeholderTextColor="#ffffff80"
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            {/* Botão salvar */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>SALVAR USERNAME</Text>
              )}
            </TouchableOpacity>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff80',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(237, 133, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 24,
    gap: 8,
    width: '100%',
  },
  hintText: {
    color: '#ed85ff',
    fontSize: 12,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
