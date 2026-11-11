export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Não autorizado', { status: 401 })

  try {
    const { companyId } = await request.json()
    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) return new Response(JSON.stringify({ error: 'Empresa não encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json' } })

    const messages = await prisma.conversation.findMany({
      where: { companyId, userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })
    const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } })
    const userName = settings?.userName || 'Edivaldo'

    const history = messages.map((m: any) => `${m.sender === 'eu' ? userName : company.name}: ${m.message}`).join('\n')

    const prompt = `Você é ${userName}. Está em uma conversa com a empresa "${company.name}" (${company.segment ?? 'negócio local'}).

Histórico da conversa:
${history}

Escreva a próxima resposta do ${userName}. Seja natural, breve e útil. Máximo 100 palavras. Não use frases genéricas de venda. Escreva APENAS a mensagem.`

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()
        let buffer = ''
        let partialRead = ''
        try {
          while (true) {
            const { done, value } = await (reader as any).read()
            if (done) break
            partialRead += decoder.decode(value, { stream: true })
            const lines = partialRead.split('\n')
            partialRead = lines.pop() ?? ''
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const d = line.slice(6)
                if (d === '[DONE]') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: buffer })}\n\n`))
                  return
                }
                try {
                  const parsed = JSON.parse(d)
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  buffer += content
                  if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'streaming', content })}\n\n`))
                } catch {}
              }
            }
          }
          if (buffer) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: buffer })}\n\n`))
        } catch (error: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', message: error?.message || 'Erro' })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    })
  } catch (error: any) {
    console.error('Suggest error:', error)
    return new Response(JSON.stringify({ error: 'Erro ao sugerir resposta' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
