import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import db from '../database/DatabaseInit';

export default function SetUsernameScreen({ navigation }) {
  const route = useRoute();
  const { user } = route.params;
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (username.length < 3) {
      Alert.alert('Erro', 'Username muito curto.');
      return;
    }

    setLoading(true);
    try {
      const finalUsername = username.trim().toLowerCase();
      db.runSync('UPDATE users SET username = ? WHERE id = ?;', [finalUsername, user.id]);
      
      const updatedUser = { ...user, username: finalUsername };
      await AsyncStorage.setItem('@dresscode_session', JSON.stringify(updatedUser));
      
      setLoading(false);
      navigation.replace('Vitrine', { user: updatedUser });
    } catch (error) {
      setLoading(false);
      Alert.alert('Erro', 'Este username já existe.');
    }
  };

  return (
    <LinearGradient colors={['#801C91', '#350238']} style={styles.container}>
      <View style={styles.inner}>
        <Image source={require('../../logo-def-dresscode.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Escolha seu @username</Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="at" size={24} color="#ffffff80" />
          <TextInput
            style={styles.input}
            placeholder="seu.username"
            placeholderTextColor="#ffffff80"
            value={username}
            onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9._]/g, ''))}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>SALVAR E ENTRAR</Text>}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  logo: { width: 120, height: 120, marginBottom: 20 },
  title: { fontSize: 22, color: '#fff', fontWeight: 'bold', marginBottom: 20 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', height: 60, borderRadius: 30, paddingHorizontal: 20, width: '100%', marginBottom: 20 },
  input: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16 },
  button: { backgroundColor: '#2d1454', height: 60, borderRadius: 30, width: '100%', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});