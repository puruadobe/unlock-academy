import test from "node:test";
import assert from "node:assert/strict";
import { rooms, engine, callTool, rpc } from "../core.mjs";
const copy = (v) => JSON.parse(JSON.stringify(v));
test("starter rooms validate against the general schema", () => {
  for (const r of rooms) assert.equal(engine.validate(r).length, 0, r.title);
});
test("every room is solvable in order from its required evidence", () => {
  for (const r of rooms) {
    const s = engine.initial();
    for (const p of r.puzzles) {
      assert.equal(engine.evaluate(r, s, p.answer, p.reasoning?.evidenceIds || []).kind, "evidence");
      for (const id of p.required) engine.inspect(s, p, id);
      const result = engine.evaluate(r, s, p.answer, p.reasoning?.evidenceIds || []);
      assert.equal(result.kind, "correct");
      assert.ok(result.lesson);
    }
    assert.equal(s.solved.length, r.puzzles.length);
    assert.ok(s.finished);
    assert.equal(engine.evaluate(r, s, 0).kind, "complete");
  }
});
test("wrong answers give feedback without unlocking", () => {
  const r = rooms[0],
    p = r.puzzles[0],
    s = engine.initial();
  p.required.forEach((id) => engine.inspect(s, p, id));
  const result = engine.evaluate(r, s, (p.answer + 1) % 3);
  assert.equal(result.kind, "retry");
  assert.equal(s.solved.length, 0);
  assert.equal(s.attempts[p.id], 1);
  assert.equal(engine.evaluate(r, s, null).kind, "invalid");
});
test("restored progress is sequential and bounds hints and attempts", () => {
  const r = rooms[0];
  const s = engine.restore(r, {
    solved: [r.puzzles[2].id],
    hints: { verify: 99 },
    seen: { verify: ["missing", "mail"] },
    attempts: { verify: -1 },
  });
  assert.equal(s.solved.length, 0);
  assert.equal(s.hints.verify, 3);
  assert.equal(s.seen.verify.length, 1);
  assert.equal(s.attempts.verify, 0);
});
test("correct progress and evidence survive serialization", () => {
  const r = rooms[0],
    s = engine.initial(),
    p = r.puzzles[0];
  p.required.forEach((id) => engine.inspect(s, p, id));
  engine.evaluate(r, s, p.answer, p.reasoning?.evidenceIds || []);
  const restored = engine.restore(r, copy(s));
  assert.equal(restored.solved[0], p.id);
  assert.equal(restored.seen[p.id].length, 2);
});
test("schema rejects bad references, answers, duplicate IDs and unsafe sources", () => {
  let r = copy(rooms[0]);
  r.puzzles[0].required = ["unknown"];
  assert.ok(engine.validate(r).length);
  r = copy(rooms[0]);
  r.puzzles[0].answer = 9;
  assert.ok(engine.validate(r).length);
  r = copy(rooms[0]);
  r.puzzles[1].id = r.puzzles[0].id;
  assert.ok(engine.validate(r).length);
  r = copy(rooms[0]);
  r.sources = [{ title: "Bad", url: "javascript:alert(1)" }];
  assert.ok(engine.validate(r).length);
  r = copy(rooms[0]);
  r.puzzles[0].id = "__proto__";
  assert.ok(engine.validate(r).length);
});
test("general author-created topic works without cyber-specific fields", () => {
  const r = copy(rooms[1]);
  r.id = "garden";
  r.topic = "Botany";
  r.puzzles = r.puzzles.slice(0, 1);
  assert.equal(engine.validate(r).length, 0);
});
test("coach context excludes answer key and hints are explicit", () => {
  const c = callTool("get_learning_context", {
    room_id: "last-transfer",
    puzzle_id: "verify",
  });
  assert.equal(c.puzzle.answer, undefined);
  assert.equal(c.puzzle.explanation, undefined);
  assert.equal(c.puzzle.hints, undefined);
  assert.ok(
    callTool("get_hint", {
      room_id: "last-transfer",
      puzzle_id: "verify",
      level: 1,
    }).hint,
  );
  assert.throws(() =>
    callTool("get_hint", {
      room_id: "last-transfer",
      puzzle_id: "verify",
      level: 0,
    }),
  );
  assert.throws(() =>
    callTool("get_learning_context", {
      room_id: "last-transfer",
      puzzle_id: "missing",
    }),
  );
});
test("MCP transport exposes five read-only tools", () => {
  const r = rpc({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  assert.equal(r.result.tools.length, 5);
  assert.ok(r.result.tools.every((t) => t.annotations.readOnlyHint));
  assert.equal(
    rpc({ jsonrpc: "2.0", method: "notifications/initialized" }),
    null,
  );
});
