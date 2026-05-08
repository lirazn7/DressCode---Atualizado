import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, Dimensions, 
  TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, 
  Platform, StatusBar, SafeAreaView, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Buffer } from 'buffer'; 
import { supabase } from '../database/supabase';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 55) / 2;

export default function ClosetScreen({ navigation }) {
  const { user } = useAuth();
  
  const [catalogs, setCatalogs] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCatalogName, setNewCatalogName] = useState('');
  const [newCatalogEmoji, setNewCatalogEmoji] = useState('👕');

  const fetchCatalogs = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('catalogs').select('*').eq('userid', user.id).order('id', { ascending: false });
      if (!error) setCatalogs(data || []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCatalogs(); }, [user?.id]);

  const handleCreateCatalog = async () => {
    if (!newCatalogName.trim()) return;
    const { error } = await supabase.from('catalogs').insert([{ userid: user.id, nome: newCatalogName, emoji: newCatalogEmoji }]);
    if (!error) {
      setNewCatalogName('');
      setShowCreateModal(false);
      fetchCatalogs();
    }
  };

  const openCatalog = async (catalog) => {
    setSelectedCatalog(catalog);
    setLoading(true);
    const { data: items } = await supabase.from('catalog_items').select('*').eq('catalogid', catalog.id).order('id', { ascending: false });
    setCatalogItems(items || []);
    setLoading(false);
  };

  const handleAddClothes = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true 
    });

    if (!result.canceled && result.assets[0].base64) {
      setUploading(true);
      try {
        const base64Data = result.assets[0].base64;
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `closet/${user.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage.from('post_images').upload(fileName, buffer, { contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('post_images').getPublicUrl(fileName);
        const { error: dbError } = await supabase.from('catalog_items').insert([{ catalogid: selectedCatalog.id, imageuri: urlData.publicUrl }]);

        if (!dbError) openCatalog(selectedCatalog);
      } catch (error) {
        Alert.alert("Erro", "Falha ao subir imagem.");
      } finally { setUploading(false); }
    }
  };

  // --- COMPONENTE DE CADA CARD DE CATEGORIA (BENTO GRID) ---
  const CategoryCard = ({ item, isWide }) => (
    <TouchableOpacity 
      style={[isWide ? styles.wideCard : styles.categoryCard]} 
      onPress={() => openCatalog(item)}
    >
      <Image source={{ uri: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1000' }} style={styles.catImg} />
      <View style={isWide ? styles.glassInfoWide : styles.glassInfo}>
        <View style={styles.catTextContainer}>
          <Text style={styles.catEmoji}>{item.emoji}</Text>
          <View>
            <Text style={styles.catName}>{item.nome}</Text>
            <Text style={styles.catCount}>Ver Coleção</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#ddb7ff" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => selectedCatalog ? setSelectedCatalog(null) : navigation.goBack()}>
          <MaterialCommunityIcons name={selectedCatalog ? "arrow-left" : "menu"} size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topLogo}>DressCode</Text>
        <TouchableOpacity onPress={() => selectedCatalog ? handleAddClothes() : setShowCreateModal(true)}>
          <MaterialCommunityIcons name={selectedCatalog ? "camera-plus" : "plus-box-outline"} size={26} color="#ddb7ff" />
        </TouchableOpacity>
      </View>

      {selectedCatalog ? (
        // --- VISUAL DENTRO DA CATEGORIA (MASONRY) ---
        <FlatList
          data={catalogItems}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnStyle}
          ListHeaderComponent={
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selectedCatalog.emoji} {selectedCatalog.nome}</Text>
              <Text style={styles.detailSub}>{catalogItems.length} Itens Salvos</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={[styles.itemCard, { marginTop: index % 2 !== 0 ? 30 : 0 }]}>
              <Image source={{ uri: item.imageuri }} style={styles.itemImg} />
            </View>
          )}
        />
      ) : (
        // --- VISUAL PRINCIPAL (BENTO GRID) ---
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Meu Closet</Text>
            <Text style={styles.heroSub}>Curadoria Pessoal</Text>
          </View>

          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>CATEGORIAS</Text>
            <View style={styles.dividerLine} />
          </View>

          {loading ? <ActivityIndicator color="#ba7ef4" /> : (
            <View style={styles.gridContainer}>
              {catalogs.map((cat, index) => (
                <CategoryCard key={cat.id} item={cat} isWide={index % 3 === 2} />
              ))}
              <TouchableOpacity style={styles.wideCard}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000' }} style={styles.catImg} />
                <View style={styles.glassInfoWide}>
                  <Text style={styles.catName}>Peças Individuais</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#ddb7ff" />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* BOTTOM NAV UNIFICADA */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => navigation.navigate('Vitrine')}><MaterialCommunityIcons name="view-grid-outline" size={26} color="#ffffff60" /></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}><MaterialCommunityIcons name="magnify" size={26} color="#ffffff60" /></TouchableOpacity>
          <TouchableOpacity style={styles.centerAddBtn} onPress={() => navigation.navigate('CreatePost')}><LinearGradient colors={['#ba7ef4', '#4b0082']} style={styles.addBtnGradient}><MaterialCommunityIcons name="plus" size={32} color="#fff" /></LinearGradient></TouchableOpacity>
          <TouchableOpacity><MaterialCommunityIcons name="hanger" size={26} color="#ddb7ff" /></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { profileUser: user, currentUser: user })}><MaterialCommunityIcons name="account-outline" size={26} color="#ffffff60" /></TouchableOpacity>
        </View>
      </View>

      {/* MODAL CRIAR CATEGORIA */}
      <Modal visible={showCreateModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Coleção</Text>
            <TextInput style={styles.emojiInput} value={newCatalogEmoji} onChangeText={setNewCatalogEmoji} maxLength={2} />
            <TextInput style={styles.textInput} placeholder="Nome da Categoria" placeholderTextColor="#978d9d" value={newCatalogName} onChangeText={setNewCatalogName} />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}><Text style={{ color: '#978d9d' }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateCatalog}><Text style={styles.saveBtnText}>Criar</Text></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  topLogo: { color: '#e5e2e1', fontSize: 20, fontStyle: 'italic' },
  scrollContent: { paddingBottom: 150 },
  heroSection: { padding: 30 },
  heroTitle: { color: '#ba7ef4', fontSize: 42, fontWeight: 'bold' },
  heroSub: { color: '#e5e2e1', fontSize: 18, opacity: 0.6 },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#978d9d', fontSize: 10, letterSpacing: 3, marginHorizontal: 15 },
  gridContainer: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: { width: COLUMN_WIDTH, height: 220, borderRadius: 20, overflow: 'hidden', marginBottom: 15, backgroundColor: '#160d22' },
  wideCard: { width: '100%', height: 160, borderRadius: 20, overflow: 'hidden', marginBottom: 15, backgroundColor: '#160d22' },
  catImg: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
  glassInfo: { position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: 'rgba(28, 27, 27, 0.9)', borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  glassInfoWide: { position: 'absolute', bottom: 15, left: 15, right: 15, backgroundColor: 'rgba(28, 27, 27, 0.9)', borderRadius: 15, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catTextContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catEmoji: { fontSize: 24 },
  catName: { color: '#e5e2e1', fontWeight: 'bold', fontSize: 14 },
  catCount: { color: '#ba7ef4', fontSize: 10 },
  listContent: { paddingBottom: 150 },
  columnStyle: { paddingHorizontal: 20, justifyContent: 'space-between' },
  detailHeader: { padding: 30 },
  detailTitle: { color: '#ba7ef4', fontSize: 32, fontWeight: 'bold' },
  detailSub: { color: '#978d9d', fontSize: 14, marginTop: 5 },
  itemCard: { width: COLUMN_WIDTH, borderRadius: 15, overflow: 'hidden', backgroundColor: '#160d22' },
  itemImg: { width: '100%', height: 260 },
  bottomNavContainer: { position: 'absolute', bottom: 25, width: '100%', alignItems: 'center' },
  bottomNav: { flexDirection: 'row', width: '92%', height: 70, backgroundColor: 'rgba(22, 13, 34, 0.95)', borderRadius: 35, alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  centerAddBtn: { marginTop: -35 },
  addBtnGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#131313' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: '#160d22', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: '#e5e2e1', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  emojiInput: { backgroundColor: '#131313', color: '#fff', fontSize: 32, textAlign: 'center', borderRadius: 12, height: 60, marginBottom: 15 },
  textInput: { backgroundColor: '#131313', color: '#e5e2e1', borderRadius: 12, height: 55, paddingHorizontal: 15, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 25 },
  saveBtn: { backgroundColor: '#ba7ef4', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  saveBtnText: { color: '#160d22', fontWeight: 'bold' }
});