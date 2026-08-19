import type { NextAuthConfig } from 'next-auth';
import { env } from '@/config/env';

// Edge-safe base config: no providers and no DB-backed code, so this file
// (and anything importing it) can be bundled into the Edge middleware
// without pulling in mongoose. The full config with the Credentials
// provider lives in `auth.ts`, which only runs in the Node.js runtime.
export const authConfig = {
  secret: env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string; status?: string; isEmailVerified?: boolean }).role;
        token.status = (user as { role?: string; status?: string; isEmailVerified?: boolean }).status;
        token.isEmailVerified = (user as { role?: string; status?: string; isEmailVerified?: boolean }).isEmailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as { role?: string; id?: string; status?: string; isEmailVerified?: boolean };
        (session.user as typeof t).role = t.role;
        (session.user as typeof t).id = t.id;
        (session.user as typeof t).status = t.status;
        (session.user as typeof t).isEmailVerified = t.isEmailVerified;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
