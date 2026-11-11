export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  let settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } })
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId: session.user.id, userName: session.user.name ?? '', userEmail: session.user.email ?? '' },
    })
  }
  return NextResponse.json(settings)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const data = await request.json()
    const allowed = ['dailyDraftLimit', 'messageTone', 'userName', 'userServices', 'userPhone', 'userEmail', 'googlePlacesKey', 'transparentAi']
    const updateData: any = {}
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key]
    }
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: { userId: session.user.id, ...updateData },
    })
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Settings error:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
