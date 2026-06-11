// ─────────────────────────────────────────────────────────────────────────────
// NuevoTurno.jsx — drop-in replacement para frontend/src/pages/NuevoTurno.jsx
// Stack: React 18 + Vite + React Router v6 + Axios (sin librerías extra)
// Payload al backend: { fecha_hora, duracion_min, profesional_id, cliente_id, notas }
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ─── CSS injection ────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("nt-styles")) return;
  const s = document.createElement("style");
  s.id = "nt-styles";
  s.textContent = `
    @keyframes nt-spin { to { transform: rotate(360deg); } }
    .nt-nb:hover  { background: rgba(255,255,255,.07) !important; color: #e7ecf5 !important; }
    .nt-gb:hover  { background: rgba(255,255,255,.06) !important; color: #e7ecf5 !important; }
    .nt-fi:focus  { border-color: #38bdf8 !important; box-shadow: 0 0 0 3px rgba(56,189,248,.15) !important; }
    .nt-dur:hover { color: #e7ecf5 !important; background: rgba(255,255,255,.07) !important; }
    .nt-tog { width:40px;height:22px;border-radius:11px;position:relative;transition:.2s;flex-shrink:0;cursor:pointer;border:none; }
    .nt-tog::after { content:"";position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:white;transition:.2s;box-shadow:0 1px 4px rgba(0,0,0,.3); }
  `;
  document.head.appendChild(s);
})();

// ─── Tokens ───────────────────────────────────────────────────────────────────
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
  ai: "#a78bfa",
  aiBg: "rgba(167,139,250,.1)",
  aiBd: "rgba(167,139,250,.3)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const p2 = (n) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
};
const addMinutes = (timeStr, mins) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${p2(Math.floor(total / 60) % 24)}:${p2(total % 60)}`;
};
const fmtFecha = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00");
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

// ─── TopNav ───────────────────────────────────────────────────────────────────
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
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginRight: 18,
        }}
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
            boxShadow: "0 4px 14px rgba(43,130,246,.4)",
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
        {links.map(([l, p]) => (
          <button
            key={l}
            className="nt-nb"
            onClick={() => p && onNav(p)}
            style={{
              padding: "8px 13px",
              borderRadius: 9,
              fontWeight: 600,
              fontSize: 13.5,
              color: C.dim,
              background: "transparent",
              border: "none",
              cursor: p ? "pointer" : "default",
              transition: ".15s",
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <button
        className="nt-nb"
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
          background: `linear-gradient(150deg,${C.accent},${C.accent2})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 13,
          color: "#04263f",
          flexShrink: 0,
        }}
      >
        {init}
      </div>
    </nav>
  );
}

