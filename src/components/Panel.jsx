import { useState, useEffect, useRef } from "react";
import {
  Star, Recycle, Package, Gift, ScanQrCode,
  MapPin, ShoppingBag, History, TrendingUp,
  CheckCircle, Clock, XCircle, ChevronRight,
  ArrowRight, Navigation, Leaf,
} from "lucide-react";
import EscaneoQR from "./EscaneoQR";
import { toast } from "sonner";
import { PUNTOS_RECOLECCION, HISTORIAL_MOCK, MATERIALES } from "../mockData.js";
import axios from "axios";

const NIVELES = [
  { nombre: "Semilla Verde", min: 0, max: 200, emoji: "🌱" },
  { nombre: "Brote Ecológico", min: 200, max: 500, emoji: "🌿" },
  { nombre: "Guerrero Verde", min: 500, max: 1500, emoji: "🌳" },
  { nombre: "Guardián del Planeta", min: 1500, max: 3000, emoji: "🌍" },
  { nombre: "Leyenda Eco", min: 3000, max: Infinity, emoji: "🏆" },
];

const estadoBadge = (estado) => {
  const m = {
    VALIDADA: "bg-green-100 text-green-700",
    aprobado: "bg-green-100 text-green-700",
    PENDIENTE: "bg-amber-100 text-amber-700",
    pendiente: "bg-amber-100 text-amber-700",
    entregado: "bg-blue-100 text-blue-700",
    RECHAZADA: "bg-red-100 text-red-600",
  };
  return m[estado] || "bg-gray-100 text-gray-500";
};

const estadoLabel = (e) => ({
  VALIDADA: "Aprobada", aprobado: "Aprobada",
  PENDIENTE: "Pendiente", pendiente: "Pendiente",
  entregado: "Entregado", RECHAZADA: "Rechazada",
}[e] || e);

function MiniMap({ puntos }) {
  const mapRef = useRef(null);
  const instRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || instRef.current) return;
    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
        .setView([2.4419, -76.6063], 13);
      instRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19,
      }).addTo(map);

      const mkIco = (c) => L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${c};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.2)"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8], popupAnchor: [0, -10],
      });
      const icos = { v: mkIco("#16a34a"), a: mkIco("#f59e0b"), r: mkIco("#ef4444") };

      puntos.forEach((p) => {
        if (!p.latitud || !p.longitud) return;
        const n = p.nivelLlenado || 0, ac = p.activo !== false;
        const ch = !ac || n >= 80 ? "#ef4444" : n >= 50 ? "#f59e0b" : "#16a34a";
        const ic = !ac || n >= 80 ? icos.r : n >= 50 ? icos.a : icos.v;
        const est = !ac ? "🔴 Inactivo" : n >= 80 ? "🔴 Lleno" : n >= 50 ? "🟡 Medio" : "🟢 Disponible";
        L.marker([p.latitud, p.longitud], { icon: ic }).addTo(map).bindPopup(`
          <div style="font-family:system-ui;padding:4px;min-width:200px">
            <strong style="font-size:12px">${p.nombre}</strong><br>
            <span style="font-size:10px;color:#6b7280">📍 ${p.direccion}</span><br><br>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:7px">
              <div style="background:#f9fafb;border-radius:7px;padding:5px;border:1px solid #e5e7eb">
                <p style="font-size:9px;color:#9ca3af;margin:0 0 2px;font-weight:700;text-transform:uppercase">Horario</p>
                <p style="font-size:11px;margin:0">🕒 ${p.horario || "Lun-Sáb 8am-6pm"}</p>
              </div>
              <div style="background:#f9fafb;border-radius:7px;padding:5px;border:1px solid #e5e7eb">
                <p style="font-size:9px;color:#9ca3af;margin:0 0 2px;font-weight:700;text-transform:uppercase">Estado</p>
                <p style="font-size:11px;font-weight:700;margin:0">${est}</p>
              </div>
            </div>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:7px;padding:5px;margin-bottom:7px">
              <p style="font-size:9px;color:#16a34a;margin:0 0 2px;font-weight:700;text-transform:uppercase">♻️ Acepta</p>
              <p style="font-size:11px;margin:0">${(p.tiposPlastico || []).slice(0, 3).join(", ")}</p>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">
              <span style="font-weight:600;color:#6b7280">Nivel llenado</span>
              <span style="color:${ch};font-weight:800">${n}%</span>
            </div>
            <div style="height:7px;background:#e5e7eb;border-radius:4px;overflow:hidden">
              <div style="height:100%;width:${n}%;background:${ch};border-radius:4px"></div>
            </div>
          </div>`, { maxWidth: 260 });
      });
    });
    return () => { if (instRef.current) { instRef.current.remove(); instRef.current = null; } };
  }, [puntos]);

  return <div ref={mapRef} className="w-full h-full" />;
}

