export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const proposals = await prisma.proposal.findMany({
    where: { userId: session.user.id },
    include: { company: true, items: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(proposals)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { companyId, title, items, notes } = await request.json()
    const proposal = await prisma.proposal.create({
      data: {
        companyId,
        userId: session.user.id,
        title: title ?? 'Proposta',
        notes: notes ?? '',
        items: {
          create: (items ?? []).map((item: any) => ({
            description: item.description,
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice ?? 0,
          })),
        },
      },
      include: { company: true, items: true },
    })
    return NextResponse.json(proposal)
  } catch (error: any) {
    console.error('Create proposal error:', error)
    return NextResponse.json({ error: 'Erro ao criar proposta' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { id, title, status, notes, items } = await request.json()
    if (items) {
      await prisma.proposalItem.deleteMany({ where: { proposalId: id } })
      await prisma.proposalItem.createMany({
        data: items.map((item: any) => ({
          proposalId: id,
          description: item.description,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? 0,
        })),
      })
    }
    const proposal = await prisma.proposal.update({
      where: { id, userId: session.user.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      include: { company: true, items: true },
    })
    return NextResponse.json(proposal)
  } catch (error: any) {
    console.error('Update proposal error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar proposta' }, { status: 500 })
  }
}
