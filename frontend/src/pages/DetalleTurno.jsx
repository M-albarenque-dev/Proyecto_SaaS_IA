// ─────────────────────────────────────────────────────────────────────────────
// DetalleTurno.jsx — drop-in replacement para frontend/src/pages/DetalleTurno.jsx
// Stack: React 18 + Vite + React Router v6 + Axios (sin librerías extra)
// Alineado al dark theme de Agenda.jsx / NuevoTurno.jsx (mismo design system).
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ─── CSS injection (scoped con prefijo dt-) ───────────────────────────────────
(() => {
  if (document.getElementById("dt-styles")) return;
  const s = document.createElement("style");
  s.id = "dt-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    @keyframes dt-spin { to { transform: rotate(360deg); } }
    .dt-nb:hover  { background: rgba(255,255,255,.07) !important; color: #e7ecf5 !important; }
    .dt-gb:hover  { background: rgba(255,255,255,.06) !important; color: #e7ecf5 !important; }
    .dt-fi:focus  { border-color: #38bdf8 !important; box-shadow: 0 0 0 3px rgba(56,189,248,.15) !important; }
    .dt-primary:hover { filter: brightness(1.08); }
    .dt-danger:hover  { background: rgba(248,113,113,.18) !important; }
  `;
  document.head.appendChild(s);
})();

// ─── Design tokens (mismos que Agenda.jsx / NuevoTurno.jsx) ──────────────────
const C = {
  bg: "#070a12",
  bgGlow: "#0e1730",
  panel: "rgba(255,255,255,.025)",
  panel2: "rgba(255,255,255,.05)",
  border: "rgba(255,255,255,.07)",
  borderS: "rgba(255,255,255,.13)",
  text: "#e7ecf5",
  dim: "#98a3b6",
  mute: "#5a6478",
  accent: "#38bdf8",
  accent2: "#2b82f6",
  ok: "#2dd4bf",
  okBg: "rgba(45,212,191,.12)",
  okBd: "rgba(45,212,191,.32)",
  warn: "#fbbf24",
  warnBg: "rgba(251,191,36,.12)",
  warnBd: "rgba(251,191,36,.32)",
  can: "#f87171",
  canBg: "rgba(248,113,113,.1)",
  canBd: "rgba(248,113,113,.28)",
  done: "#818cf8",
  doneBg: "rgba(129,140,248,.12)",
  doneBd: "rgba(129,140,248,.28)",
};

const ESTADOS = [
  "pendiente",
  "confirmado",
  "cancelado",
  "reprogramado",
  "completado",
];

const ESTADO_CFG = {
  pendiente: { label: "Pendiente", color: C.warn, bg: C.warnBg, bd: C.warnBd },
  confirmado: { label: "Confirmado", color: C.ok, bg: C.okBg, bd: C.okBd },
  cancelado: { label: "Cancelado", color: C.can, bg: C.canBg, bd: C.canBd },
  reprogramado: {
    label: "Reprogramado",
    color: C.warn,
    bg: C.warnBg,
    bd: C.warnBd,
  },
  completado: { label: "Completado", color: C.done, bg: C.doneBg, bd: C.doneBd },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDatetimeLocal(isoStr) {
  if (!isoStr) return "";
  // "2024-01-15T10:30:00" → "2024-01-15T10:30"
  return isoStr.slice(0, 16);
}
function toLocalISO(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}

// ─── TopNav (idéntico al de Agenda.jsx) ──────────────────────────────────────
function TopNav({ negocio, onNav, onLogout }) {
  const init = (negocio?.nombre || "T")[0].toUpperCase();
  const links = [
    ["Agenda", "/agenda"],
    ["Pacientes", "/clientes"],
    ["Profesionales", "/profesionales"],
    ["Reportes", null],
    ["Configuración", null],
  ];
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 28px",
        height: 60,
        borderBottom: `1px solid ${C.border}`,
        background: "rgba(7,10,18,.88)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 18 }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            flexShrink: 0,
            background: `linear-gradient(150deg,${C.accent},${C.accent2})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 14px rgba(43,130,246,.4)`,
          }}
        >
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#04263f"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4.5" width="18" height="16" rx="3" />
            <path d="M3 9h18M8 2.5v4M16 2.5v4" />
            <circle cx="12" cy="14.5" r="2.4" />
          </svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>
          Turno<span style={{ color: C.accent }}>IA</span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {links.map(([l, p]) => {
          const active = l === "Agenda";
          return (
            <button
              key={l}
              className="dt-nb"
              onClick={() => p && onNav(p)}
              style={{
                padding: "8px 13px",
                borderRadius: 9,
                fontWeight: 600,
                fontSize: 13.5,
                color: active ? C.text : C.dim,
                background: active ? C.panel2 : "transparent",
                boxShadow: active ? `inset 0 0 0 1px ${C.borderS}` : "none",
                border: "none",
                cursor: p ? "pointer" : "default",
                transition: ".15s",
              }}
            >
              {l}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          className="dt-gb"
          onClick={onLogout}
          style={{
            padding: "7px 14px",
            borderRadius: 9,
            fontWeight: 600,
            fontSize: 13,
            color: C.can,
            background: "rgba(248,113,113,.1)",
            border: `1px solid rgba(248,113,113,.25)`,
            cursor: "pointer",
            transition: ".15s",
          }}
        >
          Salir
        </button>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14,
            color: "#04263f",
            background: `linear-gradient(150deg,${C.accent},${C.accent2})`,
          }}
        >
          {init}
        </div>
      </div>
    </nav>
  );
}

function Spinner() {
  return (
    <div
      style={{ display: "flex", justifyContent: "center", padding: 60 }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: `3px solid ${C.border}`,
          borderTopColor: C.accent,
          animation: "dt-spin .7s linear infinite",
        }}
      />
    </div>
  );
}

const fieldLabel = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 700,
  color: C.dim,
  marginBottom: 7,
};
const fieldInput = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 9,
  fontSize: 14,
  color: C.text,
  background: C.panel2,
  border: `1px solid ${C.border}`,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: ".15s",
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function DetalleTurno() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout, negocio } = useAuth();

  const [loadingTurno, setLoadingTurno] = useState(true);
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profesionales, setProfesionales] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [form, setForm] = useState({
    fecha_hora: "",
    duracion_min: 30,
    profesional_id: "",
    cliente_id: "",
    estado: "pendiente",
    notas: "",
  });

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const cargarTurno = async () => {
      setLoadingTurno(true);
      setError("");
      try {
        const res = await api.get(`/turnos/${id}`);
        const t = res.data;
        setForm({
          fecha_hora: toDatetimeLocal(t.fecha_hora),
          duracion_min: t.duracion_min ?? 30,
          profesional_id: t.profesional_id ?? t.profesional?.id ?? "",
          cliente_id: t.cliente_id ?? t.cliente?.id ?? "",
          estado: t.estado ?? "pendiente",
          notas: t.notas ?? "",
        });
      } catch (err) {
        if (err.response?.status === 401) {
          onLogout();
          return;
        }
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "No se pudo cargar el turno.";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      } finally {
        setLoadingTurno(false);
      }
    };

    const cargarSelects = async () => {
      setLoadingSelects(true);
      try {
        const [rp, rc] = await Promise.all([
          api.get("/profesionales"),
          api.get("/clientes"),
        ]);
        setProfesionales(rp.data || []);
        setClientes(rc.data || []);
      } catch {
        // no bloquea la carga del turno si fallan los selects
      } finally {
        setLoadingSelects(false);
      }
    };

    cargarTurno();
    cargarSelects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload = {
        fecha_hora: toLocalISO(form.fecha_hora),
        duracion_min: Number(form.duracion_min),
        estado: form.estado,
        notas: form.notas || null,
      };
      if (form.profesional_id !== "")
        payload.profesional_id = Number(form.profesional_id);
      if (form.cliente_id !== "") payload.cliente_id = Number(form.cliente_id);

      await api.patch(`/turnos/${id}`, payload);
      setSuccess("Turno actualizado correctamente. Redirigiendo...");
      setTimeout(() => navigate("/agenda"), 1000);
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout();
        return;
      }
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(" | "));
      } else {
        setError(
          detail ||
            err.response?.data?.message ||
            err.message ||
            "Error al guardar los cambios.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelarTurno = async () => {
    const confirmado = window.confirm(
      `¿Estás seguro de que querés cancelar el Turno #${id}?\nEsta acción no se puede deshacer.`,
    );
    if (!confirmado) return;

    setSaving(true);
    setError("");
    try {
      await api.delete(`/turnos/${id}`);
      navigate("/agenda");
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout();
        return;
      }
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Error al cancelar el turno.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      setSaving(false);
    }
  };

  const estadoCfg = ESTADO_CFG[form.estado] || ESTADO_CFG.pendiente;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(1100px 500px at 50% -5%,${C.bgGlow} 0%,transparent 60%),${C.bg}`,
        color: C.text,
        fontFamily:
          "'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <TopNav negocio={negocio} onNav={navigate} onLogout={onLogout} />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 28px 60px" }}>
        {/* Page head */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}
        >
          <button
            className="dt-gb"
            onClick={() => navigate("/agenda")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 9,
              fontWeight: 600,
              fontSize: 13,
              color: C.dim,
              background: C.panel,
              border: "none",
              boxShadow: `inset 0 0 0 1px ${C.border}`,
              cursor: "pointer",
              transition: ".15s",
            }}
          >
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="m15 6-6 6 6 6" />
            </svg>
            Volver a Agenda
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: -0.4,
              color: C.text,
            }}
          >
            Turno #{id}
          </h1>
        </div>

        {/* Card */}
        <div
          style={{
            borderRadius: 16,
            background: C.panel,
            boxShadow: `inset 0 0 0 1px ${C.border}`,
            padding: 24,
            position: "relative",
          }}
        >
          {loadingTurno ? (
            <Spinner />
          ) : (
            <form onSubmit={handleGuardar}>
              {error && (
                <div
                  style={{
                    background: C.canBg,
                    color: C.can,
                    border: `1px solid ${C.canBd}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 18,
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}
              {success && (
                <div
                  style={{
                    background: C.okBg,
                    color: C.ok,
                    border: `1px solid ${C.okBd}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 18,
                    fontSize: 13,
                  }}
                >
                  {success}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
                {/* Fecha y hora */}
                <div>
                  <label style={fieldLabel}>Fecha y hora del turno *</label>
                  <input
                    className="dt-fi"
                    style={fieldInput}
                    type="datetime-local"
                    name="fecha_hora"
                    value={form.fecha_hora}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                  }}
                >
                  {/* Duración */}
                  <div>
                    <label style={fieldLabel}>Duración (minutos) *</label>
                    <input
                      className="dt-fi"
                      style={fieldInput}
                      type="number"
                      name="duracion_min"
                      min="5"
                      max="480"
                      step="5"
                      value={form.duracion_min}
                      onChange={handleChange}
                      required
                    />
                    <span
                      style={{ fontSize: 11.5, color: C.mute, marginTop: 5, display: "block" }}
                    >
                      Mínimo 5 min, máximo 480 min
                    </span>
                  </div>

                  {/* Estado */}
                  <div>
                    <label style={fieldLabel}>Estado *</label>
                    <select
                      className="dt-fi"
                      style={{
                        ...fieldInput,
                        fontWeight: 700,
                        cursor: "pointer",
                        color: estadoCfg.color,
                        background: estadoCfg.bg,
                        border: `1px solid ${estadoCfg.bd}`,
                      }}
                      name="estado"
                      value={form.estado}
                      onChange={handleChange}
                      required
                    >
                      {ESTADOS.map((e) => (
                        <option
                          key={e}
                          value={e}
                          style={{ background: C.bg, color: C.text }}
                        >
                          {ESTADO_CFG[e].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                  }}
                >
                  {/* Profesional */}
                  <div>
                    <label style={fieldLabel}>Profesional</label>
                    <select
                      className="dt-fi"
                      style={{ ...fieldInput, cursor: "pointer" }}
                      name="profesional_id"
                      value={form.profesional_id}
                      onChange={handleChange}
                      disabled={loadingSelects}
                    >
                      <option value="" style={{ background: C.bg }}>
                        {loadingSelects ? "Cargando..." : "— Sin asignar —"}
                      </option>
                      {profesionales.map((p) => (
                        <option key={p.id} value={p.id} style={{ background: C.bg }}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cliente */}
                  <div>
                    <label style={fieldLabel}>Paciente</label>
                    <select
                      className="dt-fi"
                      style={{ ...fieldInput, cursor: "pointer" }}
                      name="cliente_id"
                      value={form.cliente_id}
                      onChange={handleChange}
                      disabled={loadingSelects}
                    >
                      <option value="" style={{ background: C.bg }}>
                        {loadingSelects ? "Cargando..." : "— Sin asignar —"}
                      </option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id} style={{ background: C.bg }}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label style={fieldLabel}>Notas</label>
                  <textarea
                    className="dt-fi"
                    style={{ ...fieldInput, resize: "vertical", minHeight: 90 }}
                    name="notas"
                    placeholder="Indicaciones, observaciones, motivo de la consulta..."
                    value={form.notas}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 26 }}>
                <button
                  className="dt-primary"
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "11px 22px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#04263f",
                    background: `linear-gradient(150deg,${C.accent},${C.accent2})`,
                    border: "none",
                    cursor: saving ? "default" : "pointer",
                    opacity: saving ? 0.7 : 1,
                    boxShadow: `0 6px 18px rgba(43,130,246,.35)`,
                    transition: ".15s",
                  }}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  className="dt-danger"
                  type="button"
                  onClick={handleCancelarTurno}
                  disabled={saving}
                  style={{
                    padding: "11px 22px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    color: C.can,
                    background: C.canBg,
                    border: `1px solid ${C.canBd}`,
                    cursor: saving ? "default" : "pointer",
                    opacity: saving ? 0.7 : 1,
                    transition: ".15s",
                  }}
                >
                  Cancelar turno
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
