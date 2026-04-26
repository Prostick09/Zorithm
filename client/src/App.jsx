import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ChatPage from './features/chat/ChatPage'
import './index.css'

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('algobot-theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`
    localStorage.setItem('algobot-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <BrowserRouter>
      <div className={`app-layout theme-${theme}`}>
        <Routes>
          <Route path="/" element={<ChatPage theme={theme} onThemeToggle={toggleTheme} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
