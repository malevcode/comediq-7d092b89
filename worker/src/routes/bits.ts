import { Hono } from "hono";
import { authMiddleware, type Env } from "../middleware/auth";
import { newId } from "../lib/id";

type Variables = { userId: string };
const bits = new Hono<{ Bindings: Env; Variables: Variables }>();

bits.use("*", authMiddleware);

bits.get("/", async (c) => {
  const userId = c.get("userId");

  // Fetch bits with aggregated stats
  const rows = await c.env.DB.prepare(
    `SELECT
       b.id, b.name, b.notes, b.tags, b.created_at, b.updated_at,
       COUNT(sb.id)       AS performance_count,
       AVG(sb.rating)     AS avg_rating,
       MAX(s.performed_at) AS last_performed
     FROM bits b
     LEFT JOIN set_bits sb ON sb.bit_id = b.id
     LEFT JOIN sets s ON s.id = sb.set_id
     WHERE b.user_id = ?
     GROUP BY b.id
     ORDER BY b.name ASC`
  )
    .bind(userId)
    .all<{
      id: string;
      name: string;
      notes: string | null;
      tags: string | null;
      created_at: string;
      updated_at: string;
      performance_count: number;
      avg_rating: number | null;
      last_performed: string | null;
    }>();

  // Compute trend: compare avg of last 3 vs previous 3 ratings
  const withTrend = await Promise.all(
    rows.results.map(async (bit) => {
      const ratings = await c.env.DB.prepare(
        `SELECT sb.rating FROM set_bits sb
         JOIN sets s ON s.id = sb.set_id
         WHERE sb.bit_id = ? AND sb.rating IS NOT NULL
         ORDER BY s.performed_at DESC
         LIMIT 6`
      )
        .bind(bit.id)
        .all<{ rating: number }>();

      const r = ratings.results.map((x) => x.rating);
      let trend: "up" | "down" | "flat" = "flat";
      if (r.length >= 4) {
        const recent = r.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const prev = r.slice(3).reduce((a, b) => a + b, 0) / r.slice(3).length;
        if (recent - prev > 0.5) trend = "up";
        else if (prev - recent > 0.5) trend = "down";
      }

      return { ...bit, trend };
    })
  );

  return c.json(withTrend);
});

bits.post("/", async (c) => {
  const userId = c.get("userId");
  const { name, notes, tags } = await c.req.json<{
    name: string;
    notes?: string;
    tags?: string[];
  }>();

  if (!name) return c.json({ error: "name is required" }, 400);

  const id = newId();
  await c.env.DB.prepare(
    "INSERT INTO bits (id, user_id, name, notes, tags) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(
      id,
      userId,
      name,
      notes ?? null,
      tags ? JSON.stringify(tags) : null
    )
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM bits WHERE id = ?")
    .bind(id)
    .first();
  return c.json(row, 201);
});

bits.get("/:id", async (c) => {
  const userId = c.get("userId");
  const bit = await c.env.DB.prepare(
    "SELECT * FROM bits WHERE id = ? AND user_id = ?"
  )
    .bind(c.req.param("id"), userId)
    .first();
  if (!bit) return c.json({ error: "not found" }, 404);

  // Full history
  const history = await c.env.DB.prepare(
    `SELECT sb.rating, sb.notes, s.performed_at, s.venue, s.id AS set_id
     FROM set_bits sb
     JOIN sets s ON s.id = sb.set_id
     WHERE sb.bit_id = ?
     ORDER BY s.performed_at ASC`
  )
    .bind(c.req.param("id"))
    .all();

  return c.json({ ...bit, history: history.results });
});

bits.put("/:id", async (c) => {
  const userId = c.get("userId");
  const existing = await c.env.DB.prepare(
    "SELECT id FROM bits WHERE id = ? AND user_id = ?"
  )
    .bind(c.req.param("id"), userId)
    .first();
  if (!existing) return c.json({ error: "not found" }, 404);

  const { name, notes, tags } = await c.req.json<{
    name?: string;
    notes?: string;
    tags?: string[];
  }>();

  await c.env.DB.prepare(
    `UPDATE bits SET
       name = COALESCE(?, name),
       notes = COALESCE(?, notes),
       tags = COALESCE(?, tags),
       updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(
      name ?? null,
      notes ?? null,
      tags ? JSON.stringify(tags) : null,
      c.req.param("id")
    )
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM bits WHERE id = ?")
    .bind(c.req.param("id"))
    .first();
  return c.json(row);
});

bits.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const result = await c.env.DB.prepare(
    "DELETE FROM bits WHERE id = ? AND user_id = ?"
  )
    .bind(c.req.param("id"), userId)
    .run();
  if (!result.meta.changes) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});

export default bits;
