import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── IMPORTAÇÃO DA INFRAESTRUTURA DO GOOGLE CLOUD ───────────────────────────
import { db } from '../database/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function SetUsernameScreen({ navigation }) {
  const route = useRoute();
  const { user } = route.params; // Resgata o usuário vindo da tela de registro
  const secureUserId = user?.uid || user?.id; // Garante o ID correto do Firebase Auth

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * 📜 MÉTODO EDUCATIVO: VALIDAÇÃO E ESCRITA NOSQL
   * 1. Varre a coleção 'users' para verificar se o username já está em uso.
   * 2. Atualiza o documento específico do usuário usando 'updateDoc'.
   */
  const handleSave = async () => {
    // Validação básica de tamanho mínimo
    if (username.length < 3) {
      Alert.alert('Erro', 'Username muito curto. Escolha pelo menos 3 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const finalUsername = username.trim().toLowerCase();

      // 🔍 PASSO 1: Verificar se o username já existe no banco de dados NoSQL
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', finalUsername));
      const querySnapshot = await getDocs(q);

      // Se a busca retornar qualquer documento, significa que o nome já está ocupado
      if (!querySnapshot.empty) {
        setLoading(false);
        Alert.alert('Atenção', 'Este @username já está sendo usado por outro amante da moda.');
        return;
      }

      // 💾 PASSO 2: Salvar o username no documento do usuário logado no Firestore
      const userDocRef = doc(db, 'users', secureUserId);
      await updateDoc(userDocRef, {
        username: finalUsername
      });

      // 📱 PASSO 3: Atualizar a sessão local do telemóvel
      const updatedUser = { ...user, username: finalUsername };
      await AsyncStorage.setItem('@dresscode_session', JSON.stringify(updatedUser));
      
      setLoading(false);
      
      // Avança para a Vitrine substituindo a rota no histórico de navegação
      navigation.replace('Vitrine', { user: updatedUser });

    } catch (error) {
      setLoading(false);
      console.log('❌ Erro crítico ao definir username:', error);
      Alert.alert('Erro', 'Ocorreu um problema de conexão ao salvar seu perfil.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#801C91', '#350238']} style={styles.responsiveContainer}>
        <View style={styles.inner}>
          {/* Renderiza a logo do projeto DressCode */}
          <Image source={require('../../logo-def-dresscode.png')} style={styles.logo} resizeMode="contain" />
          
          <Text style={styles.title}>Escolha seu @username</Text>
          
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="at" size={24} color="#ffffff80" />
            <TextInput
              style={styles.input}
              placeholder="seu.username"
              placeholderTextColor="#ffffff80"
              value={username}
              // Filtro por Expressão Regular para proibir espaços ou caracteres inválidos em usernames
              onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9._]/g, ''))}
              autoCapitalize="none"
            />
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>SALVAR E ENTRAR</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a050f', alignItems: 'center', justifyContent: 'center' },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    position: 'relative',
    overflow: 'hidden',
  },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  logo: { width: 120, height: 120, marginBottom: 20 },
  title: { fontSize: 22, color: '#fff', fontWeight: 'bold', marginBottom: 20 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', height: 60, borderRadius: 30, paddingHorizontal: 20, width: '100%', marginBottom: 20 },
  input: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16 },
  button: { backgroundColor: '#2d1454', height: 60, borderRadius: 30, width: '100%', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});