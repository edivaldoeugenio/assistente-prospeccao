export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// Search is now handled client-side (Nominatim from the user's browser).
// This route exists only for backwards compatibility.
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.json({ results: [], demo: false, message: 'A busca é feita diretamente no seu navegador.' })
}
