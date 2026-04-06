import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRoute } from '@react-navigation/native';

// Banco de dados importando do Supabase para salvar os posts com as fotos e informações dos looks!
import { supabase } from '../database/supabase'; 

export default function CreatePostScreen({ navigation }) {
  const route = useRoute();
  const { user } = route.params;
  
  const [image, setImage] = useState(null);
  const [legenda, setLegenda] = useState('');
  const [marcas, setMarcas] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePublish = async () => {
    if (!image) return Alert.alert('Atenção', 'Selecione uma foto para o seu post!');
    
    setLoading(true);
    
    try {
      // ── 1. Preparar a imagem para o Upload ─────────────────────────────────
      // Pegamos a extensão da imagem (ex: jpg, png)
      const ext = image.substring(image.lastIndexOf('.') + 1);
      // Criamos um nome único para a foto usando o ID do usuário e o momento atual
      const fileName = `${user.id}_${Date.now()}.${ext}`;

      // Transformamos a imagem local em um formato que a internet entenda (Buffer)
      const response = await fetch(image);
      const arrayBuffer = await response.arrayBuffer();

      // ── 2. Enviar a foto para o Storage do Supabase ────────────────────────
      const { error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        });

      if (uploadError) {
        throw new Error('Erro ao fazer upload da imagem: ' + uploadError.message);
      }

      // ── 3. Pegar o Link Público (URL) da imagem que acabamos de subir ──────
      const { data: publicUrlData } = supabase.storage
        .from('post_images')
        .getPublicUrl(fileName);

      const publicImageUrl = publicUrlData.publicUrl;

      // ── 4. Salvar o Post na Tabela 'posts' com o link da imagem ────────────
      const { error: dbError } = await supabase
        .from('posts')
        .insert([
          { 
            userid: user.id, 
            imageuri: publicImageUrl, // <-- Agora salvamos o link da internet!
            legenda: legenda.trim(), 
            marcas: marcas.trim() 
          }
        ]);

      if (dbError) throw dbError;

      setLoading(false);
      Alert.alert('Sucesso!', 'Seu look foi postado!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      setLoading(false);
      console.log('Erro ao publicar:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao publicar. Tente novamente.');
    }
  };

  return (
    <LinearGradient colors={['#801C91', '#350238']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Look</Text>
        <TouchableOpacity onPress={handlePublish} disabled={loading}>
          {loading ? (
             <ActivityIndicator color="#ed85ff" size="small" />
          ) : (
             <Text style={styles.publishText}>Publicar</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={loading}>
          {image ? (
            <Image source={{ uri: image }} style={{ width: '100%', height: '100%', borderRadius: 15 }} />
          ) : (
            <Text style={{ color: '#fff' }}>Adicionar Foto</Text>
          )}
        </TouchableOpacity>
        
        <TextInput 
          style={styles.input} 
          placeholder="Legenda..." 
          placeholderTextColor="#aaa" 
          multiline 
          value={legenda} 
          onChangeText={setLegenda} 
          editable={!loading}
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Links/Marcas..." 
          placeholderTextColor="#aaa" 
          value={marcas} 
          onChangeText={setMarcas} 
          editable={!loading}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  publishText: { color: '#ed85ff', fontWeight: 'bold', fontSize: 16 },
  imagePicker: { width: '100%', height: 350, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 15, color: '#fff', marginBottom: 15, fontSize: 16 }
});