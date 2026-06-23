import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ── IMPORTAÇÃO DA INFRAESTRUTURA DO GOOGLE CLOUD ───────────────────────────
import { db } from '../database/firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

export default function AdminScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * 📜 MÉTODO EDUCATIVO: BUSCA COMPLETA NoSQL
   * No Firestore, para listar todos os documentos de uma coleção,
   * nós criamos uma referência da coleção e chamamos 'getDocs'.
   */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('📡 Buscando lista completa de usuários no Firestore...');
      
      const usersCollectionRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollectionRef);
      
      const userList = [];
      querySnapshot.forEach((documento) => {
        // Unimos os dados internos (.data()) com a ID da string alfanumérica do Firestore
        userList.push({ id: documento.id, ...documento.data() });
      });

      setUsers(userList);
    } catch (error) {
      console.error('Erro ao buscar usuários via Google Cloud:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * 🗑️ MÉTODO EDUCATIVO: EXCLUSÃO DE DOCUMENTO NoSQL
   * Para apagar, apontamos 'doc()' passando a coleção e a ID exata,
   * e executamos a função assíncrona 'deleteDoc'.
   */
  const handleDeleteUser = (userId, userName) => {
    Alert.alert(
      "Atenção",
      `Deseja realmente excluir o usuário ${userName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive", 
          onPress: async () => {
            try {
              const userDocumentoRef = doc(db, 'users', userId);
              await deleteDoc(userDocumentoRef);
              
              Alert.alert('Sucesso', 'Usuário removido da nuvem NoSQL.');
              fetchUsers(); // Recarrega a lista dinamicamente
            } catch (erroExclusao) {
              console.error('Erro ao deletar:', erroExclusao);
              Alert.alert('Erro', 'Não foi possível excluir o usuário.');
            }
          } 
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.nome || 'Usuário Sem Nome'}</Text>
        <Text style={styles.userSub}>@{item.username || 'sem_user'} | {item.email}</Text>
        <Text style={styles.userId}>ID Google: {item.id}</Text>
      </View>
      
      {/* Botão de excluir para o Admin */}
      <TouchableOpacity onPress={() => handleDeleteUser(item.id, item.nome)}>
        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#ff5c5c" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Painel do Administrador</Text>
        <TouchableOpacity onPress={fetchUsers}>
          <MaterialCommunityIcons name="refresh" size={26} color="#ed85ff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>Total de Usuários Cadastrados: {users.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ed85ff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id} // Ajustado para ler as chaves string nativas do Firebase
          renderItem={renderUserItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum usuário encontrado no Google Cloud.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a011b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: '#350238' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statsBar: { backgroundColor: '#ed85ff', padding: 10, alignItems: 'center' },
  statsText: { color: '#1a011b', fontWeight: 'bold' },
  list: { padding: 15 },
  userCard: { 
    flexDirection: 'row', 
    backgroundColor: '#ffffff10', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10, 
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userSub: { color: '#ffffff80', fontSize: 13 },
  userId: { color: '#ed85ff', fontSize: 11, marginTop: 4 },
  empty: { color: '#ffffff60', textAlign: 'center', marginTop: 50 }
});