import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 1. IMPORTAMOS O SUPABASE
import { supabase } from '../database/supabase';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ route, navigation }) {
  const { profileUser, currentUser } = route.params;
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  // 2. FUNÇÃO PARA BUSCAR DADOS NA NUVEM
  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Busca os posts do usuário do perfil
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('userid', profileUser.id)
        .order('id', { ascending: false });

      if (postsError) throw postsError;
      setUserPosts(posts || []);

      // Busca contagem de Posts
      const { count: pCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('userid', profileUser.id);

      // Busca contagem de Seguidores (quem segue este perfil)
      const { count: fldCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('followingid', profileUser.id);

      // Busca contagem de Seguindo (quem este perfil segue)
      const { count: flgCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('followerid', profileUser.id);

      setStats({
        posts: pCount || 0,
        followers: fldCount || 0,
        following: flgCount || 0
      });

    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [profileUser.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{profileUser.username}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.info}>
        <MaterialCommunityIcons name="account-circle" size={80} color="#ed85ff" />
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statN}>{stats.posts}</Text>
            <Text style={styles.statL}>Posts</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statN}>{stats.followers}</Text>
            <Text style={styles.statL}>Seguidores</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statN}>{stats.following}</Text>
            <Text style={styles.statL}>Seguindo</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ed85ff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={userPosts}
          numColumns={3}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Image 
              source={{ uri: item.imageuri }} // <-- Note o 'u' minúsculo
              style={styles.gridImg} 
            />
          )}
          ListEmptyComponent={
            <Text style={{ color: '#ffffff60', textAlign: 'center', marginTop: 50 }}>
              Nenhum look postado ainda.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#5D1D7A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  info: { alignItems: 'center', padding: 20 },
  statsRow: { flexDirection: 'row', gap: 30, marginTop: 20 },
  stat: { alignItems: 'center' },
  statN: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statL: { color: '#ffffff60', fontSize: 12 },
  gridImg: { width: width / 3 - 2, height: width / 3 - 2, margin: 1 }
});