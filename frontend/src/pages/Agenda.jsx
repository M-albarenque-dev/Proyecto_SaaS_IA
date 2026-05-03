import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = 'https://proyectosaasia-production.up.railway.app'

const ESTADO_COLORS = {
  pendiente:  { bg: '#fef9c3', color: '#92400e' },
  confirmado: { bg: '#d1fae5', color: '#065f46' },
  cancelado:  { bg: '#fee2e2', color: '#b91c1c' },
  completado: { bg: '#e0e7ff', color: '#3730a3' },
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: '#f0f2f5',
    fontFamily: "'Segoe UI', sans-serif",
    padding: '2rem',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  btnPrimary: {
    padding: '0.6rem 1.2rem',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '0.6rem 1.2rem',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    background: '#f8f9fa',
    padding: '0.85rem 1rem',
    textAlign: 'left',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '0.9rem 1rem',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.92rem',
    color: '#374151',
  },
  badge: (estado) => {
    const c = ESTADO_COLORS[estado?.toLowerCase()] || { bg: '#f3f4f6', color: '#374151' }
    return {
      display: 'inline-block',
      padding: '0.25rem 0.65rem',
      borderRadius: '99px',
      fontSize: '0.78rem',
      fontWeight: 700,
      background: c.bg,
      color: c.color,
    }
  },
  emptyMsg: {
    textAlign: 'center',
    padding: '3rem',
    color: '#9ca3af',
    fontSize: '1rem',
  },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
  },
}

function formatFecha(fechaStr) {
  if (!fechaStr) return '—'
  try {
    return new Date(fechaStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return fechaStr
  }
}

export default function Agenda() {
  const navigate = useNavigate()
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetchTurnos(token)
  }, [navigate])

  const fetchTurnos = async (token) => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get(`${API_BASE}/api/turnos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTurnos(res.data || [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Error al cargar los turnos.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h1 style={styles.title}>Agenda de Turnos</h1>
        <div style={styles.headerActions}>
          <button style={styles.btnPrimary} onClick={() => navigate('/nuevo-turno')}>
            + Nuevo turno
          </button>
          <button style={styles.btnPrimary} onClick={() => navigate('/profesionales')}>
            Profesionales
          </button>
          <button style={styles.btnPrimary} onClick={() => navigate('/clientes')}>
            Clientes
          </button>
          <button style={styles.btnDanger} onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loading}>Cargando turnos...</div>
        ) : turnos.length === 0 ? (
          <div style={styles.emptyMsg}>No hay turnos registrados todavia.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha inicio</th>
                <th style={styles.th}>Fecha fin</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Profesional</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Notas</th>
              </tr>
            </thead>
            <tbody>
              {turnos.map((t, i) => (
                <tr key={t.id ?? i}>
                  <td style={styles.td}>{formatFecha(t.fecha_inicio || t.fecha)}</td>
                  <td style={styles.td}>{formatFecha(t.fecha_fin)}</td>
                  <td style={styles.td}>{t.cliente?.nombre || t.cliente_id || '-'}</td>
                  <td style={styles.td}>{t.profesional?.nombre || t.profesional_id || '-'}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(t.estado)}>{t.estado || '-'}</span>
                  </td>
                  <td style={styles.td}>{t.notas || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
