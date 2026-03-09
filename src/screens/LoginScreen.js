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
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen({ onLogin, onGoToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <LinearGradient
  // As cores do seu gradiente (do mais claro para o mais escuro)
  colors={['#801C91', '#621763', '#350238']} 
  // start {x: 0.5, y: 0} foca no topo central
  start={{ x: 0.5, y: 0 }}
  // end {x: 0.5, y: 1} foca na base central, criando o efeito vertical
  end={{ x: 0.5, y: 0.59 }}
  style={styles.container}
>
      
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}>
        
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

            {/* Formulário Estilizado */}
            <View style={styles.form}>
              
              {/* Campo de E-mail */}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-outline" size={24} color="#ffffff80" />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#ffffff80"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>

              {/* Campo de Senha */}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={24} color="#ffffff80" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#ffffff80"
                  secureTextEntry={true}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Botão de Login (Pill shape) */}
              <TouchableOpacity style={styles.button} onPress={onLogin}>
                <Text style={styles.buttonText}>SIGN IN</Text>
              </TouchableOpacity>

             {/* Links de Rodapé */}
<View style={styles.footerContainer}>
  <TouchableOpacity style={styles.link} onPress={onGoToRegister}>
    <Text style={styles.linkText}>
      Não tem uma conta? <Text style={styles.boldText}>Registre-se</Text>
    </Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.link} onPress={() => { /* Lógica de esqueci a senha */ }}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Fundo escuro semi-transparente
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
    backgroundColor: '#2d1454', // Roxo escuro para contraste
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
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
