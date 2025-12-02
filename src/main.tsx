import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { theme } from './theme/theme'
import './index.css'
import App from './App.tsx'
import { AdminProvider } from './context/AdminContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AdminProvider>
          <App />
        </AdminProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
