import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = 'https://proyectosaasia-production.up.railway.app'

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
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  btnBack: {
    padding: '0.5rem 1rem',
    background: '#fff',
    color: '#4f46e5',
    border: '1px solid #4f46e5',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  title: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    padding: '2rem',
    maxWidth: '600px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  fieldFull: {
    gridColumn: '1 / -1',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.35rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#444',
  },
  input: {
    padding: '0.6rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  textarea: {
    padding: '0.6rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
    resize: 'vertical',
    minHeight: '90px',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  actions: {
    marginTop: '1.5rem',
    display: 'flex',
    gap: '0.75rem',
  },
  btnPrimary: {
    padding: '0.75rem 1.5rem',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '0.75rem 1.5rem',
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  hint: {
    fontSize: '0.78rem',
    color: '#9ca3af',
    marginTop: '0.25rem',
  },
}

// Helper: convierte datetime-local value → "2026-05-02T08:00:00" (sin zona, sin ms)
function toLocalISO(value) {
  if (!value) return null
  // datetime-local da "2026-05-02T08:00" — solo agregamos los segundos
  return value.length === 16 ? `${value}:00` : value
}

export default function NuevoTurno() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    fecha_hora: '',
    duracion_min: 30,
    profesional_id: '',
    cliente_id: '',
    notas: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) navigate('/login')
  }, [navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    setLoading(true)
    try {
      await axios.post(
        `${API_BASE}/api/turnos`,
        {
          fecha_hora: toLocalISO(form.fecha_hora),
          duracion_min: Number(form.duracion_min),
          profesional_id: Number(form.profesional_id),
          cliente_id: Number(form.cliente_id),
          notas: form.notas || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      navigate('/agenda')
    } catch (err) {
      const detail = err.response?.data?.detail
      // FastAPI puede devolver detail como string o como array de errores de validación
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(' | '))
      } else {
        setError(
          detail ||
            err.response?.data?.message ||
            err.message ||
            'Error al crear el turno.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate('/agenda')}>
          ← Volver
        </button>
        <h1 style={styles.title}>Nuevo Turno</h1>
      </div>

      <div style={styles.card}>
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            {/* Fecha y hora del turno (full width) */}
            <div style={{ ...styles.field, ...styles.fieldFull }}>
              <label style={styles.label}>Fecha y hora del turno *</label>
              <input
                style={styles.input}
                type="datetime-local"
                name="fecha_hora"
                value={form.fecha_hora}
                onChange={handleChange}
                required
              />
            </div>

            {/* Duración */}
            <div style={styles.field}>
              <label style={styles.label}>Duración (minutos) *</label>
              <input
                style={styles.input}
                type="number"
                name="duracion_min"
                min="5"
                max="480"
                step="5"
                value={form.duracion_min}
                onChange={handleChange}
                required
              />
              <span style={styles.hint}>Mínimo 5 min, máximo 480 min</span>
            </div>

            {/* Profesional ID */}
            <div style={styles.field}>
              <label style={styles.label}>ID Profesional *</label>
              <input
                style={styles.input}
                type="number"
                name="profesional_id"
                placeholder="ej: 1"
                value={form.profesional_id}
                onChange={handleChange}
                required
              />
              <span style={styles.hint}>ID numérico del profesional</span>
            </div>

            {/* Cliente ID */}
            <div style={{ ...styles.field, ...styles.fieldFull }}>
              <label style={styles.label}>ID Cliente *</label>
              <input
                style={styles.input}
                type="number"
                name="cliente_id"
                placeholder="ej: 1"
                value={form.cliente_id}
                onChange={handleChange}
                required
              />
              <span style={styles.hint}>ID numérico del cliente</span>
            </div>

            {/* Notas (full width) */}
            <div style={{ ...styles.field, ...styles.fieldFull }}>
              <label style={styles.label}>Notas</label>
              <textarea
                style={styles.textarea}
                name="notas"
                placeholder="Indicaciones, observaciones, motivo de la consulta..."
                value={form.notas}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={styles.actions}>
            <button style={styles.btnPrimary} type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear turno'}
            </button>
            <button
              style={styles.btnSecondary}
              type="button"
              onClick={() => navigate('/agenda')}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
