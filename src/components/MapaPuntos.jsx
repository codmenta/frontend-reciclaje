import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Filter } from "lucide-react";
import { PUNTOS_RECOLECCION } from "../mockData.js";
import axios from "axios";

function MapaInteractivo({ puntos }) {
  const mapRef = useRef(null);
  const instRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current || instRef.current) return;
    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true })
        .setView([2.4419, -76.6063], 13);
      instRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19,
      }).addTo(map);

      const mkIco = (c, pulse = false) => L.divIcon({
        className: "",
        html: `<div style="position:relative">${pulse ? `<div style="position:absolute;inset:-5px;border-radius:50%;background:${c};opacity:.2;animation:pulse-ring 1.5s ease-out infinite"></div>` : ""}<div style="width:18px;height:18px;border-radius:50%;background:${c};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25);position:relative"></div></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -12],
      });

      puntos.forEach((p) => {
        if (!p.latitud || !p.longitud) return;
        const n = p.nivelLlenado || 0, ac = p.activo !== false;
        const ch = !ac || n >= 80 ? "#ef4444" : n >= 50 ? "#f59e0b" : "#16a34a";
        const ic = mkIco(ch, n >= 80);
        const est = !ac ? "🔴 Inactivo" : n >= 80 ? "🔴 Lleno" : n >= 50 ? "🟡 Medio" : "🟢 Disponible";
        const marker = L.marker([p.latitud, p.longitud], { icon: ic }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:system-ui;padding:4px;min-width:220px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <div style="width:9px;height:9px;border-radius:50%;background:${ch}"></div>
              <strong style="font-size:13px;color:#111">${p.nombre}</strong>
            </div>
            <p style="font-size:11px;color:#6b7280;margin:0 0 8px">📍 ${p.direccion}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:5px">
                <p style="font-size:9px;color:#9ca3af;margin:0 0 1px;font-weight:700;text-transform:uppercase">Horario</p>
                <p style="font-size:11px;color:#374151;margin:0">🕒 ${p.horario || "Lun-Sáb 8am-6pm"}</p>
              </div>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:5px">
                <p style="font-size:9px;color:#9ca3af;margin:0 0 1px;font-weight:700;text-transform:uppercase">Estado</p>
                <p style="font-size:11px;font-weight:700;margin:0">${est}</p>
              </div>
            </div>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:6px;margin-bottom:8px">
              <p style="font-size:9px;color:#16a34a;margin:0 0 2px;font-weight:700;text-transform:uppercase">♻️ Acepta</p>
              <p style="font-size:11px;color:#374151;margin:0">${(p.tiposPlastico || []).slice(0, 3).join(", ")}</p>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">
              <span style="font-weight:600;color:#6b7280">Nivel llenado</span>
              <span style="color:${ch};font-weight:800">${n}%</span>
            </div>
            <div style="height:7px;background:#e5e7eb;border-radius:4px;overflow:hidden">
              <div style="height:100%;width:${n}%;background:${ch};border-radius:4px"></div>
            </div>
          </div>`, { maxWidth: 270 });
        markersRef.current.push({ marker, punto: p });
      });
    });
    return () => { if (instRef.current) { instRef.current.remove(); instRef.current = null; } };
  }, [puntos]);

  const flyTo = (lat, lng) => {
    if (instRef.current) instRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
  };

  return { mapRef, flyTo };
}

