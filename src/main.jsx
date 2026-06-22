import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './router/AppRouter'

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
    <AppRouter />
  </StrictMode>
)