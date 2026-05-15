import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import VitrineScreen from '../VitrineScreen'; // Ajuste as '../' dependendo de onde colocou a pasta
import { getPosts } from '../../services/postService';

// ── 1. MOCK DE NAVEGAÇÃO ──
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true, // Finge que a tela está focada/aberta
}));

// ── 2. MOCK DE AUTENTICAÇÃO ──
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'teste-123', nome: 'Usuário Teste' },
    signOut: jest.fn(),
  }),
}));

// ── 3. MOCK DOS SERVIÇOS (SUPABASE) ──
jest.mock('../../services/postService', () => ({
  getPosts: jest.fn(),
  toggleLike: jest.fn(),
  toggleFollow: jest.fn(),
  getComments: jest.fn(),
  addComment: jest.fn(),
}));

// ── 4. MOCK DE BIBLIOTECAS VISUAIS DO EXPO ──
// O Jest roda no Node (que não tem tela). Se não simularmos isso, ele quebra.
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('Testes da Tela: VitrineScreen', () => {
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks(); // Limpa a memória antes de cada teste
  });

  it('deve sair do loading e exibir o título VITRINE', async () => {
    // PREPARAÇÃO: Simula o backend retornando uma lista vazia de looks rapidamente
    getPosts.mockResolvedValue([]);

    // AÇÃO: Renderiza a tela
    const { findByText } = render(<VitrineScreen navigation={mockNavigation} />);

    // RESULTADO: 
    // Como a tela começa em Loading, usamos "findByText" que é assíncrono.
    // Ele "espera" até o ActivityIndicator sumir e a palavra VITRINE aparecer.
    const headerTitle = await findByText(/VITRINE/i);
    
    // Confere se o texto existe e se a função de buscar posts foi chamada 1 vez
    expect(headerTitle).toBeTruthy();
    expect(getPosts).toHaveBeenCalledTimes(1);
  });
});