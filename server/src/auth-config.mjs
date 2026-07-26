import PostgresAdapter from "@auth/pg-adapter";
import { configuredProviders } from "./provider-config.mjs";

export function createAuthConfig(pool, env = process.env) {
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return Object.freeze({
    adapter: PostgresAdapter(pool),
    providers: configuredProviders(env),
    secret: env.AUTH_SECRET,
    trustHost: true,
    session: Object.freeze({
      strategy: "database",
      maxAge: 30 * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
    }),
    callbacks: Object.freeze({
      session({ session, user }) {
        if (session.user && user?.id !== undefined) {
          session.user.id = String(user.id);
        }
        return session;
      },
    }),
  });
}
