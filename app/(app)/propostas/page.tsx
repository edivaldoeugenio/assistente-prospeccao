'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layouts/page-header'
import { Container } from '@/components/layouts/container'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FileText, Plus, Trash2, Building2, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface ProposalItem { description: string; quantity: number; unitPrice: number }

export default function PropostasPage() {
  const [proposals, setProposals] = useState<any[]>([])
  const [opps, setOpps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [title, setTitle] = useState('')
  const [items, setItems] = useState<ProposalItem[]>([{ description: '', quantity: 1, unitPrice: 0 }])
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    try {
      const [pRes, oRes] = await Promise.all([fetch('/api/proposals'), fetch('/api/opportunities')])
      setProposals(await pRes.json().catch(() => []))
      setOpps(await oRes.json().catch(() => []))
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function addItem() { setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_: any, i: number) => i !== idx)) }
  function updateItem(idx: number, field: string, value: any) {
    setItems(prev => prev.map((item: ProposalItem, i: number) => i === idx ? { ...item, [field]: value } : item))
  }

  const total = items.reduce((sum: number, item: ProposalItem) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0), 0)

  async function createProposal() {
    if (!selectedCompany) { toast.error('Selecione uma empresa'); return }
    if (items.some((i: ProposalItem) => !i.description)) { toast.error('Preencha todos os itens'); return }
    try {
      await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompany, title: title || 'Proposta', items, notes }),
      })
      toast.success('Proposta criada!')
      setShowNew(false)
      setItems([{ description: '', quantity: 1, unitPrice: 0 }])
      setTitle(''); setNotes(''); setSelectedCompany('')
      load()
    } catch { toast.error('Erro ao criar proposta') }
  }

  return (
    <Container size="xl" className="py-8 px-4 lg:px-8">
      <FadeIn>
        <PageHeader
          title="Propostas"
          description="Monte orçamentos com itens e valores"
          actions={<Button onClick={() => setShowNew(true)}><Plus className="mr-2 h-4 w-4" /> Nova Proposta</Button>}
        />
      </FadeIn>

      {loading ? (
        <div className="space-y-3 mt-6">{[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse h-20" />)}</div>
      ) : proposals.length === 0 && !showNew ? (
        <FadeIn><div className="text-center mt-12"><FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Nenhuma proposta ainda.</p></div></FadeIn>
      ) : (
        <Stagger className="space-y-3 mt-6">
          {(Array.isArray(proposals) ? proposals : []).map((p: any) => {
            const pTotal = (p.items ?? []).reduce((s: number, i: any) => s + (i.quantity ?? 0) * (i.unitPrice ?? 0), 0)
            return (
              <StaggerItem key={p.id}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{p.title ?? 'Proposta'}</p>
                        <p className="text-xs text-muted-foreground">{p.company?.name ?? ''} • {(p.items ?? []).length} itens</p>
                      </div>
                      <Badge variant="secondary">{p.status === 'rascunho' ? 'Rascunho' : p.status === 'enviada' ? 'Enviada' : p.status}</Badge>
                      <span className="font-mono font-bold text-sm">R$ {pTotal?.toFixed?.(2) ?? '0.00'}</span>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Nova Proposta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Empresa</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {opps.map((o: any) => <SelectItem key={o.companyId} value={o.companyId}>{o.company?.name ?? ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Título</Label>
              <Input value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="Proposta de criação de site" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Itens</Label>
              {items.map((item: ProposalItem, idx: number) => (
                <div key={idx} className="flex gap-2 items-start">
                  <Input className="flex-1" placeholder="Descrição" value={item.description} onChange={(e: any) => updateItem(idx, 'description', e.target.value)} />
                  <Input className="w-16" type="number" min={1} value={item.quantity} onChange={(e: any) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
                  <Input className="w-28" type="number" min={0} step="0.01" placeholder="Valor" value={item.unitPrice || ''} onChange={(e: any) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon-sm" onClick={() => removeItem(idx)}><Trash2 className="h-3 w-3" /></Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Adicionar item</Button>
            </div>

            <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total:</span>
              <span className="font-mono font-bold text-lg ml-auto">R$ {total?.toFixed?.(2) ?? '0.00'}</span>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Observações</Label>
              <Textarea value={notes} onChange={(e: any) => setNotes(e.target.value)} rows={3} placeholder="Condições, prazos..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={createProposal}>Criar Proposta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  )
}
