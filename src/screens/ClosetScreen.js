import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, Dimensions, 
  TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, 
  Platform, StatusBar, SafeAreaView, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

// ── SISTEMA DE ARQUIVOS LEGADO DO EXPO (SDK 54) ────────────────────────────
import * as FileSystem from 'expo-file-system/legacy';

// ── INFRAESTRUTURA DO GOOGLE CLOUD ─────────────────────────────────────────
import { db } from '../database/firebase';
import { 
  collection, addDoc, getDocs, query, where, orderBy 
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 55) / 2;

export default function ClosetScreen({ navigation }) {
  const { user } = useAuth();
  const secureUserId = user?.uid || user?.id;
  
  // NAVEGAÇÃO INTERNA: 'home' | 'catalog' | 'pieces_home' | 'piece_detail'
  const [viewMode, setViewMode] = useState('home'); 
  
  // ESTADOS DE DADOS NoSQL
  const [catalogs, setCatalogs] = useState([]); 
  const [pieceCategories, setPieceCategories] = useState([]); 
  const [selectedItem, setSelectedItem] = useState(null); 
  const [itemsList, setItemsList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // ESTADOS DOS MODAIS
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalTarget, setModalTarget] = useState('collection'); // 'collection' ou 'piece_cat'
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('👕');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [pieceLegenda, setPieceLegenda] = useState('');

  /**
   * 📜 MÉTODO EDUCATIVO: LEITURA NO FIRESTORE
   * Buscamos as coleções de looks e categorias criadas para o usuário logado.
   */
  const fetchData = async () => {
    if (!secureUserId) return;
    setLoading(true);
    try {
      // 1. Buscar Coleções/Looks
      const catalogsRef = collection(db, 'catalogs');
      const qCatalogs = query(catalogsRef, where('userid', '==', secureUserId));
      const querySnapCatalogs = await getDocs(qCatalogs);
      
      const catalogsList = [];
      querySnapCatalogs.forEach((doc) => {
        catalogsList.push({ id: doc.id, ...doc.data() });
      });
      setCatalogs(catalogsList);

      // 2. Buscar Categorias de Peças
      const categoriesRef = collection(db, 'piece_categories');
      const qCategories = query(categoriesRef, where('userid', '==', secureUserId));
      const querySnapCategories = await getDocs(qCategories);
      
      const categoriesList = [];
      querySnapCategories.forEach((doc) => {
        categoriesList.push({ id: doc.id, ...doc.data() });
      });
      setPieceCategories(categoriesList);

    } catch (e) { 
      console.log("Erro ao buscar dados do closet:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [secureUserId]);

  /**
   * ➕ ESCRITA NO BANCO NOSQL
   * Cria dinamicamente novos agrupadores no banco utilizando addDoc.
   */
  const handleCreateNew = async () => {
    if (!newName.trim() || !secureUserId) return;
    const targetCollection = modalTarget === 'collection' ? 'catalogs' : 'piece_categories';
    
    try {
      await addDoc(collection(db, targetCollection), {
        userid: secureUserId,
        nome: newName.trim(),
        emoji: newEmoji
      });

      setNewName('');
      setShowCreateModal(false);
      fetchData();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível criar o item.");
    }
  };

  /**
   * 📂 ABRIR CONTEÚDO DOS LOOKS OU ESTAÇÕES
   */
  const openContent = async (item, type) => {
    setSelectedItem(item);
    setViewMode(type === 'collection' ? 'catalog' : 'piece_detail');
    setLoading(true);
    
    try {
      const filterColumn = type === 'collection' ? 'catalogid' : 'piece_category_id';
      const itemsRef = collection(db, 'catalog_items');
      const qItems = query(itemsRef, where(filterColumn, '==', item.id));
      
      const querySnapItems = await getDocs(qItems);
      const fetchedItems = [];
      querySnapItems.forEach((doc) => {
        fetchedItems.push({ id: doc.id, ...doc.data() });
      });

      setItemsList(fetchedItems);
    } catch (e) {
      console.log("Erro ao carregar itens:", e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📸 CAPTURA E COMPACTAÇÃO DA ROUPA
   */
  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.3, // Reduz o peso da imagem para manter a string leve
    });

    if (!result.canceled) {
      setTempImage(result.assets[0]);
      setPieceLegenda('');
      setShowUploadModal(true);
    }
  };

  /**
   * 💾 SALVAMENTO REAL EM BASE64 NO FIRESTORE
   */
  const confirmUpload = async () => {
    if (!tempImage || !secureUserId) return;
    setShowUploadModal(false);
    setUploading(true);
    
    try {
      // Conversão segura do arquivo para string usando a rota legacy da SDK 54
      const base64Data = await FileSystem.readAsStringAsync(tempImage.uri, {
        encoding: 'base64',
      });

      const cleanBase64 = base64Data.replace(/(?:\r\n|\r|\n)/g, '');
      const ext = tempImage.uri.substring(tempImage.uri.lastIndexOf('.') + 1);
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
      const finalImageString = `data:${mimeType};base64,${cleanBase64}`;

      const dbPayload = {
        imageuri: finalImageString,
        legenda: pieceLegenda.trim(),
        userid: secureUserId,
        createdAt: new Date().toISOString()
      };

      if (viewMode === 'catalog') {
        dbPayload.catalogid = selectedItem.id;
      } else {
        dbPayload.piece_category_id = selectedItem.id;
      }

      // Gravando o novo item de vestuário diretamente no Firestore NoSQL
      await addDoc(collection(db, 'catalog_items'), dbPayload);

      // Atualiza a listagem na tela
      openContent(selectedItem, viewMode === 'catalog' ? 'collection' : 'piece_cat');
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Falha ao salvar peça no Google Cloud.");
    } finally { 
      setUploading(false); 
      setTempImage(null);
    }
  };

  const handleBack = () => {
    if (viewMode === 'catalog' || viewMode === 'pieces_home') setViewMode('home');
    else if (viewMode === 'piece_detail') setViewMode('pieces_home');
    else navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.responsiveContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack}>
            <MaterialCommunityIcons name={viewMode === 'home' ? "menu" : "arrow-left"} size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topLogo}>DressCode</Text>
          <TouchableOpacity onPress={() => {
            if (viewMode === 'home') { setModalTarget('collection'); setShowCreateModal(true); }
            else if (viewMode === 'pieces_home') { setModalTarget('piece_cat'); setShowCreateModal(true); }
            else if (viewMode === 'catalog' || viewMode === 'piece_detail') handlePickImage();
          }}>
            <MaterialCommunityIcons 
              name={(viewMode === 'catalog' || viewMode === 'piece_detail') ? "camera-plus" : "plus-box-outline"} 
              size={26} color="#ddb7ff" 
            />
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#ba7ef4" style={{ flex: 1 }} />}

        {!loading && viewMode === 'home' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Meu Closet</Text>
              <Text style={styles.heroSub}>Curadoria Pessoal</Text>
            </View>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} /><Text style={styles.dividerText}>COLEÇÕES</Text><View style={styles.dividerLine} />
            </View>
            <View style={styles.gridContainer}>
              {catalogs.map((cat, index) => (
                <TouchableOpacity key={cat.id} style={[styles.categoryCard, index % 3 === 2 && styles.wideCard]} onPress={() => openContent(cat, 'collection')}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1000' }} style={styles.catImg} />
                  <View style={index % 3 === 2 ? styles.glassInfoWide : styles.glassInfo}>
                    <Text style={styles.catName}>{cat.emoji} {cat.nome}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#ddb7ff" />
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.wideCard} onPress={() => setViewMode('pieces_home')}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000' }} style={styles.catImg} />
                <View style={styles.glassInfoWide}>
                  <Text style={styles.catName}>Peças Individuais</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#ddb7ff" />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {!loading && viewMode === 'pieces_home' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Minhas Peças</Text>
              <Text style={styles.heroSub}>Catálogo Geral</Text>
            </View>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} /><Text style={styles.dividerText}>CATEGORIAS</Text><View style={styles.dividerLine} />
            </View>
            <View style={styles.gridContainer}>
              {pieceCategories.map((cat, index) => (
                <TouchableOpacity key={cat.id} style={[styles.categoryCard, index % 3 === 2 && styles.wideCard]} onPress={() => openContent(cat, 'piece_cat')}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=1000' }} style={styles.catImg} />
                  <View style={index % 3 === 2 ? styles.glassInfoWide : styles.glassInfo}>
                    <Text style={styles.catName}>{cat.emoji} {cat.nome}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#ddb7ff" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {!loading && (viewMode === 'catalog' || viewMode === 'piece_detail') && (
          <FlatList
            data={itemsList}
            numColumns={2}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={styles.columnStyle}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{selectedItem?.emoji} {selectedItem?.nome.toUpperCase()}</Text>
                <Text style={styles.detailSub}>{itemsList.length} ITENS SALVOS</Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <View style={[styles.itemCard, { marginTop: index % 2 !== 0 ? 30 : 0 }]}>
                <Image source={{ uri: item.imageuri }} style={styles.itemImg} />
                {item.legenda && (
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemLegenda}>{item.legenda}</Text>
                  </View>
                )}
              </View>
            )}
          />
        )}

        {/* BOTTOM NAV */}
        <View style={styles.bottomNavContainer}>
          <View style={styles.bottomNav}>
            <TouchableOpacity onPress={() => navigation.navigate('Vitrine')}><MaterialCommunityIcons name="view-grid-outline" size={26} color="#ffffff60" /></TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}><MaterialCommunityIcons name="magnify" size={26} color="#ffffff60" /></TouchableOpacity>
            <TouchableOpacity style={styles.centerAddBtn} onPress={() => navigation.navigate('CreatePost')}><LinearGradient colors={['#ba7ef4', '#4b0082']} style={styles.addBtnGradient}><MaterialCommunityIcons name="plus" size={32} color="#fff" /></LinearGradient></TouchableOpacity>
            <TouchableOpacity><MaterialCommunityIcons name="hanger" size={26} color="#ddb7ff" /></TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { profileUser: user, currentUser: user })}><MaterialCommunityIcons name="account-outline" size={26} color="#ffffff60" /></TouchableOpacity>
          </View>
        </View>

        {/* MODAL CRIAR */}
        <Modal visible={showCreateModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior="padding" style={styles.modalContent}>
              <Text style={styles.modalTitle}>{modalTarget === 'collection' ? 'Nova Coleção' : 'Nova Categoria'}</Text>
              <TextInput style={styles.emojiInput} value={newEmoji} onChangeText={setNewEmoji} maxLength={2} />
              <TextInput style={styles.textInput} placeholder="Nome" placeholderTextColor="#978d9d" value={newName} onChangeText={setNewName} />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}><Text style={{ color: '#978d9d' }}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreateNew}><Text style={styles.saveBtnText}>Criar</Text></TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* MODAL UPLOAD */}
        <Modal visible={showUploadModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior="padding" style={styles.modalContent}>
              <Text style={styles.modalTitle}>Detalhes da Peça</Text>
              {tempImage && <Image source={{ uri: tempImage.uri }} style={styles.previewImg} />}
              <TextInput style={styles.textInput} placeholder="Nome da peça (Ex: Tênis Branco)" placeholderTextColor="#978d9d" value={pieceLegenda} onChangeText={setPieceLegenda} />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowUploadModal(false)}><Text style={{ color: '#978d9d' }}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={confirmUpload}><Text style={styles.saveBtnText}>Salvar</Text></TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </SafeAreaView>
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
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, width: '100%' },
  topLogo: { color: '#e5e2e1', fontSize: 18, fontStyle: 'italic', fontWeight: 'bold' },
  scrollContent: { paddingBottom: 150 },
  heroSection: { padding: 30, paddingTop: 10 },
  heroTitle: { color: '#ba7ef4', fontSize: 42, fontWeight: 'bold' },
  heroSub: { color: '#e5e2e1', fontSize: 16, opacity: 0.6 },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#978d9d', fontSize: 10, letterSpacing: 3, marginHorizontal: 15 },
  gridContainer: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: { width: COLUMN_WIDTH, height: 220, borderRadius: 20, overflow: 'hidden', marginBottom: 15, backgroundColor: '#160d22' },
  wideCard: { width: '100%', height: 120, borderRadius: 20, overflow: 'hidden', marginBottom: 15, backgroundColor: '#160d22', justifyContent: 'flex-end' },
  catImg: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
  glassInfo: { position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: 'rgba(28, 27, 27, 0.9)', borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  glassInfoWide: { width: '100%', backgroundColor: 'rgba(28, 27, 27, 0.7)', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catName: { color: '#e5e2e1', fontWeight: 'bold', fontSize: 16 },
  listContent: { paddingBottom: 150, paddingTop: 20 },
  columnStyle: { paddingHorizontal: 20, justifyContent: 'space-between' },
  detailHeader: { padding: 30 },
  detailTitle: { color: '#ba7ef4', fontSize: 32, fontWeight: 'bold' },
  detailSub: { color: '#978d9d', fontSize: 12, letterSpacing: 2 },
  itemCard: { width: COLUMN_WIDTH, borderRadius: 15, overflow: 'hidden', backgroundColor: '#160d22', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  itemImg: { width: '100%', height: 220, resizeMode: 'cover' },
  itemFooter: { padding: 10, backgroundColor: 'rgba(20,20,20,0.8)' },
  itemLegenda: { color: '#e5e2e1', fontSize: 12, fontWeight: 'bold' },
  bottomNavContainer: { position: 'absolute', bottom: 25, width: '100%', alignItems: 'center' },
  bottomNav: { flexDirection: 'row', width: '92%', height: 70, backgroundColor: 'rgba(22, 13, 34, 0.95)', borderRadius: 35, alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  centerAddBtn: { marginTop: -35 },
  addBtnGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#131313' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: '#160d22', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: '#e5e2e1', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  previewImg: { width: '100%', height: 200, borderRadius: 12, marginBottom: 20 },
  emojiInput: { backgroundColor: '#131313', color: '#fff', fontSize: 32, textAlign: 'center', borderRadius: 12, height: 60, marginBottom: 15 },
  textInput: { backgroundColor: '#131313', color: '#e5e2e1', borderRadius: 12, height: 55, paddingHorizontal: 15, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 25 },
  saveBtn: { backgroundColor: '#ba7ef4', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  saveBtnText: { color: '#160d22', fontWeight: 'bold' }
});