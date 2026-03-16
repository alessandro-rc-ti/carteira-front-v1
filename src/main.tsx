import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { router } from './router'
import { useI18nStore } from '@/stores/i18nStore'
import './index.css'

// Carrega traduções do JSON estático antes de renderizar
useI18nStore.getState().load();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster richColors position="top-right" />
  </StrictMode>,
)
