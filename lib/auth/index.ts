// lib/auth/index.ts
import NextAuth from "next-auth";
import { authOptions } from "./config";

// Create NextAuth instance
const auth = NextAuth(authOptions);

// Export server-side functions
export const { 
  handlers, 
  auth: getServerAuth,
  signIn: serverSignIn, 
  signOut: serverSignOut 
} = auth;

// Re-export client functions from 'next-auth/react'
export { signIn, signOut } from "next-auth/react";
export { getServerSession } from "next-auth";