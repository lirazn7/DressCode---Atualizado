import React, { useState, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  Animated, Easing, FlatList, StatusBar 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

const menuItems = [
  { id: '1', icon: 'star-outline' },
  { id: '2', icon: 'star-four-points' },
  { id: '3', icon: 'hanger' },
  { id: '4', icon: 'account-circle-outline' },
];

// Extrai primeiro nome e último sobrenome de um nome completo
const getDisplayName = (nomeCompleto) => {
  if (!nomeCompleto) return '';
  const parts = nomeCompleto.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

const NavButton = ({ item, isMenuOpen }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: false }),
      Animated.timing(glowAnim,  { toValue: 1, duration: 200, useNativeDriver: false })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: false }),
      Animated.timing(glowAnim,  { toValue: 0, duration: 200, useNativeDriver: false })
    ]).start();
  };

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8]
  });

  return (
    <TouchableOpacity 
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[
        styles.menuIconButton,
        { 
          transform: [{ scale: scaleAnim }],
          shadowOpacity: shadowOpacity,
          shadowColor: '#ed85ff',
          shadowRadius: 10,
          elevation: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] })
        }
      ]}>
        <MaterialCommunityIcons 
          name={item.icon} 
          size={26} 
          color={isMenuOpen ? "#ffffff" : "#ed85ff"}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function VitrineScreen({ onLogout, user, onOpenAdmin }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const animValue = useRef(new Animated.Value(-65)).current;

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -70 : 0; 

    Animated.timing(animValue, {
      toValue: toValue,
      duration: 300,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
      useNativeDriver: false,
    }).start();

    setIsMenuOpen(!isMenuOpen);
  };

  const renderMenuItem = ({ item }) => (
    <NavButton item={item} />
  );

  // Monta o display do usuário: @username + Nome Sobrenome
  const displayUsername = user?.username ? `@${user.username}` : null;
  const displayName     = user?.nome ? getDisplayName(user.nome) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Título no padrão da Logo DressCode */}
      <View style={styles.header}>
        <Text style={styles.vitrineTitle}>Vitrine</Text>
        {user && (
          <View style={styles.userInfo}>
            {/* Linha 1: Olá, @username */}
            <Text style={styles.greeting}>
              Olá,{' '}
              <Text style={styles.usernameHighlight}>
                {displayUsername ?? (user.role === 'admin' ? '@admin' : 'Usuário')}
              </Text>
              {user.role === 'admin' && (
                <Text style={styles.adminBadge}> ADMIN </Text>
              )}
            </Text>
            {/* Linha 2: Nome Sobrenome */}
            {displayName && user.role !== 'admin' && (
              <Text style={styles.fullName}>{displayName}</Text>
            )}
          </View>
        )}
        {user?.role === 'admin' && (
          <TouchableOpacity style={styles.adminBtn} onPress={onOpenAdmin} activeOpacity={0.8}>
            <MaterialCommunityIcons name="shield-account-outline" size={16} color="#2d1454" />
            <Text style={styles.adminBtnText}>Painel Admin</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={{ color: '#ffffff50' }}>Conteúdo da Vitrine...</Text>
      </View>

      {/* BARRA LATERAL FINA */}
      <Animated.View style={[styles.drawerContainer, { left: animValue }]}>
        <View style={styles.drawerInner}>
          <FlatList
            data={menuItems}
            renderItem={renderMenuItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.menuList}
          />
          <TouchableOpacity style={styles.logoutIconButton} onPress={onLogout}>
            <MaterialCommunityIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* SETA DE PUXAR */}
      <Animated.View style={[styles.floatingArrowContainer, { left: Animated.add(animValue, 70) }]}>
        <TouchableOpacity style={styles.floatingArrow} onPress={toggleMenu}>
          <MaterialCommunityIcons 
            name={isMenuOpen ? "chevron-left" : "chevron-right"} 
            size={30} 
            color="#ed85ff" 
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#621763' },
  header: { alignItems: 'center', marginTop: 60 },
  vitrineTitle: { 
    fontSize: 52, 
    fontWeight: 'bold', 
    color: '#ffffff', 
    fontFamily: 'Times New Roman' 
  },
  userInfo: {
    marginTop: 6,
    alignItems: 'center',
  },
  greeting: {
    color: '#ffffff90',
    fontSize: 15,
  },
  usernameHighlight: {
    color: '#ed85ff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  fullName: {
    color: '#ffffff60',
    fontSize: 13,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  adminBadge: {
    backgroundColor: '#ed85ff',
    color: '#2d1454',
    fontWeight: 'bold',
    fontSize: 11,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ed85ff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 12,
    gap: 6,
  },
  adminBtnText: {
    color: '#2d1454',
    fontWeight: 'bold',
    fontSize: 13,
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  drawerContainer: {
    position: 'absolute',
    top: '25%', 
    width: 65,
    height: '40%', 
    zIndex: 10,
  },
  drawerInner: {
    flex: 1,
    backgroundColor: '#801C91',
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    paddingVertical: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  menuIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowOffset: { width: 0, height: 0 },
  },
  floatingArrowContainer: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    zIndex: 11,
  },
  floatingArrow: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
  },
  logoutIconButton: {
    marginTop: 8,
  },
});