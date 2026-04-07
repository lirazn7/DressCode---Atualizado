import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../database/supabase';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ route, navigation }) {
  const { profileUser, currentUser } = route.params;
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Controle de edição da Bio
  const [isEditing, setIsEditing] = useState(false);
  const [editBioText, setEditBioText] = useState('');

  const isMyProfile = profileUser.id === currentUser?.id;

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Busca a Bio do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('bio')
        .eq('id', profileUser.id)
        .single();
      
      if (userData) setBio(userData.bio || '');

      // Busca os posts do usuário
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('userid', profileUser.id)
        .order('id', { ascending: false });
      setUserPosts(posts || []);

      // Contagens
      const { count: pCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('userid', profileUser.id);
      const { count: fldCount } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('followingid', profileUser.id);
      const { count: flgCount } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('followerid', profileUser.id);

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

  useEffect(() => { fetchProfileData(); }, [profileUser.id]);

  const handleSaveBio = async () => {
    const { error } = await supabase.from('users').update({ bio: editBioText }).eq('id', profileUser.id);
    if (!error) {
      setBio(editBioText);
      setIsEditing(false);
    }
  };

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
        <Text style={styles.profileName}>{profileUser.nome}</Text>
        
        {/* BIO SECTION */}
        <Text style={styles.bioText}>{bio || (isMyProfile ? "Adicione uma descrição sobre seu estilo..." : "")}</Text>
        
        {isMyProfile && (
          <TouchableOpacity style={styles.editBtn} onPress={() => { setEditBioText(bio); setIsEditing(true); }}>
            <Text style={styles.editBtnText}>Editar Perfil</Text>
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statN}>{stats.posts}</Text><Text style={styles.statL}>Posts</Text></View>
          <View style={styles.stat}><Text style={styles.statN}>{stats.followers}</Text><Text style={styles.statL}>Seguidores</Text></View>
          <View style={styles.stat}><Text style={styles.statN}>{stats.following}</Text><Text style={styles.statL}>Seguindo</Text></View>
        </View>
      </View>

      {/* MODAL DE EDITAR BIO */}
      <Modal visible={isEditing} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar Bio</Text>
            <TextInput 
              style={styles.bioInput} 
              multiline 
              maxLength={150} 
              placeholder="Escreva sua bio..." 
              placeholderTextColor="#ffffff60"
              value={editBioText} 
              onChangeText={setEditBioText} 
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setIsEditing(false)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBio}><Text style={styles.saveText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
        <ActivityIndicator size="large" color="#ed85ff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={userPosts}
          numColumns={3}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <Image source={{ uri: item.imageuri }} style={styles.gridImg} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#5D1D7A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  info: { alignItems: 'center', padding: 20, paddingTop: 0 },
  profileName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  bioText: { color: '#ffffff90', textAlign: 'center', fontSize: 14, marginTop: 8, paddingHorizontal: 20 },
  editBtn: { marginTop: 15, paddingVertical: 6, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#ffffff40', backgroundColor: '#ffffff10' },
  editBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 30, marginTop: 20, marginBottom: 10 },
  stat: { alignItems: 'center' },
  statN: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statL: { color: '#ffffff60', fontSize: 12 },
  gridImg: { width: width / 3 - 2, height: width / 3 - 2, margin: 1 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#350238', padding: 20, borderRadius: 15 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  bioInput: { backgroundColor: '#ffffff10', color: '#fff', borderRadius: 10, padding: 15, minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 20, gap: 20 },
  cancelText: { color: '#ffffff80', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#ed85ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#1a011b', fontWeight: 'bold' }
});