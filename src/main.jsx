import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './router/AppRouter'
import { iniciarAnalytics } from './utils/analytics'
import { aplicarLigaDeUrl } from './utils/cambiarLiga'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'

// Antes de pedir nada: si el link trae ?liga=..., se abre en esa liga
aplicarLigaDeUrl()

iniciarAnalytics()

// Registramos el Service Worker para las notificaciones Push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/push-sw.js')
      .then(registration => {
        console.log('ServiceWorker registrado exitosamente con el scope: ', registration.scope)
      })
      .catch(err => {
        console.error('El registro del ServiceWorker falló: ', err)
      })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  </StrictMode>
)