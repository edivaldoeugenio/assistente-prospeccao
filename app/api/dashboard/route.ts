export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const uid = session.user.id

  const [companies, opportunities, drafts, conversations, doNotContact, proposals] = await Promise.all([
    prisma.company.count({ where: { userId: uid } }),
    prisma.opportunity.findMany({ where: { userId: uid }, select: { stage: true } }),
    prisma.messageDraft.findMany({ where: { userId: uid }, select: { sentAt: true, channel: true, createdAt: true } }),
    prisma.conversation.count({ where: { userId: uid } }),
    prisma.doNotContact.count({ where: { userId: uid } }),
    prisma.proposal.count({ where: { userId: uid } }),
  ])

  const stages = ['novo', 'aprovado', 'em_conversa', 'orcamento', 'fechado']
  const stageLabels: Record<string, string> = { novo: 'Novo', aprovado: 'Aprovado', em_conversa: 'Em conversa', orcamento: 'Orçamento', fechado: 'Fechado' }
  const stageCounts = stages.map(s => ({
    stage: stageLabels[s] ?? s,
    count: opportunities.filter((o: any) => o.stage === s).length,
  }))

  const pendingDrafts = drafts.filter((d: any) => !d.sentAt).length
  const sentDrafts = drafts.filter((d: any) => d.sentAt).length

  const summary = {
    empresas: companies,
    oportunidades: opportunities.length,
    rascunhos_pendentes: pendingDrafts,
    mensagens_enviadas: sentDrafts,
    conversas: conversations,
    nao_contatar: doNotContact,
    propostas: proposals,
  }

  return NextResponse.json({
    summary,
    funnel: stageCounts,
    draftsPerChannel: [
      { channel: 'WhatsApp', total: drafts.filter((d: any) => d.channel === 'whatsapp').length, enviados: drafts.filter((d: any) => d.channel === 'whatsapp' && d.sentAt).length },
      { channel: 'E-mail', total: drafts.filter((d: any) => d.channel === 'email').length, enviados: drafts.filter((d: any) => d.channel === 'email' && d.sentAt).length },
    ],
  })
}
