import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../database/firebase';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      return Alert.alert('Atenção', 'Digite seu e-mail cadastrado.');
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setSent(true);
    } catch (error) {
      console.error(error);
      const message = error.code === 'auth/user-not-found'
        ? 'Não encontramos uma conta com este e-mail.'
        : 'Não foi possível enviar o e-mail. Verifique o endereço informado.';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.responsiveContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient colors={['#131313', '#2c0050', '#131313']} style={StyleSheet.absoluteFillObject} opacity={0.6} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#ddb7ff" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Image source={require('../../logo-def-dresscode.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.title}>Recuperar senha</Text>
            <Text style={styles.subtitle}>
              {sent
                ? 'Enviamos um link para redefinir sua senha. Verifique sua caixa de entrada e spam.'
                : 'Informe o e-mail da sua conta. Enviaremos um link para criar uma nova senha.'}
            </Text>
          </View>

          {!sent ? (
            <View style={styles.card}>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#978d9d" style={styles.iconStyle} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu e-mail"
                  placeholderTextColor="#978d9d"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                />
              </View>

              <TouchableOpacity style={styles.mainBtn} onPress={handleSendReset} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#4a0080" />
                ) : (
                  <Text style={styles.btnText}>ENVIAR LINK DE RECUPERAÇÃO</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.successIcon}>
                <MaterialCommunityIcons name="email-check-outline" size={48} color="#ba7ef4" />
              </View>
              <Text style={styles.successEmail}>{email.trim().toLowerCase()}</Text>
              <Text style={styles.successHint}>
                Abra o e-mail e clique no link para definir uma nova senha. O link expira em algumas horas.
              </Text>
              <TouchableOpacity style={styles.mainBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.btnText}>VOLTAR AO LOGIN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resendBtn} onPress={() => { setSent(false); handleSendReset(); }}>
                <Text style={styles.resendText}>Reenviar e-mail</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

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
  keyboardView: { flex: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 30 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { color: '#ddb7ff', fontSize: 16, marginLeft: 4 },
  header: { alignItems: 'center', marginBottom: 30 },
  logoImage: { width: 120, height: 90, marginBottom: 15 },
  title: { color: '#e5e2e1', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#978d9d', fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  card: {
    backgroundColor: '#160d22',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131313',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  iconStyle: { marginRight: 10 },
  input: { flex: 1, color: '#e5e2e1', fontSize: 15 },
  mainBtn: {
    backgroundColor: '#ddb7ff',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { color: '#4a0080', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
  successIcon: { alignItems: 'center', marginBottom: 15 },
  successEmail: { color: '#ba7ef4', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  successHint: { color: '#978d9d', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  resendBtn: { marginTop: 16, alignItems: 'center' },
  resendText: { color: '#978d9d', fontSize: 13, textDecorationLine: 'underline' },
});
