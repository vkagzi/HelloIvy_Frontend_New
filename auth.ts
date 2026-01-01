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
            name: user.name || user.email,
            accessToken: data.token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});