const MapaPuntos = () => {
  const [puntos, setPuntos] = useState(PUNTOS_RECOLECCION);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const mapRef = useRef(null);
  const instRef = useRef(null);

  useEffect(() => {
    axios.get("http://localhost:8080/api/puntos/todos")
      .then((r) => setPuntos(r.data))
      .catch(() => setPuntos(PUNTOS_RECOLECCION));
  }, []);

  // Montar mapa
  useEffect(() => {
    if (!mapRef.current || instRef.current) return;
    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true })
        .setView([2.4419, -76.6063], 13);
      instRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19,
      }).addTo(map);

      const mkIco = (c) => L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${c};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -12],
      });

      puntos.forEach((p) => {
        if (!p.latitud || !p.longitud) return;
        const n = p.nivelLlenado || 0, ac = p.activo !== false;
        const ch = !ac || n >= 80 ? "#ef4444" : n >= 50 ? "#f59e0b" : "#16a34a";
        const est = !ac ? "🔴 Inactivo" : n >= 80 ? "🔴 Lleno" : n >= 50 ? "🟡 Medio" : "🟢 Disponible";
        L.marker([p.latitud, p.longitud], { icon: mkIco(ch) }).addTo(map).bindPopup(`
          <div style="font-family:system-ui;padding:4px;min-width:220px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <div style="width:9px;height:9px;border-radius:50%;background:${ch}"></div>
              <strong style="font-size:13px;color:#111">${p.nombre}</strong>
            </div>
            <p style="font-size:11px;color:#6b7280;margin:0 0 8px">📍 ${p.direccion}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:5px">
                <p style="font-size:9px;color:#9ca3af;margin:0 0 1px;font-weight:700;text-transform:uppercase">Horario</p>
                <p style="font-size:11px;color:#374151;margin:0">🕒 ${p.horario || "Lun-Sáb 8am-6pm"}</p>
              </div>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:5px">
                <p style="font-size:9px;color:#9ca3af;margin:0 0 1px;font-weight:700;text-transform:uppercase">Estado</p>
                <p style="font-size:11px;font-weight:700;margin:0">${est}</p>
              </div>
            </div>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:6px;margin-bottom:8px">
              <p style="font-size:9px;color:#16a34a;margin:0 0 2px;font-weight:700;text-transform:uppercase">♻️ Acepta</p>
              <p style="font-size:11px;color:#374151;margin:0">${(p.tiposPlastico || []).slice(0, 3).join(", ")}</p>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">
              <span style="font-weight:600;color:#6b7280">Nivel llenado</span><span style="color:${ch};font-weight:800">${n}%</span>
            </div>
            <div style="height:7px;background:#e5e7eb;border-radius:4px;overflow:hidden">
              <div style="height:100%;width:${n}%;background:${ch};border-radius:4px"></div>
            </div>
          </div>`, { maxWidth: 270 });
      });
    });
    return () => { if (instRef.current) { instRef.current.remove(); instRef.current = null; } };
  }, [puntos]);

  const flyTo = (lat, lng) => {
    if (instRef.current) instRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
  };

  const puntosFiltrados = puntos.filter((p) => {
    const ok = p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || p.direccion?.toLowerCase().includes(busqueda.toLowerCase());
    if (filtro === "disponible") return ok && p.activo && (p.nivelLlenado || 0) < 80;
    if (filtro === "lleno") return ok && (!p.activo || (p.nivelLlenado || 0) >= 80);
    return ok;
  });

  return (
    <div className="animate-in fade-in duration-500 pb-8">
      <style>{`.leaflet-popup-content-wrapper{border-radius:14px!important;box-shadow:0 8px 30px rgba(0,0,0,.12)!important;border:1px solid #e5e7eb;padding:0!important}.leaflet-popup-content{margin:0!important;padding:12px 14px!important}.leaflet-popup-tip{background:white!important}.leaflet-control-attribution{font-size:8px!important}`}</style>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Puntos de Recolección</h1>
        <p className="text-gray-500 mt-1 text-sm">Red de estaciones de reciclaje en Popayán · {puntos.filter(p => p.activo).length} puntos activos</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <div className="lg:w-72 flex-shrink-0 space-y-4">
          {/* Buscador */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Buscar punto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[["todos","Todos"],["disponible","Disponibles"],["lleno","Llenos"]].map(([val,lbl]) => (
                <button key={val} onClick={() => setFiltro(val)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filtro === val ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Estado de botes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-gray-900 font-bold text-sm mb-3">Estado de Botes</h3>
            {[
              ["bg-green-500", `Disponible (${puntos.filter(p => p.activo && (p.nivelLlenado||0) < 80).length})`],
              ["bg-amber-500", `Medio (${puntos.filter(p => (p.nivelLlenado||0) >= 50 && (p.nivelLlenado||0) < 80).length})`],
              ["bg-red-500", `Lleno/Inactivo (${puntos.filter(p => !p.activo || (p.nivelLlenado||0) >= 80).length})`],
            ].map(([color, label]) => (
              <div key={label} className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${color} flex-shrink-0`} />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>

          {/* Lista puntos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-gray-900 font-bold text-sm">Puntos ({puntosFiltrados.length})</h3>
              <MapPin className="w-4 h-4 text-gray-400" />
            </div>
            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
              {puntosFiltrados.map((p) => {
                const n = p.nivelLlenado || 0, ac = p.activo !== false;
                const color = !ac || n >= 80 ? "bg-red-500" : n >= 50 ? "bg-amber-500" : "bg-green-500";
                return (
                  <button key={p.id} onClick={() => flyTo(p.latitud, p.longitud)}
                    className="w-full px-4 py-3 hover:bg-green-50 text-left transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${color}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-800 text-xs font-semibold truncate">{p.nombre}</p>
                        <p className="text-gray-400 text-xs truncate mt-0.5">{p.direccion}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${!ac||n>=80?"bg-red-500":n>=50?"bg-amber-500":"bg-green-500"}`} style={{ width: `${n}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 flex-shrink-0">{n}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: "500px" }}>
          <div className="h-[500px] sm:h-[600px] lg:h-[680px]">
            <div ref={mapRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaPuntos;
