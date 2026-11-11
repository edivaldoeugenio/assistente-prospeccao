export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const opps = await prisma.opportunity.findMany({
    where: { userId: session.user.id },
    include: { company: { include: { doNotContact: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(opps)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { companyId, stage } = await request.json()
    const existing = await prisma.opportunity.findUnique({ where: { companyId } })
    if (existing) return NextResponse.json({ error: 'Oportunidade já existe' }, { status: 409 })
    const opp = await prisma.opportunity.create({
      data: { companyId, userId: session.user.id, stage: stage || 'novo' },
      include: { company: true },
    })
    return NextResponse.json(opp)
  } catch (error: any) {
    console.error('Create opp error:', error)
    return NextResponse.json({ error: 'Erro ao criar oportunidade' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { id, stage, notes } = await request.json()
    const opp = await prisma.opportunity.update({
      where: { id, userId: session.user.id },
      data: {
        ...(stage !== undefined ? { stage } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      include: { company: true },
    })
    return NextResponse.json(opp)
  } catch (error: any) {
    console.error('Update opp error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}
