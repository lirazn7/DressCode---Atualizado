import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  FlatList, StatusBar, Image, Dimensions, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';

// Importação dos serviços integrados ao Firebase
import { getPosts, toggleLike, toggleFollow, getComments, addComment } from '../services/postService';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

export default function VitrineScreen({ navigation }) {
  const isFocused = useIsFocused();
  const { user, signOut, refreshUser } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activePostId, setActivePostId] = useState(null);
  const [fullImage, setFullImage] = useState(null);

  // Busca a primeira página do feed (RNF01)
  const fetchPosts = async () => {
    try {
      const secureUserId = user?.uid || user?.id;
      if (!secureUserId) { setLoading(false); return; }

      const tempoInicio = Date.now();

      const { posts: dadosDoBanco, lastDoc: novoLastDoc, hasMore: maisPosts } = await getPosts(secureUserId);

      const tempoFim = Date.now();
      const tempoTotal = tempoFim - tempoInicio;

      console.log(`⏱️ Tempo de carregamento da Vitrine via Google Cloud: ${tempoTotal} ms`);

      setPosts(dadosDoBanco || []);
      setLastDoc(novoLastDoc);
      setHasMore(maisPosts);
    } catch (error) {
      console.log("Erro ao carregar posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Busca a próxima página ao chegar no fim do feed
  const fetchMorePosts = async () => {
    const secureUserId = user?.uid || user?.id;
    if (!secureUserId || loadingMore || !hasMore || !lastDoc) return;

    setLoadingMore(true);
    try {
      const { posts: novosPosts, lastDoc: novoLastDoc, hasMore: maisPosts } = await getPosts(secureUserId, lastDoc);
      setPosts(currentPosts => [...currentPosts, ...(novosPosts || [])]);
      setLastDoc(novoLastDoc);
      setHasMore(maisPosts);
    } catch (error) {
      console.log("Erro ao carregar mais posts:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchPosts();
      refreshUser?.();
    }
  }, [isFocused, user?.uid, user?.id]);

  const handleLike = async (postId) => {
    const secureUserId = user?.uid || user?.id;
    if (!secureUserId) return;

    // Atualização otimista na interface (UX instantânea)
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

  // ── CARTÃO "VITRINE": visual de vitrine/lookbook de boutique,
  // ao invés do formato de story fullscreen comum em redes sociais.
  const renderPost = ({ item }) => {
    const hasImage = item.imageuri && item.imageuri.trim() !== '';
    const isOwnPost = item.userid === (user?.uid || user?.id);

    return (
      <View style={styles.lookCard}>
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={[styles.cardHeaderUser, styles.clickable]}
            onPress={() => navigation.navigate('Profile', { profileUser: { id: item.userid, username: item.username, nome: item.nome, avatar_url: item.avatar_url }, currentUser: user })}
            accessibilityRole="button"
            accessibilityLabel={`Ir para o perfil de ${item.username}`}
          >
            <View style={styles.avatarRing}>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
              ) : (
                <MaterialCommunityIcons name="account" size={18} color="#ba7ef4" />
              )}
            </View>
            <Text style={styles.postUsername}>@{item.username}</Text>
          </TouchableOpacity>

          {!isOwnPost && (
            <TouchableOpacity
              style={[styles.followBtn, item.isFollowing && styles.followingBtn, styles.clickable]}
              onPress={() => handleFollow(item.userid)}
              accessibilityRole="button"
              accessibilityLabel={item.isFollowing ? `Deixar de seguir ${item.username}` : `Seguir ${item.username}`}
            >
              <Text style={styles.followText}>{item.isFollowing ? 'Seguindo' : 'Seguir'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Pressable
          onLongPress={() => hasImage && setFullImage(item.imageuri)}
          delayLongPress={400}
          accessible={true}
          accessibilityRole="imagebutton"
          accessibilityLabel={`Look postado por ${item.username}. Legenda: ${item.legenda}`}
        >
          {hasImage ? (
            <Image source={{ uri: item.imageuri }} style={styles.lookImage} fadeDuration={200} />
          ) : (
            <View style={[styles.lookImage, styles.lookImageEmpty]}>
              <MaterialCommunityIcons name="image-off-outline" size={36} color="#978d9d" />
              <Text style={styles.lookImageEmptyText}>Mídia Indisponível</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.cardFooter}>
          <View style={styles.interactionRow}>
            <TouchableOpacity style={[styles.interactionBtn, styles.clickable]} onPress={() => handleLike(item.id)}>
              <MaterialCommunityIcons name={item.isLiked ? "heart" : "heart-outline"} size={24} color={item.isLiked ? "#ddb7ff" : "#e5e2e1"} />
              <Text style={styles.interactionCount}>{item.likes_count || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.interactionBtn, styles.clickable]} onPress={() => handleOpenComments(item.id)}>
              <MaterialCommunityIcons name="chat-outline" size={22} color="#e5e2e1" />
              <Text style={styles.interactionCount}>{item.comments_count || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.interactionBtn, styles.clickable]}>
              <MaterialCommunityIcons name="share-outline" size={22} color="#e5e2e1" />
            </TouchableOpacity>
          </View>

          {item.legenda ? <Text style={styles.postDescription} numberOfLines={4}>{item.legenda}</Text> : null}

          {item.marcas ? (
            <View style={styles.tagChip}>
              <MaterialCommunityIcons name="tag-outline" size={13} color="#ba7ef4" />
              <Text style={styles.tagChipText}>{item.marcas}</Text>
            </View>
          ) : null}
        </View>
      </View>
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
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* CONTAINER RESPONSIVO (Centralizado no PC, Fullscreen no Mobile) */}
      <View style={styles.responsiveContainer}>

        {/* HEADER / TOPBAR */}
        <View style={styles.topBar}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>VITRINE</Text>
          <TouchableOpacity onPress={signOut} style={styles.clickable}>
            <MaterialCommunityIcons name="logout" size={24} color="#978d9d" />
          </TouchableOpacity>
        </View>

        {/* FEED DE POSTS — lista vertical de cartões, não paginação em tela cheia */}
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={styles.listContent}
          onEndReached={fetchMorePosts}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyFeed}>
              <MaterialCommunityIcons name="hanger" size={44} color="#443a52" />
              <Text style={styles.emptyFeedText}>Nenhum look na sua vitrine ainda.{'\n'}Siga pessoas ou publique o primeiro!</Text>
            </View>
          }
          ListFooterComponent={loadingMore ? (
            <ActivityIndicator size="small" color="#ddb7ff" style={{ marginVertical: 20 }} />
          ) : null}
        />

        {/* NAVEGAÇÃO INFERIOR (TAB BAR) */}
        <View style={styles.bottomNavContainer}>
          <View style={styles.bottomNav}>
            <TouchableOpacity style={[styles.navButtonActive, styles.clickable]}>
              <MaterialCommunityIcons name="view-grid-outline" size={26} color="#ddb7ff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.clickable}>
              <MaterialCommunityIcons name="magnify" size={26} color="#978d9d" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.centerAddBtn, styles.clickable]} onPress={() => navigation.navigate('CreatePost', { user })}>
              <LinearGradient colors={['#ba7ef4', '#4b0082']} style={styles.addBtnGradient}>
                <MaterialCommunityIcons name="plus" size={32} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Closet')} style={styles.clickable}>
              <MaterialCommunityIcons name="hanger" size={26} color="#978d9d" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { profileUser: user, currentUser: user })} style={styles.clickable}>
              {user?.avatar_url ? (
                <View style={styles.navAvatarRing}>
                  <Image source={{ uri: user.avatar_url }} style={styles.navAvatarImg} />
                </View>
              ) : (
                <MaterialCommunityIcons name="account-outline" size={26} color="#978d9d" />
              )}
            </TouchableOpacity>
          </View>
        </View>

      </View>

      {/* MODAL DE IMAGEM CHEIA */}
      <Modal visible={!!fullImage} animationType="fade" transparent>
        <Pressable style={styles.fullImageOverlay} onPress={() => setFullImage(null)}>
          <Image source={{ uri: fullImage }} style={styles.fullImage} resizeMode="contain" />
        </Pressable>
      </Modal>

      {/* MODAL DE COMENTÁRIOS */}
      <Modal visible={showComments} animationType="slide" transparent>
        <View style={styles.commentOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>Comentários</Text>
              <TouchableOpacity onPress={() => setShowComments(false)} style={styles.clickable}>
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
              <TouchableOpacity onPress={handlePostComment} style={[styles.sendButton, styles.clickable]}>
                <MaterialCommunityIcons name="send" size={20} color="#4a0080" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </View>
  );
}

