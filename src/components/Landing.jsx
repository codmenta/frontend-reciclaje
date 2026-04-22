import { useEffect, useRef, useState } from "react";
import { Leaf, ArrowRight, MapPin, Star, Recycle, Gift, Users, TreePine, ShieldCheck, Zap, Menu, X, BarChart3 } from "lucide-react";
import { PUNTOS_RECOLECCION, MATERIALES } from "../mockData.js";

const PASOS = [
  { paso: "01", emoji: "♻️", title: "Recolecta y Separa", desc: "Separa tus residuos en casa: plástico, vidrio, cartón y metal.", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { paso: "02", emoji: "📍", title: "Encuentra un Punto", desc: "Ubica el punto más cercano en el mapa y lleva tus materiales.", color: "bg-green-50 text-green-600 border-green-200" },
  { paso: "03", emoji: "⭐", title: "Gana Puntos", desc: "Pesa tus materiales y acumula puntos según tipo y cantidad.", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { paso: "04", emoji: "🎁", title: "Canjea Premios", desc: "Usa tus puntos para obtener productos eco-amigables.", color: "bg-purple-50 text-purple-600 border-purple-200" },
];

function MapaLanding() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([2.4419, -76.6063], 13);
      mapInstanceRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);
      const mkIcon = (c) => L.divIcon({ className: "", html: `<div style="width:18px;height:18px;border-radius:50%;background:${c};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>`, iconSize:[18,18], iconAnchor:[9,9], popupAnchor:[0,-12] });
      const icons = { verde: mkIcon("#16a34a"), ambar: mkIcon("#f59e0b"), rojo: mkIcon("#ef4444") };
      const render = (puntos) => puntos.forEach((p) => {
        if (!p.latitud || !p.longitud) return;
        const n = p.nivelLlenado||0, a=p.activo!==false;
        const ch = !a||n>=80?"#ef4444":n>=50?"#f59e0b":"#16a34a";
        const ic = !a||n>=80?icons.rojo:n>=50?icons.ambar:icons.verde;
        const est = !a?"🔴 Inactivo":n>=80?"🔴 Lleno":n>=50?"🟡 Medio":"🟢 Disponible";
        L.marker([p.latitud,p.longitud],{icon:ic}).addTo(map).bindPopup(`
          <div style="font-family:system-ui;padding:4px;min-width:210px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <div style="width:9px;height:9px;border-radius:50%;background:${ch}"></div>
              <strong style="font-size:13px;color:#111">${p.nombre}</strong>
            </div>
            <p style="font-size:11px;color:#6b7280;margin:0 0 8px">📍 ${p.direccion}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:5px">
                <p style="font-size:9px;color:#9ca3af;margin:0 0 1px;font-weight:700;text-transform:uppercase">Horario</p>
                <p style="font-size:11px;color:#374151;margin:0">🕒 ${p.horario||"Lun-Sáb 8am-6pm"}</p>
              </div>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:5px">
                <p style="font-size:9px;color:#9ca3af;margin:0 0 1px;font-weight:700;text-transform:uppercase">Estado</p>
                <p style="font-size:11px;font-weight:700;margin:0">${est}</p>
              </div>
            </div>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:6px;margin-bottom:8px">
              <p style="font-size:9px;color:#16a34a;margin:0 0 2px;font-weight:700;text-transform:uppercase">♻️ Acepta</p>
              <p style="font-size:11px;color:#374151;margin:0">${(p.tiposPlastico||[]).slice(0,3).join(", ")}</p>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">
              <span style="font-weight:600;color:#6b7280">Llenado</span>
              <span style="color:${ch};font-weight:800">${n}%</span>
            </div>
            <div style="height:7px;background:#e5e7eb;border-radius:4px;overflow:hidden">
              <div style="height:100%;width:${n}%;background:${ch};border-radius:4px"></div>
            </div>
          </div>`,{ maxWidth:270 });
      });
      fetch("http://localhost:8080/api/puntos/todos").then(r=>r.ok?r.json():Promise.reject()).then(render).catch(()=>render(PUNTOS_RECOLECCION));
    });
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current=null; } };
  }, []);
  return <div ref={mapRef} className="w-full h-full" />;
}

