import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `Você é o assistente financeiro do ClariFI, um app de finanças comportamentais brasileiro.
Responda em português do Brasil, de forma simples, direta e encorajadora.
Foque em ajudar o usuário a entender seus gastos, hábitos e metas financeiras.
Seja conciso — máximo 3 parágrafos por resposta.
Não dê conselhos de investimento específicos. Não mencione valores de outros usuários.`

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  let message = ''
  try {
    const body = (await request.json()) as { message?: string }
    message = body.message?.trim() ?? ''
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!message) {
    return NextResponse.json({ error: 'empty_message' }, { status: 400 })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message }],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'api_error' }, { status: 502 })
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    const text =
      data.content?.find((c) => c.type === 'text')?.text?.trim() ||
      'Não consegui gerar uma resposta agora. Tente reformular sua pergunta.'

    return NextResponse.json({ reply: text })
  } catch {
    return NextResponse.json({ error: 'network' }, { status: 502 })
  }
}
