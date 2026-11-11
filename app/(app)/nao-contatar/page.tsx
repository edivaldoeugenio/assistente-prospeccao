'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layouts/page-header'
import { Container } from '@/components/layouts/container'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { Ban, Trash2, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NaoContatarPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/do-not-contact')
      const data = await res.json()
      setList(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function remove(id: string) {
    try {
      await fetch(`/api/do-not-contact?id=${id}`, { method: 'DELETE' })
      toast.success('Removido da lista')
      load()
    } catch { toast.error('Erro ao remover') }
  }

  return (
    <Container size="xl" className="py-8 px-4 lg:px-8">
      <FadeIn>
        <PageHeader title="Lista de Não Contatar" description="Empresas que pediram para não serem contatadas" />
      </FadeIn>

      {loading ? (
        <div className="space-y-3 mt-6">{[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse h-16" />)}</div>
      ) : list.length === 0 ? (
        <FadeIn><div className="text-center mt-12"><Ban className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Nenhuma empresa na lista.</p></div></FadeIn>
      ) : (
        <Stagger className="space-y-3 mt-6">
          {list.map((item: any) => (
            <StaggerItem key={item.id}>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <Building2 className="h-5 w-5 text-destructive flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.company?.name ?? 'Empresa'}</p>
                    <p className="text-xs text-muted-foreground">{item.reason ?? ''}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Container>
  )
}
