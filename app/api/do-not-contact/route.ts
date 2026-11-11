export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const list = await prisma.doNotContact.findMany({
    where: { userId: session.user.id },
    include: { company: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(list)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { companyId, reason } = await request.json()
    const existing = await prisma.doNotContact.findUnique({ where: { companyId } })
    if (existing) return NextResponse.json({ error: 'Já na lista' }, { status: 409 })
    const entry = await prisma.doNotContact.create({
      data: { companyId, userId: session.user.id, reason: reason ?? 'Pediu para parar' },
      include: { company: true },
    })
    return NextResponse.json(entry)
  } catch (error: any) {
    console.error('DNC error:', error)
    return NextResponse.json({ error: 'Erro ao adicionar' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 })
    await prisma.doNotContact.delete({ where: { id, userId: session.user.id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DNC delete error:', error)
    return NextResponse.json({ error: 'Erro ao remover' }, { status: 500 })
  }
}
