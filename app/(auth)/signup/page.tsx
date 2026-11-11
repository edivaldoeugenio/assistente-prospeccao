'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, User, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data?.error || 'Erro ao criar conta'); return }
      const signInRes = await signIn('credentials', { email, password, redirect: false })
      if (signInRes?.error) { toast.error('Conta criada! Faça login.'); router.push('/login') }
      else { router.replace('/dashboard') }
    } catch { toast.error('Erro ao criar conta') } finally { setLoading(false) }
  }

  return (
    <AuthLayout title="Criar conta" description="Comece a prospectar clientes agora">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="name" placeholder="Seu nome" value={name} onChange={(e: any) => setName(e.target.value)} className="pl-10" required />
          </div>
        </div>
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
            <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e: any) => setPassword(e.target.value)} className="pl-10" required />
          </div>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          <UserPlus className="mr-2 h-4 w-4" /> Criar conta
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
