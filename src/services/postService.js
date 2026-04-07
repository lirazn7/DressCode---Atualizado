import { supabase } from '../database/supabase';

// Função para buscar os posts e saber se o usuário curtiu/segue
export const getPosts = async (userId) => {
  try {
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

    const { data: followingData } = await supabase
      .from('followers')
      .select('followingid')
      .eq('followerid', userId);

    const followingIds = followingData?.map(f => f.followingid) || [];

    // Formata os dados para a tela
    return data.map(post => ({
      ...post,
      username: post.users?.username,
      nome: post.users?.nome,
      totalLikes: post.likes?.length || 0,
      totalComments: post.comments?.length || 0,
      isLiked: post.likes?.some(l => l.userid === userId),
      isFollowing: followingIds.includes(post.userid)
    }));

  } catch (error) {
    console.error('Erro no postService (getPosts):', error);
    return []; // Retorna lista vazia em caso de erro para não quebrar a tela
  }
};

// Função para dar/tirar Like
export const toggleLike = async (userId, postId) => {
  try {
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('userid', userId)
      .eq('postid', postId)
      .maybeSingle();

    if (existingLike) {
      await supabase.from('likes').delete().eq('id', existingLike.id);
    } else {
      await supabase.from('likes').insert([{ userid: userId, postid: postId }]);
    }
    return true; // Sucesso
  } catch (error) {
    console.error('Erro no postService (toggleLike):', error);
    return false; // Falha
  }
};

export const toggleFollow = async (followerId, followingId) => {
  try {
    const { data: existingFollow } = await supabase
      .from('followers')
      .select('id')
      .eq('followerid', followerId)
      .eq('followingid', followingId)
      .maybeSingle();

    if (existingFollow) {
      await supabase.from('followers').delete().eq('id', existingFollow.id);
    } else {
      await supabase.from('followers').insert([{ followerid: followerId, followingid: followingId }]);
    }
    return true;
  } catch (error) {
    console.error('Erro no postService (toggleFollow):', error);
    return false;
  }
};

// Função para buscar comentários de um post
export const getComments = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*, users(username)')
      .eq('postid', postId)
      .order('id', { ascending: true });

    if (error) throw error;

    return data.map(c => ({ ...c, username: c.users?.username }));
  } catch (error) {
    console.error('Erro no postService (getComments):', error);
    return [];
  }
};

// Função para enviar um comentário
export const addComment = async (userId, postId, texto) => {
  try {
    const { error } = await supabase
      .from('comments')
      .insert([{ userid: userId, postid: postId, texto }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro no postService (addComment):', error);
    return false;
  }
};