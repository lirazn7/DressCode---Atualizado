import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, FlatList, Image, 
  TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../database/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function SearchScreen({ navigation }) {
  const { user: currentUser } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── BUSCA NO BANCO EM TEMPO REAL ──
  const handleSearch = async (text) => {
    setSearchQuery(text);
    
    // Só começa a buscar se tiver pelo menos 2 letras para economizar internet
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Busca usuários onde o 'username' ou 'nome' pareça com o que foi digitado
      const { data, error } = await supabase
        .from('users')
        .select('id, username, nome, avatar_url')
        .or(`username.ilike.%${text}%,nome.ilike.%${text}%`)
        .limit(20);

      if (!error) setResults(data || []);
    } catch (e) {
      console.log("Erro na busca:", e);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => navigation.navigate('Profile', { profileUser: item, currentUser })}
    >
      <View style={styles.avatarBorder}>
        <Image 
          source={{ uri: item.avatar_url || 'https://via.placeholder.com/150' }} 
          style={styles.avatarImg} 
        />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.nome}>{item.nome}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#ffffff40" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* ── CABEÇALHO COM A BARRA DE BUSCA ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#e5e2e1" />
        </TouchableOpacity>
        
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={22} color="#978d9d" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar usuários..."
            placeholderTextColor="#978d9d"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus={true} // O teclado já abre sozinho ao entrar na tela
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#978d9d" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── LISTA DE RESULTADOS ── */}
      {loading ? (
        <ActivityIndicator size="large" color="#ba7ef4" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searchQuery.length > 1 ? (
              <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
            ) : (
              <View style={styles.placeholderState}>
                <MaterialCommunityIcons name="account-search-outline" size={60} color="#ffffff10" />
                <Text style={styles.placeholderText}>Encontre novos estilos</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingTop: 20, 
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  backBtn: { marginRight: 15 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#160d22',
    height: 45,
    borderRadius: 22,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#e5e2e1', fontSize: 16 },
  
  listContent: { paddingHorizontal: 20, paddingTop: 20 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  avatarBorder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ba7ef4',
    padding: 2,
    marginRight: 15
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 25 },
  userInfo: { flex: 1 },
  username: { color: '#e5e2e1', fontSize: 16, fontWeight: 'bold' },
  nome: { color: '#978d9d', fontSize: 13, marginTop: 2 },
  
  emptyText: { color: '#978d9d', textAlign: 'center', marginTop: 40, fontSize: 15 },
  placeholderState: { alignItems: 'center', marginTop: 80 },
  placeholderText: { color: '#978d9d', marginTop: 15, fontSize: 15 }
});