// ─── Duration pills ───────────────────────────────────────────────────────────
const DURATIONS = [15, 30, 45, 60, 90];
function DurPills({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {DURATIONS.map((d) => (
        <button
          key={d}
          className="nt-dur"
          onClick={() => onChange(d)}
          style={{
            padding: "8px 16px",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            transition: ".15s",
            color: value === d ? "#04263f" : C.dim,
            background:
              value === d
                ? `linear-gradient(150deg,${C.accent},${C.accent2})`
                : C.panel,
            boxShadow:
              value === d
                ? "0 3px 12px rgba(43,130,246,.3)"
                : `inset 0 0 0 1px ${C.border}`,
          }}
        >
          {d} min
        </button>
      ))}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button
      className="nt-tog"
      onClick={() => onChange(!on)}
      style={{
        background: on
          ? `linear-gradient(150deg,${C.accent},${C.accent2})`
          : "rgba(255,255,255,.1)",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "white",
          transition: ".2s",
          boxShadow: "0 1px 4px rgba(0,0,0,.3)",
          left: on ? 21 : 3,
        }}
      />
    </button>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ icon, title, badge, children }) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: C.panel,
        boxShadow: `inset 0 0 0 1px ${C.border}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "16px 20px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {icon}
        <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
        {badge && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 20,
              background: C.aiBg,
              color: C.ai,
              border: `1px solid ${C.aiBd}`,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children, style }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 7,
        marginBottom: 20,
        ...style,
      }}
    >
      <label
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: 0.6,
          color: C.mute,
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  height: 44,
  padding: "0 14px",
  borderRadius: 10,
  background: "rgba(255,255,255,.055)",
  border: `1px solid rgba(255,255,255,.13)`,
  color: "#e7ecf5",
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
  transition: ".15s",
  width: "100%",
  boxSizing: "border-box",
};
const selectStyle = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a6478' stroke-width='2.2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 34,
  backgroundColor: "rgba(255,255,255,.055)",
};

// ─── Summary row ──────────────────────────────────────────────────────────────
function SumRow({ label, value, accent }) {
  const isEmpty = !value || value === "—";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 0",
        borderBottom: `1px solid rgba(255,255,255,.04)`,
        fontSize: 13.5,
      }}
    >
      <span style={{ color: C.dim, fontSize: 12 }}>{label}</span>
      <span
        style={{
          fontWeight: 600,
          color: accent ? C.accent : isEmpty ? C.mute : C.text,
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NuevoTurno() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, negocio } = useAuth();

  // Pre-fill from navigation state (e.g. from Pacientes → "Agendar")
  const prefill = location.state || {};

  const [profesionales, setProfesionales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const [clienteId, setClienteId] = useState(
    prefill.clienteId ? String(prefill.clienteId) : "",
  );
  const [profId, setProfId] = useState(
    prefill.profesionalId ? String(prefill.profesionalId) : "",
  );
  const [fecha, setFecha] = useState(todayISO());
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState(30);
  const [notas, setNotas] = useState("");
  const [waReminder, setWaReminder] = useState(true);
  const [emailReminder, setEmailReminder] = useState(true);

  const showAlert = (msg, type = "ok") => {
    setAlert({ msg, type });
    if (type === "ok") setTimeout(() => setAlert(null), 5000);
  };

  // ── Load selects ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingSelects(true);
      try {
        const [rp, rc] = await Promise.all([
          api.get("/profesionales"),
          api.get("/clientes"),
        ]);
        setProfesionales(rp.data || []);
        setClientes(rc.data || []);
      } catch (e) {
        if (e.response?.status === 401) {
          logout();
          navigate("/login");
        } else
          showAlert(
            "No se pudieron cargar profesionales/pacientes. Recargá la página.",
            "err",
          );
      } finally {
        setLoadingSelects(false);
      }
    };
    load();
  }, []);

  // ── Derived: hora de fin ────────────────────────────────────────────────────
  const horaFin = useMemo(() => addMinutes(hora, duracion), [hora, duracion]);

  // ── Derived: nombre de cliente/profesional para el summary ────────────────
  const clienteNombre = useMemo(
    () =>
      clientes.find((c) => String(c.id) === clienteId)?.nombre ||
      prefill.clienteNombre ||
      null,
    [clientes, clienteId],
  );
  const profNombre = useMemo(() => {
    const p = profesionales.find((p) => String(p.id) === profId);
    return p
      ? `${p.nombre}${p.especialidad ? " · " + p.especialidad : ""}`
      : prefill.profesionalNombre || null;
  }, [profesionales, profId]);

  // ── Derived: disponibilidad (client-side, la real la valida el backend) ───
  const dispStatus = useMemo(() => {
    if (!profId || !fecha || !hora) return null;
    return "ok"; // el backend valida el conflicto real — aquí solo mostramos "parece libre"
  }, [profId, fecha, hora]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!clienteId) return showAlert("Seleccioná un paciente.", "err");
    if (!profId) return showAlert("Seleccioná un profesional.", "err");
    if (!fecha) return showAlert("Elegí una fecha.", "err");
    if (!hora) return showAlert("Elegí una hora.", "err");

    setLoading(true);
    setAlert(null);
    try {
      await api.post("/turnos", {
        fecha_hora: `${fecha}T${hora}:00`,
        duracion_min: duracion,
        profesional_id: Number(profId),
        cliente_id: Number(clienteId),
        notas: notas.trim() || null,
      });
      navigate("/agenda");
    } catch (e) {
      if (e.response?.status === 401) {
        logout();
        navigate("/login");
      } else {
        const d = e.response?.data;
        showAlert(
          Array.isArray(d?.detail)
            ? d.detail.map((x) => x.msg).join(" | ")
            : d?.detail ||
                d?.message ||
                e.message ||
                "Error al crear el turno.",
          "err",
        );
      }
    } finally {
      setLoading(false);
    }
  };

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
      <TopNav
        negocio={negocio}
        onNav={navigate}
        onLogout={() => {
          logout();
          navigate("/login");
        }}
      />

      <div
        style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 28px 60px" }}
      >
        {/* Page head */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <button
            className="nt-gb"
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
              boxShadow: `inset 0 0 0 1px ${C.border}`,
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
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: -0.4,
            }}
          >
            Nuevo turno
          </h1>
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* AI suggestion banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 11,
                background: C.aiBg,
                border: `1px solid ${C.aiBd}`,
              }}
            >
              <span style={{ color: C.ai, fontSize: 16, flexShrink: 0 }}>
                ✦
              </span>
              <div style={{ flex: 1, fontSize: 13, color: C.dim }}>
                <b style={{ color: C.text }}>Próximo hueco libre:</b> hoy{" "}
                {hora || "15:30"} · o pedile al asistente IA que lo elija por
                vos.
              </div>
            </div>

            {/* Alert */}
            {alert && (
              <div
                style={{
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  background: alert.type === "err" ? C.canBg : C.okBg,
                  color: alert.type === "err" ? C.can : C.ok,
                  border: `1px solid ${alert.type === "err" ? C.canBd : C.okBd}`,
                }}
                dangerouslySetInnerHTML={{ __html: alert.msg }}
              />
            )}

            {/* Form card */}
            <Card
              title="Datos del turno"
              icon={
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={C.accent}
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="3" y="4" width="18" height="17" rx="2" />
                  <path d="M3 9h18M8 2v4M16 2v4" />
                </svg>
              }
            >
              {/* Paciente */}
              <Field label="Paciente *">
                <select
                  className="nt-fi"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  disabled={loadingSelects}
                  style={selectStyle}
                >
                  <option value="">
                    {loadingSelects
                      ? "Cargando..."
                      : "— Seleccionar paciente —"}
                  </option>
                  {clientes.map((c) => (
                    <option
                      key={c.id}
                      value={String(c.id)}
                      style={{ background: "#111827" }}
                    >
                      {c.nombre}
                      {c.telefono ? " · " + c.telefono : ""}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Profesional */}
              <Field label="Profesional *">
                <select
                  className="nt-fi"
                  value={profId}
                  onChange={(e) => setProfId(e.target.value)}
                  disabled={loadingSelects}
                  style={selectStyle}
                >
                  <option value="">
                    {loadingSelects
                      ? "Cargando..."
                      : "— Seleccionar profesional —"}
                  </option>
                  {profesionales.map((p) => (
                    <option
                      key={p.id}
                      value={String(p.id)}
                      style={{ background: "#111827" }}
                    >
                      {p.nombre}
                      {p.especialidad ? " · " + p.especialidad : ""}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Fecha + Hora */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <Field label="Fecha *" style={{ marginBottom: 0 }}>
                  <input
                    className="nt-fi"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Hora *" style={{ marginBottom: 0 }}>
                  <input
                    className="nt-fi"
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    step="900"
                    style={inputStyle}
                  />
                </Field>
              </div>

              {/* Duración */}
              <Field label="Duración" style={{ marginTop: 20 }}>
                <DurPills value={duracion} onChange={setDuracion} />
              </Field>

              {/* Notas */}
              <Field label="Notas (opcional)" style={{ marginBottom: 0 }}>
                <textarea
                  className="nt-fi"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Motivo de consulta, indicaciones, observaciones..."
                  style={{
                    ...inputStyle,
                    height: "auto",
                    minHeight: 88,
                    padding: "12px 14px",
                    resize: "vertical",
                    lineHeight: 1.55,
                  }}
                />
              </Field>
            </Card>

            {/* Recordatorios card */}
            <Card
              title="Recordatorios automáticos"
              badge="✦ IA"
              icon={
                <svg
                  width={15}
                  height={15}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={C.ai}
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
                  <path d="M10 20a2 2 0 0 0 4 0" />
                </svg>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  {
                    label: "WhatsApp · 24h antes",
                    sub: "Enviado automáticamente por el asistente",
                    ico: "💬",
                    icoColor: "rgba(37,211,102,.12)",
                    icoTextColor: "#25d366",
                    val: waReminder,
                    set: setWaReminder,
                  },
                  {
                    label: "Email · 1h antes",
                    sub: "Si el paciente tiene email registrado",
                    ico: "📧",
                    icoColor: `rgba(56,189,248,.12)`,
                    icoTextColor: C.accent,
                    val: emailReminder,
                    set: setEmailReminder,
                  },
                ].map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 0",
                      borderBottom:
                        i === 0 ? `1px solid rgba(255,255,255,.04)` : "none",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15,
                          background: r.icoColor,
                          flexShrink: 0,
                        }}
                      >
                        {r.ico}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {r.label}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: C.mute,
                            marginTop: 2,
                          }}
                        >
                          {r.sub}
                        </div>
                      </div>
                    </div>
                    <Toggle on={r.val} onChange={r.set} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div
            style={{
              position: "sticky",
              top: 76,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Summary card */}
            <div
              style={{
                borderRadius: 14,
                background: C.panel,
                boxShadow: `inset 0 0 0 1px ${C.border}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 20px",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <svg
                  width={15}
                  height={15}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={C.ok}
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Resumen</span>
              </div>
              <div style={{ padding: "14px 18px" }}>
                <SumRow label="Paciente" value={clienteNombre} />
                <SumRow label="Profesional" value={profNombre} />
                <SumRow label="Fecha" value={fmtFecha(fecha)} />
                <SumRow label="Hora" value={hora || null} />
                <SumRow label="Duración" value={`${duracion} min`} accent />
                <SumRow label="Finaliza" value={horaFin || null} />
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: `1px solid ${C.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 12, color: C.dim }}>
                    Disponibilidad
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: dispStatus === "ok" ? C.ok : C.mute,
                    }}
                  >
                    {dispStatus === "ok"
                      ? "✓ Parece disponible"
                      : "Completá los datos"}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || loadingSelects}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: 12,
                borderRadius: 11,
                fontWeight: 700,
                fontSize: 15,
                background: `linear-gradient(150deg,${C.accent},${C.accent2})`,
                color: "#04263f",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(43,130,246,.35)",
                transition: ".15s",
                opacity: loading || loadingSelects ? 0.6 : 1,
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: "2.5px solid rgba(4,38,63,.3)",
                      borderTopColor: "#04263f",
                      animation: "nt-spin .7s linear infinite",
                    }}
                  />
                  Guardando…
                </>
              ) : (
                <>
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Crear turno
                </>
              )}
            </button>

            <button
              onClick={() => navigate("/agenda")}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                padding: 11,
                borderRadius: 11,
                fontWeight: 600,
                fontSize: 14,
                color: C.dim,
                background: "transparent",
                boxShadow: `inset 0 0 0 1px ${C.border}`,
                border: "none",
                cursor: "pointer",
                transition: ".15s",
              }}
            >
              Cancelar
            </button>

            {/* AI tip */}
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: C.aiBg,
                border: `1px solid ${C.aiBd}`,
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: C.ai,
                  marginBottom: 5,
                }}
              >
                ✦ Tip del asistente
              </div>
              <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.55 }}>
                También podés crear turnos diciéndole al asistente:{" "}
                <em style={{ color: C.text }}>
                  "Turno para [paciente] mañana a las 10 con Dr. García"
                </em>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
