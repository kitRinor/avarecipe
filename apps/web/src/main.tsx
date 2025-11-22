import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import './index.css'
import './lib/i18n'
import routes from '~react-pages'
import { AuthProvider } from './contexts/AuthContext'

function AppRoutes() {
  return (
      <Suspense fallback={<p>Loading...</p>}>
        {useRoutes(routes)}
      </Suspense>
  )
}

function App() {
  return (
    <StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<App />)