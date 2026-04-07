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