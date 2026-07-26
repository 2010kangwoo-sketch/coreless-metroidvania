import "dotenv/config";
import { ExpressAuth, getSession } from "@auth/express";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAuthConfig } from "./auth-config.mjs";
import { createDatabasePool } from "./database.mjs";
import {
  callbackUrls,
  providerAvailability,
} from "./provider-config.mjs";
import { validateCloudSavePayload } from "./save-contract.mjs";
import { createSaveRepository } from "./save-repository.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../..");
const port = Number(process.env.PORT ?? 3000);
const origin = String(
  process.env.CORELESS_ORIGIN ?? `http://localhost:${port}`,
).replace(/\/+$/, "");
const pool = createDatabasePool();
const authConfig = createAuthConfig(pool);
const saves = createSaveRepository(pool);
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);
app.use(express.json({ limit: "64kb" }));
app.use("/auth/*", ExpressAuth(authConfig));

const requireAccount = async (request, response, next) => {
  try {
    const session = await getSession(request, authConfig);
    if (!session?.user?.id) {
      response.status(401).json({ error: "account-required" });
      return;
    }
    response.locals.session = session;
    next();
  } catch (error) {
    next(error);
  }
};

app.get("/api/account/providers", (_request, response) => {
  response.json({
    providers: providerAvailability(),
    callbacks: callbackUrls(origin),
  });
});

app.get("/api/account/session", async (request, response, next) => {
  try {
    const session = await getSession(request, authConfig);
    response.json({
      authenticated: Boolean(session?.user?.id),
      user: session?.user ? {
        id: session.user.id,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      } : null,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/save/primary", requireAccount, async (_request, response, next) => {
  try {
    const record = await saves.read(response.locals.session.user.id);
    if (!record) {
      response.status(204).end();
      return;
    }
    response.json({ record });
  } catch (error) {
    next(error);
  }
});

app.put("/api/save/primary", requireAccount, async (request, response, next) => {
  try {
    const expectedRevision = request.body?.expectedRevision;
    const record = validateCloudSavePayload(request.body?.record);
    if (!record || !Number.isInteger(expectedRevision) ||
      expectedRevision < 0) {
      response.status(400).json({ error: "invalid-save-payload" });
      return;
    }
    const result = await saves.write(
      response.locals.session.user.id,
      record,
      expectedRevision,
    );
    if (result.status === "conflict") {
      response.status(409).json({
        error: "save-conflict",
        current: result.current,
      });
      return;
    }
    response.json({ record: result.record });
  } catch (error) {
    next(error);
  }
});

app.get("/", (_request, response) => response.redirect("/v4.html"));
app.use(express.static(root, { dotfiles: "deny", etag: true }));
app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "internal-server-error" });
});

const server = app.listen(port, () => {
  console.log(`Coreless account server listening at ${origin}`);
});
const shutdown = async () => {
  server.close();
  await pool.end();
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
