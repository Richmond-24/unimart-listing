import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  session: {
    strategy: 'jwt' as const,  // Use JWT for sessions
  },
  providers: [],  // Providers will be added in auth.ts
  pages: {
    signIn: '/login',    // Custom sign-in page
    newUser: '/register', // Custom sign-up page
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard');
      
      if (isOnDashboard) {
        return isLoggedIn;  // Dashboard requires auth
      }
      return true;  // Other pages are public
    },
  },
} satisfies NextAuthConfig;