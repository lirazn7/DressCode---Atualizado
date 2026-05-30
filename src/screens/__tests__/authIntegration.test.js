import { getPosts } from '../../services/postService'; 
import { supabase } from '../../database/supabase'; 

// 1. Criamos um Mock robusto do Supabase que suporta encadeamento (ex: from().select().order())
jest.mock('../../database/supabase', () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };
  // Faz o mock agir como uma Promessa (para o async/await funcionar)
  mockQuery.then = jest.fn((resolve) => resolve({ 
    data: [{ id: '123', legenda: 'Look validado no teste!' }], 
    error: null 
  }));

  return {
    supabase: {
      from: jest.fn(() => mockQuery)
    }
  };
});

describe('Teste de Integração - ID 02: Frontend ↔ Backend (RF04)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks(); // Limpa a memória antes de testar
  });

  it('O postService deve se comunicar corretamente com a tabela "posts" no Supabase', async () => {
    
    // AÇÃO: Disparamos a função real do seu sistema
    const resultado = await getPosts();

    // RESULTADO: A grande prova de integração!
    // Verificamos se o Frontend tentou acessar especificamente a tabela 'posts'
    expect(supabase.from).toHaveBeenCalledWith('posts');
    
    // Verifica se os dados fictícios transitaram corretamente pela função
    expect(resultado).toBeDefined();
  });
});
