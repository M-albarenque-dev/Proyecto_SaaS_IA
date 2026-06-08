import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const EMAIL_RE = /\S+@\S+\.\S+/;

const SvgMail = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const SvgLock = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const SvgUser = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const SvgEye = ({ open }) =>
  open ? (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const cardRef = useRef(null);

  const [view, setView] = useState("login"); // 'login' | 'register' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", msg: "" });

  const [lEmail, setLEmail] = useState("");
  const [lPass, setLPass] = useState("");
  const [lShowPass, setLShowPass] = useState(false);
  const [lErr, setLErr] = useState({});

  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPass, setRPass] = useState("");
  const [rShowPass, setRShowPass] = useState(false);
  const [rErr, setRErr] = useState({});

  const [fEmail, setFEmail] = useState("");
  const [fErr, setFErr] = useState({});
  const [stars, setStars] = useState([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        size: Math.random() * 2 + 0.5,
        left: Math.random() * 100,
        top: Math.random() * 100,
        dur: (Math.random() * 3 + 2).toFixed(1),
        delay: (Math.random() * 4).toFixed(1),
      })),
    );
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      const card = cardRef.current;
      if (!card) return;
      const { left, top, width, height } = card.getBoundingClientRect();
      const dx = (e.clientX - (left + width / 2)) / window.innerWidth;
      const dy = (e.clientY - (top + height / 2)) / window.innerHeight;
      card.style.transform = `perspective(1000px) rotateY(${dx * 8}deg) rotateX(${-dy * 8}deg)`;
    };
    const onLeave = () => {
      if (cardRef.current) cardRef.current.style.transform = "";
    };
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const clearAlert = () => setAlert({ type: "", msg: "" });
  const switchView = (v) => {
    setView(v);
    clearAlert();
    setLErr({});
    setRErr({});
    setFErr({});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearAlert();
    const errs = {};
    if (!EMAIL_RE.test(lEmail.trim())) errs.email = "Email inválido";
    if (lPass.length < 6) errs.pass = "Mínimo 6 caracteres";
    if (Object.keys(errs).length) {
      setLErr(errs);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        email: lEmail.trim(),
        password: lPass,
      });
      const token = data.access_token || data.token;
      if (!token) throw new Error("Sin token");
      login(token);
      navigate(location.state?.from?.pathname || "/agenda", { replace: true });
    } catch (err) {
      setAlert({
        type: "danger",
        msg:
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Credenciales incorrectas.",
      });
      setLErr({ email: true, pass: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearAlert();
    const errs = {};
    if (!rName.trim()) errs.name = "Nombre requerido";
    if (!EMAIL_RE.test(rEmail.trim())) errs.email = "Email inválido";
    if (rPass.length < 6) errs.pass = "Mínimo 6 caracteres";
    if (Object.keys(errs).length) {
      setRErr(errs);
      return;
    }
    setLoading(true);
    const slug = rName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
    try {
      await api.post("/auth/register", {
        nombre: rName.trim(),
        email: rEmail.trim(),
        password: rPass,
        slug,
      });
      const { data } = await api.post("/auth/login", {
        email: rEmail.trim(),
        password: rPass,
      });
      login(data.access_token || data.token);
      navigate("/agenda", { replace: true });
    } catch (err) {
      setAlert({
        type: "danger",
        msg:
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Error al registrarse.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setErrorMsg("Esta función estará disponible en la próxima versión");
  };

  return (
    <div className="scene">
      <div className="nebula" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="stars">
        {stars.map((s) => (
          <div
            key={s.id}
            className="star"
            style={{
              width: s.size,
              height: s.size,
              left: `${s.left}%`,
              top: `${s.top}%`,
              "--dur": `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="card" ref={cardRef}>
        <div className="corner corner-tl" />
        <div className="corner corner-tr" />
        <div className="corner corner-bl" />
        <div className="corner corner-br" />

        <div className="logo-wrap">
          <div className="logo-icon">
            <svg viewBox="0 0 26 26" fill="none">
              <circle
                cx="13"
                cy="11"
                r="5.5"
                stroke="white"
                strokeWidth="1.8"
              />
              <path
                d="M13 16.5V22M9 22h8"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="19.5" cy="6.5" r="2.5" fill="#00EEFF" opacity="0.9" />
            </svg>
          </div>
          <div className="logo-name">TurnoIA</div>
          <div className="logo-tagline">Gestión inteligente de turnos</div>
        </div>

        {view === "forgot" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <button
              type="button"
              onClick={() => switchView("login")}
              style={{
                background: "rgba(0,168,255,0.1)",
                border: "1px solid rgba(0,168,255,0.2)",
                borderRadius: 10,
                color: "#00EEFF",
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "Outfit,sans-serif",
                outline: "none",
              }}
            >
              ← Volver
            </button>
            <h3
              style={{
                fontFamily: "Syne,sans-serif",
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              Recuperar contraseña
            </h3>
          </div>
        ) : (
          <div className="tabs" role="tablist">
            <button
              className={`tab-btn ${view === "login" ? "active" : ""}`}
              onClick={() => switchView("login")}
              role="tab"
            >
              Iniciar sesión
            </button>
            <button
              className={`tab-btn ${view === "register" ? "active" : ""}`}
              onClick={() => switchView("register")}
              role="tab"
            >
              Registrarse
            </button>
          </div>
        )}

        {alert.msg && (
          <div className={`alert-box alert-${alert.type}`}>
            <span>{alert.type === "danger" ? "⚠️" : "✅"}</span>
            <span>{alert.msg}</span>
          </div>
        )}

        {view === "login" && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <SvgMail />
                </span>
                <input
                  className={`form-input ${lErr.email ? "input-error" : ""}`}
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  value={lEmail}
                  onChange={(e) => {
                    setLEmail(e.target.value);
                    setLErr((p) => ({ ...p, email: "" }));
                  }}
                />
              </div>
              {lErr.email && (
                <span className="field-error-text">{lErr.email}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <SvgLock />
                </span>
                <input
                  className={`form-input form-input-password ${lErr.pass ? "input-error" : ""}`}
                  type={lShowPass ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={lPass}
                  onChange={(e) => {
                    setLPass(e.target.value);
                    setLErr((p) => ({ ...p, pass: "" }));
                  }}
                />
                <button
                  className="password-toggle-btn"
                  type="button"
                  onClick={() => setLShowPass((p) => !p)}
                  tabIndex="-1"
                >
                  <SvgEye open={lShowPass} />
                </button>
              </div>
              {lErr.pass && (
                <span className="field-error-text">{lErr.pass}</span>
              )}
              <div className="forgot">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    switchView("forgot");
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Verificando…" : "Iniciar sesión"}
            </button>
          </form>
        )}

        {view === "register" && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <SvgUser />
                </span>
                <input
                  className={`form-input ${rErr.name ? "input-error" : ""}`}
                  type="text"
                  placeholder="Dr. Martín García"
                  value={rName}
                  onChange={(e) => {
                    setRName(e.target.value);
                    setRErr((p) => ({ ...p, name: "" }));
                  }}
                />
              </div>
              {rErr.name && (
                <span className="field-error-text">{rErr.name}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Email profesional</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <SvgMail />
                </span>
                <input
                  className={`form-input ${rErr.email ? "input-error" : ""}`}
                  type="email"
                  placeholder="tu@consultorio.com"
                  value={rEmail}
                  onChange={(e) => {
                    setREmail(e.target.value);
                    setRErr((p) => ({ ...p, email: "" }));
                  }}
                />
              </div>
              {rErr.email && (
                <span className="field-error-text">{rErr.email}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <SvgLock />
                </span>
                <input
                  className={`form-input form-input-password ${rErr.pass ? "input-error" : ""}`}
                  type={rShowPass ? "text" : "password"}
                  placeholder="Mín. 6 caracteres"
                  value={rPass}
                  onChange={(e) => {
                    setRPass(e.target.value);
                    setRErr((p) => ({ ...p, pass: "" }));
                  }}
                />
                <button
                  className="password-toggle-btn"
                  type="button"
                  onClick={() => setRShowPass((p) => !p)}
                  tabIndex="-1"
                >
                  <SvgEye open={rShowPass} />
                </button>
              </div>
              {rErr.pass && (
                <span className="field-error-text">{rErr.pass}</span>
              )}
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Registrando…" : "Crear cuenta gratis"}
            </button>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={handleForgot}>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              Introducí tu email profesional y te enviaremos un enlace seguro
              para restablecer tu contraseña.
            </p>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <SvgMail />
                </span>
                <input
                  className={`form-input ${fErr.email ? "input-error" : ""}`}
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  value={fEmail}
                  onChange={(e) => {
                    setFEmail(e.target.value);
                    setFErr({});
                  }}
                />
              </div>
              {fErr.email && (
                <span className="field-error-text">{fErr.email}</span>
              )}
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Enviando…" : "Enviar enlace de recuperación"}
            </button>
          </form>
        )}

        <div className="card-footer">
          {view === "forgot" ? (
            <span>
              ¿Recordaste tu contraseña?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  switchView("login");
                }}
              >
                Iniciá sesión
              </a>
            </span>
          ) : view === "login" ? (
            <span>
              ¿No tenés cuenta?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  switchView("register");
                }}
              >
                Registrate gratis
              </a>
            </span>
          ) : (
            <span>
              ¿Ya tenés cuenta?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  switchView("login");
                }}
              >
                Iniciá sesión
              </a>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
