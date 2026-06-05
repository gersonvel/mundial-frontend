import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import {
  IoPersonAddOutline,
  IoLockClosedOutline,
  IoFootballOutline,
} from "react-icons/io5";
import { toast } from "sonner";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones básicas en el cliente
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    setLoading(false);

    try {
      await api.post("/auth/registro", { username, password });

      toast.success("¡Usuario creado con éxito! Ya puedes iniciar sesión.");
      navigate("/login");
    } catch (err: any) {
      console.error("Error al registrar el usuario:", err);
      setError(err.response?.data?.message || "Error al registrar el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decoración superior estética */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>

        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-emerald-400 mb-3 animate-pulse">
            <IoFootballOutline className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Crea tu <span className="text-emerald-400">Cuenta</span>
          </h1>
          {/* <p className="text-xs text-slate-400 mt-1 font-medium">
            Únete a la Quiniela Mundial 2026 y demuestra quién manda
          </p> */}
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-900/60 text-red-300 rounded-xl text-xs font-semibold mb-5 text-center">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Nombre de Usuario
            </label>
            <div className="relative">
              <IoPersonAddOutline className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
              <input
                type="text"
                required
                placeholder="usuario"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <IoLockClosedOutline className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <IoLockClosedOutline className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer text-sm disabled:opacity-50 mt-2"
          >
            {loading ? "Registrando..." : "Registrarme"}
          </button>
        </form>

        {/* Enlace de navegación */}
        <div className="mt-6 text-center text-xs font-medium text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="text-emerald-400 hover:underline font-bold"
          >
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
