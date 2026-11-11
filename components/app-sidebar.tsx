'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, Search, Kanban, MessageSquare, MessagesSquare,
  FileText, BarChart3, Settings, LogOut, Menu, X, Ban, Target
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/buscar', label: 'Buscar Empresas', icon: Search },
  { href: '/oportunidades', label: 'Oportunidades', icon: Kanban },
  { href: '/rascunhos', label: 'Rascunhos', icon: MessageSquare },
  { href: '/conversas', label: 'Conversas', icon: MessagesSquare },
  { href: '/propostas', label: 'Propostas', icon: FileText },
  { href: '/nao-contatar', label: 'Não Contatar', icon: Ban },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function AppSidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-card rounded-lg p-2 shadow-md"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-300 lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm truncate">Prospecção</p>
            <p className="text-xs text-muted-foreground truncate">{user?.name ?? user?.email ?? ''}</p>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                <div className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}>
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={() => signOut({ redirectTo: '/login' })}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>
    </>
  )
}
