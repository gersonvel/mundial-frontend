import { IoLockClosedOutline, IoLogoWhatsapp } from "react-icons/io5";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const CuentaInactiva = () => {
  const { logout, user, isActivo } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("quiniela_bloqueados");
    logout();
    navigate("/login");
  };
  useEffect(() => {
    const esAdmin = user?.roles?.includes("ROLE_ADMIN");
    if (isActivo() || esAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isActivo, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-6">
        {/* Ícono de Bloqueo */}
        <div className="mx-auto h-16 w-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
          <IoLockClosedOutline className="w-8 h-8" />
        </div>

        {/* Mensaje Principal */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            ¡Hola, {user?.username}!
          </h1>
          <h2 className="text-lg font-bold text-slate-700">
            Tu cuenta está en espera de activación
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Para poder ingresar a la quiniela, enviar tus pronósticos y ver la
            tabla de posiciones, tu cuenta debe ser activada por el
            administrador.
          </p>
        </div>

        {/* Caja de Acción Informativa */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-600 font-medium text-left space-y-1">
          <p className="font-bold text-slate-700">¿Qué debes hacer?</p>
          <p>
            1. Envía tu comprobante de registro al administrador de la quiniela.
          </p>
          <p>
            2. Espera la confirmación, recarga la página o vuelve a iniciar
            sesión.
          </p>
        </div>

        {/* Botones */}
        <div className="pt-2 flex flex-col gap-3">
          <a
            href="https://wa.me/5540820434"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-3 px-5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <IoLogoWhatsapp className="w-5 h-5" />
            Contactar al Administrador
          </a>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm py-3 px-5 rounded-xl transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
          >
            Ya envíe mi comprobante, verificar mi activación
          </button>

          <button
            onClick={handleLogout}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer py-2"
          >
            Cerrar Sesión e iniciar con otra cuenta
          </button>
        </div>
      </div>
    </div>
  );
};

export default CuentaInactiva;
