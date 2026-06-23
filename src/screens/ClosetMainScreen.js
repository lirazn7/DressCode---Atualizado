import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, 
  Dimensions, StatusBar, Platform, ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// ── INFRAESTRUTURA DO GOOGLE CLOUD ─────────────────────────────────────────
import { db } from '../database/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function ClosetMainScreen({ navigation }) {
  const { user } = useAuth();
  const secureUserId = user?.uid || user?.id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * 📜 MÉTODO NoSQL: CAPTURA DINÂMICA DE CATEGORIAS
   * Coleta as coleções de estilos criadas pelo próprio usuário logado no Firestore.
   */
  const fetchClosetCategories = async () => {
    if (!secureUserId) return;
    setLoading(true);
    try {
      const catalogsRef = collection(db, 'catalogs');
      const q = query(catalogsRef, where('userid', '==', secureUserId));
      const querySnapshot = await getDocs(q);

      const fetchedCategories = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedCategories.push({
          id: doc.id,
          nome: data.nome,
          emoji: data.emoji || '✨',
          // Fallback de imagem elegante caso o catálogo não defina uma capa fixa
          image: data.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000'
        });
      });

      setCategories(fetchedCategories);
    } catch (error) {
      console.log("Erro ao carregar categorias do Closet:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosetCategories();
  }, [secureUserId]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER IMERSIVO */}
        <View style={styles.headerHero}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1000' }} 
            style={styles.heroImg} 
            blurRadius={3}
          />
          <LinearGradient colors={['transparent', '#131313']} style={styles.heroGradient} />
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Meu Closet</Text>
            <Text style={styles.heroSubtitle}>Curadoria Pessoal</Text>
          </View>
          <TouchableOpacity 
            style={styles.addBtnFloating}
            onPress={() => navigation.navigate('ClosetScreen')} // Atalho dinâmico para gerenciar/criar novas abas
          >
            <MaterialCommunityIcons name="plus" size={30} color="#160d22" />
          </TouchableOpacity>
        </View>

        {/* SEÇÃO DE CATEGORIAS (Bento Grid) */}
        <View style={styles.sectionHeader}>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>CATEGORIAS</Text>
          <View style={styles.divider} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#ba7ef4" style={{ marginTop: 30 }} />
        ) : (
          <View style={styles.gridContainer}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoryCard}
                onPress={() => navigation.navigate('ClosetCategory', { category: cat })}
              >
                <Image source={{ uri: cat.image }} style={styles.catImg} />
                <View style={styles.glassInfo}>
                  <View style={{ flex: 1, paddingRight: 4 }}>
                    <Text style={styles.catName} numberOfLines={1}>
                      {cat.emoji} {cat.nome}
                    </Text>
                    <Text style={styles.catCount}>Ver Coleção</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#ddb7ff" />
                </View>
              </TouchableOpacity>
            ))}

            {/* CARD LARGO (Peças Individuais / Inventário de Estações) */}
            <TouchableOpacity 
              style={styles.wideCard}
              onPress={() => navigation.navigate('ClosetScreen')}
            >
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000' }} 
                style={styles.catImg} 
              />
              <View style={styles.glassInfoWide}>
                 <View>
                    <Text style={styles.catName}>Peças Individuais</Text>
                    <Text style={styles.catCount}>Explore seu inventário completo por estações</Text>
                 </View>
                 <MaterialCommunityIcons name="arrow-right" size={24} color="#ddb7ff" />
              </View>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  scrollContent: { paddingBottom: 100 },
  headerHero: { width: '100%', height: 300, justifyContent: 'flex-end' },
  heroImg: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroTextContainer: { padding: 30 },
  heroTitle: { color: '#ddb7ff', fontSize: 42, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  heroSubtitle: { color: '#978d9d', fontSize: 18 },
  addBtnFloating: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#ba7ef4', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 10, zIndex: 10 },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 30 },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionTitle: { color: '#978d9d', fontSize: 12, letterSpacing: 3, marginHorizontal: 15 },

  gridContainer: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: { width: (width - 55) / 2, height: 240, borderRadius: 20, overflow: 'hidden', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: '#160d22' },
  catImg: { ...StyleSheet.absoluteFillObject, opacity: 0.6 },
  glassInfo: { position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: 'rgba(20, 20, 20, 0.85)', borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  catName: { color: '#ddb7ff', fontWeight: 'bold', fontSize: 14 },
  catCount: { color: '#978d9d', fontSize: 11, marginTop: 2 },
  
  wideCard: { width: '100%', height: 150, borderRadius: 20, overflow: 'hidden', marginTop: 10, backgroundColor: '#160d22' },
  glassInfoWide: { position: 'absolute', bottom: 15, left: 15, right: 15, backgroundColor: 'rgba(20, 20, 20, 0.85)', borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }
});