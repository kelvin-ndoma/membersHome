// contexts/AuthContext.tsx
"use client";

import { useSession } from "next-auth/react";
import { createContext, useContext, ReactNode } from "react";

interface AuthContextType {
  session: any;
  status: "loading" | "authenticated" | "unauthenticated";
  isPlatformAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const isPlatformAdmin = session?.user?.platformRole === "PLATFORM_ADMIN";

  return (
    <AuthContext.Provider
      value={{
        session,
        status,
        isPlatformAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}