import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const secret = process.env["BETTER_AUTH_SECRET"];
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}

const BCRYPT_COST = 12;

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret,
  baseURL: process.env["BETTER_AUTH_URL"] ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // саморегистрации нет: агентства создаёт супер-админ
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: false,
    requireEmailVerification: false,
    password: {
      hash: (password) => bcrypt.hash(password, BCRYPT_COST),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 дней
    updateAge: 60 * 60 * 24, // обновлять токен раз в сутки активности
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 минут
    },
  },
  plugins: [nextCookies()], // должен быть последним
});

export type Session = typeof auth.$Infer.Session;
