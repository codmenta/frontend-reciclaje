import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Plus, Edit3, X, Loader2, ImagePlus, ChevronLeft, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

const GestionCatalogo = ({ alRegresar }) => {
  const [productos, setProductos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [datos, setDatos] = useState({
    nombre: "", descripcion: "", costoPuntos: 0, stock: 0, imagenUrl: "", activo: true,
  });

  const cargarProductos = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/canje/catalogo");
      setProductos(res.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { cargarProductos(); }, [cargarProductos]);

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!datos.nombre.trim()) { toast.error("El nombre es requerido"); return; }
    if (datos.costoPuntos <= 0) { toast.error("Los puntos deben ser mayor a 0"); return; }
    setCargando(true);
    try {
      if (editandoId) {
        await axios.put(`http://localhost:8080/api/admin/productos/${editandoId}`, datos);
        toast.success("Producto actualizado");
      } else {
        await axios.post("http://localhost:8080/api/admin/productos", datos);
        toast.success("Producto publicado con éxito");
      }
      setMostrarForm(false);
      setEditandoId(null);
      setDatos({ nombre: "", descripcion: "", costoPuntos: 0, stock: 0, imagenUrl: "", activo: true });
      cargarProductos();
    } catch (err) {
      console.error(err);
      toast.error("Error al procesar");
    } finally { setCargando(false); }
  };

  // HU-18: Toggle activo/inactivo rápido
  const toggleActivo = async (producto) => {
    try {
      await axios.put(`http://localhost:8080/api/admin/productos/${producto.id}`, {
        ...producto, activo: !producto.activo,
      });
      toast.success(producto.activo ? "Premio ocultado del catálogo" : "Premio activado en el catálogo");
      cargarProductos();
    } catch (err) {
      console.error(err);
      toast.error("Error al cambiar estado");
    }
  };

  const abrirEditor = (p) => {
    setEditandoId(p.id);
    setDatos({ nombre: p.nombre || "", descripcion: p.descripcion || "", costoPuntos: p.costoPuntos || 0, stock: p.stock || 0, imagenUrl: p.imagenUrl || "", activo: p.activo !== false });
    setMostrarForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="animate-in fade-in duration-400 pb-16">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <button onClick={alRegresar} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 shadow-sm transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-gray-900 text-xl sm:text-2xl font-bold">Gestión de Catálogo</h1>
            <p className="text-gray-500 text-sm">{productos.length} productos registrados</p>
          </div>
        </div>
        <button
          onClick={() => { setMostrarForm(!mostrarForm); setEditandoId(null); setDatos({ nombre: "", descripcion: "", costoPuntos: 0, stock: 0, imagenUrl: "", activo: true }); }}
          className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm ${
            mostrarForm ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {mostrarForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span className="hidden sm:inline">{mostrarForm ? "Cancelar" : "Nuevo Premio"}</span>
        </button>
      </div>

      {/* FORMULARIO (HU-09 + HU-17) */}
      {mostrarForm && (
        <form onSubmit={handleGuardar} className="mb-8 p-5 sm:p-8 bg-white rounded-2xl border border-gray-100 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-gray-900 font-bold text-lg mb-5">
            {editandoId ? "Editar Premio" : "Nuevo Premio"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Imagen preview */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Imagen del producto</label>
              <div className="h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                {datos.imagenUrl ? (
                  <img src={datos.imagenUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="text-center">
                    <ImagePlus className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Ingresa una URL de imagen</p>
                  </div>
                )}
              </div>
              <input
                placeholder="https://... URL de imagen"
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-green-400 text-sm transition-colors"
                value={datos.imagenUrl}
                onChange={(e) => setDatos({ ...datos, imagenUrl: e.target.value })}
              />
            </div>

            {/* Datos */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Nombre *</label>
                <input
                  required
                  placeholder="Nombre del producto"
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-green-400 text-sm font-semibold transition-colors"
                  value={datos.nombre}
                  onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Descripción</label>
                <textarea
                  rows="3"
                  placeholder="Describe el producto..."
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-green-400 text-sm resize-none transition-colors"
                  value={datos.descripcion}
                  onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1 block">Puntos *</label>
                  <input
                    type="number" min="1"
                    className="w-full p-3 rounded-xl bg-green-50 border border-green-200 outline-none focus:border-green-500 text-green-700 font-bold text-sm transition-colors"
                    value={datos.costoPuntos}
                    onChange={(e) => setDatos({ ...datos, costoPuntos: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 block">Stock</label>
                  <input
                    type="number" min="0"
                    className="w-full p-3 rounded-xl bg-blue-50 border border-blue-200 outline-none focus:border-blue-500 text-blue-700 font-bold text-sm transition-colors"
                    value={datos.stock}
                    onChange={(e) => setDatos({ ...datos, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* HU-18: Toggle activo */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Visible en catálogo</p>
                  <p className="text-xs text-gray-400 mt-0.5">{datos.activo ? "Los recicladores pueden verlo y canjearlo" : "Oculto para los recicladores"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDatos({ ...datos, activo: !datos.activo })}
                  className="shrink-0"
                >
                  {datos.activo
                    ? <ToggleRight className="w-10 h-10 text-green-600" />
                    : <ToggleLeft className="w-10 h-10 text-gray-400" />
                  }
                </button>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {cargando
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                  : editandoId ? "Guardar Cambios" : "Publicar Premio"
                }
              </button>
            </div>
          </div>
        </form>
      )}

      {/* LISTA DE PRODUCTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {productos.map((p) => (
          <div
            key={p.id}
            className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all shadow-sm hover:shadow-md ${
              p.activo !== false ? "border-gray-100" : "border-gray-200 opacity-60"
            }`}
          >
            <div className="flex items-center gap-4">
              <img
                src={p.imagenUrl || "https://via.placeholder.com/150/f0fdf4/16a34a?text=Eco"}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-gray-100"
                alt={p.nombre}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-gray-900 truncate">{p.nombre}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    p.activo !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {p.activo !== false ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-green-600 font-semibold text-xs mt-0.5">{p.costoPuntos} pts</p>
                <p className="text-gray-400 text-xs">Stock: {p.stock} unidades</p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => abrirEditor(p)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar
              </button>
              {/* HU-18: Toggle rápido */}
              <button
                onClick={() => toggleActivo(p)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                  p.activo !== false
                    ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                    : "text-green-700 bg-green-50 hover:bg-green-100"
                }`}
              >
                {p.activo !== false
                  ? <><ToggleLeft className="w-3.5 h-3.5" /> Ocultar</>
                  : <><ToggleRight className="w-3.5 h-3.5" /> Activar</>
                }
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestionCatalogo;
