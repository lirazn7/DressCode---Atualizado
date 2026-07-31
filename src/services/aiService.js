import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};
const OPENROUTER_API_KEY = extra.openRouterApiKey;

const SYSTEM_PROMPT = `Você é a assistente de moda pessoal do app DressCode. 
Analise o closet do usuário e a situação descrita para sugerir looks completos.
Responda em português brasileiro, de forma acolhedora e prática.
Inclua: peças específicas do closet, calçado, acessórios e dicas extras (casaco, guarda-chuva, etc.) quando relevante.
Se o closet estiver vazio ou insuficiente, sugira combinações com o que existe e indique o que falta.
Use formatação clara com tópicos quando necessário.`;

export async function getStylistSuggestion(userMessage, closetSummary, conversationHistory = []) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('Chave da API OpenRouter não configurada.');
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `CLOSET DO USUÁRIO:\n${closetSummary || 'Closet vazio.'}\n\nMENSAGEM DO USUÁRIO:\n${userMessage}`,
    },
  ];

  conversationHistory.slice(-6).forEach((msg) => {
    messages.push({ role: msg.role, content: msg.content });
  });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://dresscode.app',
      'X-Title': 'DressCode Stylist',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('OpenRouter error:', errText);
    throw new Error('Falha ao obter sugestão da IA.');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Não consegui gerar uma sugestão. Tente reformular sua pergunta.';
}
