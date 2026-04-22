import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Toaster } from "sonner";
import { Leaf, LogOut, ChevronDown, LayoutDashboard, MapPin, ShoppingBag, History, Bell, Star, Settings, Package, Menu, X, Gift, Home } from "lucide-react";

import Landing from "./components/Landing";
import Registro from "./components/Registro";
import Login from "./components/Login";
import Panel from "./components/Panel";
import MapaPuntos from "./components/MapaPuntos";
import MapaInicio from "./components/Mapa";
import Productos from "./components/Productos";
import Historial from "./components/Historial";
import EncargadoDashboard from "./components/EncargadoDashboard";
import AdminDashboard from "./components/AdminDashboard";
import MonitorBotes from "./components/MonitorBotes";
import GestionCatalogo from "./components/GestionCatalogo";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [modo, setModo] = useState("LANDING");
  const [vista, setVista] = useState("panel");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [botes, setBotes] = useState([]);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const pts = usuario?.saldoPuntos ?? (usuario?.historialEntrega || []).filter(e => e.estado === "VALIDADA").reduce((a, e) => a + (e.puntosOtorgados || 0), 0);

  const notifs = [
    ...(usuario?.historialEntrega || []).slice(0, 3).map(e => ({ id: `e${e.id}`, tipo: "entrega", desc: `Entrega en ${e.punto?.nombre || "punto"}`, pts: e.puntosOtorgados, signo: "+", estado: e.estado, fecha: e.fechaEntrega })),
    ...(usuario?.canjes || []).slice(0, 2).map(c => ({ id: `c${c.id}`, tipo: "canje", desc: `Canje: ${c.producto?.nombre || "Premio"}`, pts: c.producto?.costoPuntos, signo: "-", estado: c.estado, fecha: c.fechaPedido })),
  ];
  const unread = notifs.filter(n => n.estado === "PENDIENTE" || n.estado === "pendiente").length;

  useEffect(() => {
    if (usuario?.rol === "ENCARGADO") {
      const fn = () => axios.get("http://localhost:8080/api/puntos/todos").then(r => setBotes(r.data)).catch(() => {});
      fn(); const i = setInterval(fn, 5000); return () => clearInterval(i);
    }
  }, [usuario]);

  useEffect(() => {
    const h = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const login = (u) => { setUsuario(u); setModo("APP"); setVista("panel"); };
  const salir = () => { setUsuario(null); setModo("LANDING"); setVista("panel"); };
  const nav = (v) => { setVista(v); setMenuOpen(false); };

  if (modo === "LANDING") return (<><Toaster position="top-center" richColors /><Landing irALogin={() => setModo("LOGIN")} irARegistro={() => setModo("REGISTRO")} /></>);
  if (modo === "LOGIN") return (<div className="min-h-screen bg-green-600 flex items-center justify-center p-4"><Toaster position="top-center" richColors /><Login alLoguear={login} irARegistro={() => setModo("REGISTRO")} /></div>);
  if (modo === "REGISTRO") return (<div className="min-h-screen bg-slate-900 flex items-center justify-center p-4"><Toaster position="top-center" richColors /><Registro alRegistrar={login} irALogin={() => setModo("LOGIN")} /></div>);

  const NAV = [
    { id: "inicio", label: "Inicio", icon: Home, roles: ["RECICLADOR", "ENCARGADO", "ADMINISTRADOR"] },
    { id: "panel", label: "Panel", icon: LayoutDashboard, roles: ["RECICLADOR", "ENCARGADO", "ADMINISTRADOR"] },
    { id: "puntos", label: "Puntos de Recolección", icon: MapPin, roles: ["RECICLADOR"] },
    { id: "productos", label: "Productos", icon: ShoppingBag, roles: ["RECICLADOR"] },
    { id: "historial", label: "Historial", icon: History, roles: ["RECICLADOR"] },
    { id: "monitor", label: "Monitor", icon: MapPin, roles: ["ENCARGADO"] },
    { id: "almacen", label: "Almacén", icon: Package, roles: ["ADMINISTRADOR"] },
  ].filter(n => n.roles.includes(usuario?.rol));

  const renderVista = () => {
    if (usuario?.rol === "ENCARGADO") {
      if (vista === "monitor") return <MonitorBotes botes={botes} usuarioId={usuario.id} alRegresar={() => nav("panel")} refrescar={() => axios.get("http://localhost:8080/api/puntos/todos").then(r => setBotes(r.data)).catch(() => {})} />;
      return <EncargadoDashboard usuario={usuario} botes={botes} />;
    }
    if (usuario?.rol === "ADMINISTRADOR") {
      if (vista === "almacen") return <GestionCatalogo alRegresar={() => nav("panel")} />;
      return <AdminDashboard usuario={usuario} irAAlmacen={() => nav("almacen")} />;
    }
    switch (vista) {
      case "inicio": return <MapaInicio />;
      case "puntos": return <MapaPuntos />;
      case "productos": return <Productos usuario={usuario} />;
      case "historial": return <Historial usuario={usuario} />;
      default: return <Panel usuario={usuario} irACatalogo={() => nav("productos")} irAHistorial={() => nav("historial")} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toaster position="top-center" richColors />
      <nav className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button onClick={() => nav("panel")} className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-sm"><Leaf className="w-5 h-5 text-white"/></div>
              <span className="text-green-800 font-bold text-lg hidden sm:block tracking-tight">PlastiUsos</span>
            </button>

            <div className="hidden md:flex items-center gap-1">
              {NAV.map(item => {
                const I = item.icon;
                return (<button key={item.id} onClick={() => nav(item.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${vista === item.id ? "bg-green-100 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-100"}`}><I className="w-4 h-4"/>{item.label}</button>);
              })}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {usuario?.rol === "RECICLADOR" && (
                <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
                  <Star className="w-4 h-4 text-green-600 fill-green-600"/><span className="text-green-700 text-sm font-bold">{pts.toLocaleString()}</span><span className="text-green-500 text-xs">pts</span>
                </div>
              )}

              {usuario?.rol === "RECICLADOR" && (
                <div className="relative" ref={notifRef}>
                  <button onClick={() => { setNotifOpen(!notifOpen); setUserMenu(false); }} className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                    <Bell className="w-5 h-5"/>
                    {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 font-bold">{unread}</span>}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b bg-green-50">
                        <h3 className="text-gray-900 text-sm font-bold">Notificaciones</h3>
                        <div className="mt-2 flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-green-100">
                          <div className="flex items-center gap-2"><Star className="w-4 h-4 text-green-600 fill-green-600"/><span className="text-xs text-gray-500">Saldo actual</span></div>
                          <span className="text-green-700 font-extrabold">{pts.toLocaleString()} pts</span>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                        {notifs.length === 0
                          ? <div className="py-10 text-center text-gray-400 text-sm">Sin notificaciones</div>
                          : notifs.map(n => (
                            <div key={n.id} className="px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.tipo === "entrega" ? "bg-blue-50" : "bg-purple-50"}`}>
                                {n.tipo === "entrega" ? <Package className="w-4 h-4 text-blue-500"/> : <Gift className="w-4 h-4 text-purple-500"/>}
                              </div>
                              <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{n.desc}</p><p className="text-xs text-gray-400">{n.estado} · {(n.fecha||"").slice(0,10)}</p></div>
                              <span className={`text-sm font-bold flex-shrink-0 ${n.signo === "+" ? "text-green-600" : "text-red-500"}`}>{n.signo}{n.pts}</span>
                            </div>
                          ))
                        }
                      </div>
                      <div className="px-4 py-3 border-t bg-gray-50">
                        <button onClick={() => { nav("historial"); setNotifOpen(false); }} className="w-full text-center text-green-700 text-sm font-semibold">Ver historial completo →</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="relative hidden sm:block" ref={userRef}>
                <button onClick={() => { setUserMenu(!userMenu); setNotifOpen(false); }} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">{usuario?.nombre?.slice(0,2).toUpperCase() || "U"}</div>
                  <span className="text-sm font-medium text-gray-700 hidden lg:block max-w-[100px] truncate">{usuario?.nombre?.split(" ")[0]}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenu ? "rotate-180" : ""}`}/>
                </button>
                {userMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold truncate">{usuario?.nombre}</p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold ${usuario?.rol === "RECICLADOR" ? "bg-green-100 text-green-700" : usuario?.rol === "ENCARGADO" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{usuario?.rol}</span>
                    </div>
                    <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Settings className="w-4 h-4 text-gray-400"/> Mi Perfil</button>
                    <button onClick={salir} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4"/> Cerrar Sesión</button>
                  </div>
                )}
              </div>

              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                {menuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
              <p className="font-semibold text-sm">{usuario?.nombre}</p>
              {usuario?.rol === "RECICLADOR" && (
                <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full">
                  <Star className="w-3.5 h-3.5 text-green-600 fill-green-600"/><span className="text-green-700 text-sm font-bold">{pts.toLocaleString()} pts</span>
                </div>
              )}
            </div>
            {NAV.map(item => {
              const I = item.icon;
              return (<button key={item.id} onClick={() => nav(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${vista === item.id ? "bg-green-100 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}><I className="w-4 h-4"/>{item.label}</button>);
            })}
            <div className="pt-2 border-t border-gray-100">
              <button onClick={salir} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4"/> Cerrar Sesión</button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderVista()}
      </main>

      <footer className="bg-green-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center"><Leaf className="w-4 h-4 text-white"/></div><span className="font-bold">PlastiUsos</span></div>
          <p className="text-green-400 text-sm">© 2025 PlastiUsos Popayán · Hecho con 💚 por el planeta</p>
          <button onClick={salir} className="text-green-400 hover:text-white text-sm">Volver al inicio</button>
        </div>
      </footer>
    </div>
  );
}
export default App;
