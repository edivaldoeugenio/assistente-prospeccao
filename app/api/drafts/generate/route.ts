export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Não autorizado', { status: 401 })

  try {
    const { companyId, channel } = await request.json()

    const blocked = await prisma.doNotContact.findUnique({ where: { companyId } })
    if (blocked) return new Response(JSON.stringify({ error: 'Empresa na lista de não contatar' }), { status: 403, headers: { 'Content-Type': 'application/json' } })

    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) return new Response(JSON.stringify({ error: 'Empresa não encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json' } })

    const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const draftsToday = await prisma.messageDraft.count({
      where: { userId: session.user.id, createdAt: { gte: todayStart } },
    })
    const limit = settings?.dailyDraftLimit ?? 10
    if (draftsToday >= limit) {
      return new Response(JSON.stringify({ error: `Limite diário de ${limit} rascunhos atingido` }), { status: 429, headers: { 'Content-Type': 'application/json' } })
    }

    const userName = settings?.userName || 'Edivaldo'
    const services = settings?.userServices || 'criação de sites profissionais'
    const tone = settings?.messageTone || 'amigavel'
    const transparent = settings?.transparentAi !== false

    const toneDesc: Record<string, string> = {
      amigavel: 'amigável, próximo, sem ser forçado',
      profissional: 'profissional e direto, mas educado',
      casual: 'casual e descontraído, como uma conversa entre amigos',
    }

    const signals: string[] = []
    if (!company.hasWebsite && !company.hasSocialOnly) signals.push('Não possui site nem rede social')
    else if (!company.hasWebsite && company.hasSocialOnly) signals.push('Presente apenas em redes sociais, sem site próprio')
    else if (company.oldWebsite) signals.push('Site desatualizado ou com visual antigo')

    const channelInstructions = channel === 'whatsapp'
      ? 'Escreva uma mensagem curta para WhatsApp (máximo 3 parágrafos curtos). Sem saudação formal. Comece direto com uma observação positiva sobre o negócio. Use linguagem conversacional natural.'
      : 'Escreva um e-mail curto e profissional. Inclua um assunto claro na primeira linha no formato "Assunto: ...". Depois pule uma linha e escreva o corpo. Máximo 4 parágrafos curtos.'

    const prompt = `Você é ${userName}, um profissional que oferece ${services}.
Você encontrou a empresa "${company.name}" (${company.segment ?? 'negócio local'}) em ${company.city ?? 'cidade não informada'}.
${signals.length > 0 ? `Observações: ${signals.join('. ')}.` : ''}
${company.rating ? `Avaliação no Google: ${company.rating} estrelas (${company.totalRatings ?? 0} avaliações).` : ''}

${channelInstructions}

Regras obrigatórias:
- Tom: ${toneDesc[tone] ?? toneDesc.amigavel}
- NÃO use frases genéricas de venda como "impulsione seu negócio" ou "leve sua empresa ao próximo nível"
- NÃO minta sobre ter visitado o local ou ser cliente
- Seja específico sobre o que notou no negócio deles
- Sugira algo concreto que um site poderia resolver (ex: cardápio online, agendamento, portfólio)
- Máximo 150 palavras
- Assine como ${userName}
${transparent ? '- Se em algum momento perguntarem se a mensagem é gerada por IA, responda com transparência que você usa ferramentas de IA para organizar seu trabalho' : ''}
- Escreva APENAS a mensagem, sem explicações extras`

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
        max_tokens: 500,
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
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'streaming', content })}\n\n`))
                  }
                } catch {}
              }
            }
          }
          if (buffer) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: buffer })}\n\n`))
          }
        } catch (error: any) {
          console.error('Stream error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', message: error?.message || 'Erro na geração' })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Generate draft error:', error)
    return new Response(JSON.stringify({ error: 'Erro ao gerar rascunho' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
