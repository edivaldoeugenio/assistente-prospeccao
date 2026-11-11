'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layouts/page-header'
import { Container } from '@/components/layouts/container'
import { FadeIn } from '@/components/ui/animate'
import { BarChart3, MessageSquare, Ban, Kanban } from 'lucide-react'

export default function RelatoriosPage() {
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
  const channels = data?.draftsPerChannel ?? []

  const totalSent = channels.reduce((s: number, c: any) => s + (c.enviados ?? 0), 0)
  const totalConversas = summary.conversas ?? 0
  const responseRate = totalSent > 0 ? ((totalConversas / totalSent) * 100) : 0

  return (
    <Container size="xl" className="py-8 px-4 lg:px-8">
      <FadeIn>
        <PageHeader title="Relatórios" description="Visão geral do desempenho das suas prospecções" />
      </FadeIn>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">{[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse h-24" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <FadeIn delay={0.1}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-display">{responseRate?.toFixed?.(0) ?? '0'}%</p>
                      <p className="text-xs text-muted-foreground">Taxa de Resposta</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <Ban className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-display">{summary.nao_contatar ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Pedidos para Parar</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.3}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Kanban className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-display">{summary.oportunidades ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Total de Oportunidades</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          {/* Funnel */}
          <FadeIn delay={0.4}>
            <Card className="mt-6">
              <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Funil de Conversão</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {funnel.map((stage: any, idx: number) => {
                    const maxCount = Math.max(...funnel.map((f: any) => f.count ?? 0), 1)
                    const pct = ((stage.count ?? 0) / maxCount) * 100
                    const colors = ['bg-blue-500', 'bg-teal-500', 'bg-amber-500', 'bg-purple-500', 'bg-green-600']
                    return (
                      <div key={stage.stage} className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-28 flex-shrink-0">{stage.stage}</span>
                        <div className="flex-1 bg-muted rounded-full h-7 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 flex items-center justify-end pr-3 ${colors[idx] ?? 'bg-primary'}`}
                            style={{ width: `${Math.max(pct, 10)}%` }}
                          >
                            <span className="text-xs font-bold text-white">{stage.count}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Channels */}
          <FadeIn delay={0.5}>
            <Card className="mt-4">
              <CardHeader><CardTitle className="text-base font-display">Mensagens por Canal</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {channels.map((ch: any) => (
                    <div key={ch.channel} className="bg-muted rounded-lg p-4 text-center">
                      <p className="font-display font-bold text-lg">{ch.total ?? 0}</p>
                      <p className="text-xs text-muted-foreground">{ch.channel}</p>
                      <p className="text-xs text-green-600 mt-1">{ch.enviados ?? 0} enviados</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </>
      )}
    </Container>
  )
}
