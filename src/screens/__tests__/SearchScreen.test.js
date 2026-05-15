import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SearchScreen from '../SearchScreen'; 
import { supabase } from '../../database/supabase'; // Importamos o Supabase para o teste!

// ── 1. MOCK DE AUTENTICAÇÃO ──
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'teste-123' } }),
}));

// ── 2. MOCK DO SUPABASE (Forma blindada contra o Hoisting do Jest) ──
jest.mock('../../database/supabase', () => ({
  supabase: {
    from: jest.fn(), // Apenas criamos a função vazia aqui
  }
}));

// ── 3. MOCK DAS BIBLIOTECAS VISUAIS ──
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('Testes da Tela: SearchScreen', () => {
  const mockNavigation = { goBack: jest.fn(), navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve realizar a busca de Raio-X e renderizar o usuário na tela', async () => {
    
    // 1. PREPARAÇÃO DA CORRENTE (Agora sim, no tempo certo!)
    const mockLimit = jest.fn().mockResolvedValue({ 
      data: [{ id: 1, username: 'nathanlira', nome: 'Nathan', avatar_url: '' }], 
      error: null 
    });
    const mockSelect = jest.fn().mockReturnValue({ limit: mockLimit });
    
    // Ensinamos o Supabase mockado a responder com a nossa correntinha
    supabase.from.mockReturnValue({ select: mockSelect });

    // 2. RENDERIZAÇÃO DA TELA
    const { getByPlaceholderText, findByText } = render(<SearchScreen navigation={mockNavigation} />);
    const searchInput = getByPlaceholderText('Buscar usuários...');

    // 3. AÇÃO (Simula o usuário digitando)
    fireEvent.changeText(searchInput, 'na');

    // 4. VERIFICAÇÃO (Teste de Integração)
    await waitFor(() => {
      // Verifica se a comunicação com o banco simulado foi exata
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    // 5. VALIDAÇÃO VISUAL (Garante que a tela não ficou vazia)
    const resultUsername = await findByText('@nathanlira');
    expect(resultUsername).toBeTruthy();
  });
});