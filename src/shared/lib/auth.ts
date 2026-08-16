import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { env } from '@/config/env';
import { userRepository } from '@/modules/users/infrastructure/UserRepository';
import { verifyPassword } from '@/shared/lib/password';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await userRepository.findByEmail(credentials.email as string);
        if (!user || user.status === 'suspended') return null;

        const isValid = await verifyPassword(credentials.password as string, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          // Named isEmailVerified (not emailVerified) to avoid colliding with
          // NextAuth's own reserved `User.emailVerified: Date | null` field.
          isEmailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string; status?: string; isEmailVerified?: boolean }).role;
        token.status = (user as { role?: string; status?: string; isEmailVerified?: boolean }).status;
        token.isEmailVerified = (user as { role?: string; status?: string; isEmailVerified?: boolean }).isEmailVerified;
      } else if (trigger === 'update' && token.id) {
        // The JWT is otherwise only populated at sign-in, so fields that can
        // change mid-session (e.g. emailVerified right after the user
        // completes verification) would stay stale until next login unless
        // explicitly refreshed here when the client calls session.update().
        const freshUser = await userRepository.findById(token.id as string);
        if (freshUser) {
          token.role = freshUser.role;
          token.status = freshUser.status;
          token.isEmailVerified = freshUser.emailVerified;
        }
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
});
