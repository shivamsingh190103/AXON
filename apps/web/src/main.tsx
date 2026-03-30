import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { App } from './App'
import { queryClient } from './lib/queryClient'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="grid min-h-screen place-items-center text-slate-400">Loading...</div>}>
          <App />
          <Toaster position="top-right" richColors />
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
