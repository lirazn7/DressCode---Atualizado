import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  FlatList, StatusBar, Image, Dimensions, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

// Importação dos seus novos serviços integrados ao Firebase
import { getPosts, toggleLike, toggleFollow, getComments, addComment } from '../services/postService';

const { width, height } = Dimensions.get('window');

export default function VitrineScreen({ navigation }) {
  const isFocused = useIsFocused();
  const { user, signOut } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activePostId, setActivePostId] = useState(null);
  const [fullImage, setFullImage] = useState(null);

  // Busca os dados medindo o desempenho em milissegundos (RNF01)
  const fetchPosts = async () => {
    try {
      // Ajuste de segurança para o ID do Firebase Auth (uid)
      const secureUserId = user?.uid || user?.id;
      if (!secureUserId) { setLoading(false); return; }

      const tempoInicio = Date.now();
      
      const dadosDoBanco = await getPosts(secureUserId); 

      const tempoFim = Date.now();
      const tempoTotal = tempoFim - tempoInicio;

      console.log(`⏱️ Tempo de carregamento da Vitrine via Google Cloud: ${tempoTotal} ms`);

      setPosts(dadosDoBanco || []);
    } catch (error) {
      console.log("Erro ao carregar posts:", error);
      setPosts([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchPosts();
    }
  }, [isFocused, user?.uid, user?.id]);

  const handleLike = async (postId) => {
    const secureUserId = user?.uid || user?.id;
    if (!secureUserId) return;

    // Atualização otimista na interface do usuário (UX fluida)
    setPosts(currentPosts => 
      currentPosts.map(p => {
        if (p.id === postId) {
          const currentCount = parseInt(p.likes_count || 0, 10);
          const newCount = p.isLiked ? currentCount - 1 : currentCount + 1;
          return { ...p, isLiked: !p.isLiked, likes_count: newCount };
        }
        return p;
      })
    );
    await toggleLike(secureUserId, postId);
  };

  const handleFollow = async (targetId) => {
    const secureUserId = user?.uid || user?.id;
    if (!secureUserId) return;

    const sucesso = await toggleFollow(secureUserId, targetId);
    if (sucesso) fetchPosts();
  };

  const handleOpenComments = async (postId) => {
    setActivePostId(postId);
    const formatComments = await getComments(postId);
    setCommentList(formatComments);
    setShowComments(true);
  };

  const handlePostComment = async () => {
    const secureUserId = user?.uid || user?.id;
    if (!newComment.trim() || !activePostId || !secureUserId) return;

    const sucesso = await addComment(secureUserId, activePostId, newComment);
    if (sucesso) {
      setNewComment('');
      const updatedComments = await getComments(activePostId);
      setCommentList(updatedComments);
      fetchPosts();
    }
  };

  const renderPost = ({ item }) => {
    const hasImage = item.imageuri && item.imageuri.trim() !== '';

    return (
      <Pressable 
        style={styles.postContainer}
        onLongPress={() => hasImage && setFullImage(item.imageuri)}
        delayLongPress={400}
        accessible={true}
        accessibilityRole="imagebutton"
        accessibilityLabel={`Look postado por ${item.username}. Legenda: ${item.legenda}`}
      >
        {hasImage ? (
          <Image source={{ uri: item.imageuri }} style={styles.backgroundImage} fadeDuration={200} />
        ) : (
          <View style={[styles.backgroundImage, { backgroundColor: '#201f1f', justifyContent: 'center', alignItems: 'center' }]}>
            <MaterialCommunityIcons name="image-off-outline" size={40} color="#978d9d" />
            <Text style={{ color: '#978d9d', marginTop: 8 }}>Mídia Indisponível</Text>
          </View>
        )}

        <LinearGradient colors={['transparent', 'rgba(19, 19, 19, 0.4)', '#131313']} style={styles.gradientOverlay} />
        
        <View style={styles.contentOverlay}>
          <View style={styles.textContainer}>
            <View style={styles.userRow}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Profile', { profileUser: { id: item.userid, username: item.username, nome: item.nome }, currentUser: user })}
                accessibilityRole="button"
                accessibilityLabel={`Ir para o perfil de ${item.username}`}
              >
                <Text style={styles.postUsername}>@{item.username}</Text>
              </TouchableOpacity>
              {item.userid !== (user?.uid || user?.id) && (
                <TouchableOpacity 
                  style={[styles.followBtn, item.isFollowing && styles.followingBtn]} 
                  onPress={() => handleFollow(item.userid)}
                  accessibilityRole="button"
                  accessibilityLabel={item.isFollowing ? `Deixar de seguir ${item.username}` : `Seguir ${item.username}`}
                >
                  <Text style={styles.followText}>{item.isFollowing ? 'Seguindo' : 'Seguir'}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.postDescription} numberOfLines={3}>{item.legenda}</Text>
            {item.marcas ? <Text style={{ color: '#ba7ef4', fontSize: 13, marginTop: 4 }}><MaterialCommunityIcons name="tag-outline" /> {item.marcas}</Text> : null}
          </View>

          <View style={styles.interactionPanel}>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleLike(item.id)}>
              <MaterialCommunityIcons name={item.isLiked ? "heart" : "heart-outline"} size={32} color={item.isLiked ? "#ddb7ff" : "#e5e2e1"} />
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
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ddb7ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id} // Ajustado para aceitar a string ID alfanumérica do Firestore
        renderItem={renderPost}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        bounces={false}
      />

      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>VITRINE</Text>
        <TouchableOpacity onPress={signOut}>
          <MaterialCommunityIcons name="logout" size={24} color="#978d9d" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navButtonActive}>
            <MaterialCommunityIcons name="view-grid-outline" size={26} color="#ddb7ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <MaterialCommunityIcons name="magnify" size={26} color="#978d9d" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.centerAddBtn} onPress={() => navigation.navigate('CreatePost', { user })}>
            <LinearGradient colors={['#ba7ef4', '#4b0082']} style={styles.addBtnGradient}>
              <MaterialCommunityIcons name="plus" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Closet')}>
            <MaterialCommunityIcons name="hanger" size={26} color="#978d9d" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { profileUser: user, currentUser: user })}>
            <MaterialCommunityIcons name="account-outline" size={26} color="#978d9d" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={!!fullImage} animationType="fade" transparent>
        <Pressable style={styles.fullImageOverlay} onPress={() => setFullImage(null)}>
          <Image source={{ uri: fullImage }} style={styles.fullImage} resizeMode="contain" />
        </Pressable>
      </Modal>

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
              keyExtractor={(item) => item.id} 
              renderItem={({ item }) => (
                <View style={styles.commentBox}>
                  <Text style={styles.commentUser}>@{item.username}</Text>
                  <Text style={styles.commentText}>{item.texto}</Text>
                </View>
              )} 
            />
            <View style={styles.commentInputArea}>
              <TextInput style={styles.input} placeholder="Comentar..." placeholderTextColor="#978d9d" value={newComment} onChangeText={setNewComment} />
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

