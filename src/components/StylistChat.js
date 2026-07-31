import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { getUserClosetItems } from '../services/closetService';
import { getStylistSuggestion } from '../services/aiService';

const GREETINGS = [
  'Para onde você vai hoje?',
  'Como está pensando em se vestir?',
  'Qual é a ocasião de hoje?',
  'Conta pra mim: clima, plano e vibe do look.',
  'Precisa de ajuda para montar um look?',
  'O que você vai usar hoje?',
  'Tem algum evento especial? Posso sugerir um look!',
  'Frio, calor ou chuva? Vamos montar algo perfeito.',
];

const SESSION_GREETING_KEY = '@dresscode_stylist_greeting';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function TypingGreeting({ text }) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayed('');
    let index = 0;
    const typeInterval = setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) clearInterval(typeInterval);
    }, 45);
    return () => clearInterval(typeInterval);
  }, [text]);

  useEffect(() => {
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <Text style={styles.greetingText}>
      {displayed}
      {displayed.length < text.length || showCursor ? '|' : ''}
    </Text>
  );
}

export default function StylistChat() {
  const { user } = useAuth();
  const secureUserId = user?.uid || user?.id;

  const [visible, setVisible] = useState(false);
  const [greeting, setGreeting] = useState(GREETINGS[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [closetSummary, setClosetSummary] = useState('');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    const pickGreeting = async () => {
      const stored = await AsyncStorage.getItem(SESSION_GREETING_KEY);
      let next;
      do {
        next = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      } while (next === stored && GREETINGS.length > 1);
      await AsyncStorage.setItem(SESSION_GREETING_KEY, next);
      setGreeting(next);
    };
    pickGreeting();
  }, []);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [visible, slideAnim]);

  const openChat = async () => {
    setVisible(true);
    if (secureUserId) {
      const { summary } = await getUserClosetItems(secureUserId);
      setClosetSummary(summary);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !secureUserId) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const reply = await getStylistSuggestion(trimmed, closetSummary, history);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-ai`, role: 'assistant', content: reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'assistant',
          content: 'Desculpe, não consegui gerar uma sugestão agora. Tente novamente em instantes.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={openChat}
        activeOpacity={0.85}
        accessibilityLabel="Abrir assistente de moda"
      >
        <LinearGradient colors={['#ba7ef4', '#4b0082']} style={styles.fabGradient}>
          <MaterialCommunityIcons name="star-four-points" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={visible} animationType="none" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)} />

          <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.panelInner}
            >
              <View style={styles.panelHeader}>
                <View style={styles.headerLeft}>
                  <LinearGradient colors={['#ba7ef4', '#4b0082']} style={styles.headerIcon}>
                    <MaterialCommunityIcons name="hanger" size={20} color="#fff" />
                  </LinearGradient>
                  <View>
                    <Text style={styles.headerTitle}>DressCode AI</Text>
                    <Text style={styles.headerSub}>Sua stylist pessoal</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={24} color="#978d9d" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                style={styles.messageList}
                contentContainerStyle={styles.messageListContent}
                ListHeaderComponent={
                  <View style={styles.greetingBox}>
                    <TypingGreeting text={greeting} />
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={[
                    styles.messageBubble,
                    item.role === 'user' ? styles.userBubble : styles.aiBubble,
                  ]}>
                    <Text style={item.role === 'user' ? styles.userText : styles.aiText}>
                      {item.content}
                    </Text>
                  </View>
                )}
                ListFooterComponent={
                  loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#ba7ef4" />
                      <Text style={styles.loadingText}>Analisando seu closet...</Text>
                    </View>
                  ) : null
                }
              />

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Está frio, vou jantar ao ar livre..."
                  placeholderTextColor="#978d9d"
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={500}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                  onPress={handleSend}
                  disabled={!input.trim() || loading}
                >
                  <MaterialCommunityIcons name="send" size={20} color="#4a0080" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    zIndex: 999,
    elevation: 8,
    shadowColor: '#ba7ef4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  panel: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    height: '78%',
    backgroundColor: '#160d22',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(221,183,255,0.12)',
  },
  panelInner: { flex: 1 },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#e5e2e1', fontSize: 16, fontWeight: 'bold' },
  headerSub: { color: '#978d9d', fontSize: 12 },
  closeBtn: { padding: 4 },
  messageList: { flex: 1 },
  messageListContent: { padding: 16, paddingBottom: 8 },
  greetingBox: {
    backgroundColor: 'rgba(186,126,244,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(186,126,244,0.15)',
  },
  greetingText: { color: '#ddb7ff', fontSize: 16, lineHeight: 24, fontStyle: 'italic' },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#ba7ef4',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#131313',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  userText: { color: '#160d22', fontSize: 14, lineHeight: 20 },
  aiText: { color: '#e5e2e1', fontSize: 14, lineHeight: 21 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { color: '#978d9d', fontSize: 13 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#131313',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#e5e2e1',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ddb7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
