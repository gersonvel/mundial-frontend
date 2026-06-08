import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, isActivo } = useAuth();

  // Mientras se verifica si hay un token válido en el localStorage, mostramos un estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold animate-pulse">
        ⚽ Verificando credenciales...
      </div>
    );
  }

  //CONTROL 1: Si no está logueado, directo al Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. CONTROL 1.5: Ya sabemos que 'user' existe con seguridad. Ahora sí evaluamos si está activo.
  // Nota: Dejamos pasar a los administradores siempre para evitar que el admin se bloquee a sí mismo.
  const esAdmin = user.roles?.includes("ROLE_ADMIN");
  if (!isActivo() && !esAdmin) {
    return <Navigate to="/cuenta-inactiva" replace />;
  }

  // CONTROL 2: Si la ruta exige roles específicos (como ser Admin) y el usuario no lo tiene, lo rebotamos
  if (allowedRoles && !allowedRoles.some((rol) => user.roles.includes(rol))) {
    // Si un usuario común intenta entrar a /admin, lo mandamos a su dashboard normal
    return <Navigate to="/dashboard" replace />;
  }

  // Si pasa todos los filtros, permitimos el acceso al componente hijo
  return <Outlet />;
};
