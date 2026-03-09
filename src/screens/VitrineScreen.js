import React, { useState, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  Animated, Easing, FlatList, StatusBar 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

const menuItems = [
  { id: '1', icon: 'star-outline' },
  { id: '2', icon: 'star-four-points' },
  { id: '3', icon: 'hanger' }, // Ícone que lembra a logo DressCode
  { id: '4', icon: 'account-circle-outline' },
];

const NavButton = ({ item, isMenuOpen }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: false }), // Aumenta o tamanho
      Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: false }) // Liga o brilho
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: false }), // Volta ao normal
      Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: false }) // Desliga o brilho
    ]).start();
  };

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8] // Sombra aparece suavemente
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
          shadowColor: '#ed85ff', // Cor da sombra roxa clarinha
          shadowRadius: 10,
          elevation: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] })
        }
      ]}>
        <MaterialCommunityIcons 
          name={item.icon} 
          size={26} 
          color={isMenuOpen ? "#ffffff" : "#ed85ff"} // O símbolo brilha com a cor clara
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function VitrineScreen({ onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // A barra agora é fina (70px), então ela só precisa sumir -70px para fechar
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Título no padrão da Logo DressCode */}
      <View style={styles.header}>
        <Text style={styles.vitrineTitle}>Vitrine</Text>
      </View>

      <View style={styles.content}>
        <Text style={{ color: '#ffffff50' }}>Conteúdo da Vitrine...</Text>
      </View>

      {/* BARRA LATERAL FINA (CONFORME O DESENHO) */}
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

      {/* SETA DE PUXAR (CONFORME O DESENHO) */}
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
  container: { flex: 1, backgroundColor: '#621763' }, // Roxo sólido DressCode
  header: { alignItems: 'center', marginTop: 60 },
  vitrineTitle: { 
    fontSize: 52, 
    fontWeight: 'bold', 
    color: '#ffffff', 
    fontFamily: 'Times New Roman' 
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Estilo da barra conforme o desenho no papel
  drawerContainer: {
    position: 'absolute',
    top: '25%', 
    width: 65, // Barra fina apenas para ícones
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fundo tipo "vidro" sutil
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    // Configuração base da sombra (iOS)
    shadowOffset: { width: 0, height: 0 },
  },

  // Seta posicionada exatamente na borda da barra
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
    marginLeft: -10, // Faz a seta "brotar" da lateral
  },
});