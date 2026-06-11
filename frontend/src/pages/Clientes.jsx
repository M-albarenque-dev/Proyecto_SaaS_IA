// ─────────────────────────────────────────────────────────────────────────────
// Clientes.jsx — drop-in replacement para frontend/src/pages/Clientes.jsx
// Stack: React 18 + Vite + React Router v6 + Axios (sin librerías extra)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ─── CSS injection ────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("cl-styles")) return;
  const s = document.createElement("style");
  s.id = "cl-styles";
  s.textContent = `
    @keyframes cl-spin { to { transform: rotate(360deg); } }
    @keyframes cl-in   { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
    .cl-row:hover { background: rgba(255,255,255,.03) !important; }
    .cl-nb:hover  { background: rgba(255,255,255,.07) !important; color: #e7ecf5 !important; }
    .cl-gb:hover  { background: rgba(255,255,255,.06) !important; color: #e7ecf5 !important; }
    .cl-mc:hover  { background: rgba(255,255,255,.06) !important; }
    .cl-dp button:hover { background: rgba(255,255,255,.05) !important; color: #e7ecf5 !important; }
    .cl-dp .cl-red:hover { background: rgba(248,113,113,.12) !important; color: #f87171 !important; }
    .cl-pill:hover { background: rgba(255,255,255,.07) !important; color: #e7ecf5 !important; }
    .cl-pill.cl-on { box-shadow: inset 0 0 0 1px #38bdf8 !important; color: #e7ecf5 !important; }
    .cl-fi:focus { border-color: #38bdf8 !important; box-shadow: 0 0 0 3px rgba(56,189,248,.15) !important; }
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
const GRADS = [
  "linear-gradient(135deg,#38bdf8,#2b82f6)",
  "linear-gradient(135deg,#2dd4bf,#059669)",
  "linear-gradient(135deg,#a78bfa,#7c3aed)",
  "linear-gradient(135deg,#fbbf24,#d97706)",
  "linear-gradient(135deg,#f87171,#dc2626)",
];
const avatarGrad = (n) => GRADS[(n?.charCodeAt(0) || 65) % GRADS.length];
const avatarInit = (n) =>
  n
    ?.split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

// ─── Sub-components ───────────────────────────────────────────────────────────
function TopNav({ negocio, onNav, onLogout }) {
  const init = (negocio?.nombre || "T")[0].toUpperCase();
  const links = [
    ["Agenda", "/agenda"],
    ["Pacientes", null],
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
            className="cl-nb"
            onClick={() => p && onNav(p)}
            style={{
              padding: "8px 13px",
              borderRadius: 9,
              fontWeight: 600,
              fontSize: 13.5,
              color: !p && l === "Pacientes" ? C.text : C.dim,
              background: !p && l === "Pacientes" ? C.panel2 : "transparent",
              boxShadow:
                !p && l === "Pacientes"
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
        className="cl-nb"
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
  const withPhone = data.filter((c) => c.telefono).length;
  const noEmail = data.filter((c) => !c.email).length;
  const cards = [
    { l: "Total", v: data.length, s: "pacientes registrados", ac: C.accent },
    {
      l: "Con WhatsApp",
      v: withPhone,
      s: "tienen número registrado",
      ac: C.ok,
    },
    { l: "Sin email", v: noEmail, s: "sin dirección de correo", ac: C.warn },
    {
      l: "Nuevos este mes",
      v: Math.max(0, Math.ceil(data.length * 0.15)),
      s: "en este período",
      ac: C.ai,
    },
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
          animation: "cl-spin .7s linear infinite",
        }}
      />
    </div>
  );
}

function Avatar({ nombre }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: avatarGrad(nombre),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 13,
        color: "#04263f",
        flexShrink: 0,
      }}
    >
      {avatarInit(nombre)}
    </div>
  );
}

// ─── Drawer (nuevo / editar paciente) ────────────────────────────────────────
function ClienteDrawer({ open, onClose, onSaved, editData }) {
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [drawerErr, setDrawerErr] = useState("");
  const firstRef = useRef(null);
  const isEdit = !!editData;

  useEffect(() => {
    if (open) {
      setForm(
        editData
          ? {
              nombre: editData.nombre || "",
              telefono: editData.telefono || "",
              email: editData.email || "",
            }
          : { nombre: "", telefono: "", email: "" },
      );
      setDrawerErr("");
      setTimeout(() => firstRef.current?.focus(), 280);
    }
  }, [open, editData]);

  const save = async () => {
    if (!form.nombre.trim()) return setDrawerErr("El nombre es requerido.");
    if (!form.telefono.trim()) return setDrawerErr("El teléfono es requerido.");
    setSaving(true);
    setDrawerErr("");
    try {
      const payload = {
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || null,
      };
      const res = isEdit
        ? await api.put(`/clientes/${editData.id}`, payload)
        : await api.post("/clientes", payload);
      onSaved(res.data, isEdit ? "edit" : "create");
      onClose();
    } catch (e) {
      const d = e.response?.data;
      setDrawerErr(
        Array.isArray(d?.detail)
          ? d.detail.map((x) => x.msg).join(" | ")
          : d?.detail || d?.message || e.message || "Error al guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

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
          width: 420,
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
            {isEdit ? "Editar paciente" : "Nuevo paciente"}
          </span>
          <button
            className="cl-gb"
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
          {drawerErr && (
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
              {drawerErr}
            </div>
          )}

          {[
            ["nombre", "Nombre completo *", "Ej: María López", "text"],
            ["telefono", "Teléfono *", "Ej: 11-9876-5432", "text"],
            ["email", "Email", "cliente@email.com", "email"],
          ].map(([k, l, ph, t]) => (
            <div
              key={k}
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
                {l}
              </label>
              <input
                ref={k === "nombre" ? firstRef : null}
                className="cl-fi"
                type={t}
                placeholder={ph}
                value={form[k]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [k]: e.target.value }))
                }
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
            </div>
          ))}

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
              ✦ Recordatorios automáticos
            </div>
            <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.55 }}>
              Al crear el paciente, quedará disponible para recibir
              recordatorios automáticos 24h y 1h antes de cada turno vía
              WhatsApp o email.
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
                    animation: "cl-spin .7s linear infinite",
                  }}
                />{" "}
                Guardando…
              </>
            ) : isEdit ? (
              "Guardar cambios"
            ) : (
              "Crear paciente"
            )}
          </button>
          <button
            onClick={onClose}
            className="cl-gb"
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
function ActMenu({ cliente, onEdit, onDelete, onAgendar }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = [
    {
      l: "Editar",
      fn: () => {
        onEdit(cliente);
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
      l: "Nuevo turno",
      fn: () => {
        onAgendar(cliente);
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
        onDelete(cliente);
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
        className="cl-gb"
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
          className="cl-dp"
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
              className={it.red ? "cl-red" : ""}
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
export default function Clientes() {
  const navigate = useNavigate();
  const { logout, negocio } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [alert, setAlert] = useState(null); // {msg, type}
  const [drawer, setDrawer] = useState(false);
  const [editData, setEditData] = useState(null);

  const showAlert = (msg, type = "ok") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/clientes");
      setClientes(res.data || []);
    } catch (e) {
      if (e.response?.status === 401) {
        logout();
        navigate("/login");
      } else
        showAlert(
          e.response?.data?.detail || e.message || "Error al cargar pacientes.",
          "err",
        );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleDelete = async (c) => {
    if (!window.confirm(`¿Eliminar a ${c.nombre}?`)) return;
    try {
      await api.delete(`/clientes/${c.id}`);
      setClientes((prev) => prev.filter((x) => x.id !== c.id));
      showAlert("Paciente eliminado.");
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
      setClientes((prev) => prev.map((c) => (c.id === data.id ? data : c)));
    else setClientes((prev) => [data, ...prev]);
    showAlert(
      mode === "edit"
        ? `Paciente actualizado.`
        : `Paciente <b>${data.nombre}</b> creado.`,
    );
  };

  const openNew = () => {
    setEditData(null);
    setDrawer(true);
  };
  const openEdit = (c) => {
    setEditData(c);
    setDrawer(true);
  };
  const handleAgendar = (c) =>
    navigate("/nuevo-turno", {
      state: { clienteId: c.id, clienteNombre: c.nombre },
    });

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      c.nombre?.toLowerCase().includes(q) ||
      c.telefono?.includes(q) ||
      c.email?.toLowerCase().includes(q);
    const matchF =
      filter === "all" ||
      (filter === "phone" && c.telefono) ||
      (filter === "email" && c.email);
    return matchQ && matchF;
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
              Pacientes
            </h1>
            <div style={{ color: C.dim, fontSize: 13.5, marginTop: 5 }}>
              {clientes.length} paciente{clientes.length !== 1 ? "s" : ""}{" "}
              registrados
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
            Nuevo paciente
          </button>
        </div>

        {/* KPIs */}
        <KPIs data={clientes} />

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
              placeholder="Buscar por nombre, teléfono o email..."
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
          {[
            ["all", "Todos"],
            ["phone", "Con teléfono"],
            ["email", "Con email"],
          ].map(([f, l]) => (
            <button
              key={f}
              className={`cl-pill${filter === f ? " cl-on" : ""}`}
              onClick={() => setFilter(f)}
              style={{
                display: "inline-flex",
                alignItems: "center",
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
              {l}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            className="cl-gb"
            onClick={fetchClientes}
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
                  <circle cx="9" cy="7" r="4" />
                  <path d="M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M22 11h-6" />
                </svg>
              </div>
              <div style={{ color: C.dim, fontSize: 14 }}>
                {search
                  ? `Sin resultados para "${search}"`
                  : "No hay pacientes registrados todavía."}
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
                  {["", "Nombre", "Teléfono", "Email", "Acciones"].map(
                    (h, i) => (
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
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={c.id ?? i}
                    className="cl-row"
                    style={{
                      borderBottom: `1px solid rgba(255,255,255,.04)`,
                      transition: ".12s",
                    }}
                  >
                    <td style={{ padding: "13px 16px", width: 52 }}>
                      <Avatar nombre={c.nombre} />
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {c.nombre || "—"}
                    </td>
                    <td style={{ padding: "13px 16px", color: C.dim }}>
                      {c.telefono ? (
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
                          {c.telefono}
                        </span>
                      ) : (
                        <span style={{ color: C.mute, fontSize: 12 }}>
                          — sin teléfono
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px", color: C.dim }}>
                      {c.email ? (
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
                          {c.email}
                        </span>
                      ) : (
                        <span style={{ color: C.mute, fontSize: 12 }}>
                          — sin email
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {c.telefono && (
                          <a
                            href={`https://wa.me/${c.telefono.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "5px 10px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              background: "rgba(37,211,102,.12)",
                              color: "#25d366",
                              boxShadow: "inset 0 0 0 1px rgba(37,211,102,.3)",
                              textDecoration: "none",
                              transition: ".15s",
                            }}
                          >
                            <svg
                              width={13}
                              height={13}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                            WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => handleAgendar(c)}
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
                          Agendar
                        </button>
                        <ActMenu
                          cliente={c}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                          onAgendar={handleAgendar}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Legend */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              color: C.mute,
              fontSize: 12,
              marginTop: 12,
              textAlign: "right",
            }}
          >
            Mostrando {filtered.length} de {clientes.length} paciente
            {clientes.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <ClienteDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        onSaved={handleSaved}
        editData={editData}
      />
    </div>
  );
}
