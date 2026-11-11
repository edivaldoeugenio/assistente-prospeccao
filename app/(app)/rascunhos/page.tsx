'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layouts/page-header'
import { Container } from '@/components/layouts/container'
import { FadeIn, HoverLift } from '@/components/ui/animate'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  MessageSquare, Mail, Phone as PhoneIcon, Sparkles, Copy, ExternalLink,
  Check, Send, Loader2, Building2
} from 'lucide-react'
import { toast } from 'sonner'

function RascunhosContent() {
  const searchParams = useSearchParams()
  const filterCompanyId = searchParams?.get('companyId') ?? ''

  const [opps, setOpps] = useState<any[]>([])
  const [drafts, setDrafts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [selectedOpp, setSelectedOpp] = useState('')
  const [channel, setChannel] = useState('whatsapp')
  const [editDraft, setEditDraft] = useState<any>(null)
  const [editBody, setEditBody] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [checklist, setChecklist] = useState({ factsChecked: false, optOut: false })

  const loadData = useCallback(async () => {
    try {
      const [oppsRes, draftsRes] = await Promise.all([
        fetch('/api/opportunities'),
        fetch(`/api/drafts${filterCompanyId ? `?companyId=${filterCompanyId}` : ''}`),
      ])
      const oppsData = await oppsRes.json()
      const draftsData = await draftsRes.json()
      setOpps(Array.isArray(oppsData) ? oppsData : [])
      setDrafts(Array.isArray(draftsData) ? draftsData : [])
    } catch {} finally { setLoading(false) }
  }, [filterCompanyId])

  useEffect(() => { loadData() }, [loadData])

  async function generateDraft() {
    if (!selectedOpp) { toast.error('Selecione uma empresa'); return }
    const opp = opps.find((o: any) => o.id === selectedOpp)
    if (!opp) return

    setGenerating(true)
    setStreamText('')

    try {
      const res = await fetch('/api/drafts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: opp.companyId, channel }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error || 'Erro ao gerar')
        setGenerating(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let partialRead = ''
      let finalText = ''

      while (true) {
        const { done, value } = await (reader as any).read()
        if (done) break
        partialRead += decoder.decode(value, { stream: true })
        const lines = partialRead.split('\n')
        partialRead = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed.status === 'streaming') {
                finalText += parsed.content ?? ''
                setStreamText(finalText)
              } else if (parsed.status === 'completed') {
                finalText = parsed.result ?? finalText
                setStreamText(finalText)
                // Save draft
                let subject = ''
                let body = finalText
                if (channel === 'email') {
                  const match = finalText.match(/^Assunto:\s*(.+?)\n/)
                  if (match) {
                    subject = match[1].trim()
                    body = finalText.replace(/^Assunto:\s*.+?\n\n?/, '').trim()
                  }
                }
                await fetch('/api/drafts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ companyId: opp.companyId, channel, subject, body }),
                })
                loadData()
              } else if (parsed.status === 'error') {
                toast.error(parsed.message || 'Erro na geração')
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      toast.error('Erro ao gerar rascunho')
    } finally {
      setGenerating(false)
    }
  }

  function openWhatsApp(draft: any) {
    const phone = draft.company?.phone?.replace(/\D/g, '') ?? ''
    const text = encodeURIComponent(draft.body ?? '')
    window.open(`https://wa.me/55${phone}?text=${text}`, '_blank')
  }

  function openEmail(draft: any) {
    const subject = encodeURIComponent(draft.subject ?? '')
    const body = encodeURIComponent(draft.body ?? '')
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
  }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); toast.success('Copiado!') } catch { toast.error('Erro ao copiar') }
  }

  async function markSent(draft: any) {
    try {
      await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draft.id, sentAt: new Date().toISOString() }),
      })
      // Move opportunity to em_conversa
      const opp = opps.find((o: any) => o.companyId === draft.companyId)
      if (opp && (opp.stage === 'novo' || opp.stage === 'aprovado')) {
        await fetch('/api/opportunities', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: opp.id, stage: 'em_conversa' }),
        })
      }
      toast.success('Marcado como enviado')
      loadData()
    } catch { toast.error('Erro') }
  }

  async function saveDraftEdit() {
    if (!editDraft) return
    try {
      await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editDraft.id, body: editBody, subject: editSubject }),
      })
      toast.success('Rascunho atualizado')
      setEditDraft(null)
      loadData()
    } catch { toast.error('Erro ao salvar') }
  }

  const pendingDrafts = drafts.filter((d: any) => !d.sentAt)
  const sentDrafts = drafts.filter((d: any) => d.sentAt)

  return (
    <Container size="xl" className="py-8 px-4 lg:px-8">
      <FadeIn>
        <PageHeader title="Rascunhos de Mensagem" description="Gere e edite mensagens antes de enviar" />
      </FadeIn>

      {/* Generate section */}
      <FadeIn delay={0.1}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Gerar novo rascunho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Empresa</Label>
                <Select value={selectedOpp} onValueChange={setSelectedOpp}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {opps.map((o: any) => (
                      <SelectItem key={o.id} value={o.id}>{o.company?.name ?? 'Empresa'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Canal</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={generateDraft} loading={generating} className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" /> Gerar com IA
                </Button>
              </div>
            </div>

            {(generating || streamText) && (
              <div className="bg-muted rounded-lg p-4">
                {generating && <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</div>}
                <p className="text-sm whitespace-pre-wrap">{streamText || 'Aguardando...'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Pending drafts */}
      {pendingDrafts.length > 0 && (
        <FadeIn delay={0.2}>
          <h3 className="text-sm font-semibold mt-8 mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Pendentes ({pendingDrafts.length})
          </h3>
          <div className="space-y-3">
            {pendingDrafts.map((draft: any) => (
              <HoverLift key={draft.id}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{draft.company?.name ?? ''}</span>
                          <Badge variant={draft.channel === 'whatsapp' ? 'default' : 'secondary'} className="text-xs">
                            {draft.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                          </Badge>
                        </div>
                        {draft.subject && <p className="text-xs text-muted-foreground mb-1">Assunto: {draft.subject}</p>}
                        <p className="text-sm whitespace-pre-wrap line-clamp-3">{draft.body}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => { setEditDraft(draft); setEditBody(draft.body ?? ''); setEditSubject(draft.subject ?? '') }}>
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyText(draft.body ?? '')}>
                        <Copy className="h-3 w-3 mr-1" /> Copiar
                      </Button>
                      {draft.channel === 'whatsapp' && (
                        <Button variant="outline" size="sm" onClick={() => openWhatsApp(draft)}>
                          <PhoneIcon className="h-3 w-3 mr-1" /> Abrir WhatsApp
                        </Button>
                      )}
                      {draft.channel === 'email' && (
                        <Button variant="outline" size="sm" onClick={() => openEmail(draft)}>
                          <Mail className="h-3 w-3 mr-1" /> Abrir E-mail
                        </Button>
                      )}
                      <Button size="sm" onClick={() => { setChecklist({ factsChecked: false, optOut: false }); markSent(draft) }}>
                        <Send className="h-3 w-3 mr-1" /> Marcar como enviado
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            ))}
          </div>
        </FadeIn>
      )}

      {/* Sent drafts */}
      {sentDrafts.length > 0 && (
        <FadeIn delay={0.3}>
          <h3 className="text-sm font-semibold mt-8 mb-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" /> Enviados ({sentDrafts.length})
          </h3>
          <div className="space-y-2">
            {sentDrafts.map((draft: any) => (
              <Card key={draft.id} className="opacity-70">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">{draft.company?.name ?? ''}</span>
                    <Badge variant="outline" className="text-xs">{draft.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Enviado
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </FadeIn>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editDraft} onOpenChange={(open: boolean) => !open && setEditDraft(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Rascunho</DialogTitle>
          </DialogHeader>
          {editDraft?.channel === 'email' && (
            <div className="space-y-1">
              <Label className="text-xs">Assunto</Label>
              <Input value={editSubject} onChange={(e: any) => setEditSubject(e.target.value)} />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Mensagem</Label>
            <Textarea value={editBody} onChange={(e: any) => setEditBody(e.target.value)} rows={8} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDraft(null)}>Cancelar</Button>
            <Button onClick={saveDraftEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default function RascunhosPage() {
  return <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}><RascunhosContent /></Suspense>
}
