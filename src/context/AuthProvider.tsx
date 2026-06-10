import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from "../api/axios";
import { AuthContext } from "./AuthContext";
import type { UserState } from "../types";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 1. Mantenemos tu lectura inicial síncrona del localStorage
  const [user, setUser] = useState<UserState | null>(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const rolesStr = localStorage.getItem("roles");

    if (token && username && rolesStr) {
      return { username, roles: JSON.parse(rolesStr) };
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return !!localStorage.getItem("token");
  });

  useEffect(() => {
    const revalidarUsuarioActual = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { username: loggedUser, activo, roles } = response.data;

        setUser({ username: loggedUser, activo, roles });
        localStorage.setItem("roles", JSON.stringify(roles));
      } catch (error) {
        console.error("Token inválido o expirado:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("roles");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    revalidarUsuarioActual();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { username, password });

      const { jwt, roles, username: loggedUser, activo } = response.data;

      localStorage.setItem("token", jwt);
      localStorage.setItem("username", loggedUser);
      localStorage.setItem("roles", JSON.stringify(roles));

      setUser({ username: loggedUser, activo, roles });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data || "Error al iniciar sesión",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("roles");
    setUser(null);
  };

  const isAdmin = () => user?.roles.includes("ROLE_ADMIN") ?? false;

  const isActivo = () => !!user?.activo;

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAdmin, isActivo, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
