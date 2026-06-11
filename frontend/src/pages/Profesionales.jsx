// ─────────────────────────────────────────────────────────────────────────────
// Profesionales.jsx — drop-in replacement para frontend/src/pages/Profesionales.jsx
// Stack: React 18 + Vite + React Router v6 + Axios (sin librerías extra)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ─── CSS injection ────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("pr-styles")) return;
  const s = document.createElement("style");
  s.id = "pr-styles";
  s.textContent = `
    @keyframes pr-spin { to { transform: rotate(360deg); } }
    .pr-row:hover { background: rgba(255,255,255,.03) !important; }
    .pr-nb:hover  { background: rgba(255,255,255,.07) !important; color: #e7ecf5 !important; }
    .pr-gb:hover  { background: rgba(255,255,255,.06) !important; color: #e7ecf5 !important; }
    .pr-dp button:hover { background: rgba(255,255,255,.05) !important; color: #e7ecf5 !important; }
    .pr-dp .pr-red:hover { background: rgba(248,113,113,.12) !important; color: #f87171 !important; }
    .pr-fi:focus { border-color: #38bdf8 !important; box-shadow: 0 0 0 3px rgba(56,189,248,.15) !important; }
    .pr-occ { transition: width .5s cubic-bezier(.4,0,.2,1); }
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

const GRADS = [
  "linear-gradient(135deg,#38bdf8,#2b82f6)",
  "linear-gradient(135deg,#2dd4bf,#059669)",
  "linear-gradient(135deg,#a78bfa,#7c3aed)",
  "linear-gradient(135deg,#fbbf24,#d97706)",
  "linear-gradient(135deg,#f87171,#dc2626)",
  "linear-gradient(135deg,#34d399,#10b981)",
];
const avatarGrad = (n) => GRADS[(n?.charCodeAt(0) || 65) % GRADS.length];
const avatarInit = (n) =>
  n
    ?.split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";
const occColor = (p) => (p >= 75 ? C.ok : p >= 40 ? C.warn : C.can);

// ─── Sub-components ───────────────────────────────────────────────────────────
function TopNav({ negocio, onNav, onLogout }) {
  const init = (negocio?.nombre || "T")[0].toUpperCase();
  const links = [
    ["Agenda", "/agenda"],
    ["Pacientes", "/clientes"],
    ["Profesionales", null],
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
            className="pr-nb"
            onClick={() => p && onNav(p)}
            style={{
              padding: "8px 13px",
              borderRadius: 9,
              fontWeight: 600,
              fontSize: 13.5,
              color: !p && l === "Profesionales" ? C.text : C.dim,
              background:
                !p && l === "Profesionales" ? C.panel2 : "transparent",
              boxShadow:
                !p && l === "Profesionales"
                  ? `inset 0 0 0 1px ${C.borderS}`
                  : "none",
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
        className="pr-nb"
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

function KPIs({ data }) {
  const totalTurnos = data.reduce((s, p) => s + (p.turnos_hoy || 0), 0);
  const avgOcc = data.length
    ? Math.round(data.reduce((s, p) => s + (p.ocupacion || 0), 0) / data.length)
    : 0;
  const esps = new Set(data.map((p) => p.especialidad).filter(Boolean));
  const cards = [
    { l: "Total", v: data.length, s: "profesionales activos", ac: C.accent },
    { l: "Turnos hoy", v: totalTurnos, s: "entre todos", ac: C.ok },
    {
      l: "Ocupación prom.",
      v: avgOcc + "%",
      s: "de la agenda de hoy",
      ac: C.warn,
    },
    { l: "Especialidades", v: esps.size, s: "distintas", ac: C.ai },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 14,
        marginBottom: 20,
      }}
    >
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            padding: "16px 18px",
            borderRadius: 14,
            background: C.panel,
            boxShadow: `inset 0 0 0 1px ${C.border}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg,${c.ac},transparent)`,
            }}
          />
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              color: C.mute,
              textTransform: "uppercase",
            }}
          >
            {c.l}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: -1,
              marginTop: 8,
              lineHeight: 1,
              color: C.text,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {c.v}
          </div>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>{c.s}</div>
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: `2.5px solid ${C.border}`,
          borderTopColor: C.accent,
          animation: "pr-spin .7s linear infinite",
        }}
      />
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
const ESPECIALIDADES = [
  "Clínica General",
  "Pediatría",
  "Odontología",
  "Cardiología",
  "Dermatología",
  "Ginecología",
  "Traumatología",
  "Nutrición",
  "Psicología",
  "Oftalmología",
  "Neurología",
  "Otra",
];

function ProfesionalDrawer({ open, onClose, onSaved, editData }) {
  const [form, setForm] = useState({
    nombre: "",
    especialidad: "",
    email: "",
    telefono: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const firstRef = useRef(null);
  const isEdit = !!editData;

  useEffect(() => {
    if (open) {
      setForm(
        editData
          ? {
              nombre: editData.nombre || "",
              especialidad: editData.especialidad || "",
              email: editData.email || "",
              telefono: editData.telefono || "",
            }
          : { nombre: "", especialidad: "", email: "", telefono: "" },
      );
      setErr("");
      setTimeout(() => firstRef.current?.focus(), 280);
    }
  }, [open, editData]);

  const save = async () => {
    if (!form.nombre.trim()) return setErr("El nombre es requerido.");
    if (!form.especialidad.trim())
      return setErr("La especialidad es requerida.");
    setSaving(true);
    setErr("");
    try {
      const payload = {
        nombre: form.nombre.trim(),
        especialidad: form.especialidad.trim(),
        email: form.email.trim() || null,
        telefono: form.telefono.trim() || null,
      };
      const res = isEdit
        ? await api.put(`/profesionales/${editData.id}`, payload)
        : await api.post("/profesionales", payload);
      onSaved(res.data, isEdit ? "edit" : "create");
      onClose();
    } catch (e) {
      const d = e.response?.data;
      setErr(
        Array.isArray(d?.detail)
          ? d.detail.map((x) => x.msg).join(" | ")
          : d?.detail || d?.message || e.message || "Error al guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, ph, type = "text", opts = null) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginBottom: 18,
      }}
    >
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.5,
          color: C.mute,
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      {opts ? (
        <select
          className="pr-fi"
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          style={{
            height: 42,
            padding: "0 14px",
            borderRadius: 10,
            background: "rgba(255,255,255,.06)",
            border: `1px solid ${C.borderS}`,
            color: form[key] ? C.text : C.mute,
            fontSize: 14,
            fontWeight: 500,
            outline: "none",
            transition: ".15s",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a6478' stroke-width='2.2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
          }}
        >
          <option value="">Seleccionar especialidad</option>
          {opts.map((o) => (
            <option
              key={o}
              value={o}
              style={{ background: "#111827", color: C.text }}
            >
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={key === "nombre" ? firstRef : null}
          className="pr-fi"
          type={type}
          placeholder={ph}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && save()}
          style={{
            height: 42,
            padding: "0 14px",
            borderRadius: 10,
            background: "rgba(255,255,255,.06)",
            border: `1px solid ${C.borderS}`,
            color: C.text,
            fontSize: 14,
            fontWeight: 500,
            outline: "none",
            transition: ".15s",
          }}
        />
      )}
    </div>
  );

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.55)",
          zIndex: 50,
          backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          transition: "opacity .22s",
          pointerEvents: open ? "all" : "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 440,
          zIndex: 51,
          background: "#0d1220",
          borderLeft: `1px solid ${C.borderS}`,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .25s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>
            {isEdit ? "Editar profesional" : "Nuevo profesional"}
          </span>
          <button
            className="pr-gb"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.dim,
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.border}`,
              transition: ".15s",
            }}
          >
            <svg
              width={15}
              height={15}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {err && (
            <div
              style={{
                background: C.canBg,
                color: C.can,
                border: `1px solid ${C.canBd}`,
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {err}
            </div>
          )}
          {field("nombre", "Nombre completo *", "Ej: Dr. García")}
          {field("especialidad", "Especialidad *", "", "text", ESPECIALIDADES)}
          {field("email", "Email", "doctor@clinica.com", "email")}
          {field("telefono", "Teléfono", "Ej: 11-1234-5678")}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: C.aiBg,
              border: `1px solid ${C.aiBd}`,
              marginTop: 4,
            }}
          >
            <div
              style={{
                color: C.ai,
                fontWeight: 700,
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              ✦ Asignación de turnos
            </div>
            <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.55 }}>
              Al crear el profesional, quedará disponible para asignar turnos
              desde la Agenda. El asistente IA lo tendrá en cuenta al sugerir
              horarios disponibles.
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "20px 24px",
            borderTop: `1px solid ${C.border}`,
            flexShrink: 0,
            display: "flex",
            gap: 10,
          }}
        >
          <button
            onClick={save}
            disabled={saving}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              background: `linear-gradient(150deg,${C.accent},${C.accent2})`,
              color: "#04263f",
              border: "none",
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
              transition: ".15s",
            }}
          >
            {saving ? (
              <>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "2px solid rgba(4,38,63,.4)",
                    borderTopColor: "#04263f",
                    animation: "pr-spin .7s linear infinite",
                  }}
                />{" "}
                Guardando…
              </>
            ) : isEdit ? (
              "Guardar cambios"
            ) : (
              "Crear profesional"
            )}
          </button>
          <button
            onClick={onClose}
            className="pr-gb"
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              color: C.dim,
              background: "transparent",
              boxShadow: `inset 0 0 0 1px ${C.border}`,
              transition: ".15s",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Action menu ──────────────────────────────────────────────────────────────
