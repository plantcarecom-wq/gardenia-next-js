import NextAuth from 'next-auth';
import { authConfig } from '@/shared/lib/auth.config';

// Edge-safe NextAuth instance used only for reading/decoding the session
// JWT (e.g. in `proxy.ts`). It must not import the Credentials provider or
// any DB-backed repository, since those transitively pull in mongoose,
// which the Edge Runtime cannot bundle.
export const { auth } = NextAuth(authConfig);
