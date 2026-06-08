import { createContext } from "react";
import type { UserState } from "../types";

export interface AuthContextType {
  user: UserState | null;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAdmin: () => boolean;
  isActivo: () => boolean;
  loading: boolean; // Se queda aquí para no romper contratos
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
