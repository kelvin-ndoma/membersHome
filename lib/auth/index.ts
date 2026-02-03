// lib/auth/index.ts - Update to export auth
import NextAuth from "next-auth";
import { authOptions } from "./config";

export const auth = NextAuth(authOptions);
export { getServerSession } from "next-auth";
export { signIn, signOut } from "./client";

// Then re-export everything
export default auth;