import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, Dimensions, 
  TouchableOpacity, ActivityIndicator, Modal, TextInput, Platform, StatusBar, SafeAreaView,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../database/supabase';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 2;

export default function ProfileScreen({ route, navigation }) {
  const { profileUser, currentUser } = route.params;
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editBioText, setEditBioText] = useState('');

  const isMyProfile = profileUser?.id === currentUser?.id;

  const fetchProfileData = async () => {
    if (!profileUser?.id) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('bio, avatar_url')
        .eq('id', profileUser.id)
        .single();
      
      if (userData) setBio(userData.bio || '');

      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('userid', profileUser.id)
        .order('id', { ascending: false });
      
      setUserPosts(posts || []);

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

  useEffect(() => { 
    fetchProfileData(); 
  }, [profileUser?.id]);

  const handleSaveBio = async () => {
    const { error } = await supabase.from('users').update({ bio: editBioText }).eq('id', profileUser.id);
    if (!error) {
      setBio(editBioText);
      setIsEditing(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerArea}>
      <View style={styles.avatarWrapper}>
        <LinearGradient colors={['#ba7ef4', '#4b0082']} style={styles.avatarGradient}>
          <View style={styles.avatarInner}>
            <Image 
              source={{ uri: profileUser?.avatar_url || 'https://via.placeholder.com/150' }} 
              style={styles.avatarImg} 
            />
          </View>
        </LinearGradient>
      </View>

      <Text style={styles.profileName}>{profileUser?.nome || 'Usuário'}</Text>
      <Text style={styles.profileHandle}>@{profileUser?.username || 'user'}</Text>
      
      <Text style={styles.bioDisplay}>
        {bio || (isMyProfile ? "Adicione uma descrição sobre seu estilo..." : "")}
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats.posts}</Text>
          <Text style={styles.statLab}>LOOKS</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats.followers}</Text>
          <Text style={styles.statLab}>SEGUIDORES</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats.following}</Text>
          <Text style={styles.statLab}>SEGUINDO</Text>
        </View>
      </View>

      {isMyProfile && (
        <TouchableOpacity style={styles.editActionBtn} onPress={() => { setEditBioText(bio); setIsEditing(true); }}>
          <MaterialCommunityIcons name="pencil-outline" size={16} color="#ddb7ff" />
          <Text style={styles.editActionText}>Editar Perfil</Text>
        </TouchableOpacity>
      )}

      <View style={styles.sectionDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>VITRINE PESSOAL</Text>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topLogo}>DressCode</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ba7ef4" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={userPosts}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnStyle}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={[styles.postCard, { marginTop: index % 2 !== 0 ? 30 : 0 }]}
              onPress={() => navigation.navigate('Vitrine', { initialPost: item })}
            >
              <Image source={{ uri: item.imageuri }} style={styles.gridImg} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.postOverlay}>
                <Text style={styles.postTag}>#Style</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
      )}

      {/* BOTTOM NAV ATUALIZADA */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => navigation.navigate('Vitrine')}>
             <MaterialCommunityIcons name="view-grid-outline" size={26} color="#ffffff60" />
          </TouchableOpacity>
          <TouchableOpacity>
             <MaterialCommunityIcons name="magnify" size={26} color="#ffffff60" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.centerAddBtn}
            onPress={() => navigation.navigate('CreatePost', { user: currentUser })}
          >
            <LinearGradient colors={['#ba7ef4', '#4b0082']} style={styles.addBtnGradient}>
              <MaterialCommunityIcons name="plus" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Closet')}>
             <MaterialCommunityIcons name="hanger" size={26} color="#ffffff60" />
          </TouchableOpacity>
          <TouchableOpacity>
             <MaterialCommunityIcons name="account" size={26} color="#ddb7ff" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={isEditing} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Editar Bio</Text>
              <View style={styles.inputBox}>
                <TextInput 
                  style={styles.textInput} 
                  multiline 
                  maxLength={150} 
                  placeholder="Sua bio..." 
                  placeholderTextColor="#978d9d"
                  value={editBioText} 
                  onChangeText={setEditBioText} 
                />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setIsEditing(false)}>
                  <Text style={styles.btnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSave} onPress={handleSaveBio}>
                  <Text style={styles.btnSaveText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, height: 60 },
  topLogo: { color: '#ddb7ff', fontSize: 20, fontStyle: 'italic' },
  headerArea: { alignItems: 'center', paddingVertical: 20 },
  avatarWrapper: { marginBottom: 15 },
  avatarGradient: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  avatarInner: { width: 114, height: 114, borderRadius: 57, borderWidth: 3, borderColor: '#131313', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  profileName: { color: '#e5e2e1', fontSize: 24, fontWeight: 'bold' },
  profileHandle: { color: '#ba7ef4', fontSize: 14, letterSpacing: 1, marginBottom: 10 },
  bioDisplay: { color: '#978d9d', textAlign: 'center', fontSize: 14, paddingHorizontal: 40, lineHeight: 20 },
  statsContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-evenly', marginVertical: 25 },
  statItem: { alignItems: 'center' },
  statNum: { color: '#e5e2e1', fontSize: 20, fontWeight: 'bold' },
  statLab: { color: '#978d9d', fontSize: 10, letterSpacing: 2, marginTop: 4 },
  editActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#160d22', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(221,183,255,0.2)' },
  editActionText: { color: '#e5e2e1', fontSize: 12, fontWeight: 'bold', marginLeft: 8 },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 20, marginVertical: 30 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#978d9d', fontSize: 10, letterSpacing: 3, marginHorizontal: 15 },
  listContent: { paddingBottom: 120 },
  columnStyle: { paddingHorizontal: 15, justifyContent: 'space-between' },
  postCard: { width: COLUMN_WIDTH, borderRadius: 15, overflow: 'hidden', backgroundColor: '#160d22' },
  gridImg: { width: '100%', height: 260, resizeMode: 'cover' },
  postOverlay: { position: 'absolute', bottom: 0, width: '100%', padding: 10 },
  postTag: { color: '#ddb7ff', fontSize: 10, fontWeight: 'bold' },
  bottomNavContainer: { position: 'absolute', bottom: 25, width: '100%', alignItems: 'center' },
  bottomNav: { flexDirection: 'row', width: '92%', height: 70, backgroundColor: 'rgba(22, 13, 34, 0.95)', borderRadius: 35, alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  centerAddBtn: { marginTop: -35 },
  addBtnGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#131313' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalWrapper: { width: '100%' },
  modalContent: { backgroundColor: '#160d22', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { color: '#e5e2e1', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  inputBox: { backgroundColor: '#131313', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  textInput: { color: '#e5e2e1', fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 25, gap: 25 },
  btnCancelText: { color: '#978d9d', fontWeight: 'bold' },
  btnSave: { backgroundColor: '#ba7ef4', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  btnSaveText: { color: '#160d22', fontWeight: 'bold' }
});