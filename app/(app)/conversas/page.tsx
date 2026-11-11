'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layouts/page-header'
import { Container } from '@/components/layouts/container'
import { FadeIn } from '@/components/ui/animate'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessagesSquare, Send, Sparkles, Copy, Loader2, User, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ConversasPage() {
  const [opps, setOpps] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sender, setSender] = useState('cliente')
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/opportunities').then(r => r.json()).then(d => setOpps(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const loadMessages = useCallback(async (companyId: string) => {
    if (!companyId) return
    try {
      const res = await fetch(`/api/conversations?companyId=${companyId}`)
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  useEffect(() => { if (selectedCompany) loadMessages(selectedCompany) }, [selectedCompany, loadMessages])

  async function addMessage() {
    if (!newMsg.trim() || !selectedCompany) return
    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompany, sender, message: newMsg }),
      })
      setNewMsg('')
      loadMessages(selectedCompany)
    } catch { toast.error('Erro ao registrar') }
  }

  async function suggestReply() {
    if (!selectedCompany) return
    setSuggesting(true)
    setSuggestion('')
    try {
      const res = await fetch('/api/conversations/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompany }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let partialRead = ''
      let text = ''
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
              if (parsed.status === 'streaming') { text += parsed.content ?? ''; setSuggestion(text) }
              else if (parsed.status === 'completed') { text = parsed.result ?? text; setSuggestion(text) }
            } catch {}
          }
        }
      }
    } catch { toast.error('Erro ao sugerir') } finally { setSuggesting(false) }
  }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); toast.success('Copiado!') } catch {}
  }

  return (
    <Container size="xl" className="py-8 px-4 lg:px-8">
      <FadeIn>
        <PageHeader title="Conversas" description="Registre respostas e peça sugestões de resposta à IA" />
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="mt-6 space-y-1">
          <label className="text-xs font-medium">Empresa</label>
          <Select value={selectedCompany} onValueChange={(v: string) => { setSelectedCompany(v); setSuggestion('') }}>
            <SelectTrigger className="max-w-sm"><SelectValue placeholder="Selecione uma empresa..." /></SelectTrigger>
            <SelectContent>
              {opps.filter((o: any) => o.stage === 'em_conversa' || o.stage === 'orcamento').map((o: any) => (
                <SelectItem key={o.companyId} value={o.companyId}>{o.company?.name ?? 'Empresa'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FadeIn>

      {selectedCompany && (
        <FadeIn delay={0.2}>
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base font-display">Histórico</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mensagem registrada.</p>}
                {messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.sender === 'eu' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg p-3 text-sm ${
                      m.sender === 'eu' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <div className="flex items-center gap-1 mb-1">
                        {m.sender === 'eu' ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                        <span className="text-xs font-medium">{m.sender === 'eu' ? 'Você' : 'Cliente'}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add message */}
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <Select value={sender} onValueChange={setSender}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eu">Eu</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={suggestReply} disabled={suggesting || messages.length === 0}>
                    <Sparkles className="h-3 w-3 mr-1" /> Sugerir resposta
                  </Button>
                </div>
                <Textarea value={newMsg} onChange={(e: any) => setNewMsg(e.target.value)} placeholder="Registrar mensagem..." rows={3} />
                <Button onClick={addMessage} disabled={!newMsg.trim()}>
                  <Send className="h-3 w-3 mr-1" /> Registrar
                </Button>
              </div>

              {/* Suggestion */}
              {(suggesting || suggestion) && (
                <div className="mt-4 bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Sugestão de resposta</span>
                    {suggesting && <Loader2 className="h-3 w-3 animate-spin" />}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{suggestion}</p>
                  {suggestion && (
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => copyText(suggestion)}>
                        <Copy className="h-3 w-3 mr-1" /> Copiar
                      </Button>
                      <Button size="sm" onClick={() => { setNewMsg(suggestion); setSender('eu') }}>
                        Usar como resposta
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </Container>
  )
}
