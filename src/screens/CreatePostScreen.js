import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
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
    <View style={styles.container}>
      <SafeAreaView style={styles.responsiveContainer}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#ddb7ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Look</Text>
          <TouchableOpacity onPress={handlePublish} disabled={loading || !image} style={styles.publishBtnWrapper}>
            {loading ? (
              <View style={[styles.publishBtn, styles.publishBtnDisabled]}>
                <ActivityIndicator color="#ddb7ff" size="small" />
              </View>
            ) : (
              <LinearGradient
                colors={image ? ['#ba7ef4', '#4b0082'] : ['#2a2233', '#2a2233']}
                style={styles.publishBtn}
              >
                <Text style={[styles.publishText, !image && styles.publishTextDisabled]}>Publicar</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={loading}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImg} />
            ) : (
              <View style={styles.imagePickerEmpty}>
                <MaterialCommunityIcons name="camera-plus-outline" size={38} color="#ba7ef4" />
                <Text style={styles.imagePickerText}>Adicionar Foto</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>DETALHES DO LOOK</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Escreva uma legenda para o seu look..."
            placeholderTextColor="#978d9d"
            multiline
            value={legenda}
            onChangeText={setLegenda}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Marcas ou links das peças..."
            placeholderTextColor="#978d9d"
            value={marcas}
            onChangeText={setMarcas}
            editable={!loading}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a050f', alignItems: 'center', justifyContent: 'center' },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#131313',
    position: 'relative',
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  iconBtn: { padding: 4 },
  headerTitle: { color: '#e5e2e1', fontSize: 18, fontWeight: 'bold' },
  publishBtnWrapper: { borderRadius: 20, overflow: 'hidden' },
  publishBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, alignItems: 'center', justifyContent: 'center', minWidth: 90 },
  publishBtnDisabled: { backgroundColor: '#160d22' },
  publishText: { color: '#160d22', fontWeight: 'bold', fontSize: 14 },
  publishTextDisabled: { color: '#6b6270' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  imagePicker: { width: '100%', height: 380, backgroundColor: '#160d22', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(186,126,244,0.2)', overflow: 'hidden' },
  imagePickerEmpty: { alignItems: 'center' },
  imagePickerText: { color: '#978d9d', fontSize: 14, marginTop: 10, fontWeight: '600' },
  previewImg: { width: '100%', height: '100%' },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#978d9d', fontSize: 10, letterSpacing: 3, marginHorizontal: 15 },
  input: { backgroundColor: '#160d22', borderRadius: 12, padding: 15, color: '#e5e2e1', marginBottom: 15, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' }
});