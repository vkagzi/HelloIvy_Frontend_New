import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      first_name?: string;
      last_name?: string;
      role?: string;
      school_id?: number;
      school_name?: string;
      terms_accepted?: boolean;
      force_password_change?: boolean;
    } & DefaultSession['user'];
    accessToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    school_id?: number;
    school_name?: string;
    terms_accepted?: boolean;
    force_password_change?: boolean;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    school_id?: number;
    school_name?: string;
    terms_accepted?: boolean;
    force_password_change?: boolean;
    accessToken?: string;
  }
}
