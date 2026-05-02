import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Agenda from './pages/Agenda'
import NuevoTurno from './pages/NuevoTurno'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz → redirige a /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Autenticación */}
        <Route path="/login" element={<Login />} />

        {/* App principal */}
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/nuevo-turno" element={<NuevoTurno />} />

        {/* Fallback: cualquier ruta desconocida → /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
