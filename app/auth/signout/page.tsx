// app/auth/signout/page.tsx
'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function SignOutPage() {
  useEffect(() => {
    signOut({ 
      callbackUrl: '/auth/signin',
      redirect: true 
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Signing you out...</p>
      </div>
    </div>
  );
}