function ActMenu({ prof, onEdit, onDelete, onVerAgenda }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const items = [
    {
      l: "Editar",
      fn: () => {
        onEdit(prof);
        setOpen(false);
      },
      icon: (
        <svg
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
    },
    {
      l: "Ver agenda",
      fn: () => {
        onVerAgenda(prof);
        setOpen(false);
      },
      icon: (
        <svg
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M3 9h18M8 2v4M16 2v4" />
        </svg>
      ),
    },
    {
      l: "Eliminar",
      fn: () => {
        onDelete(prof);
        setOpen(false);
      },
      red: true,
      icon: (
        <svg
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      ),
    },
  ];
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        className="pr-gb"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>
      {open && (
        <div
          className="pr-dp"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            zIndex: 50,
            background: "#111827",
            border: `1px solid ${C.borderS}`,
            borderRadius: 10,
            padding: 6,
            minWidth: 160,
            boxShadow: "0 16px 40px rgba(0,0,0,.6)",
          }}
        >
          {items.map((it) => (
            <button
              key={it.l}
              onClick={it.fn}
              className={it.red ? "pr-red" : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 12px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                color: C.dim,
                transition: ".12s",
                border: "none",
                background: "none",
                cursor: "pointer",
              }}
            >
              {it.icon}
              {it.l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Profesionales() {
  const navigate = useNavigate();
  const { logout, negocio } = useAuth();

  const [profesionales, setProfesionales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [editData, setEditData] = useState(null);

  const showAlert = (msg, type = "ok") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchProfesionales = async () => {
    setLoading(true);
    try {
      const res = await api.get("/profesionales");
      setProfesionales(res.data || []);
    } catch (e) {
      if (e.response?.status === 401) {
        logout();
        navigate("/login");
      } else
        showAlert(
          e.response?.data?.detail ||
            e.message ||
            "Error al cargar profesionales.",
          "err",
        );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfesionales();
  }, []);

  const handleDelete = async (p) => {
    if (!window.confirm(`¿Eliminar a ${p.nombre}?`)) return;
    try {
      await api.delete(`/profesionales/${p.id}`);
      setProfesionales((prev) => prev.filter((x) => x.id !== p.id));
      showAlert("Profesional eliminado.");
    } catch (e) {
      if (e.response?.status === 401) {
        logout();
        navigate("/login");
      } else
        showAlert(
          e.response?.data?.detail || e.message || "Error al eliminar.",
          "err",
        );
    }
  };

  const handleSaved = (data, mode) => {
    if (mode === "edit")
      setProfesionales((prev) =>
        prev.map((p) => (p.id === data.id ? data : p)),
      );
    else setProfesionales((prev) => [data, ...prev]);
    showAlert(
      mode === "edit"
        ? `Profesional actualizado.`
        : `Profesional <b>${data.nombre}</b> creado.`,
    );
  };

  const openNew = () => {
    setEditData(null);
    setDrawer(true);
  };
  const openEdit = (p) => {
    setEditData(p);
    setDrawer(true);
  };
  const handleVerAgenda = (p) =>
    navigate("/agenda", {
      state: { profesionalId: p.id, profesionalNombre: p.nombre },
    });

  const filtered = profesionales.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.nombre?.toLowerCase().includes(q) ||
      p.especialidad?.toLowerCase().includes(q)
    );
  });

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
        style={{ maxWidth: 1340, margin: "0 auto", padding: "28px 28px 60px" }}
      >
        {/* Page head */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 22,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: -0.5,
                color: C.text,
              }}
            >
              Profesionales
            </h1>
            <div style={{ color: C.dim, fontSize: 13.5, marginTop: 5 }}>
              {profesionales.length} profesional
              {profesionales.length !== 1 ? "es" : ""} registrados
            </div>
          </div>
          <button
            onClick={openNew}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 11,
              fontWeight: 700,
              fontSize: 14,
              background: `linear-gradient(150deg,${C.accent},${C.accent2})`,
              color: "#04263f",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 6px 18px rgba(43,130,246,.35)",
              whiteSpace: "nowrap",
              transition: ".15s",
            }}
          >
            <svg
              width={15}
              height={15}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo profesional
          </button>
        </div>

        {/* KPIs */}
        <KPIs data={profesionales} />

        {/* Alert */}
        {alert && (
          <div
            style={{
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              marginBottom: 14,
              background: alert.type === "err" ? C.canBg : C.okBg,
              color: alert.type === "err" ? C.can : C.ok,
              border: `1px solid ${alert.type === "err" ? C.canBd : C.okBd}`,
            }}
            dangerouslySetInnerHTML={{ __html: alert.msg }}
          />
        )}

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 14px",
              height: 38,
              borderRadius: 10,
              background: C.panel2,
              boxShadow: `inset 0 0 0 1px ${C.borderS}`,
              flex: 1,
              maxWidth: 340,
            }}
          >
            <svg
              width={15}
              height={15}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity=".5"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre o especialidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: C.text,
                fontSize: 13.5,
                fontWeight: 500,
                width: "100%",
              }}
            />
          </div>
          <div style={{ flex: 1 }} />
          <button
            className="pr-gb"
            onClick={fetchProfesionales}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "0 14px",
              height: 38,
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              color: C.dim,
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.border}`,
              border: "none",
              cursor: "pointer",
              transition: ".15s",
            }}
          >
            <svg
              width={13}
              height={13}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-6.36 2.64L3 8" />
              <path d="M3 3v5h5M3 12a9 9 0 0 0 9 9 9 9 0 0 0 6.36-2.64L21 16" />
              <path d="M21 21v-5h-5" />
            </svg>
            Actualizar
          </button>
        </div>

        {/* Table */}
        <div
          style={{
            borderRadius: 14,
            background: C.panel,
            boxShadow: `inset 0 0 0 1px ${C.border}`,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                padding: "72px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: C.panel2,
                  border: `1px solid ${C.borderS}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width={28}
                  height={28}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity=".5"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div style={{ color: C.dim, fontSize: 14 }}>
                {search
                  ? `Sin resultados para "${search}"`
                  : "No hay profesionales registrados todavía."}
              </div>
              {!search && (
                <button
                  onClick={openNew}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    borderRadius: 9,
                    fontWeight: 700,
                    fontSize: 13,
                    background: `linear-gradient(150deg,${C.accent},${C.accent2})`,
                    color: "#04263f",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  + Agregar el primero
                </button>
              )}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    "",
                    "Profesional",
                    "Email",
                    "Teléfono",
                    "Ocupación hoy",
                    "Acciones",
                  ].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "12px 16px",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 1,
                        color: C.mute,
                        textTransform: "uppercase",
                        textAlign: "left",
                        background: "rgba(255,255,255,.018)",
                        borderBottom: `1px solid ${C.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const occ = p.ocupacion || 0;
                  const oc = occColor(occ);
                  return (
                    <tr
                      key={p.id ?? i}
                      className="pr-row"
                      style={{
                        borderBottom: `1px solid rgba(255,255,255,.04)`,
                        transition: ".12s",
                      }}
                    >
                      <td style={{ padding: "13px 16px", width: 52 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: avatarGrad(p.nombre),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#04263f",
                            flexShrink: 0,
                          }}
                        >
                          {avatarInit(p.nombre)}
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {p.nombre || "—"}
                        </div>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 9px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            background: C.aiBg,
                            color: C.ai,
                            border: `1px solid ${C.aiBd}`,
                            marginTop: 4,
                          }}
                        >
                          {p.especialidad || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", color: C.dim }}>
                        {p.email ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <svg
                              width={12}
                              height={12}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              opacity=".5"
                            >
                              <rect x="2" y="4" width="20" height="16" rx="2" />
                              <path d="m2 7 10 7 10-7" />
                            </svg>
                            {p.email}
                          </span>
                        ) : (
                          <span style={{ color: C.mute, fontSize: 12 }}>
                            — sin email
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "13px 16px", color: C.dim }}>
                        {p.telefono ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <svg
                              width={12}
                              height={12}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              opacity=".5"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            {p.telefono}
                          </span>
                        ) : (
                          <span style={{ color: C.mute, fontSize: 12 }}>
                            — sin teléfono
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "13px 16px", width: 180 }}>
                        <div
                          style={{ fontSize: 13, fontWeight: 700, color: oc }}
                        >
                          {occ}%
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: 6,
                            background: "rgba(255,255,255,.08)",
                            borderRadius: 3,
                            overflow: "hidden",
                            marginTop: 5,
                          }}
                        >
                          <div
                            className="pr-occ"
                            style={{
                              width: `${occ}%`,
                              height: "100%",
                              borderRadius: 3,
                              background: oc,
                            }}
                          />
                        </div>
                        <div
                          style={{ fontSize: 11, color: C.mute, marginTop: 4 }}
                        >
                          {p.turnos_hoy || 0} turno
                          {(p.turnos_hoy || 0) !== 1 ? "s" : ""} hoy
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px", width: 130 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <button
                            onClick={() => handleVerAgenda(p)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "5px 10px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.accent,
                              background: "rgba(56,189,248,.1)",
                              boxShadow: `inset 0 0 0 1px rgba(56,189,248,.3)`,
                              border: "none",
                              cursor: "pointer",
                              transition: ".15s",
                            }}
                          >
                            <svg
                              width={12}
                              height={12}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                            >
                              <rect x="3" y="4" width="18" height="17" rx="2" />
                              <path d="M3 9h18M8 2v4M16 2v4" />
                            </svg>
                            Agenda
                          </button>
                          <ActMenu
                            prof={p}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onVerAgenda={handleVerAgenda}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div
            style={{
              color: C.mute,
              fontSize: 12,
              marginTop: 12,
              textAlign: "right",
            }}
          >
            Mostrando {filtered.length} de {profesionales.length} profesional
            {profesionales.length !== 1 ? "es" : ""}
          </div>
        )}
      </div>

      <ProfesionalDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        onSaved={handleSaved}
        editData={editData}
      />
    </div>
  );
}
