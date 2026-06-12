/**
 * Assistente via API Anthropic (rota /api/assistant).
 * Sem chave configurada, retorna aviso honesto — sem respostas simuladas.
 */

export async function fetchAssistantReply(userText: string): Promise<string> {
  const raw = userText.trim()
  if (!raw) {
    return 'Escreva uma pergunta para eu poder ajudar.'
  }

  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: raw }),
    })

    if (response.status === 503) {
      return 'O assistente de IA está em configuração. Em breve disponível.'
    }

    if (!response.ok) {
      return 'Não foi possível obter uma resposta agora. Verifique sua conexão e tente de novo.'
    }

    const data = (await response.json()) as { reply?: string }
    return data.reply?.trim() || 'Resposta vazia. Tente outra pergunta.'
  } catch {
    return 'Erro de conexão ao falar com o assistente. Tente novamente em instantes.'
  }
}
