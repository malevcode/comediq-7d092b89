import { Hono } from "hono";
import { authMiddleware, type Env } from "../middleware/auth";
import { newId } from "../lib/id";

type Variables = { userId: string };
const sets = new Hono<{ Bindings: Env; Variables: Variables }>();

sets.use("*", authMiddleware);

sets.get("/", async (c) => {
  const userId = c.get("userId");
  const rows = await c.env.DB.prepare(
    `SELECT * FROM sets WHERE user_id = ? ORDER BY performed_at DESC, created_at DESC`
  )
    .bind(userId)
    .all();
  return c.json(rows.results);
});

sets.post("/", async (c) => {
  const userId = c.get("userId");
  const { venue, performed_at, stage_time_minutes, rating, notes } =
    await c.req.json<{
      venue?: string;
      performed_at: string;
      stage_time_minutes?: number;
      rating?: number;
      notes?: string;
    }>();

  if (!performed_at)
    return c.json({ error: "performed_at is required" }, 400);

  const id = newId();
  await c.env.DB.prepare(
    `INSERT INTO sets (id, user_id, venue, performed_at, stage_time_minutes, rating, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      userId,
      venue ?? null,
      performed_at,
      stage_time_minutes ?? null,
      rating ?? null,
      notes ?? null
    )
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM sets WHERE id = ?")
    .bind(id)
    .first();
  return c.json(row, 201);
});

sets.get("/:id", async (c) => {
  const userId = c.get("userId");
  const set = await c.env.DB.prepare(
    "SELECT * FROM sets WHERE id = ? AND user_id = ?"
  )
    .bind(c.req.param("id"), userId)
    .first();
  if (!set) return c.json({ error: "not found" }, 404);

  const bits = await c.env.DB.prepare(
    `SELECT sb.*, b.name, b.tags
     FROM set_bits sb
     JOIN bits b ON b.id = sb.bit_id
     WHERE sb.set_id = ?
     ORDER BY sb.order_in_set ASC, sb.created_at ASC`
  )
    .bind(c.req.param("id"))
    .all();

  return c.json({ ...set, bits: bits.results });
});

sets.put("/:id", async (c) => {
  const userId = c.get("userId");
  const existing = await c.env.DB.prepare(
    "SELECT id FROM sets WHERE id = ? AND user_id = ?"
  )
    .bind(c.req.param("id"), userId)
    .first();
  if (!existing) return c.json({ error: "not found" }, 404);

  const { venue, performed_at, stage_time_minutes, rating, notes } =
    await c.req.json<{
      venue?: string;
      performed_at?: string;
      stage_time_minutes?: number;
      rating?: number;
      notes?: string;
    }>();

  await c.env.DB.prepare(
    `UPDATE sets SET
       venue = COALESCE(?, venue),
       performed_at = COALESCE(?, performed_at),
       stage_time_minutes = COALESCE(?, stage_time_minutes),
       rating = COALESCE(?, rating),
       notes = COALESCE(?, notes)
     WHERE id = ?`
  )
    .bind(
      venue ?? null,
      performed_at ?? null,
      stage_time_minutes ?? null,
      rating ?? null,
      notes ?? null,
      c.req.param("id")
    )
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM sets WHERE id = ?")
    .bind(c.req.param("id"))
    .first();
  return c.json(row);
});

sets.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const result = await c.env.DB.prepare(
    "DELETE FROM sets WHERE id = ? AND user_id = ?"
  )
    .bind(c.req.param("id"), userId)
    .run();
  if (!result.meta.changes) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});

// Link a bit to a set
sets.post("/:id/bits", async (c) => {
  const userId = c.get("userId");
  const setRow = await c.env.DB.prepare(
    "SELECT id FROM sets WHERE id = ? AND user_id = ?"
  )
    .bind(c.req.param("id"), userId)
    .first();
  if (!setRow) return c.json({ error: "set not found" }, 404);

  const { bit_id, rating, notes, order_in_set } = await c.req.json<{
    bit_id: string;
    rating?: number;
    notes?: string;
    order_in_set?: number;
  }>();

  if (!bit_id) return c.json({ error: "bit_id required" }, 400);

  const bitRow = await c.env.DB.prepare(
    "SELECT id FROM bits WHERE id = ? AND user_id = ?"
  )
    .bind(bit_id, userId)
    .first();
  if (!bitRow) return c.json({ error: "bit not found" }, 404);

  const id = newId();
  await c.env.DB.prepare(
    `INSERT INTO set_bits (id, set_id, bit_id, rating, notes, order_in_set)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(set_id, bit_id) DO UPDATE SET
       rating = excluded.rating,
       notes = excluded.notes,
       order_in_set = excluded.order_in_set`
  )
    .bind(
      id,
      c.req.param("id"),
      bit_id,
      rating ?? null,
      notes ?? null,
      order_in_set ?? null
    )
    .run();

  return c.json({ ok: true }, 201);
});

// Unlink a bit from a set
sets.delete("/:id/bits/:bitId", async (c) => {
  const userId = c.get("userId");
  const setRow = await c.env.DB.prepare(
    "SELECT id FROM sets WHERE id = ? AND user_id = ?"
  )
    .bind(c.req.param("id"), userId)
    .first();
  if (!setRow) return c.json({ error: "set not found" }, 404);

  const result = await c.env.DB.prepare(
    "DELETE FROM set_bits WHERE set_id = ? AND bit_id = ?"
  )
    .bind(c.req.param("id"), c.req.param("bitId"))
    .run();

  if (!result.meta.changes) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});

export default sets;
