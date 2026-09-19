import test from "node:test";
import assert from "node:assert/strict";
const base = "http://127.0.0.1:8788";
test("serves app assets and blocks private files", async () => {
  for (const p of ["/", "/app.js", "/engine.js", "/rooms.js", "/style.css"])
    assert.equal((await fetch(base + p)).status, 200);
  for (const p of ["/server.mjs", "/.env", "/package.json"])
    assert.equal((await fetch(base + p)).status, 404);
});
test("foreign origins cannot invoke MCP", async () => {
  assert.equal(
    (
      await fetch(base + "/mcp", {
        method: "POST",
        headers: {
          Origin: "https://untrusted.example",
          "Content-Type": "application/json",
        },
        body: "{}",
      })
    ).status,
    403,
  );
});
test("case context comes from a real MCP tool result", async () => {
  const r = await fetch(base + "/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "get_learning_context",
        arguments: { room_id: "last-transfer", puzzle_id: "verify" },
      },
    }),
  });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(JSON.parse(d.result.content[0].text).puzzle.id, "verify");
});
test("invalid coach requests and unknown sessions are rejected", async () => {
  for (const body of [
    { question: "" },
    { question: "Help", roomId: null, puzzleId: null, session: "unknown" },
  ])
    assert.equal(
      (
        await fetch(base + "/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      ).status,
      400,
    );
});
