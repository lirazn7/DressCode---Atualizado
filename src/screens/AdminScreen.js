import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 1. IMPORTADO O SUPABASE
import { supabase } from '../database/supabase';

export default function AdminScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. BUSCA TODOS OS USUÁRIOS NA NUVEM
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 3. FUNÇÃO PARA DELETAR USUÁRIO (Opcional - Poder de Admin!)
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
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (!error) fetchUsers(); // Recarrega a lista
          } 
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.nome}</Text>
        <Text style={styles.userSub}>@{item.username} | {item.email}</Text>
        <Text style={styles.userId}>ID: {item.id}</Text>
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
        <Text style={styles.statsText}>Total de Usuários: {users.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ed85ff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum usuário encontrado.</Text>}
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