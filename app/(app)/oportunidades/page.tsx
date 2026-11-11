'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layouts/page-header'
import { Container } from '@/components/layouts/container'
import { FadeIn } from '@/components/ui/animate'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Phone, Globe, Star, StickyNote, ChevronRight, ChevronLeft, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const STAGES = [
  { key: 'novo', label: 'Novo', color: 'bg-blue-500' },
  { key: 'aprovado', label: 'Aprovado', color: 'bg-teal-500' },
  { key: 'em_conversa', label: 'Em Conversa', color: 'bg-amber-500' },
  { key: 'orcamento', label: 'Orçamento', color: 'bg-purple-500' },
  { key: 'fechado', label: 'Fechado', color: 'bg-green-600' },
]

export default function OportunidadesPage() {
  const [opps, setOpps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/opportunities')
      const data = await res.json()
      setOpps(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function moveStage(opp: any, direction: number) {
    const idx = STAGES.findIndex(s => s.key === opp.stage)
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= STAGES.length) return
    try {
      await fetch('/api/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: opp.id, stage: STAGES[newIdx].key }),
      })
      load()
      toast.success(`Movido para ${STAGES[newIdx].label}`)
    } catch { toast.error('Erro ao mover') }
  }

  async function saveNotes() {
    if (!selected) return
    try {
      await fetch('/api/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, notes }),
      })
      toast.success('Notas salvas')
      setSelected(null)
      load()
    } catch { toast.error('Erro ao salvar notas') }
  }

  return (
    <Container size="xl" className="py-8 px-4 lg:px-8">
      <FadeIn>
        <PageHeader title="Oportunidades" description="Acompanhe o progresso de cada empresa no funil" />
      </FadeIn>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
          {STAGES.map(s => <Card key={s.key} className="animate-pulse h-48" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-6">
          {STAGES.map(stage => {
            const items = opps.filter((o: any) => o.stage === stage.key)
            return (
              <div key={stage.key} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <span className="text-sm font-semibold">{stage.label}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
                </div>
                <ScrollArea className="max-h-[calc(100vh-250px)]">
                  <div className="space-y-2 pr-1">
                    {items.map((opp: any) => (
                      <Card key={opp.id} variant="interactive" className="cursor-pointer" onClick={() => { setSelected(opp); setNotes(opp.notes ?? '') }}>
                        <CardContent className="p-3">
                          <p className="font-medium text-sm truncate">{opp.company?.name ?? 'Empresa'}</p>
                          <p className="text-xs text-muted-foreground truncate">{opp.company?.segment ?? ''} • {opp.company?.city ?? ''}</p>
                          <div className="flex gap-1 mt-2">
                            <Button variant="ghost" size="icon-sm" onClick={(e: any) => { e.stopPropagation(); moveStage(opp, -1) }} disabled={stage.key === 'novo'}>
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={(e: any) => { e.stopPropagation(); moveStage(opp, 1) }} disabled={stage.key === 'fechado'}>
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                            <Link href={`/rascunhos?companyId=${opp.companyId}`} onClick={(e: any) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon-sm"><MessageSquare className="h-3 w-3" /></Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {items.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhuma empresa</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open: boolean) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{selected?.company?.name ?? 'Detalhes'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {selected?.company?.segment && <Badge variant="outline">{selected.company.segment}</Badge>}
              {selected?.company?.city && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{selected.company.city}</span>}
              {selected?.company?.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selected.company.phone}</span>}
              {selected?.company?.rating != null && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{selected.company.rating}</span>}
            </div>
            {selected?.company?.website && (
              <a href={selected.company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1">
                <Globe className="h-3 w-3" /> {selected.company.website}
              </a>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-1"><StickyNote className="h-3 w-3" /> Notas</label>
              <Textarea value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Anotações sobre essa empresa..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
            <Button onClick={saveNotes}>Salvar Notas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  )
}
