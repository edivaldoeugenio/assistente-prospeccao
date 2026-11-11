export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  const where: any = { userId: session.user.id }
  if (companyId) where.companyId = companyId
  const drafts = await prisma.messageDraft.findMany({
    where,
    include: { company: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(drafts)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { companyId, channel, subject, body } = await request.json()
    const draft = await prisma.messageDraft.create({
      data: { companyId, userId: session.user.id, channel, subject: subject ?? '', body },
      include: { company: true },
    })
    return NextResponse.json(draft)
  } catch (error: any) {
    console.error('Create draft error:', error)
    return NextResponse.json({ error: 'Erro ao criar rascunho' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { id, body, subject, sentAt, approved } = await request.json()
    const draft = await prisma.messageDraft.update({
      where: { id, userId: session.user.id },
      data: {
        ...(body !== undefined ? { body } : {}),
        ...(subject !== undefined ? { subject } : {}),
        ...(sentAt !== undefined ? { sentAt: new Date(sentAt) } : {}),
        ...(approved !== undefined ? { approved } : {}),
      },
      include: { company: true },
    })
    return NextResponse.json(draft)
  } catch (error: any) {
    console.error('Update draft error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar rascunho' }, { status: 500 })
  }
}
