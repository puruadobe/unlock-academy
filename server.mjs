import http from "node:http";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { rooms, rpc } from "./core.mjs";
import { generateDraft, validateBrief } from "./generation.mjs";
import { TeamGames } from "./multiplayer.mjs";
const PORT = Number(process.env.PORT || 8788),
  baseUrl = process.env.TRUEFORGE_BASE_URL || "http://localhost:8790";
const assets = {
  "/": ["index.html", "text/html"],
  "/index.html": ["index.html", "text/html"],
  "/style.css": ["style.css", "text/css"],
  "/rooms.js": ["rooms.js", "text/javascript"],
  "/engine.js": ["engine.js", "text/javascript"],
  "/draft.js": ["draft.js", "text/javascript"],
  "/scene.js": ["scene.js", "text/javascript"],
  "/studio-ai.js": ["studio-ai.js", "text/javascript"],
  "/multiplayer.js": ["multiplayer.js", "text/javascript"],
  "/app.js": ["app.js", "text/javascript"],
};
const sessions = new Map();
let active = 0;
function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}
async function body(req, limit = 12000) {
  let text = "";
  for await (const chunk of req) {
    text += chunk;
    if (Buffer.byteLength(text) > limit) throw Error("Request too large");
  }
  return JSON.parse(text);
}
async function client() {
  const { TrueForge } = await import("@truefoundry/trueforge-sdk");
  return new TrueForge({
    baseUrl,
    timeoutInSeconds: 120,
    ...(process.env.TRUEFORGE_TOKEN
      ? { token: process.env.TRUEFORGE_TOKEN }
      : {}),
  });
}
export function createServer() {
  const teams = new TeamGames();
  const entranceRates = new Map();
  return http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
    const requestPort = req.socket.localPort;
    const allowedHosts = new Set([
      `127.0.0.1:${requestPort}`,
      `localhost:${requestPort}`,
    ]);
    const allowedOrigins = new Set([
      `http://127.0.0.1:${requestPort}`,
      `http://localhost:${requestPort}`,
    ]);
    if (process.env.TEAM_ORIGIN) {
      const teamOrigin = new URL(process.env.TEAM_ORIGIN);
      allowedHosts.add(teamOrigin.host);
      allowedOrigins.add(teamOrigin.origin);
    }
    if (!allowedHosts.has(req.headers.host)) {
      json(res, 403, { error: "Localhost access only" });
      return;
    }
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.has(origin)) {
      json(res, 403, { error: "Origin not allowed" });
      return;
    }
    const path = new URL(req.url, "http://localhost").pathname;
    try {
      const local = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
        req.socket.remoteAddress,
      );
      if (!local && !assets[path] && !path.startsWith("/api/teams")) {
        json(res, 403, {
          error:
            "Authoring and AI services are available on the host computer only.",
        });
        return;
      }
      if (path === "/api/teams" || path.startsWith("/api/teams/")) {
        const parts = path.split("/").filter(Boolean);
        const token = req.headers.authorization?.replace(/^Bearer /, "");
        if (req.method === "GET" && parts.length === 3) {
          json(res, 200, teams.read(parts[2], token));
          return;
        }
        if (req.method !== "POST") {
          json(res, 405, { error: "Use POST for team actions." });
          return;
        }
        if (!req.headers["content-type"]?.startsWith("application/json")) {
          json(res, 415, { error: "JSON required" });
          return;
        }
        const input = await body(req, 120000);
        if (!input || typeof input !== "object" || Array.isArray(input)) {
          json(res, 400, { error: "JSON object required" });
          return;
        }
        if (parts.length === 2 || parts[3] === "join") {
          const now = Date.now();
          for (const [ip, r] of entranceRates)
            if (now - r.at > 60000) entranceRates.delete(ip);
          const ip = req.socket.remoteAddress,
            r = entranceRates.get(ip) || { at: now, count: 0 };
          if (r.count >= 30 || entranceRates.size > 10000) {
            json(res, 429, { error: "Too many join requests. Wait a minute." });
            return;
          }
          r.count++;
          entranceRates.set(ip, r);
        }
        if (parts.length === 2) {
          json(res, 201, teams.create(input));
          return;
        }
        if (parts.length === 4 && parts[3] === "join") {
          json(res, 200, teams.join(parts[2], input));
          return;
        }
        if (parts.length === 4 && parts[3] === "action") {
          json(res, 200, teams.action(parts[2], token, input));
          return;
        }
        json(res, 404, { error: "Team endpoint not found" });
        return;
      }
      if (req.method === "GET" && assets[path]) {
        const [file, type] = assets[path];
        res.writeHead(200, { "Content-Type": type + "; charset=utf-8" });
        res.end(await readFile(new URL("./public/" + file, import.meta.url)));
        return;
      }
      if (path === "/api/status" && req.method === "GET") {
        try {
          const r = await fetch(baseUrl + "/api/v1/agents", {
            headers: process.env.TRUEFORGE_TOKEN
              ? { Authorization: "Bearer " + process.env.TRUEFORGE_TOKEN }
              : {},
            signal: AbortSignal.timeout(2500),
          });
          if (!r.ok) throw Error();
          const data = await r.json();
          const agents = Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.data?.items)
              ? data.data.items
              : [];
          const ready = agents.some((a) => a.name === "unlock-academy");
          json(res, 200, {
            ready,
            message: ready
              ? "Agent available."
              : "TrueForge responded. Configure the unlock-academy agent to enable the coach.",
          });
        } catch {
          json(res, 200, {
            ready: false,
            message:
              "Live coach not connected. Start TrueForge and configure the unlock-academy agent. Rooms and authored hints work offline.",
          });
        }
        return;
      }
      if (path === "/mcp") {
        if (req.method !== "POST") {
          res.setHeader("Allow", "POST");
          json(res, 405, { error: "Use MCP Streamable HTTP POST" });
          return;
        }
        if (!req.headers["content-type"]?.startsWith("application/json")) {
          json(res, 415, { error: "JSON required" });
          return;
        }
        const result = rpc(await body(req, 120000));
        if (result === null) {
          res.writeHead(202);
          res.end();
        } else json(res, 200, result);
        return;
      }
      if (path === "/api/draft" && req.method === "POST") {
        if (!req.headers["content-type"]?.startsWith("application/json")) {
          json(res, 415, { error: "JSON required" });
          return;
        }
        const request = validateBrief(await body(req, 120000));
        if (active >= 2) {
          json(res, 429, {
            error: "Two agent runs are already active. Try again shortly.",
          });
          return;
        }
        active++;
        res.writeHead(200, {
          "Content-Type": "application/x-ndjson; charset=utf-8",
        });
        const emit = (event) => {
          if (!res.destroyed) res.write(JSON.stringify(event) + "\n");
        };
        try {
          await generateDraft(
            await client(),
            request,
            emit,
            process.env.TRUEFORGE_MODEL,
          );
          emit({ type: "done" });
        } catch (e) {
          emit({
            type: "error",
            message: e.statusCode
              ? "TrueForge rejected the run (HTTP " +
                e.statusCode +
                "). Check its configuration."
              : e.message?.includes("fetch")
                ? "TrueForge is unavailable. Start it at the configured address."
                : e.message || "Room generation failed.",
          });
        } finally {
          active--;
          res.end();
        }
        return;
      }
      if (path === "/api/coach" && req.method === "POST") {
        if (!req.headers["content-type"]?.startsWith("application/json")) {
          json(res, 415, { error: "JSON required" });
          return;
        }
        const b = await body(req);
        const c = rooms.find((r) => r.id === b.roomId);
        if (
          typeof b.question !== "string" ||
          !b.question.trim() ||
          b.question.length > 2000 ||
          !(b.roomId === null || typeof b.roomId === "string") ||
          !(b.puzzleId === null || typeof b.puzzleId === "string") ||
          JSON.stringify(b.customContext || null).length > 8000
        ) {
          json(res, 400, {
            error: "Enter a question of up to 2,000 characters.",
          });
          return;
        }
        if (active >= 2) {
          json(res, 429, {
            error: "Two coach turns are already running. Try again shortly.",
          });
          return;
        }
        if (b.session && !sessions.has(b.session)) {
          json(res, 400, {
            error:
              "Session expired after server restart. Reload the page to begin again.",
          });
          return;
        }
        active++;
        try {
          const tf = await client();
          let session = b.session;
          for (const [key, value] of sessions) {
            if (Date.now() - value.created > 86400000) sessions.delete(key);
          }
          if (!session) {
            if (sessions.size >= 100) {
              json(res, 429, {
                error: "Session limit reached. Restart the local app server.",
              });
              return;
            }
            const { data } = await tf.sessions.create({
              agent: { name: "unlock-academy" },
            });
            session = randomUUID();
            sessions.set(session, {
              id: data.id,
              created: Date.now(),
              busy: false,
            });
          }
          const entry = sessions.get(session);
          if (!entry) {
            json(res, 400, { error: "Session expired. Reload the page." });
            return;
          }
          if (entry.busy) {
            json(res, 409, {
              error: "This session already has a running turn.",
            });
            return;
          }
          entry.busy = true;
          try {
            const stream = await tf.sessions.createTurnStream(entry.id, {
              input: [
                {
                  type: "user.message",
                  content:
                    "Learning context: " +
                    JSON.stringify({
                      room_id: c?.id || null,
                      puzzle_id: b.puzzleId || null,
                      author_supplied_context: b.customContext || null,
                    }) +
                    "\nLearner question: " +
                    b.question,
                },
              ],
            });
            res.writeHead(200, {
              "Content-Type": "application/x-ndjson; charset=utf-8",
            });
            const send = (x) => {
              if (!res.destroyed) res.write(JSON.stringify(x) + "\n");
            };
            send({ type: "session", id: session });
            for await (const { data: event } of stream.withMetadata()) {
              if (event.type === "model.message.delta")
                send({ type: "text", text: event.content ?? "" });
              else if (event.type === "turn.done")
                send({
                  type: "done",
                  status: event.state?.status || "finished",
                });
              else if (
                event.type.startsWith("tool.") ||
                event.type === "turn.created"
              )
                send({ type: "event", name: event.type });
            }
            res.end();
          } finally {
            entry.busy = false;
          }
        } catch {
          if (res.headersSent) {
            res.end(
              JSON.stringify({
                type: "error",
                message:
                  "TrueForge could not complete the turn. Check its session logs and provider configuration.",
              }) + "\n",
            );
          } else
            json(res, 503, {
              error:
                "Start TrueForge, configure a model and the unlock-academy connector, then run agent:setup. No AI response was simulated.",
            });
        } finally {
          active--;
        }
        return;
      }
      json(res, 404, { error: "Not found" });
    } catch (e) {
      if (!res.headersSent)
        json(res, e.status || 400, {
          error: e.status
            ? e.message
            : e.message === "Request too large"
              ? "Request too large"
              : "Invalid request",
        });
      else res.end();
    }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer().listen(
    PORT,
    process.env.TEAM_ORIGIN ? "0.0.0.0" : "127.0.0.1",
    () =>
      console.log(
        `Unlock Academy: http://127.0.0.1:${PORT}\nMCP connector: http://127.0.0.1:${PORT}/mcp`,
      ),
  );
}
