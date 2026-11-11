'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/layouts/page-header'
import { Container } from '@/components/layouts/container'
import { FadeIn } from '@/components/ui/animate'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, User, MapPin, MessageCircle, Save, Shield, Globe } from 'lucide-react'
import { toast } from 'sonner'

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => setSettings(d ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) toast.success('Configurações salvas!')
      else toast.error('Erro ao salvar')
    } catch { toast.error('Erro ao salvar') } finally { setSaving(false) }
  }

  function update(key: string, value: any) {
    setSettings((prev: any) => ({ ...(prev ?? {}), [key]: value }))
  }

  if (loading) return <Container size="lg" className="py-8 px-4"><div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <Card key={i} className="h-24" />)}</div></Container>

  return (
    <Container size="lg" className="py-8 px-4 lg:px-8">
      <FadeIn>
        <PageHeader title="Configurações" description="Personalize o comportamento do assistente" />
      </FadeIn>

      <div className="space-y-4 mt-6">
        {/* Personal info */}
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><User className="h-4 w-4" /> Seus Dados</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input value={settings?.userName ?? ''} onChange={(e: any) => update('userName', e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">E-mail</Label>
                  <Input value={settings?.userEmail ?? ''} onChange={(e: any) => update('userEmail', e.target.value)} placeholder="seu@email.com" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telefone</Label>
                  <Input value={settings?.userPhone ?? ''} onChange={(e: any) => update('userPhone', e.target.value)} placeholder="(65) 9 9999-9999" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Serviços oferecidos</Label>
                <Textarea value={settings?.userServices ?? ''} onChange={(e: any) => update('userServices', e.target.value)} placeholder="Criação de sites, Landing pages, E-commerce..." rows={2} />
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Messages */}
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Mensagens</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tom das mensagens</Label>
                  <Select value={settings?.messageTone ?? 'amigavel'} onValueChange={(v: string) => update('messageTone', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amigavel">Amigável</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Limite diário de rascunhos</Label>
                  <Input type="number" min={1} max={50} value={settings?.dailyDraftLimit ?? 10} onChange={(e: any) => update('dailyDraftLimit', parseInt(e.target.value) || 10)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={settings?.transparentAi ?? true} onCheckedChange={(v: boolean) => update('transparentAi', v)} />
                <div>
                  <Label className="text-sm">Transparência sobre IA</Label>
                  <p className="text-xs text-muted-foreground">Se perguntarem, admitir que usa ferramentas de IA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Fonte de dados */}
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><Globe className="h-4 w-4" /> Fonte de Dados</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                <MapPin className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-teal-800 dark:text-teal-300">OpenStreetMap (Gratuito)</p>
                  <p className="text-teal-700 dark:text-teal-400 mt-1">
                    A busca utiliza dados do OpenStreetMap — 100% gratuito, sem necessidade de chave ou cadastro.
                    A cobertura pode variar por região. Se não encontrar empresas de um segmento específico, tente termos diferentes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.4}>
          <Button onClick={save} loading={saving} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" /> Salvar Configurações
          </Button>
        </FadeIn>
      </div>
    </Container>
  )
}
