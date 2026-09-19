import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../server.mjs";
import { once } from "node:events";
test("team HTTP lifecycle, bearer access and origin checks", async () => {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = "http://127.0.0.1:" + server.address().port;
  const call = async (path, body, token, origin) =>
    fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: {
        Host: "127.0.0.1:" + server.address().port,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: "Bearer " + token } : {}),
        ...(origin ? { Origin: origin } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  try {
    let r = await call("/api/teams", { name: "Host", roomId: "last-transfer" });
    assert.equal(r.status, 201);
    const h = await r.json();
    assert.equal((await call("/api/teams/" + h.code)).status, 401);
    assert.equal(
      (
        await call(
          "/api/teams/" + h.code,
          null,
          h.token,
          "https://foreign.example",
        )
      ).status,
      403,
    );
    r = await call("/api/teams/" + h.code + "/join", { name: "Guest" });
    assert.equal(r.status, 200);
    const g = await r.json();
    r = await call("/api/teams/" + h.code, null, h.token);
    const view = await r.json();
    assert.equal(view.players.length, 2);
    r = await call(
      "/api/teams/" + h.code + "/action",
      { type: "close", version: view.version, requestId: "guest-close" },
      g.token,
    );
    assert.equal(r.status, 403);
    r = await call(
      "/api/teams/" + h.code + "/action",
      { type: "close", version: view.version, requestId: "host-close" },
      h.token,
    );
    assert.equal(r.status, 200);
    assert.equal((await r.json()).phase, "closed");
    assert.equal(
      (await call("/api/teams", { name: "", roomId: "last-transfer" })).status,
      400,
    );
    assert.equal((await call("/multiplayer.js")).status, 200);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
