import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const THEMES = {
  dark: {
    name:"dark",
    pageBg:"#0d0d1a", navBg:"rgba(10,10,22,0.96)", calBg:"rgba(13,13,26,0.98)",
    colHdrBg:"rgba(18,18,36,0.98)", colHdrActive:"rgba(37,99,235,0.15)",
    timeBg:"rgba(10,10,22,0.98)", rowAlt:"rgba(255,255,255,0.012)", weekendBg:"rgba(0,0,0,0.18)",
    blue:"#2563eb", cyan:"#06b6d4", gradient:"linear-gradient(135deg,#2563eb,#06b6d4)",
    text:"#e2e8f0", textSec:"#94a3b8", textDis:"#475569", textTime:"#64748b",
    border:"rgba(51,65,85,0.55)", borderDash:"rgba(51,65,85,0.3)", borderCard:"#1e293b",
    inputBg:"rgba(30,41,59,0.8)", inputBorder:"#334155", toggleBg:"#1e293b",
    shadow:"0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(51,65,85,0.4)",
    font:"'Space Grotesk',sans-serif", fontMono:"'JetBrains Mono',monospace",
    turno:{
      confirmado:   {bg:"rgba(20,184,166,0.16)", border:"rgba(45,212,191,0.5)",  text:"#5eead4", dot:"#2dd4bf"},
      pendiente:    {bg:"rgba(234,179,8,0.14)",  border:"rgba(253,224,71,0.45)", text:"#fde047", dot:"#facc15"},
      cancelado:    {bg:"rgba(239,68,68,0.14)",  border:"rgba(252,165,165,0.45)",text:"#fca5a5", dot:"#f87171"},
      completado:   {bg:"rgba(99,102,241,0.16)", border:"rgba(196,181,253,0.45)",text:"#c4b5fd", dot:"#a78bfa"},
      reprogramado: {bg:"rgba(6,182,212,0.14)",  border:"rgba(103,232,249,0.45)",text:"#67e8f9", dot:"#22d3ee"},
      sugerido:     {bg:"rgba(139,92,246,0.1)",  border:"rgba(167,139,250,0.4)", text:"#c4b5fd", dot:"#8b5cf6", dashed:true},
    },
  },
  light: {
    name:"light",
    pageBg:"#f0f4f8", navBg:"rgba(255,255,255,0.97)", calBg:"#ffffff",
    colHdrBg:"#f8fafc", colHdrActive:"#eff6ff",
    timeBg:"#f8fafc", rowAlt:"rgba(0,0,0,0.012)", weekendBg:"rgba(0,0,0,0.025)",
    blue:"#2563eb", cyan:"#0891b2", gradient:"linear-gradient(135deg,#2563eb,#0891b2)",
    text:"#0f172a", textSec:"#64748b", textDis:"#94a3b8", textTime:"#94a3b8",
    border:"#e2e8f0", borderDash:"rgba(226,232,240,0.7)", borderCard:"#e2e8f0",
    inputBg:"#ffffff", inputBorder:"#cbd5e1", toggleBg:"#f1f5f9",
    shadow:"0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(226,232,240,0.8)",
    font:"'Space Grotesk',sans-serif", fontMono:"'JetBrains Mono',monospace",
    turno:{
      confirmado:   {bg:"#ccfbf1", border:"#5eead4", text:"#134e4a", dot:"#14b8a6"},
      pendiente:    {bg:"#fef9c3", border:"#fde047", text:"#713f12", dot:"#eab308"},
      cancelado:    {bg:"#fee2e2", border:"#fca5a5", text:"#7f1d1d", dot:"#ef4444"},
      completado:   {bg:"#ede9fe", border:"#c4b5fd", text:"#2e1065", dot:"#8b5cf6"},
      reprogramado: {bg:"#cffafe", border:"#67e8f9", text:"#083344", dot:"#06b6d4"},
      sugerido:     {bg:"#f3e8ff", border:"#d8b4fe", text:"#3b0764", dot:"#a855f7", dashed:true},
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLunes(iso){const d=new Date(iso+"T12:00");const diff=d.getDay()===0?-6:1-d.getDay();d.setDate(d.getDate()+diff);return d;}
function addDays(d,n){const r=new Date(d);r.setDate(r.getDate()+n);return r;}
function toISO(d){return d.toISOString().split("T")[0];}
function hoyISO(){return new Date().toISOString().split("T")[0];}
function diaNombre(d){return d.toLocaleDateString("es-AR",{weekday:"short"}).toUpperCase().replace(".","");}
function mesLabel(d){return d.toLocaleDateString("es-AR",{month:"long",year:"numeric"});}
function formatHoraStr(str){
  if(!str)return null;
  try{const d=new Date(str);return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;}
  catch{return null;}
}
function minutosDesde8(h){if(!h)return 0;const[hh,mm]=h.split(":").map(Number);return Math.max(0,(hh-8)*60+(mm||0));}
function useHover(){const [h,s]=useState(false);return [h,{onMouseEnter:()=>s(true),onMouseLeave:()=>s(false)}];}
function useTheme(){
  const [m,set]=useState(()=>{try{return localStorage.getItem("turnoIA_theme")||"dark";}catch{return"dark";}});
  const tog=()=>set(p=>{const n=p==="dark"?"light":"dark";try{localStorage.setItem("turnoIA_theme",n);}catch{}return n;});
  return [m,tog];
}

// ─── Starfield ────────────────────────────────────────────────────────────────
function Starfield(){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext("2d");
    c.width=window.innerWidth;c.height=window.innerHeight;
    const stars=Array.from({length:90},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.1+0.3,o:Math.random()*0.45+0.25,s:Math.random()*0.25+0.08}));
    let raf;
    const draw=()=>{
      ctx.clearRect(0,0,c.width,c.height);
      stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${s.o})`;ctx.fill();s.o+=s.s*0.005;if(s.o>0.8||s.o<0.2)s.s*=-1;});
      raf=requestAnimationFrame(draw);
    };
    draw();
    const resize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};
    window.addEventListener("resize",resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

// ─── Iconos SVG (sin emojis) ──────────────────────────────────────────────────
const IconLogo = ({size=18,color="#fff"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
  </svg>
);
const IconSearch = ({size=14,color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconBell = ({size=15,color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconUser = ({size=15,color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconSun = ({size=13,color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IconMoon = ({size=13,color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IconPlus = ({size=13,color="#fff"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconCalendar = ({size=14,color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconStar = ({size=10,color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
);

// ─── ThemeToggle ──────────────────────────────────────────────────────────────
function ThemeToggle({mode,onToggle,T}){
  const [hov,hp]=useHover();
  const dark=mode==="dark";
  return(
    <button onClick={onToggle} {...hp} title={dark?"Modo claro":"Modo oscuro"} style={{
      display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:99,cursor:"pointer",
      border:`1px solid ${hov?T.cyan:T.borderCard}`,
      background:hov?"rgba(6,182,212,0.1)":T.toggleBg,
      color:hov?T.cyan:T.textSec,fontSize:11,fontWeight:700,fontFamily:T.font,transition:"all .2s",
    }}>
      <span style={{position:"relative",width:26,height:13,borderRadius:99,display:"inline-block",
                    background:dark?T.blue:T.inputBorder,transition:"background .2s",flexShrink:0}}>
        <span style={{position:"absolute",top:2,left:dark?14:2,width:9,height:9,borderRadius:"50%",
                      background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.3)",transition:"left .2s",
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
          {dark ? <IconMoon size={6} color="#475569"/> : <IconSun size={6} color="#f59e0b"/>}
        </span>
      </span>
      {dark?"Oscuro":"Claro"}
    </button>
  );
}

// ─── NavBar ───────────────────────────────────────────────────────────────────
function NavBar({navigate,onLogout,mode,onToggle,T,busqueda,setBusqueda}){
  return(
    <nav style={{
      position:"sticky",top:0,zIndex:200,height:50,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"0 20px",background:T.navBg,
      borderBottom:`1px solid ${T.border}`,
      backdropFilter:"blur(24px)",fontFamily:T.font,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <div style={{
          width:26,height:26,borderRadius:7,background:T.gradient,
          display:"flex",alignItems:"center",justifyContent:"center",marginRight:6,
          boxShadow:mode==="dark"?"0 0 10px rgba(37,99,235,0.4)":"none",
        }}>
          <IconLogo size={14} color="#fff"/>
        </div>
        <span style={{fontWeight:700,fontSize:13,letterSpacing:.5,marginRight:12,
                      background:T.gradient,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          IA
        </span>
        {[{l:"Agenda",p:"/agenda",a:true},{l:"Clientes",p:"/clientes"},{l:"Profesionales",p:"/profesionales"},{l:"Reportes",p:"/reportes"}]
          .map(({l,p,a})=>(
          <NavPill key={p} active={a} onClick={()=>navigate(p)} T={T}>{l}</NavPill>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)"}}>
            <IconSearch size={12} color={T.textDis}/>
          </span>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)}
            placeholder="Buscar..." style={{
              width:170,height:30,padding:"0 10px 0 28px",
              background:T.inputBg,border:`1px solid ${T.inputBorder}`,
              borderRadius:8,fontSize:11,color:T.text,
              fontFamily:T.font,outline:"none",backdropFilter:"blur(10px)",
            }}/>
        </div>
        <div style={{position:"relative",width:30,height:30,borderRadius:"50%",
                     background:T.toggleBg,border:`1px solid ${T.borderCard}`,
                     display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <IconBell size={15} color={T.textSec}/>
          <div style={{position:"absolute",top:3,right:3,width:12,height:12,borderRadius:"50%",
                       background:T.gradient,display:"flex",alignItems:"center",justifyContent:"center",
                       fontSize:7,fontWeight:700,color:"#fff"}}>3</div>
        </div>
        <ThemeToggle mode={mode} onToggle={onToggle} T={T}/>
        <div style={{width:30,height:30,borderRadius:"50%",background:T.gradient,
                     display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <IconUser size={15} color="#fff"/>
        </div>
      </div>
    </nav>
  );
}
function NavPill({children,onClick,active,T}){
  const [hov,hp]=useHover();
  return(
    <button onClick={onClick} {...hp} style={{
      padding:"4px 12px",borderRadius:6,border:"none",cursor:"pointer",
      fontSize:12,fontWeight:active?700:400,fontFamily:T.font,
      background:active?T.gradient:hov?"rgba(255,255,255,0.06)":"transparent",
      color:active?"#fff":hov?T.text:T.textSec,
      WebkitTextFillColor:active?"#fff":undefined,
      transition:"all .15s",
    }}>{children}</button>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function CalToolbar({semanaStart,onPrev,onNext,onHoy,vista,setVista,T,navigate}){
  return(
    <div style={{
      display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"7px 16px",borderBottom:`1px solid ${T.border}`,
      background:T.navBg,backdropFilter:"blur(16px)",flexWrap:"wrap",gap:6,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        <ArrBtn onClick={onPrev} T={T}>‹</ArrBtn>
        <ArrBtn onClick={onNext} T={T}>›</ArrBtn>
        <button onClick={onHoy} style={{
          padding:"3px 10px",borderRadius:6,border:`1px solid ${T.borderCard}`,
          background:"transparent",color:T.textSec,fontSize:11,fontWeight:600,
          cursor:"pointer",fontFamily:T.font,
        }}>Hoy</button>
        <span style={{fontSize:13,fontWeight:600,color:T.text,textTransform:"capitalize",
                      marginLeft:6,fontFamily:T.font}}>
          {mesLabel(semanaStart)}
        </span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <VistaSel vista={vista} setVista={setVista} T={T}/>
        <button onClick={()=>navigate("/nuevo-turno")} style={{
          display:"flex",alignItems:"center",gap:6,
          padding:"5px 14px",border:"none",borderRadius:7,
          background:T.gradient,color:"#fff",fontSize:11,fontWeight:700,
          cursor:"pointer",fontFamily:T.font,
          boxShadow:"0 2px 10px rgba(37,99,235,0.35)",
        }}>
          <IconPlus size={12}/> Nuevo turno
        </button>
      </div>
    </div>
  );
}
function ArrBtn({children,onClick,T}){
  const [hov,hp]=useHover();
  return(
    <button onClick={onClick} {...hp} style={{
      width:26,height:26,border:`1px solid ${T.borderCard}`,borderRadius:6,
      background:hov?"rgba(37,99,235,0.15)":"transparent",
      color:hov?T.cyan:T.textSec,fontSize:15,
      display:"flex",alignItems:"center",justifyContent:"center",
      cursor:"pointer",fontFamily:T.font,transition:"all .12s",
    }}>{children}</button>
  );
}
function VistaSel({vista,setVista,T}){
  return(
    <div style={{display:"flex",background:T.toggleBg,borderRadius:7,padding:2,border:`1px solid ${T.borderCard}`}}>
      {["Día","Semana","Mes"].map(v=>(
        <button key={v} onClick={()=>setVista(v)} style={{
          padding:"3px 10px",borderRadius:5,border:"none",cursor:"pointer",
          fontSize:11,fontWeight:vista===v?700:400,fontFamily:T.font,
          background:vista===v?T.gradient:"transparent",
          color:vista===v?"#fff":T.textDis,transition:"all .15s",
        }}>{v}</button>
      ))}
    </div>
  );
}

// ─── Leyenda ──────────────────────────────────────────────────────────────────
function Leyenda({T,mode}){
  return(
    <div style={{
      display:"flex",alignItems:"center",gap:14,padding:"5px 16px",
      borderBottom:`1px solid ${T.border}`,
      background:mode==="dark"?"rgba(5,5,16,0.4)":"rgba(248,250,252,0.8)",
      flexWrap:"wrap",
    }}>
      <span style={{fontSize:9,fontWeight:700,color:T.textDis,
                    textTransform:"uppercase",letterSpacing:1,fontFamily:T.font}}>
        Estados:
      </span>
      {Object.entries(T.turno).map(([est,c])=>(
        <div key={est} style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:8,height:8,borderRadius:2,background:c.bg,
                       border:`1.5px ${c.dashed?"dashed":"solid"} ${c.border}`}}/>
          <span style={{fontSize:10,color:T.textSec,fontFamily:T.font,textTransform:"capitalize"}}>
            {est}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Bloque de turno ──────────────────────────────────────────────────────────
const HORA_H = 58;

function TurnoBloque({turno,T,mode,onClick}){
  const [hov,hp]=useHover();
  const estado=(turno.estado||"pendiente").toLowerCase();
  const cfg=T.turno[estado]||T.turno.pendiente;
  const horaStr=formatHoraStr(turno.fecha_inicio||turno.fecha_hora);
  const offset=minutosDesde8(horaStr||"08:00");
  const dur=turno.duracion_min||60;
  const top=(offset/60)*HORA_H+4;
  const height=Math.max((dur/60)*HORA_H-6,20);
  const cliente=turno.cliente?.nombre||"Turno";
  const prof=turno.profesional?.nombre?turno.profesional.nombre.split(" ").slice(-1)[0]:null;
  const label=prof?`${cliente} · ${prof}`:cliente;
  const sugerido=estado==="sugerido";

  return(
    <div {...hp} onClick={()=>onClick(turno)} style={{
      position:"absolute",top,left:4,right:4,height,
      background:cfg.bg,border:`1.5px ${sugerido?"dashed":"solid"} ${cfg.border}`,
      borderRadius:6,padding:"3px 7px",cursor:"pointer",overflow:"hidden",
      transition:"all .15s",
      transform:hov?"scale(1.025)":"scale(1)",
      boxShadow:hov?`0 4px 14px ${cfg.dot}44`:"none",
      zIndex:hov?5:1,
      display:"flex",flexDirection:"column",justifyContent:"center",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:4,minWidth:0}}>
        {sugerido
          ? <IconStar size={7} color={cfg.dot}/>
          : <div style={{width:5,height:5,borderRadius:"50%",background:cfg.dot,flexShrink:0}}/>
        }
        <span style={{
          fontSize:height<28?9:10,fontWeight:700,color:cfg.text,
          fontFamily:T.font,overflow:"hidden",textOverflow:"ellipsis",
          whiteSpace:"nowrap",lineHeight:1.2,
        }}>
          {sugerido?`Sugerido IA`:label}
        </span>
      </div>
      {height>=34&&horaStr&&(
        <span style={{fontSize:9,color:cfg.text,opacity:.65,
                      fontFamily:T.fontMono,marginLeft:9,marginTop:1}}>
          {horaStr}
        </span>
      )}
    </div>
  );
}

// ─── Vista semanal ────────────────────────────────────────────────────────────
const HORAS=Array.from({length:10},(_,i)=>i+8);

function VistaSemanal({semanaStart,turnos,T,mode,onTurnoClick}){
  const dias=Array.from({length:7},(_,i)=>addDays(semanaStart,i));
  const hoy=hoyISO();
  const turnosPorDia={};
  dias.forEach(d=>{turnosPorDia[toISO(d)]=[];});
  turnos.forEach(t=>{
    const fecha=(t.fecha_inicio||t.fecha_hora||"").split("T")[0];
    if(turnosPorDia[fecha])turnosPorDia[fecha].push(t);
  });

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header días */}
      <div style={{display:"flex",flexShrink:0,borderBottom:`1px solid ${T.border}`,background:T.colHdrBg}}>
        <div style={{width:54,flexShrink:0,borderRight:`1px solid ${T.border}`}}/>
        {dias.map((d,i)=>{
          const iso=toISO(d);
          const esHoy=iso===hoy;
          const count=turnosPorDia[iso]?.length||0;
          const esFinde=i>=5;
          return(
            <div key={i} style={{
              flex:1,textAlign:"center",padding:"8px 2px 6px",
              borderLeft:`1px solid ${T.border}`,
              background:esHoy?T.colHdrActive:esFinde?T.weekendBg:"transparent",
            }}>
              <div style={{fontSize:9,fontWeight:600,color:T.textSec,
                           textTransform:"uppercase",letterSpacing:1,fontFamily:T.font}}>
                {diaNombre(d)}
              </div>
              <div style={{
                width:28,height:28,borderRadius:"50%",
                background:esHoy?T.gradient:"transparent",
                display:"flex",alignItems:"center",justifyContent:"center",
                margin:"3px auto",
                boxShadow:esHoy&&mode==="dark"?"0 0 10px rgba(37,99,235,0.4)":"none",
              }}>
                <span style={{
                  fontSize:13,fontWeight:700,fontFamily:T.font,
                  color:esHoy?"#fff":esFinde?T.textDis:T.text,
                  WebkitTextFillColor:esHoy?"#fff":undefined,
                }}>{d.getDate()}</span>
              </div>
              <div style={{fontSize:9,fontFamily:T.font,
                           color:count>0?(mode==="dark"?T.cyan:T.blue):T.textDis,
                           fontWeight:count>0?600:400}}>
                {count} turno{count!==1?"s":""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cuerpo */}
      <div style={{flex:1,overflowY:"auto",display:"flex"}}>
        <div style={{width:54,flexShrink:0,borderRight:`1px solid ${T.border}`,
                     background:T.timeBg,position:"sticky",left:0,zIndex:3}}>
          {HORAS.map(h=>(
            <div key={h} style={{height:HORA_H,display:"flex",alignItems:"flex-start",
                                 justifyContent:"flex-end",paddingRight:8,paddingTop:4,
                                 borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:10,color:T.textTime,fontFamily:T.fontMono}}>
                {String(h).padStart(2,"0")}:00
              </span>
            </div>
          ))}
        </div>

        {dias.map((d,di)=>{
          const iso=toISO(d);
          const esHoy=iso===hoy;
          const esFinde=di>=5;
          const dayTurnos=turnosPorDia[iso]||[];
          return(
            <div key={di} style={{
              flex:1,borderLeft:`1px solid ${T.border}`,
              background:esFinde?T.weekendBg:esHoy?(mode==="dark"?"rgba(37,99,235,0.025)":"rgba(37,99,235,0.015)"):"transparent",
              position:"relative",
            }}>
              {HORAS.map(h=>(
                <div key={h} style={{height:HORA_H,borderBottom:`1px solid ${T.border}`,position:"relative"}}>
                  <div style={{position:"absolute",top:HORA_H/2,left:0,right:0,height:1,
                               borderBottom:`1px dashed ${T.borderDash}`}}/>
                </div>
              ))}
              <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,pointerEvents:"none"}}>
                {dayTurnos.map((t,ti)=>(
                  <div key={t.id??ti} style={{pointerEvents:"all"}}>
                    <TurnoBloque turno={t} T={T} mode={mode} onClick={onTurnoClick}/>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function Agenda(){
  const navigate=useNavigate();
  const {logout}=useAuth();
  const [mode,toggleTheme]=useTheme();
  const T=THEMES[mode];
  const [semanaStart,setSS]=useState(()=>getLunes(hoyISO()));
  const [vista,setVista]=useState("Semana");
  const [turnos,setTurnos]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [busqueda,setBusqueda]=useState("");
  const semanaISOs=Array.from({length:7},(_,i)=>toISO(addDays(semanaStart,i)));

  const fetchTurnos=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const results=await Promise.allSettled(semanaISOs.map(fecha=>api.get("/turnos",{params:{fecha}})));
      setTurnos(results.flatMap(r=>r.status==="fulfilled"?(r.value.data||[]):[]));
    }catch(e){setError(e.response?.data?.detail||e.message||"Error al cargar turnos.");}
    finally{setLoading(false);}
  },[semanaStart]);

  useEffect(()=>{fetchTurnos();},[fetchTurnos]);

  const turnosFiltrados=busqueda.trim()
    ?turnos.filter(t=>(t.cliente?.nombre||"").toLowerCase().includes(busqueda.toLowerCase())||(t.profesional?.nombre||"").toLowerCase().includes(busqueda.toLowerCase()))
    :turnos;

  return(
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg);}}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${T.borderCard};border-radius:3px;}
        input::placeholder{color:${T.textDis};}
      `}</style>
      {mode==="dark"&&<Starfield/>}
      <div style={{
        minHeight:"100vh",
        background:mode==="dark"
          ?`radial-gradient(ellipse at 70% 25%,rgba(88,28,235,0.22) 0%,transparent 50%),radial-gradient(ellipse at 15% 80%,rgba(37,99,235,0.12) 0%,transparent 50%),#0d0d1a`
          :T.pageBg,
        fontFamily:T.font,display:"flex",flexDirection:"column",
        position:"relative",zIndex:1,transition:"background .35s",
      }}>
        <NavBar navigate={navigate} onLogout={()=>{logout();navigate("/login");}}
          mode={mode} onToggle={toggleTheme} T={T} busqueda={busqueda} setBusqueda={setBusqueda}/>
        <CalToolbar semanaStart={semanaStart}
          onPrev={()=>setSS(s=>addDays(s,-7))} onNext={()=>setSS(s=>addDays(s,7))}
          onHoy={()=>setSS(getLunes(hoyISO()))}
          vista={vista} setVista={setVista} T={T} navigate={navigate}/>
        <Leyenda T={T} mode={mode}/>
        <div style={{
          flex:1,margin:"10px 14px 14px",borderRadius:12,
          border:`1px solid ${T.border}`,background:T.calBg,
          backdropFilter:"blur(20px)",boxShadow:T.shadow,
          overflow:"hidden",display:"flex",flexDirection:"column",
          minHeight:0,transition:"background .35s",
        }}>
          {loading?(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",
                         padding:"48px",gap:12,color:T.textSec,fontFamily:T.font}}>
              <div style={{width:26,height:26,borderRadius:"50%",
                           border:`2px solid ${T.borderCard}`,borderTopColor:T.cyan,
                           animation:"spin .7s linear infinite"}}/>
              <span style={{fontSize:13}}>Cargando turnos...</span>
            </div>
          ):error?(
            <div style={{margin:16,padding:"10px 14px",borderRadius:8,
                         background:"rgba(239,68,68,0.12)",border:"1px solid rgba(248,113,113,0.3)",
                         color:mode==="dark"?"#fca5a5":"#991b1b",fontSize:13,fontFamily:T.font,
                         display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>{error}</span>
              <button onClick={fetchTurnos} style={{background:"none",border:"none",cursor:"pointer",
                fontWeight:700,fontSize:12,color:"inherit",fontFamily:T.font}}>Reintentar</button>
            </div>
          ):(
            <VistaSemanal semanaStart={semanaStart} turnos={turnosFiltrados}
              T={T} mode={mode} onTurnoClick={t=>navigate(`/turnos/${t.id}`)}/>
          )}
        </div>
      </div>
    </>
  );
}
