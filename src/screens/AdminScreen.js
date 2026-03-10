import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import db from '../database/DatabaseInit';

export default function AdminScreen({ onBack }) {
  const [users, setUsers]           = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [search, setSearch]         = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // ── Busca todos os usuários no banco ────────────────────────────────────────
  const loadUsers = useCallback(() => {
    try {
      const result = db.getAllSync(
        'SELECT id, nome, email FROM users ORDER BY id DESC;',
        []
      );
      setUsers(result);
      setFiltered(result);
    } catch (error) {
      console.log('Erro ao carregar usuários:', error);
      Alert.alert('Erro', 'Não foi possível carregar os usuários.');
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Filtro de busca ─────────────────────────────────────────────────────────
  useEffect(() => {
    const query = search.toLowerCase().trim();
    if (!query) {
      setFiltered(users);
    } else {
      setFiltered(
        users.filter(
          (u) =>
            u.nome.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        )
      );
    }
  }, [search, users]);

  // ── Pull-to-refresh ─────────────────────────────────────────────────────────
  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
    setRefreshing(false);
  };

  // ── Excluir usuário ─────────────────────────────────────────────────────────
  const handleDelete = (user) => {
    Alert.alert(
      'Excluir usuário',
      `Deseja remover "${user.nome}" permanentemente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync('DELETE FROM users WHERE id = ?;', [user.id]);
              loadUsers();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o usuário.');
            }
          },
        },
      ]
    );
  };

  // ── Card de cada usuário ────────────────────────────────────────────────────
  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      {/* Avatar com inicial */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.nome ? item.nome.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>

      {/* Dados */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.nome}</Text>
        <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
        <Text style={styles.cardId}>ID #{item.id}</Text>
      </View>

      {/* Botão excluir */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={['#801C91', '#621763', '#350238']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.59 }}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Painel Admin</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={loadUsers} style={styles.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={24} color="#ed85ff" />
        </TouchableOpacity>
      </View>

      {/* Barra de busca */}
      <View style={styles.searchWrapper}>
        <MaterialCommunityIcons name="magnify" size={20} color="#ffffff80" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou e-mail..."
          placeholderTextColor="#ffffff60"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#ffffff80" />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de usuários */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ed85ff"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-off-outline" size={60} color="#ffffff30" />
            <Text style={styles.emptyText}>
              {search ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  badge: {
    backgroundColor: 'rgba(237,133,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#ed85ff',
    fontSize: 12,
    fontWeight: '600',
  },
  refreshBtn: {
    padding: 6,
  },
  // ── Busca ───────────────────────────────────────────────────────────────────
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  // ── Lista ───────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  // ── Card ────────────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(237,133,255,0.15)',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#801C91',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#ed85ff',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardEmail: {
    color: '#ffffff80',
    fontSize: 12,
    marginBottom: 2,
  },
  cardId: {
    color: '#ed85ff',
    fontSize: 11,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderRadius: 10,
  },
  // ── Vazio ───────────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: '#ffffff50',
    fontSize: 16,
    marginTop: 16,
  },
});