// ... Manter os mesmos Styles originais do seu arquivo
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  centerContainer: { flex: 1, backgroundColor: '#131313', justifyContent: 'center', alignItems: 'center' },
  postContainer: { width: width, height: height, justifyContent: 'flex-end' },
  backgroundImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'cover' },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },
  contentOverlay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 190 },
  textContainer: { flex: 1, paddingRight: 20, marginBottom: 10 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  postUsername: { color: '#ddb7ff', fontSize: 18, fontWeight: '700', marginRight: 12 },
  followBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderColor: '#ddb7ff', borderWidth: 1 },
  followingBtn: { backgroundColor: 'rgba(221, 183, 255, 0.2)' },
  followText: { color: '#e5e2e1', fontSize: 12, fontWeight: 'bold' },
  postDescription: { color: '#e5e2e1', fontSize: 14, lineHeight: 20 },
  interactionPanel: { backgroundColor: 'rgba(32, 31, 31, 0.4)', borderColor: 'rgba(221, 183, 255, 0.1)', borderWidth: 1, borderRadius: 30, paddingVertical: 15, paddingHorizontal: 5, alignItems: 'center', marginBottom: 10 },
  iconButton: { alignItems: 'center', marginVertical: 10 },
  iconText: { color: '#e5e2e1', fontSize: 12, fontWeight: '600', marginTop: 2 },
  topBar: { position: 'absolute', top: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 20, zIndex: 10, backgroundColor: 'rgba(19, 19, 19, 0.7)' },
  headerTitle: { color: '#e5e2e1', fontSize: 20, letterSpacing: 4, fontWeight: 'bold', fontStyle: 'italic' },
  bottomNavContainer: { position: 'absolute', bottom: 25, width: '100%', alignItems: 'center' },
  bottomNav: { flexDirection: 'row', width: '92%', height: 70, backgroundColor: 'rgba(22, 13, 34, 0.95)', borderRadius: 35, alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10 },
  centerAddBtn: { marginTop: -35 },
  addBtnGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#131313' },
  fullImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '95%', height: '80%' },
  commentOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  commentContent: { height: '60%', backgroundColor: '#1c1b1b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  commentTitle: { color: '#e5e2e1', fontSize: 18, fontWeight: 'bold' },
  commentBox: { marginBottom: 15, backgroundColor: '#201f1f', padding: 16, borderRadius: 12 },
  commentUser: { color: '#ddb7ff', fontWeight: 'bold', marginBottom: 4 },
  commentText: { color: '#e5e2e1', lineHeight: 20 },
  commentInputArea: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  input: { flex: 1, color: '#e5e2e1', backgroundColor: '#2a2a2a', borderRadius: 25, paddingHorizontal: 20, height: 50 },
  sendButton: { backgroundColor: '#ddb7ff', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});