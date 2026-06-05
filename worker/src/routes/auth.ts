import { Hono } from "hono";
import { hashPassword, verifyPassword } from "../lib/hash";
import { signJwt } from "../lib/jwt";
import { newId } from "../lib/id";
import type { Env } from "../middleware/auth";

const auth = new Hono<{ Bindings: Env }>();

auth.post("/register", async (c) => {
  const { email, password, stage_name } = await c.req.json<{
    email: string;
    password: string;
    stage_name?: string;
  }>();

  if (!email || !password)
    return c.json({ error: "email and password required" }, 400);
  if (password.length < 8)
    return c.json({ error: "password must be at least 8 characters" }, 400);

  const existing = await c.env.DB.prepare(
    "SELECT id FROM users WHERE email = ?"
  )
    .bind(email.toLowerCase())
    .first();
  if (existing) return c.json({ error: "email already registered" }, 409);

  const id = newId();
  const pass_hash = await hashPassword(password);

  await c.env.DB.prepare(
    "INSERT INTO users (id, email, pass_hash, stage_name) VALUES (?, ?, ?, ?)"
  )
    .bind(id, email.toLowerCase(), pass_hash, stage_name ?? null)
    .run();

  const token = await signJwt({ sub: id, email }, c.env.JWT_SECRET);
  return c.json({ token, user: { id, email, stage_name: stage_name ?? null } });
});

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json<{
    email: string;
    password: string;
  }>();

  if (!email || !password)
    return c.json({ error: "email and password required" }, 400);

  const user = await c.env.DB.prepare(
    "SELECT id, email, pass_hash, stage_name FROM users WHERE email = ?"
  )
    .bind(email.toLowerCase())
    .first<{ id: string; email: string; pass_hash: string; stage_name: string | null }>();

  if (!user) return c.json({ error: "invalid credentials" }, 401);

  const ok = await verifyPassword(password, user.pass_hash);
  if (!ok) return c.json({ error: "invalid credentials" }, 401);

  const token = await signJwt(
    { sub: user.id, email: user.email },
    c.env.JWT_SECRET
  );
  return c.json({
    token,
    user: { id: user.id, email: user.email, stage_name: user.stage_name },
  });
});

export default auth;
