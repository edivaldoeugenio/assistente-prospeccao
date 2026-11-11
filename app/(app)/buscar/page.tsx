'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layouts/page-header'
import { Container } from '@/components/layouts/container'
import { FadeIn, Stagger, StaggerItem, HoverLift } from '@/components/ui/animate'
import { Search, MapPin, Globe, Instagram, AlertTriangle, Plus, Phone, ExternalLink, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

const social = /instagram\.com|facebook\.com|fb\.com|linktr\.ee|wa\.me|api\.whatsapp/i

const typeLabels: Record<string, string> = {
  restaurant: 'Restaurante', cafe: 'Cafeteria', bar: 'Bar', pub: 'Bar',
  fast_food: 'Lanchonete', bakery: 'Padaria', pharmacy: 'Farmácia',
  clinic: 'Clínica', dentist: 'Dentista', veterinary: 'Veterinário',
  fuel: 'Posto de Combustível', bank: 'Banco', school: 'Escola',
  supermarket: 'Supermercado', convenience: 'Conveniência',
  hairdresser: 'Salão', beauty: 'Salão de Beleza',
  car_repair: 'Oficina Mecânica', clothes: 'Loja de Roupas',
  electronics: 'Eletrônicos', furniture: 'Móveis', pet: 'Pet Shop',
  hotel: 'Hotel', guest_house: 'Pousada', fitness_centre: 'Academia',
  florist: 'Floricultura', optician: 'Ótica', shoes: 'Calçados',
}

function mapNominatimResults(data: any[], segment: string, cityName: string) {
  const skipTypes = ['city', 'state', 'country', 'administrative', 'county', 'town', 'village', 'hamlet', 'road', 'residential', 'stream', 'river', 'park', 'suburb', 'neighbourhood']

  return data
    .filter((item: any) => {
      if (skipTypes.includes(item.type)) return false
      if (['boundary', 'place', 'highway', 'waterway', 'natural'].includes(item.class)) return false
      return true
    })
    .map((item: any) => {
      const tags = item.extratags ?? {}
      const addr = item.address ?? {}
      const website = tags.website ?? tags['contact:website'] ?? ''
      const phone = tags.phone ?? tags['contact:phone'] ?? ''

      const isSocial = !!website && social.test(website)
      const hasWebsite = !!website && !isSocial
      const hasSocialOnly = isSocial

      let potentialLevel = 'baixo'
      if (!website) potentialLevel = 'alto'
      else if (isSocial) potentialLevel = 'alto'

      const name = item.display_name?.split(',')[0] ?? 'Sem nome'
      const road = addr.road ?? ''
      const houseNumber = addr.house_number ?? ''
      const suburb = addr.suburb ?? addr.neighbourhood ?? ''
      const addressCity = addr.city ?? addr.town ?? cityName
      const addressParts = [road, houseNumber, suburb, addressCity].filter(Boolean)

      const segLabel = segment || typeLabels[item.type] || item.type?.replace(/_/g, ' ') || ''

      return {
        placeId: `osm_${item.osm_type}_${item.osm_id}`,
        name,
        segment: segLabel,
        city: addressCity,
        state: addr.state ?? '',
        phone,
        website,
        address: addressParts.join(', ') || cityName,
        rating: null,
        totalRatings: null,
        hasWebsite,
        hasSocialOnly,
        oldWebsite: false,
        potentialLevel,
      }
    })
}

export default function BuscarPage() {
  const [city, setCity] = useState('')
  const [segment, setSegment] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!city.trim()) { toast.error('Preencha a cidade'); return }
    setLoading(true)
    setResults([])
    setStatusMsg('')
    setSearched(false)

    try {
      // Step 1: Geocode city with Nominatim (runs from user's browser — no server blocking)
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', Brasil')}&format=json&limit=1&accept-language=pt-BR`
      const geoResp = await fetch(geoUrl, { headers: { 'Accept': 'application/json' } })
      const geoData = await geoResp.json()

      if (!geoData.length) {
        setStatusMsg(`Cidade "${city}" não encontrada no mapa.`)
        setSearched(true)
        setLoading(false)
        return
      }

      const lat = parseFloat(geoData[0].lat)
      const lon = parseFloat(geoData[0].lon)
      const cityName = (geoData[0].display_name ?? city).split(',')[0]

      // Step 2: Build bounding box (~10km
      const delta = 0.1
      const viewbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`

      // Step 3: Search for businesses (from user's browser)
      const query = segment.trim() || 'loja restaurante empresa'
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=30&bounded=1&viewbox=${viewbox}&q=${encodeURIComponent(query)}&accept-language=pt-BR&addressdetails=1&extratags=1`

      // Nominatim rate limit: max 1 req/s
      await new Promise(resolve => setTimeout(resolve, 1100))

      const searchResp = await fetch(searchUrl, { headers: { 'Accept': 'application/json' } })
      const searchData = await searchResp.json()

      let mapped = Array.isArray(searchData) ? mapNominatimResults(searchData, segment.trim(), cityName) : []

      // If segment search returned nothing, try broader search
      if (mapped.length === 0 && segment.trim()) {
        await new Promise(resolve => setTimeout(resolve, 1100))
        const broadUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=30&bounded=1&viewbox=${viewbox}&q=${encodeURIComponent(segment + ' ' + cityName)}&accept-language=pt-BR&addressdetails=1&extratags=1`
        const broadResp = await fetch(broadUrl, { headers: { 'Accept': 'application/json' } })
        const broadData = await broadResp.json()
        mapped = Array.isArray(broadData) ? mapNominatimResults(broadData, segment.trim(), cityName) : []
      }

      if (mapped.length === 0) {
        setStatusMsg(`Nenhuma empresa do tipo "${segment || 'geral'}" encontrada para ${cityName}. A cobertura de dados pode variar por região — tente termos diferentes.`)
      }

      setResults(mapped)
      setSearched(true)
    } catch (err) {
      console.error('Search error:', err)
      toast.error('Erro ao buscar empresas. Tente novamente.')
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  async function addCompany(company: any) {
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      })
      if (res.status === 409) { toast.error('Empresa já adicionada'); return }
      if (!res.ok) throw new Error()
      const saved = await res.json()
      await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: saved.id }),
      })
      toast.success(`${company.name} adicionada às oportunidades!`)
      setResults(prev => prev.filter((r: any) => r.placeId !== company.placeId))
    } catch {
      toast.error('Erro ao adicionar empresa')
    }
  }

  function getPotentialBadge(level: string) {
    const colors: Record<string, string> = { alto: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', medio: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', baixo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }
    const labels: Record<string, string> = { alto: 'Alto potencial', medio: 'Médio', baixo: 'Baixo' }
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[level] ?? colors.medio}`}>{labels[level] ?? level}</span>
  }

  return (
    <Container size="xl" className="py-8 px-4 lg:px-8">
      <FadeIn>
        <PageHeader title="Buscar Empresas" description="Encontre potenciais clientes por cidade e segmento" />
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="mt-6">
          <CardContent className="p-5">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Cidade</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Ex: Cuiabá, Campo Grande" value={city} onChange={(e: any) => setCity(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Segmento</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Ex: Restaurante, Salão" value={segment} onChange={(e: any) => setSegment(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="flex items-end">
                <Button type="submit" loading={loading} className="w-full sm:w-auto">
                  <Search className="mr-2 h-4 w-4" /> Buscar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>

      {searched && statusMsg && (
        <FadeIn delay={0.2}>
          <Alert className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              {statusMsg}
            </AlertDescription>
          </Alert>
        </FadeIn>
      )}

      {searched && results.length === 0 && !loading && !statusMsg && (
        <FadeIn><p className="text-center text-muted-foreground mt-8">Nenhuma empresa encontrada.</p></FadeIn>
      )}

      {results.length > 0 && (
        <p className="text-xs text-muted-foreground mt-4 mb-1">{results.length} empresa{results.length > 1 ? 's' : ''} encontrada{results.length > 1 ? 's' : ''}</p>
      )}

      <Stagger className="mt-2 space-y-3">
        {results.map((company: any) => (
          <StaggerItem key={company.placeId}>
            <HoverLift>
              <Card>
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-base truncate">{company.name}</h3>
                        {getPotentialBadge(company.potentialLevel)}
                      </div>
                      <p className="text-sm text-muted-foreground">{company.segment} • {company.city}{company.state ? `, ${company.state}` : ''}</p>
                      {company.address && <p className="text-xs text-muted-foreground mt-1">{company.address}</p>}

                      <div className="flex flex-wrap gap-3 mt-2">
                        {company.phone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {company.phone}
                          </span>
                        )}
                      </div>

                      {/* Signals */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {!company.hasWebsite && !company.hasSocialOnly && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Sem site
                          </Badge>
                        )}
                        {company.hasSocialOnly && (
                          <Badge variant="secondary" className="text-xs">
                            <Instagram className="h-3 w-3 mr-1" /> Só redes sociais
                          </Badge>
                        )}
                        {company.oldWebsite && (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" /> Site desatualizado
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {company.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={company.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" /> Site
                          </a>
                        </Button>
                      )}
                      <Button size="sm" onClick={() => addCompany(company)}>
                        <Plus className="h-3 w-3 mr-1" /> Adicionar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </HoverLift>
          </StaggerItem>
        ))}
      </Stagger>
    </Container>
  )
}
