import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Star, Search, Package, X, ShoppingBag, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { PRODUCTOS_CATALOGO } from "../mockData.js";

const CATEGORIAS = ["Todas", "Hogar", "Cocina", "Jardín", "Oficina", "Cuidado Personal"];

const Productos = ({ usuario }) => {
  const [productos, setProductos] = useState(PRODUCTOS_CATALOGO);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [modal, setModal] = useState(null);
  const [canjeOk, setCanjeOk] = useState(false);
  const [cargando, setCargando] = useState(false);

  const pts = usuario?.saldoPuntos ??
    (usuario?.historialEntrega || []).filter(e => e.estado === "VALIDADA").reduce((a, e) => a + (e.puntosOtorgados || 0), 0);

  const cargar = useCallback(() => {
    axios.get("http://localhost:8080/api/canje/catalogo")
      .then((r) => { if (r.data?.length) setProductos(r.data); })
      .catch(() => setProductos(PRODUCTOS_CATALOGO));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = productos.filter((p) => {
    const activo = p.activo !== false;
    const m = p.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const c = categoria === "Todas" || p.categoria === categoria;
    return activo && m && c;
  });

  const puede = (costo) => pts >= costo;

  const canjear = async () => {
    if (!modal) return;
    if (!puede(modal.costoPuntos)) {
      toast.error("Puntos insuficientes");
      return;
    }
    const dir = window.prompt("¿A dónde enviamos tu premio?");
    if (!dir) return;
    setCargando(true);
    try {
      await axios.post(`http://localhost:8080/api/canje/realizar?userId=${usuario?.id}&productoId=${modal.id}&direccion=${dir}`);
      setCanjeOk(true);
      toast.success("¡Canje exitoso!");
      setTimeout(() => { setCanjeOk(false); setModal(null); cargar(); }, 2000);
    } catch {
      toast.error("Sin backend aún — demo visual activo");
      setCanjeOk(true);
      setTimeout(() => { setCanjeOk(false); setModal(null); }, 2000);
    } finally { setCargando(false); }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      {/* HEADER */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 text-sm mt-1">Canjea tus puntos por productos eco-amigables</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 self-start sm:self-auto">
          <Star className="w-5 h-5 text-green-600 fill-green-600" />
          <span className="text-green-800 text-sm font-bold">{pts.toLocaleString()}</span>
          <span className="text-green-600 text-xs">puntos disponibles</span>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIAS.map((cat) => (
              <button key={cat} onClick={() => setCategoria(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${categoria === cat ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GRID */}
      {filtrados.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No hay productos</p>
          <p className="text-gray-300 text-sm mt-1">Prueba con otra búsqueda o categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filtrados.map((prod) => {
            const pued = puede(prod.costoPuntos);
            return (
              <div key={prod.id} onClick={() => setModal(prod)}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-all ${!pued ? "opacity-70 border-gray-100" : "border-gray-100 hover:border-green-200"}`}>
                <div className="h-40 sm:h-48 bg-gray-50 overflow-hidden relative">
                  <img src={prod.imagenUrl || "https://via.placeholder.com/300x300/f0fdf4/16a34a?text=Eco"}
                    alt={prod.nombre} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  {prod.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">AGOTADO</span>
                    </div>
                  )}
                  {!pued && prod.stock > 0 && (
                    <div className="absolute top-2 right-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Pts insuf.</div>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <h4 className="text-gray-900 font-semibold text-sm truncate">{prod.nombre}</h4>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{prod.descripcion}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-green-600 fill-green-600" />
                      <span className="text-green-700 font-bold text-sm">{prod.costoPuntos}</span>
                      <span className="text-green-500 text-xs">pts</span>
                    </div>
                    <span className="text-gray-300 text-xs">Stock: {prod.stock}</span>
                  </div>
                  <button className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition-colors ${pued && prod.stock > 0 ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                    {prod.stock <= 0 ? "Agotado" : pued ? "Canjear" : "Sin puntos"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => { if (!cargando) setModal(null); }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="h-52 bg-gray-100 relative">
              <img src={modal.imagenUrl || "https://via.placeholder.com/400x300/f0fdf4/16a34a?text=Eco"} alt={modal.nombre} className="w-full h-full object-cover" />
              <button onClick={() => setModal(null)} className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white">
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>
            <div className="p-6">
              {canjeOk ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-gray-900">¡Canje Exitoso!</h3>
                  <p className="text-gray-500 text-sm mt-1">Tu premio está en camino</p>
                </div>
              ) : (
                <>
                  <h3 className="text-gray-900 text-xl font-bold">{modal.nombre}</h3>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">{modal.descripcion}</p>
                  <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-green-600 fill-green-600" />
                      <span className="text-green-700 font-bold text-lg">{modal.costoPuntos} pts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-sm">Stock: {modal.stock}</span>
                    </div>
                  </div>
                  {!puede(modal.costoPuntos) && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-amber-700 text-xs font-semibold">
                        Te faltan {modal.costoPuntos - pts} puntos. ¡Sigue reciclando!
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => setModal(null)}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={canjear} disabled={!puede(modal.costoPuntos) || modal.stock <= 0 || cargando}
                      className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      {cargando ? "Procesando..." : "Confirmar Canje"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;
