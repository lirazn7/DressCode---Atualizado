import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../database/supabase';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 45) / 2;

export default function ClosetScreen({ route, navigation }) {
  const { user } = route.params;
  
  // Estados Principais
  const [catalogs, setCatalogs] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCatalogName, setNewCatalogName] = useState('');
  const [newCatalogEmoji, setNewCatalogEmoji] = useState('👗');

  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]); // Posts que o user já curtiu para poder adicionar

  // 1. BUSCAR CATÁLOGOS
  const fetchCatalogs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('catalogs').select('*').eq('userid', user.id).order('id', { ascending: false });
    if (!error) setCatalogs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCatalogs(); }, [user.id]);

  // 2. CRIAR NOVO CATÁLOGO
  const handleCreateCatalog = async () => {
    if (!newCatalogName.trim() || !newCatalogEmoji.trim()) return;
    const { error } = await supabase.from('catalogs').insert([{ userid: user.id, nome: newCatalogName, emoji: newCatalogEmoji }]);
    if (!error) {
      setNewCatalogName('');
      setNewCatalogEmoji('👗');
      setShowCreateModal(false);
      fetchCatalogs();
    }
  };

  // 3. ABRIR UM CATÁLOGO ESPECÍFICO
  const openCatalog = async (catalog) => {
    setSelectedCatalog(catalog);
    fetchCatalogItems(catalog.id);
  };

  const fetchCatalogItems = async (catalogId) => {
    setLoading(true);
    // Busca os itens vinculados a este catálogo
    const { data: items } = await supabase.from('catalog_items').select('postid').eq('catalogid', catalogId);
    
    if (items && items.length > 0) {
      const postIds = items.map(item => item.postid);
      const { data: posts } = await supabase.from('posts').select('*').in('id', postIds);
      setCatalogItems(posts || []);
    } else {
      setCatalogItems([]);
    }
    setLoading(false);
  };

  // 4. BUSCAR LIKES PARA ADICIONAR AO CATÁLOGO
  const loadLikedPostsToAdd = async () => {
    const { data: likes } = await supabase.from('likes').select('postid').eq('userid', user.id);
    if (likes && likes.length > 0) {
      const postIds = likes.map(l => l.postid);
      const { data: posts } = await supabase.from('posts').select('*').in('id', postIds);
      setLikedPosts(posts || []);
    }
    setShowAddItemsModal(true);
  };

  // 5. SALVAR ITEM NO CATÁLOGO
  const addItemToCatalog = async (postId) => {
    // Verifica se já está no catálogo
    const exists = catalogItems.find(p => p.id === postId);
    if (exists) return; // Já adicionado

    const { error } = await supabase.from('catalog_items').insert([{ catalogid: selectedCatalog.id, postid: postId }]);
    if (!error) {
      fetchCatalogItems(selectedCatalog.id);
      setShowAddItemsModal(false);
    }
  };

  // --- RENDERIZAÇÃO DA TELA DE CATÁLOGOS ---
  if (!selectedCatalog) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={28} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Closet</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)}><MaterialCommunityIcons name="plus-box" size={28} color="#ed85ff" /></TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator size="large" color="#ed85ff" style={{ marginTop: 50 }} /> : (
          <FlatList
            data={catalogs}
            numColumns={2}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.scrollContent}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.catalogCard} onPress={() => openCatalog(item)}>
                <View style={styles.emojiCircle}><Text style={styles.emojiText}>{item.emoji}</Text></View>
                <Text style={styles.catalogName}>{item.nome}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Você ainda não criou nenhum catálogo.</Text>}
          />
        )}

        {/* MODAL DE CRIAR CATÁLOGO */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Novo Catálogo</Text>
              
              <Text style={styles.inputLabel}>Emoji do Catálogo:</Text>
              <TextInput style={[styles.input, {fontSize: 30, textAlign: 'center'}]} maxLength={2} value={newCatalogEmoji} onChangeText={setNewCatalogEmoji} />
              
              <Text style={styles.inputLabel}>Nome do Catálogo:</Text>
              <TextInput style={styles.input} placeholder="Ex: Looks de Inverno" placeholderTextColor="#ffffff60" value={newCatalogName} onChangeText={setNewCatalogName} />
              
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreateCatalog}><Text style={styles.saveText}>Criar</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // --- RENDERIZAÇÃO DE DENTRO DO CATÁLOGO ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedCatalog(null)}><MaterialCommunityIcons name="arrow-left" size={28} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedCatalog.emoji} {selectedCatalog.nome}</Text>
        <TouchableOpacity onPress={loadLikedPostsToAdd}><MaterialCommunityIcons name="hanger" size={28} color="#ed85ff" /></TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator size="large" color="#ed85ff" style={{ marginTop: 50 }} /> : (
        <FlatList
          data={catalogItems}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.scrollContent}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <Image source={{ uri: item.imageuri }} style={styles.postImage} />
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum look salvo neste catálogo ainda. Clique no cabide acima para adicionar!</Text>}
        />
      )}

      {/* MODAL PARA ADICIONAR ITEMS (BUSCA DOS LIKES) */}
      <Modal visible={showAddItemsModal} animationType="slide" transparent>
        <View style={styles.modalBgFull}>
          <View style={styles.headerModal}>
            <TouchableOpacity onPress={() => setShowAddItemsModal(false)}><MaterialCommunityIcons name="close" size={28} color="#fff" /></TouchableOpacity>
            <Text style={styles.headerTitle}>Escolha um Look</Text>
            <View style={{width: 28}}/>
          </View>
          <FlatList
            data={likedPosts}
            numColumns={3}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => addItemToCatalog(item.id)}>
                <Image source={{ uri: item.imageuri }} style={styles.gridImg} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Você precisa curtir (dar coração) em posts na Vitrine para eles aparecerem aqui!</Text>}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#5D1D7A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 15, paddingBottom: 100 },
  
  // Estilos do Catálogo
  catalogCard: { width: COLUMN_WIDTH, height: 180, backgroundColor: '#8226A3', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 5 },
  emojiCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#ffffff20', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  emojiText: { fontSize: 35 },
  catalogName: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center', paddingHorizontal: 10 },
  
  // Estilos dos Posts
  postCard: { width: COLUMN_WIDTH, height: 280, borderRadius: 20, overflow: 'hidden', backgroundColor: '#4A1461', marginBottom: 15 },
  postImage: { width: '100%', height: '100%' },
  emptyText: { color: '#ffffff60', textAlign: 'center', marginTop: 50, paddingHorizontal: 20, fontSize: 16 },
  
  // Estilos Modais
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#350238', padding: 20, borderRadius: 15 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  inputLabel: { color: '#ffffff80', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#ffffff10', color: '#fff', borderRadius: 10, padding: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 25, gap: 20 },
  cancelText: { color: '#ffffff80', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#ed85ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#1a011b', fontWeight: 'bold' },
  
  // Modal Full Screen (Adicionar Look)
  modalBgFull: { flex: 1, backgroundColor: '#5D1D7A', paddingTop: 50 },
  headerModal: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  gridImg: { width: width / 3 - 2, height: width / 3 - 2, margin: 1 }
});