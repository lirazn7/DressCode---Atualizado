import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  FlatList, StatusBar, Image, Dimensions, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';

// Importações de Contexto e Banco (Supabase)
import { useAuth } from '../contexts/AuthContext';
import { getPosts, toggleLike, toggleFollow, getComments, addComment } from '../services/postService';

const { width, height } = Dimensions.get('window');

export default function VitrineScreen({ navigation }) {
  const isFocused = useIsFocused();
  const { user, signOut } = useAuth();

  // ── ESTADOS ──
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activePostId, setActivePostId] = useState(null);

  // ── BUSCA DE POSTS NA NUVEM (COM TRAVA DE SEGURANÇA) ──
  const fetchPosts = async () => {
    try {
      if (!user?.id) { 
        setLoading(false); 
        return; 
      }

      const formattedPosts = await getPosts(user.id);
      setPosts(formattedPosts || []); 
      
    } catch (error) {
      console.log("Erro ao buscar posts da Vitrine:", error);
    } finally {
      // O finally garante que o loading da tela vai sumir de qualquer jeito
      setLoading(false); 
    }
  };

  useEffect(() => { 
    if (isFocused) {
      setLoading(true); // Garante que mostre o loading ao entrar na tela
      fetchPosts(); 
    }
  }, [isFocused, user?.id]);

  // ── LÓGICA DE LIKE NA NUVEM (CORRIGIDO) ──
  const handleLike = async (postId) => {
    // Atualização otimista: Muda a cor e a contagem de likes instantaneamente
    setPosts(currentPosts => 
      currentPosts.map(p => {
        if (p.id === postId) {
          const currentCount = parseInt(p.likes_count || 0, 10);
          const newCount = p.isLiked ? currentCount - 1 : currentCount + 1;
          
          return { 
            ...p, 
            isLiked: !p.isLiked, 
            likes_count: newCount 
          };
        }
        return p;
      })
    );

    // Salva no banco de dados
    const sucesso = await toggleLike(user.id, postId);
    if (sucesso) {
      fetchPosts(); // Sincroniza
    }
  };

  // ── LÓGICA DE SEGUIR NA NUVEM ──
  const handleFollow = async (targetId) => {
    const sucesso = await toggleFollow(user.id, targetId);
    if (sucesso) fetchPosts();
  };

  // ── BUSCAR E ENVIAR COMENTÁRIOS ──
  const handleOpenComments = async (postId) => {
    setActivePostId(postId);
    const formatComments = await getComments(postId);
    setCommentList(formatComments);
    setShowComments(true);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !activePostId) return;

    const sucesso = await addComment(user.id, activePostId, newComment);
    if (sucesso) {
      setNewComment('');
      const formatComments = await getComments(activePostId);
      setCommentList(formatComments);
      fetchPosts(); 
    }
  };

  // ── RENDERIZAÇÃO DE CADA FOTO (TELA CHEIA) ──
  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <Image 
        source={{ uri: item.imageuri }} 
        style={styles.backgroundImage} 
      />
      
      <LinearGradient
        colors={['transparent', 'rgba(19, 19, 19, 0.4)', '#131313']}
        style={styles.gradientOverlay}
      />

      <View style={styles.contentOverlay}>
        {/* Textos e Username */}
        <View style={styles.textContainer}>
          <TouchableOpacity 
            style={styles.userRow}
            onPress={() => navigation.navigate('Profile', { profileUser: { id: item.userid, username: item.username, nome: item.nome }, currentUser: user })}
          >
            <Text style={styles.postUsername}>@{item.username}</Text>
            {item.userid !== user?.id && (
              <TouchableOpacity 
                style={[styles.followBtn, item.isFollowing && styles.followingBtn]} 
                onPress={() => handleFollow(item.userid)}
              >
                <Text style={styles.followText}>{item.isFollowing ? 'Seguindo' : 'Seguir'}</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <Text style={styles.postDescription} numberOfLines={3}>
            {item.legenda}
          </Text>
        </View>

        {/* Botões Flutuantes */}
        <View style={styles.interactionPanel}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleLike(item.id)}>
            <MaterialCommunityIcons 
              name={item.isLiked ? "heart" : "heart-outline"} 
              size={32} 
              color={item.isLiked ? "#ddb7ff" : "#e5e2e1"} 
            />
            <Text style={styles.iconText}>{item.likes_count || '0'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => handleOpenComments(item.id)}>
            <MaterialCommunityIcons name="chat-outline" size={30} color="#e5e2e1" />
            <Text style={styles.iconText}>{item.comments_count || '0'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <MaterialCommunityIcons name="share-outline" size={32} color="#e5e2e1" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ── LOADING ──
  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#ddb7ff" />
    </View>
  );

  // ── TELA VAZIA (Sem Posts) ──
  if (!loading && posts.length === 0) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <MaterialCommunityIcons name="camera-off" size={60} color="#978d9d" />
      <Text style={{ color: '#978d9d', marginTop: 15, fontSize: 16 }}>Nenhum post encontrado.</Text>
      
      <TouchableOpacity style={[styles.fab, { position: 'relative', bottom: 0, marginTop: 30 }]} onPress={() => navigation.navigate('CreatePost', { user })}>
        <MaterialCommunityIcons name="plus" size={32} color="#4a0080" />
      </TouchableOpacity>
      
      {/* Botão de Logout para não ficar preso */}
      <TouchableOpacity style={{ marginTop: 40 }} onPress={signOut}>
        <Text style={{ color: '#ddb7ff', textDecorationLine: 'underline' }}>Sair</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* FEED DE ROLAGEM */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        bounces={false}
      />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => navigation.navigate('Profile', { profileUser: user, currentUser: user })}
        >
          <MaterialCommunityIcons name="account-circle" size={32} color="#ddb7ff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>VITRINE</Text>
        
        <TouchableOpacity onPress={signOut}>
          <MaterialCommunityIcons name="logout" size={26} color="#978d9d" />
        </TouchableOpacity>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePost', { user })}>
        <MaterialCommunityIcons name="plus" size={32} color="#4a0080" />
      </TouchableOpacity>

      {/* BOTTOM NAV BAR */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navButtonActive}>
            <MaterialCommunityIcons name="view-grid-outline" size={24} color="#ddb7ff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Closet', { user })}>
            <MaterialCommunityIcons name="hanger" size={24} color="#978d9d" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Profile', { profileUser: user, currentUser: user })}>
            <MaterialCommunityIcons name="account-outline" size={24} color="#978d9d" />
          </TouchableOpacity>

          {user?.role === 'admin' && (
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Admin')}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#ba7ef4" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* MODAL COMENTÁRIOS */}
      <Modal visible={showComments} animationType="slide" transparent>
        <View style={styles.commentOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.commentContent}>
            
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>Comentários</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#ddb7ff" />
              </TouchableOpacity>
            </View>

            <FlatList 
              data={commentList} 
              keyExtractor={(item) => item.id.toString()} 
              renderItem={({ item }) => (
                <View style={styles.commentBox}>
                  <Text style={styles.commentUser}>@{item.username}</Text>
                  <Text style={styles.commentText}>{item.texto}</Text>
                </View>
              )} 
              contentContainerStyle={{ paddingBottom: 20 }}
            />
            
            <View style={styles.commentInputArea}>
              <TextInput 
                style={styles.input} 
                placeholder="Adicione um comentário..." 
                placeholderTextColor="#978d9d" 
                value={newComment} 
                onChangeText={setNewComment} 
              />
              <TouchableOpacity onPress={handlePostComment} style={styles.sendButton}>
                <MaterialCommunityIcons name="send" size={20} color="#4a0080" />
              </TouchableOpacity>
            </View>

          </KeyboardAvoidingView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  postContainer: {
    width: width,
    height: height,
    justifyContent: 'flex-end',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 180,
  },
  textContainer: {
    flex: 1,
    paddingRight: 20,
    marginBottom: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postUsername: {
    color: '#ddb7ff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
  followBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderColor: '#ddb7ff',
    borderWidth: 1,
  },
  followingBtn: {
    backgroundColor: 'rgba(221, 183, 255, 0.2)',
  },
  followText: {
    color: '#e5e2e1',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postDescription: {
    color: '#e5e2e1',
    fontSize: 14,
    lineHeight: 20,
  },
  interactionPanel: {
    backgroundColor: 'rgba(32, 31, 31, 0.4)',
    borderColor: 'rgba(221, 183, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  iconButton: {
    alignItems: 'center',
    marginVertical: 10,
  },
  iconText: {
    color: '#e5e2e1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    backgroundColor: 'rgba(19, 19, 19, 0.5)',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#e5e2e1',
    fontSize: 20,
    letterSpacing: 4,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ddb7ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4b0082',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    width: '85%',
    backgroundColor: 'rgba(28, 27, 27, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    padding: 10,
    borderRadius: 20,
  },
  navButtonActive: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 65, 179, 0.2)',
  },
  commentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  commentContent: {
    height: '60%',
    backgroundColor: '#1c1b1b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  commentTitle: {
    color: '#e5e2e1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentBox: {
    marginBottom: 15,
    backgroundColor: '#201f1f',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  commentUser: {
    color: '#ddb7ff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentText: {
    color: '#e5e2e1',
    lineHeight: 20,
  },
  commentInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    color: '#e5e2e1',
    backgroundColor: '#2a2a2a',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 50,
  },
  sendButton: {
    backgroundColor: '#ddb7ff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  }
});