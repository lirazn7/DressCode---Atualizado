// ── DOCUMENTAÇÃO DO SERVIÇO DE REGRA DE NEGÓCIO ────────────────────────────
// Este arquivo centraliza todas as chamadas de API do ecossistema DressCode,
// abstraindo a comunicação com o Cloud Firestore Database do Google Cloud.
import { db } from '../database/firebase';
import { 
  collection, getDocs, doc, getDoc, addDoc, updateDoc, 
  query, where, orderBy, deleteDoc, arrayUnion, arrayRemove, increment 
} from 'firebase/firestore';

/**
 * ⏱️ RF04 / RNF01 - Busca todos os posts do Firestore de forma cronológica
 */
export const getPosts = async (currentUserId) => {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const postsList = [];

    // Buscando a lista de quem o usuário atual segue para marcar o botão "Seguindo"
    const followRef = collection(db, 'followers');
    const followQuery = query(followRef, where('followerId', '==', currentUserId));
    const followSnapshot = await getDocs(followQuery);
    const followingIds = followSnapshot.docs.map(doc => doc.data().targetId);

    querySnapshot.forEach((documento) => {
      const dados = documento.data();
      const likedBy = dados.likedBy || [];

      postsList.push({
        id: documento.id,
        userid: dados.userid,
        username: dados.username || 'user_dresscode',
        nome: dados.nome || 'Usuário DressCode',
        imageuri: dados.imageuri,
        legenda: dados.legenda || '',
        marcas: dados.marcas || '',
        likes_count: dados.likes_count || 0,
        comments_count: dados.comments_count || 0,
        // Regras lógicas computadas dinamicamente via NoSQL
        isLiked: likedBy.includes(currentUserId),
        isFollowing: followingIds.includes(dados.userid)
      });
    });

    return postsList;
  } catch (error) {
    console.error("Erro no serviço getPosts:", error);
    return [];
  }
};

/**
 * ❤️ RF07 - Executa a inversão atômica de curtidas (Like / Unlike) no documento
 */
export const toggleLike = async (currentUserId, postId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) return false;

    const dados = postSnap.data();
    const likedBy = dados.likedBy || [];
    const jaCurtiu = likedBy.includes(currentUserId);

    // Atualização atômica usando os operadores nativos do Google Cloud
    await updateDoc(postRef, {
      likes_count: increment(jaCurtiu ? -1 : 1),
      likedBy: jaCurtiu ? arrayRemove(currentUserId) : arrayUnion(currentUserId)
    });

    return true;
  } catch (error) {
    console.error("Erro no serviço toggleLike:", error);
    return false;
  }
};

/**
 * 👥 RF07 - Gerencia o sistema de Seguir/Deixar de Seguir perfis
 */
export const toggleFollow = async (currentUserId, targetId) => {
  try {
    const followRef = collection(db, 'followers');
    const q = query(followRef, where('followerId', '==', currentUserId), where('targetId', '==', targetId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Se já seguia, deleta o registro (Unfollow)
      const docId = querySnapshot.docs[0].id;
      await deleteDoc(doc(db, 'followers', docId));
    } else {
      // Se não seguia, cria a nova relação de seguimento
      await addDoc(followRef, {
        followerId: currentUserId,
        targetId: targetId,
        createdAt: new Date().toISOString()
      });
    }
    return true;
  } catch (error) {
    console.error("Erro no serviço toggleFollow:", error);
    return false;
  }
};

/**
 * 💬 RF07 - Resgata todos os comentários pertencentes à subcoleção do Post
 */
export const getComments = async (postId) => {
  try {
    // Acessa a subcoleção interna 'comments' dentro daquele post específico
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);

    const commentsList = [];
    querySnapshot.forEach((doc) => {
      commentsList.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return commentsList;
  } catch (error) {
    console.error("Erro no serviço getComments:", error);
    return [];
  }
};

/**
 * ✍️ RF07 - Insere um novo comentário na subcoleção e incrementa o contador do post
 */
export const addComment = async (currentUserId, postId, text) => {
  try {
    // 1. Resgata o nome do usuário logado para associar ao comentário
    const userSnap = await getDoc(doc(db, 'users', currentUserId));
    const username = userSnap.exists() ? userSnap.data().username : 'user';

    // 2. Insere na subcoleção do post
    const commentsRef = collection(db, 'posts', postId, 'comments');
    await addDoc(commentsRef, {
      userid: currentUserId,
      username: username,
      texto: text.trim(),
      createdAt: new Date().toISOString()
    });

    // 3. Atualiza o contador de comentários no documento principal do Post
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments_count: increment(1)
    });

    return true;
  } catch (error) {
    console.error("Erro no serviço addComment:", error);
    return false;
  }
};