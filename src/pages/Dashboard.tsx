import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import type { Partido, ResponseDTO } from "../types";
import {
  IoFootballOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoTrophyOutline,
  IoListOutline,
  IoEyeOutline,
  IoFilterOutline,
} from "react-icons/io5";

interface UsuarioRanking {
  username: string;
  puntosTotales: number;
}

interface PrediccionHistorial {
  id?: number;
  partido: Partido;
  golesLocalPred: number | null;
  golesVisitantePred: number | null;
  puntosGanados?: number;
}

const Dashboard = () => {
  const [partidosActivos, setPartidosActivos] = useState<Partido[]>([]);
  //   NUEVO ESTADO: Almacena el universo total de partidos de la BD
  const [todosLosPartidos, setTodosLosPartidos] = useState<Partido[]>([]);
  const [ranking, setRanking] = useState<UsuarioRanking[]>([]);
  const [misPrediccionesRaw, setMisPrediccionesRaw] = useState<
    PrediccionHistorial[]
  >([]);

  const [vistaActiva, setVistaActiva] = useState<
    "partidos" | "ranking" | "mis_pronosticos"
  >("partidos");
  const [pronosticoLocal, setPronosticoLocal] = useState<{
    [key: number]: string;
  }>({});
  const [pronosticoVisitante, setPronosticoVisitante] = useState<{
    [key: number]: string;
  }>({});
  const [partidosPronosticados, setPartidosPronosticados] = useState<number[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const [filtroFase, setFiltroFase] = useState<string>("TODAS");
  const [filtroGrupo, setFiltroGrupo] = useState<string>("TODOS");

  useEffect(() => {
    let activo = true;

    const inicializarDashboard = async () => {
      setLoading(true);

      // 1. Cargar Partidos Activos (Para la pestaña de apostar en vivo)
      try {
        const resPartidos =
          await api.get<ResponseDTO<Partido[]>>("/partidos/activos");
        if (activo) setPartidosActivos(resPartidos.data.data);
      } catch (error) {
        console.error("Error al recuperar partidos activos:", error);
      }

      // 2.   NUEVO: Cargar ABSOLUTAMENTE TODOS los partidos (Para la pestaña de historial)
      try {
        const resTodos = await api.get<ResponseDTO<Partido[]>>("/partidos");
        if (activo) setTodosLosPartidos(resTodos.data.data);
      } catch (error) {
        console.error(
          "Error al recuperar la cartelera general de partidos:",
          error,
        );
      }

      // 3. Cargar Ranking Global
      try {
        const resRanking =
          await api.get<ResponseDTO<UsuarioRanking[]>>("/ranking");
        if (activo) setRanking(resRanking.data.data);
      } catch (error) {
        console.error("Error al cargar el ranking:", error);
      }

      // 4. Cargar Historial de Predicciones de la Base de Datos
      try {
        const resPredicciones = await api.get<ResponseDTO<any[]>>(
          "/predicciones/mis-predicciones",
        );
        const prediccionesGuardadas = resPredicciones.data.data;

        if (activo) setMisPrediccionesRaw(prediccionesGuardadas);

        const idsBloqueados: number[] = [];
        const golesLocalesTemp: { [key: number]: string } = {};
        const golesVisitantesTemp: { [key: number]: string } = {};

        prediccionesGuardadas.forEach((pred: any) => {
          const pId = pred.partido?.id;
          if (pId) {
            idsBloqueados.push(pId);
            golesLocalesTemp[pId] = String(pred.golesLocalPred);
            golesVisitantesTemp[pId] = String(pred.golesVisitantePred);
          }
        });

        if (activo) {
          setPartidosPronosticados(idsBloqueados);
          setPronosticoLocal((prev) => ({ ...prev, ...golesLocalesTemp }));
          setPronosticoVisitante((prev) => ({
            ...prev,
            ...golesVisitantesTemp,
          }));
        }
      } catch (error) {
        console.error("No se encontraron predicciones previas.");
      }

      if (activo) setLoading(false);
    };

    inicializarDashboard();

    return () => {
      activo = false;
    };
  }, []);

  const handleGuardarPronostico = async (partidoId: number) => {
    const gLocal = pronosticoLocal[partidoId];
    const gVisitante = pronosticoVisitante[partidoId];

    if (
      gLocal === undefined ||
      gVisitante === undefined ||
      gLocal === "" ||
      gVisitante === ""
    ) {
      alert("¡Por favor introduce un marcador completo antes de guardar!");
      return;
    }

    try {
      await api.post("/predicciones", {
        partidoId: partidoId,
        golesLocalPred: parseInt(gLocal, 10),
        golesVisitantePred: parseInt(gVisitante, 10),
      });

      alert("🎯 ¡Pronóstico registrado con éxito!");
      setPartidosPronosticados((prev) => [...prev, partidoId]);

      const resPredicciones = await api.get<ResponseDTO<any[]>>(
        "/predicciones/mis-predicciones",
      );
      setMisPrediccionesRaw(resPredicciones.data.data);
    } catch (error: any) {
      alert(
        error.response?.data?.message || "Error al procesar tu pronóstico.",
      );
    }
  };

  const formatearFecha = (fechaStr: string) => {
    // Si la fecha viene de la BD como '2026-06-11T13:00:00' o similar,
    // nos aseguramos de reemplazar la 'Z' si existe para que el navegador la tome en hora local pura
    const fechaLimpia = fechaStr.includes("Z")
      ? fechaStr.replace("Z", "")
      : fechaStr;
    const fecha = new Date(fechaLimpia);

    return fecha.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // Muestra 01:00 PM en lugar de 13:00
    });
  };

  //  LÓGICA MAESTRA OPTIMIZADA (OPCIÓN 2): Cruce sobre todos los partidos de la BD
  const obtenerHistorialCompleto = (): PrediccionHistorial[] => {
    const ahora = new Date();
    const historialUnificado: PrediccionHistorial[] = [...misPrediccionesRaw];

    // Recorremos el universo completo de partidos devuelto por la opción 2
    todosLosPartidos.forEach((partido) => {
      // AQUÍ ENTRA LA LIMPIEZA DE ZONA HORARIA
      const fechaLimpia = partido.fechaHora.includes("Z")
        ? partido.fechaHora.replace("Z", "")
        : partido.fechaHora;

      const fechaPartido = new Date(fechaLimpia);

      // Un partido califica para el historial si ya pasó de su hora o si su estado es JUGADO
      const yaExpiro = fechaPartido < ahora || partido.estado === "JUGADO";

      const yaTieneApuesta = misPrediccionesRaw.some(
        (pred) => pred.partido?.id === partido.id,
      );

      // Si el partido ya caducó/terminó y el usuario no apostó, le creamos su tarjeta virtual vacía
      if (yaExpiro && !yaTieneApuesta) {
        historialUnificado.push({
          id: Math.random(),
          partido: partido,
          golesLocalPred: null,
          golesVisitantePred: null,
          puntosGanados: 0,
        });
      }
    });

    //   OPCIONAL: También puedes limpiar las fechas en el ordenamiento final para que sea exacto
    return historialUnificado.sort((a, b) => {
      const fechaA = a.partido.fechaHora.includes("Z")
        ? a.partido.fechaHora.replace("Z", "")
        : a.partido.fechaHora;
      const fechaB = b.partido.fechaHora.includes("Z")
        ? b.partido.fechaHora.replace("Z", "")
        : b.partido.fechaHora;
      return new Date(fechaB).getTime() - new Date(fechaA).getTime();
    });
  };

  const prediccionesFiltradas = obtenerHistorialCompleto().filter((pred) => {
    const partido = pred.partido;
    if (!partido) return false;

    const cumpleFase = filtroFase === "TODAS" || partido.fase === filtroFase;
    const grupoPartido = partido.grupo || "NINGUNO";
    const cumpleGrupo = filtroGrupo === "TODOS" || grupoPartido === filtroGrupo;

    return cumpleFase && cumpleGrupo;
  });

  // Filtrado estricto para la primera pestaña (SÓLO lo que tenga fecha futura y siga PENDIENTE)
  const partidosActivosValidos = partidosActivos.filter((partido) => {
    const fechaLimpia = partido.fechaHora.includes("Z")
      ? partido.fechaHora.replace("Z", "")
      : partido.fechaHora;
    const fechaPartido = new Date(fechaLimpia);
    const ahora = new Date();
    return fechaPartido > ahora && partido.estado !== "JUGADO";
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-green-500 selection:text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-green-700 to-emerald-950 rounded-2xl p-6 md:p-8 text-white shadow-lg mb-8">
          <h1 className="text-3xl font-black md:text-4xl tracking-tight">
            Estadio <span className="text-green-300">Quiniela Pro</span>
          </h1>
          <p className="text-green-100 text-sm md:text-base mt-2 max-w-xl">
            Calcula tus jugadas, asegura tus marcadores y escala puestos en la
            tabla general.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => setVistaActiva("partidos")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                vistaActiva === "partidos"
                  ? "bg-white text-emerald-950 shadow-md"
                  : "bg-green-800/40 text-green-100 hover:bg-green-800/60"
              }`}
            >
              <IoListOutline className="w-4 h-4" />
              Ver Partidos
            </button>
            <button
              onClick={() => setVistaActiva("mis_pronosticos")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                vistaActiva === "mis_pronosticos"
                  ? "bg-white text-emerald-950 shadow-md"
                  : "bg-green-800/40 text-green-100 hover:bg-green-800/60"
              }`}
            >
              <IoEyeOutline className="w-4 h-4" />
              Mis Pronósticos
            </button>
            <button
              onClick={() => setVistaActiva("ranking")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                vistaActiva === "ranking"
                  ? "bg-white text-emerald-950 shadow-md"
                  : "bg-green-800/40 text-green-100 hover:bg-green-800/60"
              }`}
            >
              <IoTrophyOutline className="w-4 h-4" />
              Tabla de Ranking
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium animate-pulse">
            ⚽ Cargando cartelera y posiciones de la Quiniela...
          </div>
        ) : (
          <>
            {/* --- VISTA 1: FIXTURE DISPONIBLE --- */}
            {vistaActiva === "partidos" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <IoFootballOutline className="text-green-600 h-6 w-6" />
                  Fixture Disponible
                </h2>
                {partidosActivosValidos.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
                    No hay partidos activos o disponibles para apostar en este
                    momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {partidosActivosValidos.map((partido) => {
                      const yaPronosticado = partidosPronosticados.includes(
                        partido.id,
                      );
                      return (
                        <div
                          key={partido.id}
                          className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-300"
                        >
                          {/* Encabezado: Fase y Fecha */}
                          <div className="flex items-center justify-between mb-5">
                            <span className="text-[11px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-md tracking-wider">
                              {partido.fase.replace("_", " ")}
                            </span>
                            <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                              <IoTimeOutline className="w-4 h-4 text-slate-400" />
                              {formatearFecha(partido.fechaHora)}
                            </div>
                          </div>

                          <div className="grid grid-cols-[1fr_auto_1fr] items-center my-2 gap-4">
                            {/* 🏠 1. EQUIPO LOCAL (Empuja todo hacia la derecha, bandera al centro) */}
                            <div className="flex items-center justify-end gap-3 min-w-0">
                              <div className="text-right min-w-0">
                                <span
                                  className="font-black text-slate-800 text-sm md:text-base block truncate"
                                  title={partido.equipoLocal}
                                >
                                  {partido.equipoLocal}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                  Local
                                </span>
                              </div>
                              <img
                                src={`/banderas/${partido.banderaLocal}`}
                                alt={partido.equipoLocal}
                                className="w-9 h-6 object-cover rounded-md shadow-sm border border-slate-200 flex-shrink-0"
                              />
                            </div>

                            {/* 🔢 2. CONTENEDOR CENTRAL (Marcadores compactos) */}
                            <div className="flex items-center justify-center gap-2 px-1">
                              <input
                                type="number"
                                min="0"
                                placeholder="-"
                                disabled={yaPronosticado}
                                className={`w-11 h-11 border rounded-xl text-center text-lg font-black text-slate-800 focus:outline-none focus:border-green-600 transition-all shadow-inner ${
                                  yaPronosticado
                                    ? "bg-slate-100 border-slate-200 text-slate-400"
                                    : "bg-slate-50 border-slate-300 hover:border-slate-400"
                                }`}
                                value={pronosticoLocal[partido.id] ?? ""}
                                onChange={(e) =>
                                  setPronosticoLocal({
                                    ...pronosticoLocal,
                                    [partido.id]: e.target.value,
                                  })
                                }
                              />
                              <span className="text-slate-300 font-black text-xs uppercase px-0.5">
                                vs
                              </span>
                              <input
                                type="number"
                                min="0"
                                placeholder="-"
                                disabled={yaPronosticado}
                                className={`w-11 h-11 border rounded-xl text-center text-lg font-black text-slate-800 focus:outline-none focus:border-green-600 transition-all shadow-inner ${
                                  yaPronosticado
                                    ? "bg-slate-100 border-slate-200 text-slate-400"
                                    : "bg-slate-50 border-slate-300 hover:border-slate-400"
                                }`}
                                value={pronosticoVisitante[partido.id] ?? ""}
                                onChange={(e) =>
                                  setPronosticoVisitante({
                                    ...pronosticoVisitante,
                                    [partido.id]: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div className="flex items-center justify-start gap-3 min-w-0">
                              <img
                                src={`/banderas/${partido.banderaVisitante}`}
                                alt={partido.equipoVisitante}
                                className="w-9 h-6 object-cover rounded-md shadow-sm border border-slate-200 flex-shrink-0"
                              />
                              <div className="text-left min-w-0">
                                <span
                                  className="font-black text-slate-800 text-sm md:text-base block truncate"
                                  title={partido.equipoVisitante}
                                >
                                  {partido.equipoVisitante}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                  Visitante
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Botón de Acción */}
                          <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                            {yaPronosticado ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50/60 border border-emerald-200 text-xs font-bold px-4 py-2 rounded-xl shadow-sm">
                                <IoCheckmarkCircleOutline className="w-4 h-4" />
                                Pronóstico Enviado
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  handleGuardarPronostico(partido.id)
                                }
                                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
                              >
                                <IoCheckmarkCircleOutline className="w-4 h-4" />
                                Enviar Pronóstico
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- VISTA 2: SECCIÓN "MIS PRONÓSTICOS" (RELOJ COMPLETO DE LA OPCIÓN 2) --- */}
            {vistaActiva === "mis_pronosticos" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                    <IoFilterOutline className="text-green-600 w-5 h-5" />
                    <span>Filtrar Apuestas:</span>
                  </div>

                  <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-end">
                    <select
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-green-600 font-medium"
                      value={filtroFase}
                      onChange={(e) => setFiltroFase(e.target.value)}
                    >
                      <option value="TODAS">Todas las Fases</option>
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

                    <select
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-green-600 font-medium"
                      value={filtroGrupo}
                      onChange={(e) => setFiltroGrupo(e.target.value)}
                    >
                      <option value="TODOS">Todos los Grupos</option>
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
                      <option value="NINGUNO">Sin Grupo (Eliminatorias)</option>
                    </select>
                  </div>
                </div>

                {prediccionesFiltradas.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
                    No se encontraron pronósticos que coincidan con los filtros
                    seleccionados.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {prediccionesFiltradas.map((pred) => {
                      const part = pred.partido;
                      const esFinalizado = part.estado === "JUGADO";
                      const esNoApostado = pred.golesLocalPred === null;

                      return (
                        <div
                          key={pred.id || part.id}
                          className={`bg-white border rounded-2xl shadow-sm p-5 flex flex-col justify-between relative overflow-hidden transition-all ${
                            esNoApostado
                              ? "border-red-200 bg-red-50/10"
                              : "border-slate-200"
                          }`}
                        >
                          {esFinalizado && (
                            <div className="absolute top-0 right-0 bg-slate-800 text-slate-300 font-bold text-[10px] tracking-wider uppercase px-3 py-1 rounded-bl-xl border-l border-b border-slate-700">
                              Resultado Oficial
                            </div>
                          )}

                          {!esFinalizado && esNoApostado && (
                            <div className="absolute top-0 right-0 bg-red-600 text-white font-bold text-[10px] tracking-wider uppercase px-3 py-1 rounded-bl-xl">
                              No Jugado
                            </div>
                          )}

                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md">
                              {part.fase.replace("_", " ")}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {formatearFecha(part.fechaHora)}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 items-center text-center my-3 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                            <span className="font-extrabold text-slate-800 text-sm truncate">
                              {part.equipoLocal}
                            </span>
                            <div className="flex flex-col items-center justify-center">
                              <span
                                className={`text-xl font-black tracking-widest ${esNoApostado ? "text-red-500" : "text-slate-900"}`}
                              >
                                {esNoApostado
                                  ? "- : -"
                                  : `${pred.golesLocalPred} - ${pred.golesVisitantePred}`}
                              </span>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${esNoApostado ? "text-red-600" : "text-green-600"}`}
                              >
                                {esNoApostado ? "Sin Pronóstico" : "Tu Apuesta"}
                              </span>
                            </div>
                            <span className="font-extrabold text-slate-800 text-sm truncate">
                              {part.equipoVisitante}
                            </span>
                          </div>

                          {esFinalizado ? (
                            <>
                              <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">
                                  Marcador del Torneo:
                                </span>
                                <span className="font-black text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg tracking-wider">
                                  {part.golesLocal} - {part.golesVisitante}
                                </span>
                              </div>
                              <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">
                                  Puntos obtenidos:
                                </span>
                                <span
                                  className={`font-black bg-slate-100 border px-2.5 py-1 rounded-lg tracking-wider ${
                                    esNoApostado
                                      ? "text-red-600 border-red-100"
                                      : "text-slate-800 border-slate-200"
                                  }`}
                                >
                                  {pred.puntosGanados} pts
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 font-medium text-xs">
                              {esNoApostado ? (
                                <span className="text-red-500 font-semibold">
                                  El tiempo de juego expiró. No acumulaste
                                  puntos.
                                </span>
                              ) : (
                                <>
                                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                                  <span className="text-amber-600">
                                    Partido en espera de resultado oficial...
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- VISTA 3: TABLA DE RANKING --- */}
            {vistaActiva === "ranking" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <IoTrophyOutline className="text-yellow-500 h-5 w-5" />
                  <h2 className="font-bold text-slate-800 text-lg">
                    Tabla General de Posiciones
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="py-4 px-6 text-center w-20">Posición</th>
                        <th className="py-4 px-6">Usuario</th>
                        <th className="py-4 px-6 text-right w-36">
                          Puntos Totales
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {ranking.map((row, index) => {
                        const esPodio = index < 3;
                        const coloresPodio = [
                          "bg-yellow-100 text-yellow-700 border-yellow-300",
                          "bg-slate-200 text-slate-700 border-slate-300",
                          "bg-amber-100 text-amber-800 border-amber-300",
                        ];
                        return (
                          <tr
                            key={row.username}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-4 px-6 font-bold text-center">
                              <span
                                className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs border font-black ${
                                  esPodio
                                    ? coloresPodio[index]
                                    : "bg-slate-50 border-slate-200 text-slate-500"
                                }`}
                              >
                                {index + 1}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-semibold text-slate-800">
                              @{row.username}
                            </td>
                            <td className="py-4 px-6 text-right font-black text-slate-900 text-base">
                              <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg border border-green-100">
                                {row.puntosTotales} pts
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