const Landing = ({ irALogin, irARegistro }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const disp = PUNTOS_RECOLECCION.filter(p=>p.activo&&p.nivelLlenado<80).length;
  const med = PUNTOS_RECOLECCION.filter(p=>p.nivelLlenado>=50&&p.nivelLlenado<80).length;
  const llenos = PUNTOS_RECOLECCION.filter(p=>!p.activo||p.nivelLlenado>=80).length;
  return (
    <div className="min-h-screen bg-white font-sans">
      <style>{`.leaflet-popup-content-wrapper{border-radius:14px!important;box-shadow:0 8px 30px rgba(0,0,0,.12)!important;border:1px solid #e5e7eb;padding:0!important}.leaflet-popup-content{margin:0!important;padding:12px 14px!important}.leaflet-popup-tip{background:white!important}.leaflet-control-attribution{font-size:8px!important}`}</style>

      {/* NAV */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-sm"><Leaf className="w-5 h-5 text-white" /></div>
              <span className="text-green-800 font-bold text-lg tracking-tight">PlastiUsos</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-500 font-medium">
              <a href="#mapa" className="hover:text-green-700 transition-colors">Puntos de Reciclaje</a>
              <a href="#como-funciona" className="hover:text-green-700 transition-colors">¿Cómo Funciona?</a>
              <a href="#materiales" className="hover:text-green-700 transition-colors">Materiales</a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button onClick={irALogin} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-colors">Iniciar Sesión</button>
              <button onClick={irARegistro} className="px-4 py-2 text-sm font-semibold bg-green-600 text-white hover:bg-green-700 rounded-xl shadow-sm transition-colors">Registrarme</button>
            </div>
            <button onClick={()=>setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">{menuOpen?<X className="w-5 h-5"/>:<Menu className="w-5 h-5"/>}</button>
          </div>
        </div>
        {menuOpen&&(
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2 shadow-lg">
            <a href="#mapa" onClick={()=>setMenuOpen(false)} className="block py-2 text-sm text-gray-600">Puntos de Reciclaje</a>
            <a href="#como-funciona" onClick={()=>setMenuOpen(false)} className="block py-2 text-sm text-gray-600">¿Cómo Funciona?</a>
            <a href="#materiales" onClick={()=>setMenuOpen(false)} className="block py-2 text-sm text-gray-600">Materiales</a>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button onClick={irALogin} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl">Iniciar Sesión</button>
              <button onClick={irARegistro} className="flex-1 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-xl">Registrarme</button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="bg-white pt-12 pb-8 text-center px-4">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-5">
          <Leaf className="w-3.5 h-3.5 text-green-600"/>
          <span className="text-green-700 text-xs font-semibold tracking-wide">Plataforma de Reciclaje · Popayán, Cauca</span>
        </div>
        <h1 className="text-gray-900 text-3xl sm:text-5xl font-extrabold leading-tight mb-4">
          Recicla, Gana Puntos y <span className="text-green-600">Cuida el Planeta</span>
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto mb-8">
          Convierte tus residuos reciclables en recompensas reales. Entrega materiales en los puntos de Popayán y canjéalos por productos eco-amigables.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={irARegistro} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-green-200 transition-colors">Comenzar Ahora <ArrowRight className="w-4 h-4"/></button>
          <button onClick={irALogin} className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl font-semibold transition-colors">Ya tengo cuenta</button>
        </div>
      </section>

      {/* MAPA PROTAGONISTA */}
      <section id="mapa" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="text-center mb-8">
          <h2 className="text-gray-900 text-2xl sm:text-3xl font-extrabold">Red de Puntos en Tiempo Real</h2>
          <p className="text-gray-500 mt-2">Encuentra el punto de reciclaje más cercano en Popayán y conoce su estado actual.</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Sidebar */}
          <div className="lg:w-64 shrink-0 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-gray-900 font-bold text-sm mb-4">Estado de Botes</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3"><div className="w-3 h-3 bg-green-500 rounded-full"/><span className="text-gray-700 text-sm">Disponible ({disp})</span></div>
                <div className="flex items-center gap-3"><div className="w-3 h-3 bg-amber-500 rounded-full"/><span className="text-gray-700 text-sm">Medio ({med})</span></div>
                <div className="flex items-center gap-3"><div className="w-3 h-3 bg-red-500 rounded-full"/><span className="text-gray-700 text-sm">Lleno/Inactivo ({llenos})</span></div>
              </div>
            </div>
            <div className="bg-green-50 rounded-2xl border border-green-100 p-5">
              <p className="text-green-700 text-sm font-medium mb-3">♻️ <strong>{PUNTOS_RECOLECCION.filter(p=>p.activo).length} puntos activos</strong> esperan tu reciclaje en Popayán</p>
              <button onClick={irARegistro} className="text-green-700 font-semibold text-sm hover:text-green-800 flex items-center gap-1">Registrarme gratis <ArrowRight className="w-3.5 h-3.5"/></button>
            </div>
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100"><h3 className="text-gray-900 font-bold text-sm">Todos los Puntos</h3></div>
              <div className="max-h-56 overflow-y-auto">
                {PUNTOS_RECOLECCION.map(p=>(
                  <div key={p.id} className="px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <div className="flex items-start gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${!p.activo||p.nivelLlenado>=80?"bg-red-500":p.nivelLlenado>=50?"bg-amber-500":"bg-green-500"}`}/>
                      <div className="min-w-0">
                        <p className="text-gray-800 text-xs font-semibold truncate">{p.nombre}</p>
                        <p className="text-gray-400 text-xs truncate">{p.direccion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Mapa */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="h-105 sm:h-125 lg:h-140"><MapaLanding/></div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-green-700 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
          {[{icon:Users,value:"1,847",label:"Recicladores"},{icon:Recycle,value:"45.2t",label:"Kg Reciclados"},{icon:BarChart3,value:"8,920",label:"Transacciones"},{icon:TreePine,value:"90,460",label:"CO₂ Evitado (kg)"}].map(s=>{const I=s.icon;return(<div key={s.label}><I className="w-6 h-6 mx-auto mb-1.5 text-green-300"/><div className="text-2xl sm:text-3xl font-extrabold">{s.value}</div><div className="text-green-200 text-xs sm:text-sm mt-0.5">{s.label}</div></div>);})}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-green-600 text-xs font-bold uppercase tracking-widest">¿Cómo Funciona?</span>
            <h2 className="text-gray-900 text-2xl sm:text-3xl font-extrabold mt-2">4 Pasos para Reciclar y Ganar</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PASOS.map(s=>(
              <div key={s.paso} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="text-gray-100 text-5xl font-black absolute top-4 right-5 select-none">{s.paso}</div>
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{s.emoji}</div>
                <h3 className="text-gray-900 font-bold mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MATERIALES */}
      <section id="materiales" className="bg-green-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-green-600 text-xs font-bold uppercase tracking-widest">Materiales Aceptados</span>
            <h2 className="text-gray-900 text-2xl sm:text-3xl font-extrabold mt-2">¿Qué puedes reciclar?</h2>
            <p className="text-gray-500 mt-2 text-sm">Puntos por kg entregado según tipo de material</p>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {MATERIALES.map(m=>(
              <div key={m.nombre} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{m.icono}</div>
                <h4 className="text-gray-800 text-xs font-semibold mb-1.5">{m.nombre}</h4>
                <div className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${m.color}`}>{m.pts} pts/kg</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto bg-linear-to-br from-green-600 to-green-800 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl shadow-green-200 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full"/>
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/5 rounded-full"/>
          <div className="relative z-10">
            <Leaf className="w-12 h-12 mx-auto mb-4 text-green-300"/>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Empieza a Reciclar Hoy</h2>
            <p className="text-green-200 mb-8 max-w-md mx-auto text-sm">Únete a nuestra comunidad de recicladores en Popayán.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={irARegistro} className="inline-flex items-center gap-2 bg-white text-green-700 hover:bg-green-50 px-7 py-3.5 rounded-xl font-bold shadow-lg transition-colors">Crear mi Cuenta Gratis <ArrowRight className="w-4 h-4"/></button>
              <button onClick={irALogin} className="inline-flex items-center gap-2 bg-green-500/30 text-white border border-white/30 px-7 py-3.5 rounded-xl font-semibold hover:bg-green-500/40 transition-colors">Ya tengo cuenta</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-green-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center"><Leaf className="w-4 h-4 text-white"/></div><span className="font-bold text-lg">PlastiUsos</span></div>
              <p className="text-green-300 text-sm leading-relaxed">Transformamos el reciclaje en recompensas. Juntos construimos un Popayán más limpio.</p>
            </div>
            <div><h4 className="text-green-200 mb-3 font-semibold text-sm">Plataforma</h4><ul className="space-y-2 text-sm text-green-300"><li><button onClick={irALogin} className="hover:text-white transition-colors">Panel</button></li><li><a href="#mapa" className="hover:text-white">Puntos de Recolección</a></li><li><button onClick={irALogin} className="hover:text-white transition-colors">Productos</button></li><li><button onClick={irALogin} className="hover:text-white transition-colors">Historial</button></li></ul></div>
            <div><h4 className="text-green-200 mb-3 font-semibold text-sm">Materiales</h4><ul className="space-y-2 text-sm text-green-300"><li>Plástico PET</li><li>Cartón y Papel</li><li>Vidrio</li><li>Metales</li><li>Electrónicos</li></ul></div>
            <div><h4 className="text-green-200 mb-3 font-semibold text-sm">Contacto</h4><ul className="space-y-2 text-sm text-green-300"><li>info@plastiusos.co</li><li>+57 (2) 820 1234</li><li>Lun-Sáb 8am-6pm</li><li>Popayán, Cauca</li></ul></div>
          </div>
          <div className="border-t border-green-800 mt-8 pt-6 text-center text-sm text-green-400">© 2025 PlastiUsos Popayán · Hecho con 💚 por el planeta</div>
        </div>
      </footer>
    </div>
  );
};
export default Landing;
