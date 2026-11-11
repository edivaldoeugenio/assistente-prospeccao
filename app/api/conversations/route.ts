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
  const conversations = await prisma.conversation.findMany({
    where,
    include: { company: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(conversations)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { companyId, sender, message } = await request.json()
    const conv = await prisma.conversation.create({
      data: { companyId, userId: session.user.id, sender, message },
    })
    return NextResponse.json(conv)
  } catch (error: any) {
    console.error('Create conversation error:', error)
    return NextResponse.json({ error: 'Erro ao registrar conversa' }, { status: 500 })
  }
}
