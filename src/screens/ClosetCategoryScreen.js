import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ── INFRAESTRUTURA DO GOOGLE CLOUD ─────────────────────────────────────────
import { db } from '../database/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 2;

export default function ClosetCategoryScreen({ route, navigation }) {
  const { category } = route.params;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * 📜 BUSCA NoSQL: FILTRAGEM DE PEÇAS POR COLEÇÃO/CATÁLOGO
   * Realiza o carregamento dos itens cujo 'catalogid' seja o ID deste documento.
   */
  const fetchCategoryItems = async () => {
    if (!category?.id) return;
    setLoading(true);
    try {
      const itemsRef = collection(db, 'catalog_items');
      const q = query(
        itemsRef,
        where('catalogid', '==', category.id),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedItems = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedItems.push({
          id: doc.id,
          title: data.legenda || 'Peça do Closet',
          image: data.imageuri,
          type: 'OUTFIT' // Classificação visual padrão do ecossistema NoSQL
        });
      });

      setItems(fetchedItems);
    } catch (error) {
      console.log("Erro ao carregar itens da coleção:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryItems();
  }, [category?.id]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER DINÂMICO */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#ddb7ff" />
        </TouchableOpacity>
        <Text style={styles.topLogo}>DressCode</Text>
        <TouchableOpacity onPress={fetchCategoryItems}>
          <MaterialCommunityIcons name="refresh" size={26} color="#ddb7ff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ba7ef4" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item) => item.id} // Mapeado para o ID string do Firestore
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnStyle}
          ListHeaderComponent={
            <View style={styles.titleArea}>
              <Text style={styles.categoryTitle}>{category.nome}</Text>
              <View style={styles.countBadge}>
                 <Text style={styles.countText}>{items.length} ITEMS STORED</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="hanger" size={60} color="rgba(255,255,255,0.05)" />
              <Text style={styles.emptyText}>Nenhum item salvo nesta coleção.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity style={[styles.masonryCard, { marginTop: index % 2 !== 0 ? 30 : 0 }]}>
              <View style={styles.imageWrapper}>
                 <Image source={{ uri: item.image }} style={styles.itemImg} />
                 <View style={styles.chip}>
                   <Text style={styles.chipText}>{item.type}</Text>
                 </View>
              </View>
              <View style={styles.itemFooter}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemSub}>Cloud Selection</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 80, paddingTop: 30 },
  topLogo: { color: '#e5e2e1', fontSize: 22, fontWeight: 'bold', fontStyle: 'italic' },
  listContent: { paddingBottom: 50 },
  columnStyle: { paddingHorizontal: 15, justifyContent: 'space-between' },
  titleArea: { padding: 20, marginBottom: 10 },
  categoryTitle: { color: '#ddb7ff', fontSize: 38, fontWeight: 'bold' },
  countBadge: { marginTop: 5 },
  countText: { color: '#978d9d', fontSize: 10, letterSpacing: 2 },
  
  masonryCard: { width: COLUMN_WIDTH, backgroundColor: '#160d22', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  imageWrapper: { width: '100%', height: 240 },
  itemImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  chip: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(75, 0, 130, 0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(221, 183, 255, 0.2)' },
  chipText: { color: '#ddb7ff', fontSize: 9, fontWeight: 'bold' },
  itemFooter: { padding: 15 },
  itemTitle: { color: '#e5e2e1', fontSize: 15, fontWeight: 'bold' },
  itemSub: { color: '#978d9d', fontSize: 11, marginTop: 4 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { color: '#978d9d', fontSize: 14, textAlign: 'center', marginTop: 15 }
});