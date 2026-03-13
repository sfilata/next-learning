import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import z from "zod";
import postgres from "postgres";
import { User } from "./app/lib/definitions";
import bcrypt from "bcryptjs";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const getUser = async (email: string) => {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    return user[0];
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user');
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [Credentials({
    async authorize(credentials): Promise<User | null> {
      const parsedCredentials = z.object({ email: z.string().email(), password: z.string().min(6) })
        .safeParse(credentials);

      if (parsedCredentials.success) {
        const { email, password } = parsedCredentials.data;
        const user = await getUser(email);

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
          return user;
        }

        console.log('Invalid password for user:', email);

        return null;
      }

      return null;
    }
  })]
})