import { db } from '../database/firebase';
import {
  collection, getDocs, doc, getDoc, addDoc, updateDoc,
  query, where, orderBy, deleteDoc, arrayUnion, arrayRemove, increment,
  limit, startAfter
} from 'firebase/firestore';

const PAGE_SIZE = 10;

export const getPosts = async (currentUserId, lastDoc = null) => {
  try {
    const postsRef = collection(db, 'posts');
    const baseQuery = lastDoc
      ? query(postsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE))
      : query(postsRef, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

    const querySnapshot = await getDocs(baseQuery);

    const postsList = [];

    const followRef = collection(db, 'followers');
    const followQuery = query(followRef, where('followerId', '==', currentUserId));
    const followSnapshot = await getDocs(followQuery);
    const followingIds = followSnapshot.docs.map(doc => doc.data().targetId);

    const userIds = [...new Set(querySnapshot.docs.map(d => d.data().userid).filter(Boolean))];
    const avatarMap = {};

    await Promise.all(userIds.map(async (uid) => {
      try {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          avatarMap[uid] = userSnap.data().avatar_url || null;
        }
      } catch (_) { /* ignore */ }
    }));

    querySnapshot.forEach((documento) => {
      const dados = documento.data();
      const likedBy = dados.likedBy || [];

      postsList.push({
        id: documento.id,
        userid: dados.userid,
        username: dados.username || 'user_dresscode',
        nome: dados.nome || 'Usuário DressCode',
        avatar_url: avatarMap[dados.userid] || null,
        imageuri: dados.imageuri,
        legenda: dados.legenda || '',
        marcas: dados.marcas || '',
        likes_count: dados.likes_count || 0,
        comments_count: dados.comments_count || 0,
        isLiked: likedBy.includes(currentUserId),
        isFollowing: followingIds.includes(dados.userid)
      });
    });

    const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;
    const hasMore = querySnapshot.docs.length === PAGE_SIZE;

    return { posts: postsList, lastDoc: newLastDoc, hasMore };
  } catch (error) {
    console.log("Erro no serviço getPosts:", error);
    return { posts: [], lastDoc: null, hasMore: false };
  }
};

export const toggleLike = async (currentUserId, postId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) return false;

    const dados = postSnap.data();
    const likedBy = dados.likedBy || [];
    const jaCurtiu = likedBy.includes(currentUserId);

    await updateDoc(postRef, {
      likes_count: increment(jaCurtiu ? -1 : 1),
      likedBy: jaCurtiu ? arrayRemove(currentUserId) : arrayUnion(currentUserId)
    });

    return true;
  } catch (error) {
    console.log("Erro no serviço toggleLike:", error);
    return false;
  }
};

export const toggleFollow = async (currentUserId, targetId) => {
  try {
    const followRef = collection(db, 'followers');
    const q = query(followRef, where('followerId', '==', currentUserId), where('targetId', '==', targetId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id;
      await deleteDoc(doc(db, 'followers', docId));
    } else {
      await addDoc(followRef, {
        followerId: currentUserId,
        targetId: targetId,
        createdAt: new Date().toISOString()
      });
    }
    return true;
  } catch (error) {
    console.log("Erro no serviço toggleFollow:", error);
    return false;
  }
};

export const getComments = async (postId) => {
  try {
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
    console.log("Erro no serviço getComments:", error);
    return [];
  }
};

export const addComment = async (currentUserId, postId, text) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', currentUserId));
    const username = userSnap.exists() ? userSnap.data().username : 'user';

    const commentsRef = collection(db, 'posts', postId, 'comments');
    await addDoc(commentsRef, {
      userid: currentUserId,
      username: username,
      texto: text.trim(),
      createdAt: new Date().toISOString()
    });

    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments_count: increment(1)
    });

    return true;
  } catch (error) {
    console.log("Erro no serviço addComment:", error);
    return false;
  }
};