"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "customer" | "shopkeeper";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  storeName?: string;
  sellerId?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  signInDemo: (role: UserRole) => void;
  updateUserProfile: (profile: Partial<User>) => void;
  sendOtp: (email: string, role?: UserRole) => Promise<{ success: boolean; otpCode?: string; message?: string; error?: string }>;
  verifyOtp: (email: string, code: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loadingSession: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Check HttpOnly JWT session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch {
        /* ignore */
      } finally {
        setLoadingSession(false);
      }
    }
    checkSession();
  }, []);

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setUser(null);
  };

  const signInDemo = (role: UserRole) => {
    const demoUser: User = {
      id: role === "shopkeeper" ? "shopkeeper-maya" : "customer-alex",
      email: role === "shopkeeper" ? "aggigupta30@gmail.com" : "alex.morgan@gmail.com",
      name: role === "shopkeeper" ? "Maya Lin" : "Alex Morgan",
      role,
      storeName: role === "shopkeeper" ? "Maya's Kitchen" : undefined,
      sellerId: role === "shopkeeper" ? "mayas-kitchen" : undefined,
      avatar: role === "shopkeeper"
        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80"
        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    };
    setUser(demoUser);
  };

  const updateUserProfile = (profile: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...profile } : null));
  };

  const sendOtp = async (email: string, role: UserRole = "customer") => {
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      return { success: res.ok, otpCode: data.otpCode, message: data.message, error: data.error };
    } catch (err: any) {
      return { success: false, error: "Failed to send code." };
    }
  };

  const verifyOtp = async (email: string, code: string, role: UserRole = "customer") => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, role }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || "Invalid verification code." };
    } catch (err: any) {
      return { success: false, error: "Network error during verification." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        signOut,
        signInDemo,
        updateUserProfile,
        sendOtp,
        verifyOtp,
        loadingSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
