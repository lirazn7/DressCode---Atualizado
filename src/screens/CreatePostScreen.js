import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Apontamos para a rota de legado exigida pela nova SDK do Expo
import * as FileSystem from 'expo-file-system/legacy';

// ── IMPORTAÇÃO DA INFRA DO GOOGLE CLOUD ───────────────────────────
import { db } from '../database/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';

export default function CreatePostScreen({ navigation }) {
  const { user } = useAuth();

  const [image, setImage] = useState(null);
  const [legenda, setLegenda] = useState('');
  const [marcas, setMarcas] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.6, // Reduz um pouco a qualidade para otimizar o tamanho do texto no banco
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePublish = async () => {
    if (!image) return Alert.alert('Atenção', 'Selecione uma foto para o seu post!');

    // Resgata o ID único seguro do Firebase Auth
    const secureUserId = user?.uid || user?.id;
    if (!secureUserId) {
      return Alert.alert('Erro Interno', 'Não conseguimos identificar o seu usuário logado.');
    }

    setLoading(true);
    console.log('🚀 Iniciando processamento do upload do look...');

    try {
      // ── 1. TRANSFORMAÇÃO DA IMAGEM EM TEXTO (BASE64) ───────────────────────
      console.log('🔄 Convertendo arquivo físico para string Base64...');

      // Trocamos FileSystem.EncodingType.Base64 por apenas 'base64' para evitar o erro de undefined
      const base64Image = await FileSystem.readAsStringAsync(image, {
        encoding: 'base64',
      });

      // Limpeza de quebras de linha dadas pelo OS
      const cleanBase64 = base64Image.replace(/(?:\r\n|\r|\n)/g, '');

      // Montamos o cabeçalho URI com a string limpa
      const ext = image.substring(image.lastIndexOf('.') + 1);
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
      const finalImageString = `data:${mimeType};base64,${cleanBase64}`;
      // ── 2. SALVAR O DOCUMENTO REAL NO CLOUD FIRESTORE ──────────────────────
      console.log('💾 Gravando documento completo na nuvem do Firestore...');
      await addDoc(collection(db, 'posts'), {
        userid: secureUserId,
        username: user?.username || 'user_dresscode',
        imageuri: finalImageString, // O texto da imagem vai direto para o banco NoSQL!
        legenda: legenda.trim(),
        marcas: marcas.trim(),
        likes_count: 0,
        comments_count: 0,
        createdAt: new Date().toISOString()
      });

      setLoading(false);
      Alert.alert('Sucesso!', 'Seu look foi publicado de verdade pelo app!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      setLoading(false);
      console.log('❌ Erro crítico no processo de upload:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao salvar o post na nuvem.');
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