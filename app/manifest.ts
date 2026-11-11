import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Assistente de Prospecção',
    short_name: 'Prospecção',
    description: 'Encontre clientes, gere mensagens e feche negócios',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0D9488',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
