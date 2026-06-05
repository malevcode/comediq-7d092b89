import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import sets from "./routes/sets";
import bits from "./routes/bits";
import type { Env } from "./middleware/auth";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));

app.route("/auth", auth);
app.route("/sets", sets);
app.route("/bits", bits);

app.get("/health", (c) => c.json({ ok: true }));

export default app;
