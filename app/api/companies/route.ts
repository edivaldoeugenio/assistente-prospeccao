export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const companies = await prisma.company.findMany({
    where: { userId: session.user.id },
    include: { opportunity: true, doNotContact: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(companies)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const data = await request.json()
    if (data.placeId) {
      const existing = await prisma.company.findUnique({ where: { placeId: data.placeId } })
      if (existing) return NextResponse.json({ error: 'Empresa já adicionada' }, { status: 409 })
    }
    const company = await prisma.company.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    })
    return NextResponse.json(company)
  } catch (error: any) {
    console.error('Create company error:', error)
    return NextResponse.json({ error: 'Erro ao salvar empresa' }, { status: 500 })
  }
}
