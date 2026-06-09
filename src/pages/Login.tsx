import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { IoFootball, IoEye, IoEyeOff } from "react-icons/io5";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // 1. Intentamos iniciar sesión
    const result = await login(username, password);

    if (result.success) {
      const rolesRaw = localStorage.getItem("roles");
      const roles: string[] = rolesRaw ? JSON.parse(rolesRaw) : [];

      setIsSubmitting(false);

      if (roles.includes("ROLE_ADMIN")) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } else {
      setIsSubmitting(false);
      setError(result.message || "Credenciales inválidas");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-800 to-emerald-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <IoFootball
              className="h-10 w-10 animate-spin"
              style={{ animationDuration: "6s" }}
            />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
            Quiniela Mundial 2026
          </h2>
        </div>

        {/* Alerta de Error en caso de credenciales incorrectas */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border-l-4 border-red-500 font-medium">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            {/* Input Usuario */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Nombre de Usuario
              </label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:text-sm transition-colors"
                placeholder="usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Input Password */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Contraseña
              </label>
              {/* 1. SE AGREGÓ UN CONTENEDOR RELATIVO AQUÍ */}
              <div className="relative flex items-center">
                <input
                  // 2. AHORA EL TIPO CAMBIA DINÁMICAMENTE
                  type={showPassword ? "text" : "password"}
                  required
                  // 3. CAMBIÉ px-3 POR pl-3 Y pr-10 PARA QUE EL TEXTO NO SE LE ENCIEME AL OJO
                  className="w-full rounded-lg border border-gray-300 pl-3 pr-10 py-2 text-gray-950 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:text-sm transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none flex items-center"
                >
                  {/* 4. NOTA: Invertí los iconos para que IoEyeOff aparezca cuando está oculto y IoEye cuando se ve */}
                  {showPassword ? (
                    <IoEyeOff className="h-5 w-5" />
                  ) : (
                    <IoEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Botón de Enviar */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 transition-colors cursor-pointer"
            >
              {isSubmitting ? "Verificando..." : "Entrar a la Cancha"}
            </button>
          </div>
          <div className="mt-6 text-center text-xs font-medium text-slate-400">
            <Link
              to="/register"
              className="text-green-600 hover:underline font-bold"
            >
              Regístrate
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
