import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Agenda from './pages/Agenda'
import NuevoTurno from './pages/NuevoTurno'
import Profesionales from './pages/Profesionales'
import Clientes from './pages/Clientes'

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
        <Route path="/profesionales" element={<Profesionales />} />
        <Route path="/clientes" element={<Clientes />} />

        {/* Fallback: cualquier ruta desconocida → /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
