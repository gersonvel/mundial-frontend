import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { IoFootball, IoLogOutOutline } from "react-icons/io5";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("quiniela_bloqueados");
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo de la App */}
        <div className="flex items-center space-x-2">
          <IoFootball
            className="h-7 w-7 text-emerald-400 animate-spin"
            style={{ animationDuration: "10s" }}
          />
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
            {/* QUINIELA MUNDIAL 2026 */}
          </span>
        </div>

        {/* Info de Usuario y Cierre de Sesión */}
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">
              @{user?.username}
            </p>
            <p className="text-xs text-emerald-400 font-medium">
              {user?.roles.includes("ROLE_ADMIN") ? "Administrador" : "Jugador"}
            </p>
          </div>

          {/* Línea divisoria */}
          <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

          {/* Botón de Cerrar Sesión Estilizado */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-red-600 border border-slate-700 hover:border-red-500 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 group cursor-pointer"
          >
            <IoLogOutOutline className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
            <span className="group-hover:text-white transition-colors">
              Salir
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
