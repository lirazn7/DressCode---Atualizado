import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Animated, Easing,
  FlatList, StatusBar, Image, Dimensions, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useIsFocused } from '@react-navigation/native';

// DB AGORA É SUPABASE
import { supabase } from '../database/supabase';

const { width, height } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 45) / 2;

export default function VitrineScreen({ navigation }) {
  const route = useRoute();
  const isFocused = useIsFocused();
  const user = route.params?.user;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState([]);
  const [newComment, setNewComment] = useState('');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const animValue = useRef(new Animated.Value(-100)).current;

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -100 : 0;
    Animated.timing(animValue, {
      toValue,
      duration: 300,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  // 2. BUSCA DE POSTS NA NUVEM
  const fetchPosts = async () => {
    if (!user?.id) { setLoading(false); return; }

    try {
      // Buscamos posts, dados do autor, likes e comentários de uma vez
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users (username, nome),
          likes (userid),
          comments (id)
        `)
        .order('id', { ascending: false });

      if (error) throw error;

      // Pegamos quem o usuário atual segue para marcar o botão "Seguindo"
      const { data: followingData } = await supabase
        .from('followers')
        .select('followingid')
        .eq('followerid', user.id);

      const followingIds = followingData?.map(f => f.followingid) || [];

      // Formatamos os dados para manter a compatibilidade com sua interface
      const formattedPosts = data.map(post => ({
        ...post,
        username: post.users?.username,
        nome: post.users?.nome,
        totalLikes: post.likes?.length || 0,
        totalComments: post.comments?.length || 0,
        isLiked: post.likes?.some(l => l.userid === user.id),
        isFollowing: followingIds.includes(post.userid)
      }));

      setPosts(formattedPosts);

      // Atualiza o modal se ele estiver aberto
      if (selectedPost) {
        const updated = formattedPosts.find(p => p.id === selectedPost.id);
        if (updated) setSelectedPost(updated);
      }
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isFocused) fetchPosts(); }, [isFocused, user?.id]);

  // 3. LÓGICA DE LIKE NA NUVEM
  const handleLike = async (postId) => {
    try {
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('userid', user.id)
        .eq('postid', postId)
        .maybeSingle();

      if (existingLike) {
        await supabase.from('likes').delete().eq('id', existingLike.id);
      } else {
        await supabase.from('likes').insert([{ userid: user.id, postid: postId }]);
      }
      fetchPosts();
    } catch (error) {
      console.error('Erro no like:', error);
    }
  };

  // 4. LÓGICA DE SEGUIR NA NUVEM
  const handleFollow = async (targetId) => {
    try {
      const { data: existingFollow } = await supabase
        .from('followers')
        .select('id')
        .eq('followerid', user.id)
        .eq('followingid', targetId)
        .maybeSingle();

      if (existingFollow) {
        await supabase.from('followers').delete().eq('id', existingFollow.id);
      } else {
        await supabase.from('followers').insert([{ followerid: user.id, followingid: targetId }]);
      }
      fetchPosts();
    } catch (error) {
      console.error('Erro ao seguir:', error);
    }
  };

  // 5. BUSCAR COMENTÁRIOS
  const openComments = async (postId) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, users(username)')
      .eq('postid', postId)
      .order('id', { ascending: true });

    if (!error) {
      const formattedComments = data.map(c => ({ ...c, username: c.users?.username }));
      setCommentList(formattedComments);
      setShowComments(true);
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    const { error } = await supabase
      .from('comments')
      .insert([{ userid: user.id, postid: selectedPost.id, texto: newComment }]);

    if (!error) {
      setNewComment('');
      fetchPosts();
      setShowComments(false);
    }
  };

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color="#ed85ff" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={posts}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.scrollContent}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => setSelectedPost(item)} style={[styles.postCard, { marginTop: index % 2 === 0 ? 0 : 25 }]}>
            <Image source={{ uri: item.imageuri }} style={styles.postImage} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.postOverlay}>
              <Text style={styles.postUsername}>@{item.username}</Text>
              <View style={styles.miniStatsRow}>
                <MaterialCommunityIcons name="heart" size={12} color={item.isLiked ? "#ed85ff" : "#fff"} />
                <Text style={styles.miniStatText}>{item.totalLikes}</Text>
                <MaterialCommunityIcons name="comment" size={12} color="#fff" style={{ marginLeft: 8 }} />
                <Text style={styles.miniStatText}>{item.totalComments}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.vitrineTitle}>Vitrine</Text>
            <Text style={styles.greeting}>Olá, <Text style={styles.usernameHighlight}>@{user?.username}</Text></Text>
          </View>
        }
      />

      {/* MENU LATERAL */}
      <Animated.View style={[styles.drawerContainer, { left: animValue }]}>
        <View style={styles.drawerInner}>
          <TouchableOpacity style={styles.drawerItem}><MaterialCommunityIcons name="star-outline" size={30} color="#ffffff90" /></TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem}><MaterialCommunityIcons name="creation" size={30} color="#ffffff90" /></TouchableOpacity>
          
          {/* BOTÃO DO CLOSET AQUI */}
          <TouchableOpacity 
            style={styles.drawerItem} 
            onPress={() => { toggleMenu(); navigation.navigate('Closet', { user }); }}
          >
            <MaterialCommunityIcons name="hanger" size={30} color="#ffffff90" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => { toggleMenu(); navigation.navigate('Profile', { profileUser: user, currentUser: user }); }}
          >
            <MaterialCommunityIcons name="account-circle-outline" size={30} color="#ed85ff" />
          </TouchableOpacity>

          {/* NOVO: BOTÃO SECRETO DE ADMIN (SÓ APARECE PARA O ADMIN) */}
          {user?.role === 'admin' && (
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => { toggleMenu(); navigation.navigate('Admin'); }}
            >
              <MaterialCommunityIcons name="shield-check" size={30} color="#ed85ff" />
              <Text style={{ color: '#ed85ff', fontSize: 9, fontWeight: 'bold', textAlign: 'center' }}>ADMIN</Text>
            </TouchableOpacity>
          )}

          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.replace('Login')}>
            <MaterialCommunityIcons name="logout" size={30} color="#ffffff90" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.toggleTabSimple} onPress={toggleMenu}>
          <MaterialCommunityIcons
            name={isMenuOpen ? "chevron-left" : "chevron-right"}
            size={38}
            color="#ed85ff"
          />
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePost', { user })}>
        <MaterialCommunityIcons name="plus" size={40} color="#fff" />
      </TouchableOpacity>

      {/* MODAL DE DETALHES */}
      <Modal visible={!!selectedPost} animationType="slide" transparent>
        {selectedPost && (
          <View style={styles.modalFull}>
            <Image source={{ uri: selectedPost.imageuri }} style={styles.modalImage} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPost(null)}>
              <MaterialCommunityIcons name="chevron-down" size={40} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalBody}>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => handleLike(selectedPost.id)}>
                  <MaterialCommunityIcons name={selectedPost.isLiked ? "heart" : "heart-outline"} size={32} color={selectedPost.isLiked ? "#ed85ff" : "#fff"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openComments(selectedPost.id)}>
                  <MaterialCommunityIcons name="comment-outline" size={30} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.userRow}>
                <TouchableOpacity onPress={() => { setSelectedPost(null); navigation.navigate('Profile', { profileUser: { id: selectedPost.userid, username: selectedPost.username, nome: selectedPost.nome }, currentUser: user }); }}>
                  <Text style={styles.detailUser}>@{selectedPost.username}</Text>
                </TouchableOpacity>
                {selectedPost.userid !== user.id && (
                  <TouchableOpacity style={[styles.followBtn, selectedPost.isFollowing && { backgroundColor: '#ed85ff' }]} onPress={() => handleFollow(selectedPost.userid)}>
                    <Text style={styles.followText}>{selectedPost.isFollowing ? 'Seguindo' : 'Seguir'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.detailLegenda}>{selectedPost.legenda}</Text>
            </View>
          </View>
        )}
      </Modal>

      {/* MODAL DE COMENTÁRIOS */}
      <Modal visible={showComments} animationType="fade" transparent>
        <View style={styles.commentOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.commentContent}>
            <TouchableOpacity onPress={() => setShowComments(false)}><Text style={{ color: '#ed85ff', textAlign: 'right', fontWeight: 'bold', marginBottom: 15 }}>Fechar</Text></TouchableOpacity>
            <FlatList data={commentList} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
              <View style={styles.commentBox}><Text style={{ color: '#ed85ff', fontWeight: 'bold' }}>@{item.username}</Text><Text style={{ color: '#fff' }}>{item.texto}</Text></View>
            )} />
            <View style={styles.commentInputArea}>
              <TextInput style={styles.input} placeholder="Comentar..." placeholderTextColor="#aaa" value={newComment} onChangeText={setNewComment} />
              <TouchableOpacity onPress={postComment}><MaterialCommunityIcons name="send" size={24} color="#ed85ff" /></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#5D1D7A' },
  scrollContent: { paddingHorizontal: 15, paddingTop: 60, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: 30 },
  vitrineTitle: { fontSize: 50, fontWeight: 'bold', color: '#fff' , fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif'},
  greeting: { color: '#ed85ff', fontSize: 18 },
  usernameHighlight: { fontWeight: 'bold' },
  drawerContainer: { position: 'absolute', top: height * 0.25, height: height * 0.5, flexDirection: 'row', alignItems: 'center', zIndex: 100 },
  drawerInner: { width: 80, height: '100%', backgroundColor: '#8226A3', borderTopRightRadius: 40, borderBottomRightRadius: 40, paddingVertical: 30, alignItems: 'center', elevation: 10 },
  drawerItem: { marginVertical: 15 },
  toggleTabSimple: { height: 100, width: 60, justifyContent: 'center', alignItems: 'center', marginLeft: 20 },
  postCard: { width: COLUMN_WIDTH, height: 280, borderRadius: 20, overflow: 'hidden', backgroundColor: '#4A1461' },
  postImage: { width: '100%', height: '100%' },
  postOverlay: { position: 'absolute', bottom: 0, width: '100%', padding: 12 },
  postUsername: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  miniStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  miniStatText: { color: '#fff', fontSize: 10, marginLeft: 3 },
  fab: { position: 'absolute', bottom: 30, alignSelf: 'center', width: 70, height: 70, borderRadius: 35, backgroundColor: '#8226A3', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ed85ff', elevation: 5 },
  modalFull: { flex: 1, backgroundColor: '#1a011b' },
  modalImage: { width: '100%', height: '60%' },
  closeBtn: { position: 'absolute', top: 40, alignSelf: 'center' },
  modalBody: { padding: 25 },
  actionRow: { flexDirection: 'row', gap: 20, marginBottom: 15 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  detailUser: { color: '#ed85ff', fontSize: 22, fontWeight: 'bold' },
  followBtn: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 12, borderColor: '#ed85ff', borderWidth: 1 },
  followText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  detailLegenda: { color: '#fff', marginTop: 12, fontSize: 16 },
  commentOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  commentContent: { height: '65%', backgroundColor: '#2d1454', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  commentBox: { marginBottom: 15, backgroundColor: '#ffffff10', padding: 12, borderRadius: 12 },
  commentInputArea: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, borderTopWidth: 0.5, borderColor: '#ffffff30', paddingTop: 15 },
  input: { flex: 1, color: '#fff', backgroundColor: '#00000040', borderRadius: 20, paddingHorizontal: 20, height: 50 }
});