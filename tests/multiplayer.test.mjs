import test from "node:test";
import assert from "node:assert/strict";
import { TeamGames } from "../multiplayer.mjs";
import { rooms } from "../core.mjs";
const make = () => {
  const t = new TeamGames(),
    h = t.create({ name: "Host", roomId: rooms[0].id }),
    j = t.join(h.code, { name: "Guest" });
  return { t, h, j };
};
const act = (t, s, type, extra = {}) => {
  const v = t.read(s.code, s.token);
  return t.action(s.code, s.token, {
    type,
    version: v.version,
    puzzleId: v.puzzle?.id,
    requestId: crypto.randomUUID(),
    ...extra,
  });
};
const begin = ({ t, h, j }) => {
  act(t, h, "ready", { ready: true });
  act(t, j, "ready", { ready: true });
  return act(t, h, "start");
};
test("lobby requires two ready players and only host can start", () => {
  const { t, h, j } = make();
  assert.throws(() => act(t, h, "start"), /ready/);
  assert.throws(() => act(t, j, "start"), /host/);
  assert.equal(begin({ t, h, j }).phase, "playing");
  assert.throws(() => t.join(h.code, { name: "Late" }), /started/);
});
test("seat tokens and host controls cannot be impersonated", () => {
  const { t, h, j } = make();
  assert.throws(() => t.read(h.code, "incorrect"), /seat/);
  assert.throws(() => act(t, j, "remove", { playerId: h.snapshot.me }), /host/);
  assert.throws(() => act(t, j, "close"), /host/);
  const view = t.read(h.code, j.token);
  assert.equal(JSON.stringify(view).includes(h.token), false);
  assert.equal(JSON.stringify(view).includes(j.token), false);
});
test("current answer keys and future locks are absent from team snapshots", () => {
  const f = make();
  const v = begin(f);
  assert.equal(v.puzzle.answer, undefined);
  assert.equal(v.puzzle.feedback, undefined);
  assert.equal(v.puzzle.hints.length, 0);
  assert.equal(v.puzzle.reasoning, undefined);
  assert.equal(v.room, undefined);
  assert.equal(v.debrief, null);
});
test("stale actions rejected and duplicate requests applied only once", () => {
  const { t, h, j } = make();
  const v = t.read(h.code, h.token),
    input = {
      type: "ready",
      ready: true,
      version: v.version,
      requestId: "same",
    };
  const a = t.action(h.code, h.token, input),
    b = t.action(h.code, h.token, input);
  assert.equal(a.version, b.version);
  assert.throws(
    () =>
      t.action(h.code, j.token, {
        type: "ready",
        ready: true,
        version: v.version,
        requestId: "other",
      }),
    /changed/,
  );
});
test("votes private until all submit and disagreements need discussion", () => {
  const f = make(),
    { t, h, j } = f;
  begin(f);
  const p = rooms[0].puzzles[0];
  for (const id of p.required) act(t, h, "inspect", { evidenceId: id });
  act(t, h, "vote", { choice: 0, evidence: p.reasoning.evidenceIds });
  assert.equal(t.read(j.code, j.token).votes.length, 0);
  assert.equal(t.read(j.code, j.token).myVote, null);
  act(t, j, "vote", { choice: 1, evidence: p.reasoning.evidenceIds });
  const result = act(t, h, "resolve");
  assert.equal(result.feedback.kind, "discussion");
  assert.equal(result.solved, 0);
  assert.equal(result.votes.length, 2);
});
test("two players complete all locks with server grading and shared clues", () => {
  const f = make(),
    { t, h, j } = f;
  begin(f);
  for (const p of rooms[0].puzzles) {
    assert.throws(
      () => act(t, h, "vote", { choice: p.answer, evidence: [] }),
      /required/,
    );
    for (const id of p.required) act(t, j, "inspect", { evidenceId: id });
    assert.ok(t.read(h.code, h.token).puzzle.seen.length);
    for (const s of [h, j])
      act(t, s, "vote", { choice: p.answer, evidence: [] });
    assert.equal(act(t, h, "resolve").feedback.kind, "reasoning");
    for (const s of [h, j])
      act(t, s, "vote", {
        choice: p.answer,
        evidence: p.reasoning.evidenceIds,
      });
    const result = act(t, h, "resolve");
    assert.equal(result.phase, "reveal");
    assert.equal(result.feedback.kind, "correct");
    assert.throws(() => act(t, h, "resolve"), /active/);
    act(t, h, "next");
  }
  const v = t.read(j.code, j.token);
  assert.equal(v.phase, "complete");
  assert.equal(v.debrief.lessons.length, 3);
  assert.equal(v.debrief.attempts, 3);
});
test("remove disconnected seat clears its vote; leaving invalidates credentials", () => {
  const { t, h, j } = make();
  act(t, h, "remove", { playerId: j.snapshot.me });
  assert.throws(() => t.read(j.code, j.token), /seat/);
  const k = t.join(h.code, { name: "New" });
  act(t, k, "leave");
  assert.equal(t.read(h.code, h.token).players.length, 1);
  assert.throws(() => t.read(k.code, k.token), /seat/);
});
test("bounds, duplicate names and expiry keep sessions finite", () => {
  let now = 0;
  const t = new TeamGames({ now: () => now, maxGames: 1 });
  const h = t.create({ name: "Host", roomId: rooms[0].id });
  assert.throws(() => t.create({ name: "B", roomId: rooms[0].id }), /limit/);
  assert.throws(() => t.join(h.code, { name: "host" }), /already/);
  for (let i = 1; i < 8; i++) t.join(h.code, { name: "Player" + i });
  assert.throws(() => t.join(h.code, { name: "Extra" }), /full/);
  now = 3600001;
  assert.throws(() => t.read(h.code, h.token), /expired/);
});
test("custom room is copied into session and closed sessions cannot progress", () => {
  const t = new TeamGames(),
    r = structuredClone(rooms[0]);
  const h = t.create({ name: "H", room: r });
  r.title = "Changed outside";
  assert.notEqual(t.read(h.code, h.token).title, r.title);
  act(t, h, "close");
  assert.equal(t.read(h.code, h.token).phase, "closed");
  assert.throws(() => t.join(h.code, { name: "Late" }), /started/);
  assert.throws(() => act(t, h, "start"), /ready/);
});