// ── ESTILOS ADAPTADOS PARA PC E MOBILE ───────────────────────────────────────
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#0a050f', alignItems: 'center', justifyContent: 'center' },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480, // Largura máxima perfeita estilo Instagram Web / Feed Mobile
    backgroundColor: '#131313',
    position: 'relative',
    overflow: 'hidden',
  },
  centerContainer: { flex: 1, backgroundColor: '#131313', justifyContent: 'center', alignItems: 'center' },

  // Design de Cartões Lookbook Premium
  lookCard: {
    backgroundColor: '#160d22',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.08)',
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#ba7ef4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#131313',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  navAvatarRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#ba7ef4',
    overflow: 'hidden',
    backgroundColor: '#131313',
  },
  navAvatarImg: {
    width: '100%',
    height: '100%',
  },
  postUsername: {
    color: '#e5e2e1',
    fontSize: 14,
    fontWeight: '700',
  },
  followBtn: {
    backgroundColor: '#ba7ef4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.3)',
  },
  followText: {
    color: '#131313',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lookImage: {
    width: '92%',
    height: 420,
    borderRadius: 18,
    alignSelf: 'center',
    backgroundColor: '#201f1f',
  },
  lookImageEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookImageEmptyText: {
    color: '#978d9d',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  cardFooter: {
    padding: 16,
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  interactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  interactionCount: {
    color: '#e5e2e1',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  postDescription: {
    color: '#978d9d',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(186, 126, 244, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(186, 126, 244, 0.15)',
  },
  tagChipText: {
    color: '#ddb7ff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
  listContent: {
    paddingTop: 95,
    paddingBottom: 110,
    paddingHorizontal: 16,
  },
  emptyFeed: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyFeedText: {
    color: '#978d9d',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 15,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
    paddingBottom: 15,
    zIndex: 10,
    backgroundColor: 'rgba(19, 19, 19, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    color: '#e5e2e1',
    fontSize: 20,
    letterSpacing: 4,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    width: '92%',
    height: 65,
    backgroundColor: 'rgba(22, 13, 34, 0.95)',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
  },
  centerAddBtn: {
    marginTop: -30,
  },
  addBtnGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#131313',
  },
  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '95%',
    height: '80%',
  },
  commentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  commentContent: {
    width: '100%',
    maxWidth: 480,
    height: '60%',
    backgroundColor: '#1c1b1b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
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
  },
  input: {
    flex: 1,
    color: '#e5e2e1',
    backgroundColor: '#2a2a2a',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 46,
    outlineStyle: 'none',
  },
  sendButton: {
    backgroundColor: '#ddb7ff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  clickable: {
    cursor: 'pointer',
  },
});