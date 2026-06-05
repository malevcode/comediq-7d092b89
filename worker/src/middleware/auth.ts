import type { Context, Next } from "hono";
import { verifyJwt } from "../lib/jwt";

export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

export async function authMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const header = c.req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);

  c.set("userId", payload.sub as string);
  await next();
}
