import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        try {
          // Call your backend API for authentication
          const res = await fetch(`${baseUrl}/api/accounts/login/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            return null;
          }

          const data = await res.json();

          // Fetch user details
          const userRes = await fetch(`${baseUrl}/api/accounts/me/`, {
            headers: {
              Authorization: `Bearer ${data.token}`,
            },
          });

          if (!userRes.ok) {
            return null;
          }

          const user = await userRes.json();

          // Return user object with token
          return {
            id: user.id.toString(),
            email: user.email,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email,
            role: user.role || 'student',
            school_id: user.school_id || undefined,
            school_name: user.school_name || undefined,
            terms_accepted: user.terms_accepted ?? false,
            accessToken: data.token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.role = user.role;
        token.school_id = user.school_id;
        token.school_name = user.school_name;
        token.terms_accepted = user.terms_accepted;
        token.accessToken = user.accessToken;
      }
      if (trigger === 'update' && session?.terms_accepted !== undefined) {
        token.terms_accepted = session.terms_accepted;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.first_name = token.first_name as string | undefined;
        session.user.last_name = token.last_name as string | undefined;
        session.user.role = token.role as string;
        session.user.school_id = token.school_id as number | undefined;
        session.user.school_name = token.school_name as string | undefined;
        session.user.terms_accepted = token.terms_accepted as boolean | undefined;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});
