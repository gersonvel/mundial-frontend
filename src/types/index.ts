export interface Rol {
  id: number;
  nombre: string;
}

export interface UsuarioRol {
  id: number;
  rol: Rol;
}

export interface Usuario {
  id: number;
  username: string;
  puntosTotales: number;
  usuarioRoles?: UsuarioRol[];
}

// Interfaz simple para controlar la sesión activa en React
export interface UserState {
  username: string;
  roles: string[];
}

export interface Partido {
  id: number;
  equipoLocal: string;
  equipoVisitante: string;
  golesLocal: number | null;
  golesVisitante: number | null;
  fechaHora: string;
  estado: "PENDIENTE" | "JUGADO";
  fase: string;
  grupo: string | null;
  ganadorPenales?: string | null; 
}

export interface ResponseDTO<T> {
  status: number;
  error: boolean;
  message: string;
  data: T;
}

export interface Prediccion {
  id?: number;
  partidoId: number;
  golesLocalPronostico: number;
  golesVisitantePronostico: number;
}

export interface PartidoConPronostico {
  partido: Partido;
  pronostico: Prediccion | null;
}