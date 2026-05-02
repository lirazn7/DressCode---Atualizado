import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 2;

export default function ClosetCategoryScreen({ route, navigation }) {
  const { category } = route.params;

  // Itens de exemplo para o visual
  const items = [
    { id: '1', type: 'OUTFIT', title: 'Midnight Trench', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000' },
    { id: '2', type: 'PIECE', title: 'Obsidian Coat', image: 'https://images.unsplash.com/photo-1544022613-e87ce7526edb?q=80&w=1000' },
    { id: '3', type: 'PIECE', title: 'Stiletto Boots', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000' },
    { id: '4', type: 'OUTFIT', title: 'Casual Frost', image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1000' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER DINÂMICO */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#ddb7ff" />
        </TouchableOpacity>
        <Text style={styles.topLogo}>DressCode</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="filter-variant" size={26} color="#ddb7ff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnStyle}
        ListHeaderComponent={
          <View style={styles.titleArea}>
            <Text style={styles.categoryTitle}>{category.nome}</Text>
            <View style={styles.countBadge}>
               <Text style={styles.countText}>{category.count} ITEMS STORED</Text>
            </View>
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
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub}>Premium Selection</Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
  itemSub: { color: '#978d9d', fontSize: 11, marginTop: 4 }
});