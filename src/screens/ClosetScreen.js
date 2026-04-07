import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../database/supabase';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 45) / 2;

export default function ClosetScreen({ route, navigation }) {
  const { user } = route.params;
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        // Busca os IDs dos posts que o usuário curtiu
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('postid')
          .eq('userid', user.id);

        if (likesError) throw likesError;

        const postIds = likesData.map(like => like.postid);

        if (postIds.length > 0) {
          // Se tiver curtidas, busca os posts correspondentes
          const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select('id, imageuri')
            .in('id', postIds)
            .order('id', { ascending: false });

          if (postsError) throw postsError;
          setSavedPosts(postsData || []);
        } else {
            setSavedPosts([]);
        }

      } catch (error) {
        console.error('Erro ao buscar closet:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPosts();
  }, [user.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Closet</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ed85ff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={savedPosts}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.scrollContent}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <Image source={{ uri: item.imageuri }} style={styles.postImage} />
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Seu closet está vazio. Curta posts na vitrine para guardá-los aqui!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#5D1D7A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 15, paddingBottom: 100 },
  postCard: { width: COLUMN_WIDTH, height: 280, borderRadius: 20, overflow: 'hidden', backgroundColor: '#4A1461', marginBottom: 15 },
  postImage: { width: '100%', height: '100%' },
  emptyText: { color: '#ffffff60', textAlign: 'center', marginTop: 50, paddingHorizontal: 20, fontSize: 16 }
});