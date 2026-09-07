// @ts-nocheck
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from './store'
import App from './App'
import VirtualKeyboard from './components/VirtualKeyboard'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <App />
      <VirtualKeyboard />
    </AppProvider>
  </React.StrictMode>
)
