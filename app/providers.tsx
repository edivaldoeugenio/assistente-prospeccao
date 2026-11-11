'use client'

import { SessionProvider } from 'next-auth/react'
import { ForceChangePassword } from '@/components/force-change-password'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ForceChangePassword>{children}</ForceChangePassword>
    </SessionProvider>
  )
}
