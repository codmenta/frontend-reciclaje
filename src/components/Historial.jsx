import { useState } from "react";
import { CheckCircle, Clock, XCircle, Recycle, Star, Filter, Gift, Leaf } from "lucide-react";
import { HISTORIAL_MOCK } from "../mockData.js";

const cfgEstado = {
  VALIDADA:   { label: "Aprobada",  Icon: CheckCircle, cls: "bg-green-100 text-green-700" },
  aprobado:   { label: "Aprobada",  Icon: CheckCircle, cls: "bg-green-100 text-green-700" },
  PENDIENTE:  { label: "Pendiente", Icon: Clock,        cls: "bg-amber-100 text-amber-700" },
  pendiente:  { label: "Pendiente", Icon: Clock,        cls: "bg-amber-100 text-amber-700" },
  entregado:  { label: "Entregado", Icon: CheckCircle,  cls: "bg-blue-100 text-blue-700" },
  RECHAZADA:  { label: "Rechazada", Icon: XCircle,      cls: "bg-red-100 text-red-600" },
};

const Badge = ({ estado }) => {
  const cfg = cfgEstado[estado] || { label: estado, Icon: Clock, cls: "bg-gray-100 text-gray-500" };
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.cls}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
};

const Historial = ({ usuario }) => {
  const [tab, setTab] = useState("entregas");
  const [filtro, setFiltro] = useState("todos");

  // Mezclar datos reales con mock
  const entregasReal = usuario?.historialEntrega || [];
  const canjesReal = usuario?.canjes || [];
  const entregas = entregasReal.length > 0 ? entregasReal : HISTORIAL_MOCK.filter(h => h.tipo === "entrega");
  const canjes = canjesReal.length > 0 ? canjesReal : HISTORIAL_MOCK.filter(h => h.tipo === "canje");

  const ptsGanados = entregas.filter(e => e.estado === "VALIDADA" || e.estado === "aprobado").reduce((s, e) => s + (e.puntosOtorgados || 0), 0);
  const ptsCanjeados = canjes.reduce((s, c) => s + (c.producto?.costoPuntos || 0), 0);

  const entregasFiltradas = entregas.filter((e) => filtro === "todos" ? true : e.estado === filtro);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-400 pb-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Historial</h1>
        <p className="text-gray-500 text-sm mt-1">Registro completo de tus entregas y canjes en Popayán</p>
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Entregas", value: entregas.length, Icon: Recycle, bg: "bg-green-50 border-green-100", ic: "text-green-600" },
          { label: "Pts Ganados", value: ptsGanados.toLocaleString(), Icon: Star, bg: "bg-amber-50 border-amber-100", ic: "text-amber-600" },
          { label: "Canjes", value: canjes.length, Icon: Gift, bg: "bg-purple-50 border-purple-100", ic: "text-purple-600" },
          { label: "Pts Canjeados", value: ptsCanjeados.toLocaleString(), Icon: Star, bg: "bg-red-50 border-red-100", ic: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
            <s.Icon className={`w-5 h-5 mb-2 ${s.ic}`} />
            <div className="text-xl sm:text-2xl font-extrabold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* TABS + CONTENIDO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[["entregas", `Entregas (${entregas.length})`], ["canjes", `Canjes (${canjes.length})`]].map(([id, lbl]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${tab === id ? "border-b-2 border-green-600 text-green-700" : "text-gray-500 hover:text-gray-700"}`}>
              {lbl}
            </button>
          ))}
        </div>

        {tab === "entregas" && (
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            {[["todos","Todos"],["VALIDADA","Aprobadas"],["PENDIENTE","Pendientes"],["RECHAZADA","Rechazadas"]].map(([val,lbl]) => (
              <button key={val} onClick={() => setFiltro(val)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filtro === val ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {lbl}
              </button>
            ))}
          </div>
        )}

        {tab === "entregas" && (
          <div className="divide-y divide-gray-50">
            {entregasFiltradas.length === 0 ? (
              <div className="py-14 text-center text-gray-400">
                <Leaf className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay entregas con este filtro</p>
              </div>
            ) : entregasFiltradas.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Recycle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-800 text-sm font-semibold">
                      Entrega en {e.punto?.nombre || `Punto de reciclaje`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge estado={e.estado} />
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400 text-xs">{(e.fechaEntrega || "").slice(0, 10)}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${e.estado === "VALIDADA" || e.estado === "aprobado" ? "text-green-600" : "text-gray-400"}`}>
                  {e.estado === "VALIDADA" || e.estado === "aprobado" ? `+${e.puntosOtorgados || 0}` : "—"} pts
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "canjes" && (
          <div className="divide-y divide-gray-50">
            {canjes.length === 0 ? (
              <div className="py-14 text-center text-gray-400">
                <Gift className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No has realizado canjes aún</p>
              </div>
            ) : canjes.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {c.producto?.imagenUrl
                      ? <img src={c.producto.imagenUrl} alt="" className="w-full h-full object-cover" />
                      : <Gift className="w-5 h-5 text-purple-600" />
                    }
                  </div>
                  <div>
                    <p className="text-gray-800 text-sm font-semibold">{c.producto?.nombre || "Premio"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge estado={c.estado} />
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400 text-xs">{(c.fechaPedido || "").slice(0, 10)}</span>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-red-500 flex-shrink-0">
                  -{c.producto?.costoPuntos || 0} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;
