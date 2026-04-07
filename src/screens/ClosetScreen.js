import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Buffer } from 'buffer'; // Usando Buffer igual você fez no upload de posts
import { supabase } from '../database/supabase';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 45) / 2;

export default function ClosetScreen({ route, navigation }) {
  const { user } = route.params;
  
  const [catalogs, setCatalogs] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCatalogName, setNewCatalogName] = useState('');
  const [newCatalogEmoji, setNewCatalogEmoji] = useState('👕');

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
      setNewCatalogEmoji('👕');
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
    // Busca as fotos das roupas guardadas neste catálogo
    const { data: items } = await supabase.from('catalog_items').select('*').eq('catalogid', catalogId).order('id', { ascending: false });
    setCatalogItems(items || []);
    setLoading(false);
  };

  // 4. UPLOAD DA PRÓPRIA ROUPA
  const handleAddClothes = async () => {
    // Abre a galeria
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true // Pedimos a foto em base64 para facilitar o upload
    });

    if (!result.canceled && result.assets[0].base64) {
      setUploading(true);
      try {
        const base64Data = result.assets[0].base64;
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `closet/${user.id}/${Date.now()}.jpg`; // Pasta closet no servidor

        // 1. Sobe a foto pro Supabase Storage (no mesmo bucket post_images)
        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(fileName, buffer, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        // 2. Pega o link público da foto
        const { data: urlData } = supabase.storage
          .from('post_images')
          .getPublicUrl(fileName);

        // 3. Salva a roupa no banco de dados, vinculada a este catálogo
        const { error: dbError } = await supabase.from('catalog_items').insert([
          { catalogid: selectedCatalog.id, imageuri: urlData.publicUrl }
        ]);

        if (dbError) throw dbError;

        // Atualiza a tela
        fetchCatalogItems(selectedCatalog.id);

      } catch (error) {
        console.error("Erro ao subir roupa:", error);
        Alert.alert("Erro", "Não foi possível guardar esta roupa no closet.");
      } finally {
        setUploading(false);
      }
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
            ListEmptyComponent={<Text style={styles.emptyText}>Você ainda não tem divisórias no closet. Crie uma!</Text>}
          />
        )}

        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Nova Coleção</Text>
              <Text style={styles.inputLabel}>Emoji da Coleção:</Text>
              <TextInput style={[styles.input, {fontSize: 30, textAlign: 'center'}]} maxLength={2} value={newCatalogEmoji} onChangeText={setNewCatalogEmoji} />
              <Text style={styles.inputLabel}>Nome (Ex: Calças Jeans):</Text>
              <TextInput style={styles.input} placeholderTextColor="#ffffff60" value={newCatalogName} onChangeText={setNewCatalogName} />
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

  // --- RENDERIZAÇÃO DE DENTRO DO CATÁLOGO (AS ROUPAS) ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedCatalog(null)}><MaterialCommunityIcons name="arrow-left" size={28} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedCatalog.emoji} {selectedCatalog.nome}</Text>
        <View style={{width: 28}} /> 
      </View>

      {uploading && <ActivityIndicator size="small" color="#ed85ff" style={{ marginBottom: 10 }} />}
      {loading && !uploading ? <ActivityIndicator size="large" color="#ed85ff" style={{ marginTop: 50 }} /> : (
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
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma roupa aqui ainda.</Text>}
        />
      )}

      {/* BOTÃO FLUTUANTE PARA ADICIONAR FOTO DA ROUPA */}
      <TouchableOpacity style={styles.fab} onPress={handleAddClothes} disabled={uploading}>
        <MaterialCommunityIcons name="camera-plus" size={30} color="#1a011b" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#5D1D7A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 15, paddingBottom: 100 },
  catalogCard: { width: COLUMN_WIDTH, height: 180, backgroundColor: '#8226A3', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 5 },
  emojiCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#ffffff20', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  emojiText: { fontSize: 35 },
  catalogName: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center', paddingHorizontal: 10 },
  postCard: { width: COLUMN_WIDTH, height: 280, borderRadius: 20, overflow: 'hidden', backgroundColor: '#4A1461', marginBottom: 15 },
  postImage: { width: '100%', height: '100%' },
  emptyText: { color: '#ffffff60', textAlign: 'center', marginTop: 50, paddingHorizontal: 20, fontSize: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#350238', padding: 20, borderRadius: 15 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  inputLabel: { color: '#ffffff80', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#ffffff10', color: '#fff', borderRadius: 10, padding: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 25, gap: 20 },
  cancelText: { color: '#ffffff80', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#ed85ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#1a011b', fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#ed85ff', justifyContent: 'center', alignItems: 'center', elevation: 5 }
});