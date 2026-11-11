'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layouts/page-header'
import { Container } from '@/components/layouts/container'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { Building2, MessageSquare, Send, MessagesSquare, FileText, Ban, Kanban } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const summary = data?.summary ?? {}
  const funnel = data?.funnel ?? []

  const kpis = [
    { label: 'Empresas Encontradas', value: summary.empresas ?? 0, icon: Building2, color: 'text-blue-500', href: '/buscar' },
    { label: 'Oportunidades', value: summary.oportunidades ?? 0, icon: Kanban, color: 'text-primary', href: '/oportunidades' },
    { label: 'Rascunhos Pendentes', value: summary.rascunhos_pendentes ?? 0, icon: MessageSquare, color: 'text-amber-500', href: '/rascunhos' },
    { label: 'Mensagens Enviadas', value: summary.mensagens_enviadas ?? 0, icon: Send, color: 'text-green-500', href: '/rascunhos' },
    { label: 'Conversas', value: summary.conversas ?? 0, icon: MessagesSquare, color: 'text-purple-500', href: '/conversas' },
    { label: 'Propostas', value: summary.propostas ?? 0, icon: FileText, color: 'text-indigo-500', href: '/propostas' },
  ]

  return (
    <Container size="xl" className="py-8 px-4 lg:px-8">
      <FadeIn>
        <PageHeader
          title="Painel de Prospecção"
          description="Acompanhe suas oportunidades e mensagens em um só lugar"
        />
      </FadeIn>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-16 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <>
          <Stagger className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {kpis.map((kpi) => (
              <StaggerItem key={kpi.label}>
                <Link href={kpi.href}>
                  <Card variant="interactive" className="group">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                          <kpi.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold font-display tracking-tight">{kpi.value}</p>
                          <p className="text-xs text-muted-foreground">{kpi.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>

          {/* Funnel */}
          <FadeIn delay={0.3}>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-display">Funil de Oportunidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {funnel.map((stage: any) => {
                    const maxCount = Math.max(...funnel.map((f: any) => f.count ?? 0), 1)
                    const pct = ((stage.count ?? 0) / maxCount) * 100
                    return (
                      <div key={stage.stage} className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-28 flex-shrink-0">{stage.stage}</span>
                        <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(pct, 8)}%` }}
                          >
                            <span className="text-xs font-medium text-primary-foreground">{stage.count}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Quick actions */}
          <FadeIn delay={0.5}>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/buscar">
                <Card variant="interactive" className="text-center p-6">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-sm">Buscar Empresas</p>
                </Card>
              </Link>
              <Link href="/rascunhos">
                <Card variant="interactive" className="text-center p-6">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-sm">Gerar Rascunhos</p>
                </Card>
              </Link>
              <Link href="/oportunidades">
                <Card variant="interactive" className="text-center p-6">
                  <Kanban className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-sm">Ver Oportunidades</p>
                </Card>
              </Link>
            </div>
          </FadeIn>
        </>
      )}
    </Container>
  )
}
