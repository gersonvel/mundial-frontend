import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { toast } from "sonner";
import {
  IoArrowBackOutline,
  IoPeopleOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoKeyOutline,
} from "react-icons/io5";

interface UsuarioData {
  id?: number;
  username: string;
  puntosTotales: number;
  activo: boolean;
}

export const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [usuarioAEditar, setUsuarioAEditar] = useState<string | null>(null);
  const [nuevaClaveTemporal, setNuevaClaveTemporal] = useState<string>("");

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await api.get("/admin/usuarios", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsuarios(response.data);
      } catch (error) {
        toast.error("Error al cargar la lista de usuarios registrados");
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
  }, []);

  const handleToggleActivo = async (username: string) => {
    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/admin/usuarios/${username}/activar`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((user) =>
          user.username === username ? { ...user, activo: !user.activo } : user,
        ),
      );

      toast.success(`Estado de ${username} actualizado correctamente`);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cambiar el estado del usuario");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioAEditar || nuevaClaveTemporal.length < 4) {
      toast.error("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/admin/usuarios/${usuarioAEditar}/reset-password`,
        { nuevaPassword: nuevaClaveTemporal },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success(
        `🔑 Contraseña de @${usuarioAEditar} cambiada a: ${nuevaClaveTemporal}`,
      );

      // Limpiamos el formulario y cerramos el panel de edición
      setUsuarioAEditar(null);
      setNuevaClaveTemporal("");
    } catch (error) {
      toast.error("No se pudo restablecer la contraseña");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              <IoArrowBackOutline className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black flex items-center gap-2">
                <IoPeopleOutline className="text-emerald-400" /> Control de
                Activaciones
              </h1>
              <p className="text-xs text-slate-400">
                Activa o desactiva a los participantes que pagaron su quiniela
              </p>
            </div>
          </div>

          <span className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl">
            Total: {usuarios.length} Jugadores
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-bold animate-pulse">
            ⚽ Cargando jugadores...
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs font-bold uppercase border-b border-slate-800">
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Puntos</th>
                    <th className="p-4 text-center">Estatus del pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {usuarios.map((u) => (
                    <tr
                      key={u.username}
                      className="hover:bg-slate-800/20 transition-all"
                    >
                      <td className="p-4 font-black text-slate-200">
                        @{u.username}
                      </td>
                      <td className="p-4 text-amber-400 font-bold">
                        {u.puntosTotales} pts
                      </td>
                      <td className="p-4 flex justify-center">
                        <button
                          onClick={() => handleToggleActivo(u.username)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide cursor-pointer transition-all border ${
                            u.activo
                              ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-md shadow-emerald-950/20"
                              : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {u.activo ? (
                            <>
                              <IoCheckmarkCircleOutline className="w-4 h-4" />
                              ACTIVO
                            </>
                          ) : (
                            <>
                              <IoCloseCircleOutline className="w-4 h-4" />
                              INACTIVO
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setUsuarioAEditar(u.username)}
                          className="p-2 bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-400 hover:text-amber-400 rounded-xl transition-all cursor-pointer"
                          title="Restablecer Contraseña"
                        >
                          <IoKeyOutline className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {usuarios.length === 0 && (
              <div className="text-center p-8 text-slate-500 text-sm">
                No hay usuarios registrados en el torneo actualmente.
              </div>
            )}

            {usuarioAEditar && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl">
                  <div>
                    <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                      Forzar Clave de {usuarioAEditar}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      El usuario ignorará su contraseña anterior al iniciar
                      sesión.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Ej: Temporal123#"
                      value={nuevaClaveTemporal}
                      onChange={(e) => setNuevaClaveTemporal(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setUsuarioAEditar(null)}
                        className="w-1/2 bg-slate-800 hover:bg-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black py-2.5 rounded-xl transition-colors cursor-pointer"
                      >
                        Cambiar Clave
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsuarios;
