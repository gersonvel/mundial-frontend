import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import type { Partido, ResponseDTO } from "../types";
import { IoSaveOutline, IoTimeOutline, IoTrashOutline } from "react-icons/io5";

const AdminPanel = () => {
  const [equipoLocal, setEquipoLocal] = useState("");
  const [equipoVisitante, setEquipoVisitante] = useState("");
  const [fase, setFase] = useState("JORNADA_1");
  const [grupo, setGrupo] = useState("GRUPO_A");
  const [fechaHora, setFechaHora] = useState("");

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [golesLocales, setGolesLocales] = useState<{ [key: number]: string }>(
    {},
  );
  const [golesVisitantes, setGolesVisitantes] = useState<{
    [key: number]: string;
  }>({});

  //   NUEVO ESTADO: Guarda qué equipo ganó en penales por cada partidoId
  const [ganadoresPenales, setGanadoresPenales] = useState<{
    [key: number]: string;
  }>({});

  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const cargarPartidos = async () => {
    try {
      const response = await api.get<ResponseDTO<Partido[]>>("/partidos");

      const partidosOrdenados = response.data.data.sort((a, b) => {
        // 1. Mantener la prioridad por Estado: PENDIENTE arriba, JUGADO abajo
        if (a.estado === "PENDIENTE" && b.estado === "JUGADO") return -1;
        if (a.estado === "JUGADO" && b.estado === "PENDIENTE") return 1;

        const fechaA = a.fechaHora.includes("Z")
          ? a.fechaHora.replace("Z", "")
          : a.fechaHora;
        const fechaB = b.fechaHora.includes("Z")
          ? b.fechaHora.replace("Z", "")
          : b.fechaHora;

        return new Date(fechaA).getTime() - new Date(fechaB).getTime();
      });

      setPartidos(partidosOrdenados);
    } catch (error) {
      console.error("Error al cargar partidos:", error);
    }
  };

  useEffect(() => {
    cargarPartidos();
  }, []);

  const handleCrearPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    try {
      const partidoData = {
        equipoLocal,
        equipoVisitante,
        fase,
        grupo: grupo === "NINGUNO" ? null : grupo,
        fechaHora: fechaHora,
        estado: "PENDIENTE",
      };

      await api.post("/partidos", partidoData);
      setMsg({ type: "success", text: " ¡Partido creado exitosamente!" });
      setEquipoLocal("");
      setEquipoVisitante("");
      setFechaHora("");
      cargarPartidos();
    } catch (error: any) {
      setMsg({
        type: "error",
        text: error.response?.data?.message || "Error al crear",
      });
    }
  };

  const handleGuardarResultado = async (partidoId: number) => {
    const gLocal = golesLocales[partidoId];
    const gVisitante = golesVisitantes[partidoId];

    if (
      gLocal === undefined ||
      gVisitante === undefined ||
      gLocal === "" ||
      gVisitante === ""
    ) {
      alert("Por favor, ingresa ambos marcadores antes de guardar.");
      return;
    }

    const golesLocalNum = parseInt(gLocal, 10);
    const golesVisitanteNum = parseInt(gVisitante, 10);

    if (golesLocalNum < 0 || golesVisitanteNum < 0) {
      alert(" ¡Los goles no pueden ser números negativos!");
      return;
    }

    const partidoActual = partidos.find((p) => p.id === partidoId);
    let ganadorPenalesDto: string | null = null;

    //   CONTROL DE ELIMINATORIAS SEGURO
    if (
      partidoActual &&
      golesLocalNum === golesVisitanteNum &&
      !partidoActual.fase.startsWith("JORNADA")
    ) {
      const seleccion = ganadoresPenales[partidoId];
      if (!seleccion || seleccion === "") {
        alert(
          ` El partido es de eliminación directa y quedó empatado. Por favor, selecciona abajo qué equipo avanzó en la tanda de penales.`,
        );
        return;
      }
      ganadorPenalesDto = seleccion; // Mandará "LOCAL" o "VISITANTE" de forma limpia
    }

    try {
      await api.put(`/partidos/${partidoId}/resultado`, {
        golesLocal: golesLocalNum,
        golesVisitante: golesVisitanteNum,
        ganadorPenales: ganadorPenalesDto,
      });

      alert("🏆 ¡Resultado oficial guardado y puntos distribuidos!");
      cargarPartidos();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar el resultado");
    }
  };

  const handleEliminarPartido = async (partidoId: number) => {
    if (!window.confirm(" ¿Estás seguro de que deseas eliminar este partido?"))
      return;
    try {
      await api.delete(`/partidos/${partidoId}`);
      alert(" Partido eliminado de la cartelera.");
      cargarPartidos();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al eliminar");
    }
  };

  const formatearFecha = (fechaStr: string) => {
    const fechaLimpia = fechaStr.includes("Z")
      ? fechaStr.replace("Z", "")
      : fechaStr;
    const fecha = new Date(fechaLimpia);
    return fecha.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Panel de Control <span className="text-emerald-400">Admin</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FORMULARIO */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-400 rounded-full"></span>
              Registrar Nuevo Partido
            </h2>
            {msg && (
              <div
                className={`p-4 rounded-xl mb-4 text-sm font-medium border-l-4 ${msg.type === "success" ? "bg-emerald-950/50 border-emerald-500 text-emerald-300" : "bg-red-950/50 border-red-500 text-red-300"}`}
              >
                {msg.text}
              </div>
            )}
            <form onSubmit={handleCrearPartido} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Equipo Local
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Argentina"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  value={equipoLocal}
                  onChange={(e) => setEquipoLocal(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Equipo Visitante
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Francia"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  value={equipoVisitante}
                  onChange={(e) => setEquipoVisitante(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Fase
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    value={fase}
                    onChange={(e) => setFase(e.target.value)}
                  >
                    <option value="JORNADA_1">Jornada 1</option>
                    <option value="JORNADA_2">Jornada 2</option>
                    <option value="JORNADA_3">Jornada 3</option>
                    <option value="DIESISEISAVOS">Dieciseisavos</option>
                    <option value="OCTAVOS">Octavos</option>
                    <option value="CUARTOS">Cuartos</option>
                    <option value="SEMIFINAL">Semifinal</option>
                    <option value="TERCER_LUGAR">Tercer lugar</option>
                    <option value="FINAL">Gran Final</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Grupo
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    value={grupo}
                    onChange={(e) => setGrupo(e.target.value)}
                  >
                    <option value="GRUPO_A">Grupo A</option>
                    <option value="GRUPO_B">Grupo B</option>
                    <option value="GRUPO_C">Grupo C</option>
                    <option value="GRUPO_D">Grupo D</option>
                    <option value="GRUPO_E">Grupo E</option>
                    <option value="GRUPO_F">Grupo F</option>
                    <option value="GRUPO_G">Grupo G</option>
                    <option value="GRUPO_H">Grupo H</option>
                    <option value="GRUPO_I">Grupo I</option>
                    <option value="GRUPO_J">Grupo J</option>
                    <option value="GRUPO_K">Grupo K</option>
                    <option value="GRUPO_L">Grupo L</option>
                    <option value="NINGUNO">Ninguno</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Fecha y Hora
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition-colors shadow-lg cursor-pointer"
              >
                Abrir Partido en Cancha
              </button>
            </form>
          </div>

          {/* LISTA DE PARTIDOS */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-yellow-400 rounded-full"></span>
              Cerrar Resultados Oficiales ({partidos.length})
            </h2>

            {partidos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/30 p-8 text-center">
                <p className="font-semibold text-slate-400 mb-1">
                  No hay partidos registrados aún
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-2">
                {partidos.map((partido) => {
                  const gLocalVal = golesLocales[partido.id];
                  const gVisitVal = golesVisitantes[partido.id];

                  // Identifica en tiempo real si el admin está escribiendo un empate en eliminatorias
                  const mostrarSelectorPenales =
                    partido.estado === "PENDIENTE" &&
                    gLocalVal !== undefined &&
                    gLocalVal !== "" &&
                    gVisitVal !== undefined &&
                    gVisitVal !== "" &&
                    parseInt(gLocalVal, 10) === parseInt(gVisitVal, 10) &&
                    !partido.fase.startsWith("JORNADA");

                  return (
                    <div
                      key={partido.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col space-y-4 transition-all hover:border-slate-700"
                    >
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Info */}
                        <div className="flex flex-col space-y-1 w-full sm:w-1/3 text-center sm:text-left">
                          <div className="flex items-center justify-center sm:justify-start space-x-2">
                            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-semibold border border-slate-700">
                              {partido.fase}
                            </span>
                            {partido.grupo && (
                              <span className="text-xs bg-emerald-950/40 text-emerald-400 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-900/40">
                                {partido.grupo}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                            <IoTimeOutline />{" "}
                            {formatearFecha(partido.fechaHora)}
                          </div>
                        </div>

                        {/* Versus e Inputs */}
                        <div className="flex items-center justify-center space-x-4 w-full sm:w-auto">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold">
                              {partido.equipoLocal}
                            </span>

                            <img
                              src={`/banderas/${partido.banderaLocal}`}
                              alt={partido.equipoLocal}
                              className="w-8 h-5 object-cover rounded shadow-md mr-5"
                            />
                          </div>

                          {partido.estado === "JUGADO" ? (
                            <div className="flex flex-col items-center">
                              <div className="bg-slate-800 text-emerald-400 px-4 py-1.5 rounded-lg font-black tracking-widest text-lg border border-slate-700">
                                {partido.golesLocal} - {partido.golesVisitante}
                              </div>
                              {partido.ganadorPenales && (
                                <span className="text-[10px] text-yellow-500 font-bold uppercase mt-1">
                                  Pasó: {partido.ganadorPenales}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                className="w-12 bg-slate-900 border border-slate-700 rounded-lg text-center py-1 text-white font-bold focus:outline-none focus:border-yellow-400"
                                value={gLocalVal ?? ""}
                                onChange={(e) =>
                                  setGolesLocales({
                                    ...golesLocales,
                                    [partido.id]: e.target.value,
                                  })
                                }
                              />
                              <span className="text-slate-500 font-bold">
                                vs
                              </span>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                className="w-12 bg-slate-900 border border-slate-700 rounded-lg text-center py-1 text-white font-bold focus:outline-none focus:border-yellow-400"
                                value={gVisitVal ?? ""}
                                onChange={(e) =>
                                  setGolesVisitantes({
                                    ...golesVisitantes,
                                    [partido.id]: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <span className="font-bold">
                              {partido.equipoVisitante}
                            </span>
                            <img
                              src={`/banderas/${partido.banderaVisitante}`}
                              alt={partido.equipoVisitante}
                              className="w-8 h-5 object-cover rounded shadow-md mr-5"
                            />
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="w-full sm:w-auto flex justify-center sm:justify-end items-center gap-2">
                          {partido.estado === "JUGADO" ? (
                            <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1.5 rounded-lg font-bold uppercase">
                              Finalizado
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  handleGuardarResultado(partido.id)
                                }
                                className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                              >
                                <IoSaveOutline className="w-4 h-4" />
                                Guardar
                              </button>

                              <button
                                onClick={() =>
                                  handleEliminarPartido(partido.id)
                                }
                                className="p-2 bg-red-950/40 hover:bg-red-600 border border-red-900/60 text-red-400 hover:text-white rounded-lg transition-all cursor-pointer"
                              >
                                <IoTrashOutline className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/*   SELECTOR DINÁMICO DE PENALES (SOLO APARECE EN EMPATE DE ELIMINATORIA) */}
                      {mostrarSelectorPenales && (
                        <div className="bg-slate-900/60 border border-dashed border-yellow-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <span className="text-xs font-bold text-yellow-500">
                            🏆 Marcador empatado. ¿Quién clasifica en penales?
                          </span>
                          <select
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white font-semibold focus:outline-none focus:border-yellow-400"
                            value={ganadoresPenales[partido.id] ?? ""}
                            onChange={(e) =>
                              setGanadoresPenales({
                                ...ganadoresPenales,
                                [partido.id]: e.target.value,
                              })
                            }
                          >
                            <option value="">
                              -- Seleccionar Clasificado --
                            </option>
                            {/*   CAMBIO AQUÍ: El 'value' ahora guarda el nombre real del equipo */}
                            <option value={partido.equipoLocal}>
                              Avanza {partido.equipoLocal}
                            </option>
                            <option value={partido.equipoVisitante}>
                              Avanza {partido.equipoVisitante}
                            </option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
