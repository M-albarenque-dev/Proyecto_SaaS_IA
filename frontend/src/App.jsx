import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Las páginas se importan aquí a medida que se crean en src/pages/
// import Login from './pages/Login'
// import Agenda from './pages/Agenda'
// import DetalleTurno from './pages/DetalleTurno'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Placeholder — reemplazar con las rutas reales */}
        <Route path="/" element={<h1>TurnoIA — En construcción</h1>} />
        {/* <Route path="/login" element={<Login />} /> */}
        {/* <Route path="/agenda" element={<Agenda />} /> */}
        {/* <Route path="/turno/:id" element={<DetalleTurno />} /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
