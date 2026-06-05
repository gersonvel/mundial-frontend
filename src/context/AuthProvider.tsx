import { useState } from "react";
import type { ReactNode } from "react";
import api from "../api/axios";
import { AuthContext } from "./AuthContext";
import type { UserState } from "../types";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const rolesStr = localStorage.getItem("roles");

    if (token && username && rolesStr) {
      return { username, roles: JSON.parse(rolesStr) };
    }
    return null;
  });

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { username, password });

      const { jwt, roles, username: loggedUser } = response.data;

      localStorage.setItem("token", jwt);
      localStorage.setItem("username", loggedUser);
      localStorage.setItem("roles", JSON.stringify(roles));

      setUser({ username: loggedUser, roles });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: "Error al iniciar sesión" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("roles");
    setUser(null);
  };

  const isAdmin = () => user?.roles.includes("ROLE_ADMIN") ?? false;

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAdmin, loading: false }}
    >
      {children}
    </AuthContext.Provider>
  );
};
