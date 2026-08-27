"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  cpf?: string;
  role: string;
  avatar_url?: string;
  tenant?: {
    id: number;
    slug: string;
    name: string;
    bio?: string;
    logo_url?: string;
    banner_url?: string;
    whatsapp?: string;
    instagram?: string;
    pix_key?: string;
    is_verified: boolean;
    available_balance: number;
    total_sales_amount: number;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (token: string, userData: UserProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("rifa_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const response = await api.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Auth error:", error);
      localStorage.removeItem("rifa_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, userData: UserProfile) => {
    localStorage.setItem("rifa_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("rifa_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
