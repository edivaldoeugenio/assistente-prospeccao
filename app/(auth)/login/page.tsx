'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, LogIn } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.error) {
        toast.error('E-mail ou senha incorretos')
      } else {
        router.replace('/dashboard')
      }
    } catch {
      toast.error('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Bem-vindo de volta" description="Entre na sua conta para continuar">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e: any) => setEmail(e.target.value)} className="pl-10" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e: any) => setPassword(e.target.value)} className="pl-10" required />
          </div>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          <LogIn className="mr-2 h-4 w-4" /> Entrar
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link href="/signup" className="text-primary hover:underline font-medium">Criar conta</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