const Panel = ({ usuario, irACatalogo, irAHistorial }) => {
  const [scanneando, setScanneando] = useState(false);
  const [puntosMapa, setPuntosMapa] = useState(PUNTOS_RECOLECCION);

  useEffect(() => {
    axios.get("http://localhost:8080/api/puntos/todos")
      .then((r) => setPuntosMapa(r.data))
      .catch(() => setPuntosMapa(PUNTOS_RECOLECCION));
  }, []);

  // Combinar datos reales con mock
  const historialReal = usuario?.historialEntrega || [];
  const canjesReal = usuario?.canjes || [];
  const historial = historialReal.length > 0 ? historialReal : HISTORIAL_MOCK.filter(h => h.tipo === "entrega");
  const canjes = canjesReal.length > 0 ? canjesReal : HISTORIAL_MOCK.filter(h => h.tipo === "canje");

  const pts = usuario?.saldoPuntos ?? historial.filter(e => e.estado === "VALIDADA").reduce((a, e) => a + (e.puntosOtorgados || 0), 0);
  const kgTotal = historial.reduce((a, e) => a + (e.kilos || e.cantidadKilos || 0), 0);
  const aprobadas = historial.filter(e => e.estado === "VALIDADA" || e.estado === "aprobado").length;

  const nivel = NIVELES.find(n => pts >= n.min && pts < n.max) || NIVELES[0];
  const sigNivel = NIVELES[NIVELES.indexOf(nivel) + 1];
  const progreso = sigNivel ? Math.round(((pts - nivel.min) / (sigNivel.min - nivel.min)) * 100) : 100;

  const movRecientes = [
    ...historial.slice(0, 3).map(e => ({ ...e, _tipo: "entrega" })),
    ...canjes.slice(0, 2).map(c => ({ ...c, _tipo: "canje" })),
  ].sort((a, b) => new Date(b.fechaEntrega || b.fechaPedido || 0) - new Date(a.fechaEntrega || a.fechaPedido || 0)).slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      <style>{`.leaflet-popup-content-wrapper{border-radius:14px!important;box-shadow:0 8px 30px rgba(0,0,0,.12)!important;border:1px solid #e5e7eb;padding:0!important}.leaflet-popup-content{margin:0!important;padding:12px 14px!important}.leaflet-popup-tip{background:white!important}.leaflet-control-attribution{font-size:8px!important}`}</style>

      {/* GREETING */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          ¡Hola, {usuario?.nombre?.split(" ")[0] || "Reciclador"}! 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Resumen de tu actividad de reciclaje en Popayán</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Puntos Disponibles", value: pts.toLocaleString(), sub: "saldo actual", bg: "bg-green-50 border-green-100", iconBg: "bg-green-500", Icon: Star },
          { label: "Kg Reciclados", value: `${kgTotal} kg`, sub: "total acumulado", bg: "bg-blue-50 border-blue-100", iconBg: "bg-blue-500", Icon: Recycle },
          { label: "Entregas", value: historial.length, sub: `${aprobadas} aprobadas`, bg: "bg-amber-50 border-amber-100", iconBg: "bg-amber-500", Icon: Package },
          { label: "Canjes", value: canjes.length, sub: "premios obtenidos", bg: "bg-purple-50 border-purple-100", iconBg: "bg-purple-500", Icon: Gift },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 sm:p-5 border ${s.bg}`}>
            <div className={`w-9 h-9 ${s.iconBg} rounded-xl flex items-center justify-center mb-3`}>
              <s.Icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{s.value}</div>
            <div className="text-gray-600 text-xs sm:text-sm mt-0.5 font-medium">{s.label}</div>
            <div className="text-gray-400 text-xs mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ACCIONES + NIVEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Acciones */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-900 font-semibold mb-4">Acciones Rápidas</h3>
          <div className="space-y-2.5">
            {[
              { label: "Buscar punto cercano", emoji: "📍", bg: "bg-blue-50 hover:bg-blue-100", action: () => document.getElementById("mapa-panel")?.scrollIntoView({ behavior: "smooth" }) },
              { label: "Canjear mis puntos", emoji: "🎁", bg: "bg-purple-50 hover:bg-purple-100", action: irACatalogo },
              { label: "Ver mis entregas", emoji: "📋", bg: "bg-green-50 hover:bg-green-100", action: irAHistorial },
              { label: "Escanear bote QR", emoji: "📷", bg: "bg-amber-50 hover:bg-amber-100", action: () => setScanneando(true) },
            ].map((a) => (
              <button key={a.label} onClick={a.action}
                className={`w-full flex items-center justify-between p-3 rounded-xl ${a.bg} transition-colors group text-left`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{a.emoji}</span>
                  <span className="text-gray-700 text-sm font-medium">{a.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            ))}
          </div>

          {/* Nivel eco */}
          <div className="mt-5 bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{nivel.emoji}</span>
              <span className="text-green-800 text-sm font-semibold">{nivel.nombre}</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progreso}%` }} />
            </div>
            <p className="text-green-600 text-xs mt-1.5">
              {sigNivel ? `${pts} / ${sigNivel.min} pts para "${sigNivel.nombre}"` : "¡Nivel máximo! 🏆"}
            </p>
          </div>
        </div>

        {/* Últimas transacciones */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold">Últimas Transacciones</h3>
            <button onClick={irAHistorial} className="text-green-600 text-sm flex items-center gap-1 hover:text-green-700 font-medium">
              Ver todas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {movRecientes.length > 0 ? movRecientes.map((mov, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${mov._tipo === "entrega" ? "bg-green-100" : "bg-purple-100"}`}>
                    {mov._tipo === "entrega"
                      ? <Recycle className="w-4 h-4 text-green-600" />
                      : <Gift className="w-4 h-4 text-purple-600" />
                    }
                  </div>
                  <div>
                    <p className="text-gray-800 text-sm font-medium">
                      {mov._tipo === "entrega"
                        ? `Entrega en ${mov.punto?.nombre || "Punto de reciclaje"}`
                        : `Canje: ${mov.producto?.nombre || "Premio"}`
                      }
                    </p>
                    <p className="text-gray-400 text-xs">
                      {(mov.fechaEntrega || mov.fechaPedido || "").slice(0, 10)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${estadoBadge(mov.estado)}`}>
                    {estadoLabel(mov.estado)}
                  </span>
                  <span className={`text-sm font-bold ${mov._tipo === "entrega" ? "text-green-600" : "text-red-500"}`}>
                    {mov._tipo === "entrega" ? `+${mov.puntosOtorgados || 0}` : `-${mov.producto?.costoPuntos || 0}`} pts
                  </span>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-gray-400">
                <Leaf className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin transacciones aún. ¡Empieza a reciclar!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLA MATERIALES */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h3 className="text-gray-900 font-semibold mb-4">Puntos por Material</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {MATERIALES.map((m) => (
            <div key={m.nombre} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-colors cursor-default">
              <div className="text-2xl mb-1">{m.icono}</div>
              <p className="text-gray-700 text-xs font-medium">{m.nombre}</p>
              <p className="text-green-600 text-sm font-bold">{m.pts} pts/kg</p>
            </div>
          ))}
        </div>
      </div>

      {/* MAPA PANEL */}
      <div id="mapa-panel" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-gray-900 font-semibold">Puntos de Recolección · Popayán</h3>
            <p className="text-gray-500 text-xs mt-0.5">Clic en marcador para ver horario, materiales y nivel de llenado</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-green-600 rounded-full" /> Disponible</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Medio</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-500 rounded-full" /> Lleno</div>
          </div>
        </div>
        <div className="h-[300px] sm:h-[420px] lg:h-[500px]">
          <MiniMap puntos={puntosMapa} />
        </div>
        <div className="px-5 py-3 bg-slate-900 flex items-center gap-3">
          <div className="bg-green-600 p-2 rounded-xl flex-shrink-0"><Navigation className="w-4 h-4 text-white" /></div>
          <p className="text-xs text-white/80 font-medium uppercase tracking-wide">
            Red industrial de recolección · Popayán en tiempo real
          </p>
        </div>
      </div>

      {scanneando && <EscaneoQR userId={usuario?.id} alCerrar={() => setScanneando(false)} />}
    </div>
  );
};

export default Panel;
