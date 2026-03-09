import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  Alert, StatusBar, ScrollView 
} from 'react-native';
import db from './database/DatabaseInit'; 

export default function RegisterScreen({ onBack }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    // Validação de campos vazios
    if (!nome || !email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    // Inserção no SQLite
    db.transaction(tx => {
      tx.executeSql(
        "INSERT INTO users (nome, email, password) VALUES (?, ?, ?);",
        [nome, email, password],
        (_, { insertId }) => {
          Alert.alert("Sucesso!", "Conta DressCode criada.", [
            { text: "Fazer Login", onPress: () => onBack() }
          ]);
        },
        (_, error) => {
          Alert.alert("Erro", "Não foi possível salvar os dados.");
          return false;
        }
      );
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Junte-se à DressCode</Text>
      </View>

      <View style={styles.form}>
        <TextInput 
          style={styles.input} 
          placeholder="Nome" 
          placeholderTextColor="#a29bfe" 
          value={nome}
          onChangeText={setNome}
        />
        <TextInput 
          style={styles.input} 
          placeholder="E-mail" 
          placeholderTextColor="#a29bfe" 
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Senha" 
          placeholderTextColor="#a29bfe" 
          secureTextEntry 
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={onBack}>
          <Text style={styles.linkText}>Voltar para o Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#1e0b36', justifyContent: 'center', padding: 30 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#a29bfe', marginTop: 10 },
  form: { width: '100%' },
  input: { backgroundColor: '#2d1454', height: 55, borderRadius: 12, paddingHorizontal: 15, color: '#fff', marginBottom: 15, borderWidth: 1, borderColor: '#4834d4' },
  button: { backgroundColor: '#6c5ce7', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  link: { marginTop: 25, alignItems: 'center' },
  linkText: { color: '#a29bfe' },
});