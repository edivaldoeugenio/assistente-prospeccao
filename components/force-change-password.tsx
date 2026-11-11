'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function ForceChangePassword({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession() || {}
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if ((session as any)?.mustChangePassword && pathname !== '/alterar-senha') {
      router.replace('/alterar-senha')
    }
  }, [session, pathname, router])

  return <>{children}</>
}
