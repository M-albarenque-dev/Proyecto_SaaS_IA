import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function App() {
  // --- AUTH STATES ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [businessName, setBusinessName] = useState('');
  
  // --- VIEW STATES ---
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [isForgotView, setIsForgotView] = useState(false);
  
  // --- FORM STATES ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  // --- PASSWORD VISIBILITY STATES ---
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // --- FIELD ERROR STATES ---
  const [emailErr, setEmailErr] = useState(false);
  const [passwordErr, setPasswordErr] = useState(false);
  const [regNameErr, setRegNameErr] = useState(false);
  const [regEmailErr, setRegEmailErr] = useState(false);
  const [regPassErr, setRegPassErr] = useState(false);
  const [forgotEmailErr, setForgotEmailErr] = useState(false);

  // --- INPUT REFS FOR AUTO-FOCUS ---
  const loginEmailRef = useRef(null);
  const registerNameRef = useRef(null);
  const forgotEmailRef = useRef(null);
  
  // --- ACTION LOADING STATES ---
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // --- DATA STATES ---
  const [turnos, setTurnos] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // --- BACKGROUND & INTERACTION STATES ---
  const [stars, setStars] = useState([]);
  const cardRef = useRef(null);
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  // --- STARS GENERATION ---
  useEffect(() => {
    const starList = [];
    for (let i = 0; i < 80; i++) {
      const size = Math.random() * 2 + 0.5;
      starList.push({
        id: i,
        size,
        left: Math.random() * 100,
        top: Math.random() * 100,
        dur: (Math.random() * 3 + 2).toFixed(1),
        delay: (Math.random() * 4).toFixed(1),
        opacity: (Math.random() * 0.3 + 0.05).toFixed(2),
      });
    }
    setStars(starList);
  }, []);

  // --- AUTO-FOCUS & ERROR RESET EFFECT ---
  useEffect(() => {
    if (isAuthenticated) return;
    
    if (isForgotView) {
      setTimeout(() => {
        if (forgotEmailRef.current) forgotEmailRef.current.focus();
      }, 50);
    } else if (activeTab === 'login') {
      setTimeout(() => {
        if (loginEmailRef.current) loginEmailRef.current.focus();
      }, 50);
    } else {
      setTimeout(() => {
        if (registerNameRef.current) registerNameRef.current.focus();
      }, 50);
    }
    
    // Clear alerts on switch
    setErrorMsg('');
    setSuccessMsg('');
    setEmailErr(false);
    setPasswordErr(false);
    setRegNameErr(false);
    setRegEmailErr(false);
    setRegPassErr(false);
    setForgotEmailErr(false);
  }, [activeTab, isForgotView, isAuthenticated]);

  // --- CARD PARALLAX EFFECT ---
  useEffect(() => {
    if (isAuthenticated) return;

    const handleMouseMove = (e) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / window.innerWidth;
      const dy = (e.clientY - cy) / window.innerHeight;
      // Soft angle rotation (8 degrees max)
      card.style.transform = `perspective(1000px) rotateY(${dx * 8}deg) rotateX(${-dy * 8}deg)`;
    };

    const handleMouseLeave = () => {
      const card = cardRef.current;
      if (card) {
        card.style.transform = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Add event listener directly to clean up properly
    const cardEl = cardRef.current;
    if (cardEl) {
      cardEl.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (cardEl) {
        cardEl.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [isAuthenticated, activeTab]); // Rebind if view toggles

  // --- SYNC AUTH TOKEN AND DETAILS ---
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      fetchBusinessDetails(token);
      fetchTurnos(token);
    } else {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setBusinessName('');
      setTurnos([]);
    }
  }, [token]);

  // --- API CALLS ---
  const fetchBusinessDetails = async (authToken) => {
    try {
      const res = await axios.get(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setBusinessName(res.data.nombre);
    } catch (err) {
      console.error('Error al obtener datos del negocio:', err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchTurnos = async (authToken) => {
    setDbLoading(true);
    setDbError(null);
    try {
      const res = await axios.get(`${apiUrl}/turnos`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setTurnos(res.data);
    } catch (err) {
      console.error('Error al conectar con la API:', err);
      setDbError('No se pudo conectar con el servidor para obtener los turnos.');
    } finally {
      setDbLoading(false);
    }
  };

  // Generate URL slug from Full Name
  const generateSlug = (text) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD') // splits accents into base characters + accent marks
      .replace(/[\u0300-\u036f]/g, '') // removes accent marks
      .trim()
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/[^\w\-]+/g, '') // remove all non-word chars
      .replace(/\-\-+/g, '-') // replace multiple hyphens with single
      .replace(/^-+/, '') // trim leading hyphen
      .replace(/-+$/, ''); // trim trailing hyphen
  };

  // --- ACTIONS ---
  const getErrorMessage = (err, defaultMsg) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(d => {
        const field = d.loc && d.loc.length > 1 ? d.loc.slice(1).join('.') : '';
        return `${field ? field + ': ' : ''}${d.msg || JSON.stringify(d)}`;
      }).join(' | ');
    }
    return defaultMsg;
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setEmailErr(false);
    setPasswordErr(false);
    setActionLoading(true);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailErr(true);
      setErrorMsg('Por favor introduce tu dirección de email.');
      setActionLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setEmailErr(true);
      setErrorMsg('Por favor introduce una dirección de email válida.');
      setActionLoading(false);
      return;
    }

    if (!password) {
      setPasswordErr(true);
      setErrorMsg('Por favor introduce tu contraseña.');
      setActionLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${apiUrl}/auth/login`, {
        email: trimmedEmail,
        password
      });
      setToken(res.data.access_token);
      setSuccessMsg('¡Sesión iniciada con éxito!');
    } catch (err) {
      console.error('Login error:', err);
      const msg = getErrorMessage(err, 'Las credenciales proporcionadas no son válidas.');
      setErrorMsg(msg);
      // Highlight fields on failure
      setEmailErr(true);
      setPasswordErr(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setRegNameErr(false);
    setRegEmailErr(false);
    setRegPassErr(false);
    setActionLoading(true);

    const trimmedName = regName.trim();
    const trimmedEmail = regEmail.trim();

    if (!trimmedName) {
      setRegNameErr(true);
      setErrorMsg('Por favor introduce tu nombre completo.');
      setActionLoading(false);
      return;
    }

    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setRegEmailErr(true);
      setErrorMsg('Por favor introduce un email profesional válido.');
      setActionLoading(false);
      return;
    }

    if (regPass.length < 8) {
      setRegPassErr(true);
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      setActionLoading(false);
      return;
    }

    const businessSlug = generateSlug(trimmedName);
    if (!businessSlug) {
      setRegNameErr(true);
      setErrorMsg('Por favor introduce un nombre válido.');
      setActionLoading(false);
      return;
    }

    try {
      // Register
      await axios.post(`${apiUrl}/auth/register`, {
        nombre: trimmedName,
        slug: businessSlug,
        email: trimmedEmail,
        password: regPass
      });

      setSuccessMsg('Registro exitoso. Iniciando sesión...');
      
      // Auto Login
      const loginRes = await axios.post(`${apiUrl}/auth/login`, {
        email: trimmedEmail,
        password: regPass
      });
      setToken(loginRes.data.access_token);
    } catch (err) {
      console.error('Registration error:', err);
      const msg = getErrorMessage(err, 'El email profesional o el nombre de negocio ya se encuentra registrado.');
      setErrorMsg(msg);
      
      if (msg.toLowerCase().includes('email')) {
        setRegEmailErr(true);
      } else if (msg.toLowerCase().includes('slug') || msg.toLowerCase().includes('nombre')) {
        setRegNameErr(true);
      } else {
        setRegEmailErr(true);
        setRegNameErr(true);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setForgotEmailErr(false);
    setActionLoading(true);

    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setForgotEmailErr(true);
      setErrorMsg('Por favor introduce un dirección de email válida.');
      setActionLoading(false);
      return;
    }

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccessMsg('Si tu correo está registrado, recibirás un enlace de recuperación en breve.');
      setForgotEmail('');
    } catch (err) {
      setErrorMsg('Ocurrió un error al enviar el correo. Inténtalo más tarde.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setEmail('');
    setPassword('');
    setRegName('');
    setRegEmail('');
    setRegPass('');
    setForgotEmail('');
    setErrorMsg('');
    setSuccessMsg('');
    setEmailErr(false);
    setPasswordErr(false);
    setRegNameErr(false);
    setRegEmailErr(false);
    setRegPassErr(false);
    setForgotEmailErr(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setIsForgotView(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="scene">
      {/* Background elements */}
      <div className="nebula"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      
      {/* Star Particles */}
      <div className="stars">
        {stars.map((s) => (
          <div
            key={s.id}
            className="star"
            style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              left: `${s.left}%`,
              top: `${s.top}%`,
              '--dur': `${s.dur}s`,
              animationDelay: `${s.delay}s`,
              opacity: s.opacity,
            }}
          ></div>
        ))}
      </div>

      {/* Main Container: Auth or Dashboard */}
      {!isAuthenticated ? (
        <div className="card" id="card" ref={cardRef}>
          {/* Card Brackets */}
          <div className="corner corner-tl"></div>
          <div className="corner corner-tr"></div>
          <div className="corner corner-bl"></div>
          <div className="corner corner-br"></div>

          {/* Logo Section */}
          <div className="logo-wrap">
            <div className="logo-icon">
              <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="13" cy="11" r="5.5" stroke="white" stroke-width="1.8" />
                <path d="M13 16.5V22M9 22h8" stroke="white" stroke-width="1.8" stroke-linecap="round" />
                <path d="M8 8.5C8 8.5 6 10 6 12" stroke="rgba(255,255,255,0.5)" stroke-width="1.4" stroke-linecap="round" />
                <circle cx="19.5" cy="6.5" r="2.5" fill="#00EEFF" opacity="0.9" />
                <path d="M18.8 6.5h1.4M19.5 5.8v1.4" stroke="white" stroke-width="1.2" stroke-linecap="round" />
              </svg>
            </div>
            <div className="logo-name">TurnoIA</div>
            <div className="logo-tagline">Gestión inteligente de turnos</div>
          </div>

          {/* Tabs / Header */}
          {isForgotView ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <button 
                type="button"
                onClick={() => setIsForgotView(false)} 
                style={{
                  background: 'rgba(0, 168, 255, 0.1)',
                  border: '1px solid rgba(0, 168, 255, 0.2)',
                  borderRadius: '10px',
                  color: '#00EEFF',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  fontFamily: 'Outfit, sans-serif',
                  outline: 'none'
                }}
              >
                ← Volver
              </button>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: '700', color: '#fff' }}>Recuperar contraseña</h3>
            </div>
          ) : (
            <div className="tabs" role="tablist">
              <button
                className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => switchTab('login')}
                role="tab"
                aria-selected={activeTab === 'login'}
              >
                Iniciar sesión
              </button>
              <button
                className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => switchTab('register')}
                role="tab"
                aria-selected={activeTab === 'register'}
              >
                Registrarse
              </button>
            </div>
          )}

          {/* Notifications */}
          {errorMsg && (
            <div className="alert-box alert-danger">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="alert-box alert-success">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login Panel */}
          {!isForgotView && activeTab === 'login' && (
            <form onSubmit={handleLogin} id="panel-login">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    ref={loginEmailRef}
                    className={`form-input ${emailErr ? 'input-error' : ''}`}
                    type="email"
                    id="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailErr(false); setErrorMsg(''); }}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password">Contraseña</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    className={`form-input form-input-password ${passwordErr ? 'input-error' : ''}`}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordErr(false); setErrorMsg(''); }}
                    required
                  />
                  <button
                    className="password-toggle-btn"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="forgot"><a href="#" onClick={(e) => { e.preventDefault(); setIsForgotView(true); }}>¿Olvidaste tu contraseña?</a></div>
              </div>
              
              <button className="btn-primary" type="submit" disabled={actionLoading}>
                {actionLoading ? 'Verificando…' : 'Iniciar sesión'}
              </button>

              <div className="divider">
                <div className="divider-line"></div>
                <span className="divider-text">o continuá con</span>
                <div className="divider-line"></div>
              </div>

              <div className="social-row">
                <button className="btn-social" type="button" onClick={() => setSuccessMsg('Accediendo con Google (Demo)...')}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button className="btn-social" type="button" onClick={() => setSuccessMsg('Accediendo con X (Demo)...')}>
                  <svg viewBox="0 0 24 24" fill="white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X
                </button>
              </div>
            </form>
          )}

          {/* Register Panel */}
          {!isForgotView && activeTab === 'register' && (
            <form onSubmit={handleRegister} id="panel-register">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Nombre completo</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </span>
                  <input
                    ref={registerNameRef}
                    className={`form-input ${regNameErr ? 'input-error' : ''}`}
                    type="text"
                    id="reg-name"
                    placeholder="Dr. Martín García"
                    value={regName}
                    onChange={(e) => { setRegName(e.target.value); setRegNameErr(false); setErrorMsg(''); }}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email profesional</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    className={`form-input ${regEmailErr ? 'input-error' : ''}`}
                    type="email"
                    id="reg-email"
                    placeholder="tu@consultorio.com"
                    value={regEmail}
                    onChange={(e) => { setRegEmail(e.target.value); setRegEmailErr(false); setErrorMsg(''); }}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-pass">Contraseña</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    className={`form-input form-input-password ${regPassErr ? 'input-error' : ''}`}
                    type={showRegPassword ? 'text' : 'password'}
                    id="reg-pass"
                    placeholder="Mín. 8 caracteres"
                    value={regPass}
                    onChange={(e) => { setRegPass(e.target.value); setRegPassErr(false); setErrorMsg(''); }}
                    required
                  />
                  <button
                    className="password-toggle-btn"
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    tabIndex="-1"
                    title={showRegPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showRegPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button className="btn-primary" type="submit" disabled={actionLoading}>
                {actionLoading ? 'Registrando…' : 'Crear cuenta gratis'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.22)', marginTop: '14px', lineHeight: '1.6' }}>
                Al registrarte aceptás nuestros <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'rgba(0,238,255,0.5)', textDecoration: 'none' }}>Términos de uso</a> y <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'rgba(0,238,255,0.5)', textDecoration: 'none' }}>Privacidad</a>
              </p>
            </form>
          )}

          {/* Forgot Password Panel */}
          {isForgotView && (
            <form onSubmit={handleForgotPassword} id="panel-forgot">
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '20px', lineHeight: '1.5' }}>
                Introduce tu correo electrónico profesional y te enviaremos un enlace seguro para restablecer tu contraseña.
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Email</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    ref={forgotEmailRef}
                    className={`form-input ${forgotEmailErr ? 'input-error' : ''}`}
                    type="email"
                    id="forgot-email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotEmailErr(false); setErrorMsg(''); }}
                    required
                  />
                </div>
              </div>
              <button className="btn-primary" type="submit" disabled={actionLoading}>
                {actionLoading ? 'Enviando…' : 'Enviar enlace de recuperación'}
              </button>
            </form>
          )}

          <div className="card-footer">
            {isForgotView ? (
              <span id="footer-text">
                ¿Recordaste tu contraseña?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsForgotView(false); switchTab('login'); }}>
                  Iniciá sesión
                </a>
              </span>
            ) : activeTab === 'login' ? (
              <span id="footer-text">
                ¿No tenés cuenta?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); switchTab('register'); }}>
                  Registrate gratis
                </a>
              </span>
            ) : (
              <span id="footer-text">
                ¿Ya tenés cuenta?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); switchTab('login'); }}>
                  Iniciá sesión
                </a>
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Authenticated Dashboard View */
        <div className="dashboard-container">
          {/* Top Bar */}
          <header className="header">
            <div className="logo-area">
              <span className="logo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #010094, #00A8FF)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ color: '#fff' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <div>
                <h1 className="title">TurnoIA</h1>
                <p className="subtitle">Gestión de turnos inteligente</p>
              </div>
            </div>
            
            <div className="session-info">
              <div className="user-badge">{businessName || 'Cargando Negocio...'}</div>
              <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
            </div>
          </header>

          {/* Main Dashboard Section */}
          <main className="main-content">
            <section className="card">
              <div className="card-header">
                <h2 className="card-title">Agenda de Turnos</h2>
                <span className="badge-success">Estado: Conectado</span>
              </div>

              {dbLoading ? (
                <div className="loading-state">
                  <span className="spinner"></span>
                  <p>Cargando información del servidor...</p>
                </div>
              ) : dbError ? (
                <div className="error-state">
                  <p>⚠️ {dbError}</p>
                  <button className="action-button" style={{ marginTop: '12px' }} onClick={() => fetchTurnos(token)}>Reintentar</button>
                </div>
              ) : turnos.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: '2.5rem' }}>📅</div>
                  <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>No hay turnos registrados</h3>
                  <p style={{ fontSize: '13px', maxWidth: '300px', margin: '0 auto' }}>Tus clientes o consultorios asociados aparecerán aquí cuando reserven un turno.</p>
                </div>
              ) : (
                <div className="data-list">
                  {turnos.map((turno) => {
                    const formattedDate = new Date(turno.fecha_hora).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    return (
                      <div key={turno.id} className="list-item">
                        <div className="item-info">
                          <span className="item-time">
                            🕒 {formattedDate}
                          </span>
                          <span className="item-status">
                            Estado: <span className="status-highlight">{turno.estado}</span>
                          </span>
                        </div>
                        <button className="action-button">Gestionar</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;