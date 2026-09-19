import { randomBytes, randomUUID } from "node:crypto";
import { rooms, engine } from "./core.mjs";
const fail = (status, message) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
const nameOf = (value) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 30)
    fail(400, "Use a display name of 1–30 characters.");
  return value.trim();
};
export class TeamGames {
  constructor({ now = Date.now, maxGames = 100 } = {}) {
    this.games = new Map();
    this.now = now;
    this.maxGames = maxGames;
  }
  clean() {
    for (const [code, g] of this.games)
      if (this.now() - g.updated > 3600000 || this.now() - g.created > 14400000)
        this.games.delete(code);
  }
  addPlayer(g, name) {
    name = nameOf(name);
    if (g.players.some((p) => p.name.toLowerCase() === name.toLowerCase()))
      fail(409, "That name is already in this team.");
    const p = {
      id: randomUUID(),
      token: randomBytes(32).toString("hex"),
      name,
      ready: false,
      lastSeen: this.now(),
      requests: new Set(),
    };
    g.players.push(p);
    return p;
  }
  create(input) {
    this.clean();
    if (this.games.size >= this.maxGames)
      fail(429, "Session limit reached. Try later.");
    nameOf(input.name);
    const room = input.room || rooms.find((r) => r.id === input.roomId);
    if (
      !room ||
      JSON.stringify(room).length > 100000 ||
      engine.validate(room).length
    )
      fail(400, "Choose a valid learning room.");
    let code;
    do {
      code = randomBytes(4).toString("hex").toUpperCase();
    } while (this.games.has(code));
    const g = {
      code,
      room: structuredClone(room),
      players: [],
      host: null,
      phase: "lobby",
      state: engine.initial(),
      votes: {},
      feedback: null,
      version: 0,
      created: this.now(),
      updated: this.now(),
      activity: [],
    };
    const p = this.addPlayer(g, input.name);
    g.host = p.id;
    this.games.set(code, g);
    this.log(g, `${p.name} created the team.`);
    return this.welcome(g, p);
  }
  get(code) {
    this.clean();
    const g = this.games.get(String(code).toUpperCase());
    if (!g)
      fail(404, "Team not found or expired. Ask your host for a new code.");
    return g;
  }
  join(code, input) {
    const g = this.get(code);
    if (g.phase !== "lobby")
      fail(409, "This mission has started. Join a new lobby.");
    if (g.players.length >= 8) fail(409, "This team is full (8 players).");
    const p = this.addPlayer(g, input.name);
    g.version++;
    g.updated = this.now();
    this.log(g, `${p.name} joined.`);
    return this.welcome(g, p);
  }
  welcome(g, p) {
    return { code: g.code, token: p.token, snapshot: this.view(g, p) };
  }
  auth(code, token) {
    const g = this.get(code),
      p = g.players.find((p) => p.token === token);
    if (!p) fail(401, "Your seat is no longer active. Rejoin the team.");
    p.lastSeen = this.now();
    return { g, p };
  }
  read(code, token) {
    const { g, p } = this.auth(code, token);
    return this.view(g, p);
  }
  log(g, text) {
    g.activity.push({ text, at: this.now() });
    g.activity = g.activity.slice(-20);
  }
  view(g, me) {
    const p = g.room.puzzles[g.state.solved.length];
    return {
      code: g.code,
      version: g.version,
      phase: g.phase,
      me: me.id,
      host: g.host,
      title: g.room.title,
      topic: g.room.topic,
      total: g.room.puzzles.length,
      solved: g.state.solved.length,
      players: g.players.map((x) => ({
        id: x.id,
        name: x.name,
        ready: x.ready,
        online: this.now() - x.lastSeen < 15000,
        voted: !!g.votes[x.id],
      })),
      puzzle:
        g.phase === "playing" && p
          ? {
              id: p.id,
              title: p.title,
              story: p.story,
              objective: p.objective,
              question: p.question,
              options: p.options,
              evidence: p.evidence.map((e) => ({
                id: e.id,
                title: e.title,
                body: e.body,
                type: e.type,
              })),
              required: p.required,
              reasoningPrompt: p.reasoning?.prompt,
              seen: g.state.seen[p.id] || [],
              hints: p.hints.slice(0, g.state.hints[p.id] || 0),
            }
          : null,
      myVote: g.votes[me.id] || null,
      votes: g.players.every((x) => g.votes[x.id])
        ? g.players.map((x) => ({ name: x.name, choice: g.votes[x.id].choice }))
        : [],
      feedback: g.feedback,
      activity: g.activity,
      debrief:
        g.phase === "complete"
          ? {
              objectives: g.room.objectives,
              lessons: g.room.puzzles.map((p) => ({
                title: p.title,
                explanation: p.explanation,
              })),
              attempts: Object.values(g.state.attempts).reduce(
                (a, b) => a + b,
                0,
              ),
            }
          : null,
    };
  }
  action(code, token, input) {
    const { g, p } = this.auth(code, token);
    if (
      typeof input.requestId !== "string" ||
      input.requestId.length > 80 ||
      !input.requestId
    )
      fail(400, "A request ID is required.");
    if (p.requests.has(input.requestId)) return this.view(g, p);
    if (input.version !== g.version)
      fail(409, "The team changed. Refresh your view and try again.");
    const hostOnly = () => {
      if (p.id !== g.host) fail(403, "Only the host can do that.");
    };
    const playing = () => {
      if (
        g.phase !== "playing" ||
        input.puzzleId !== g.room.puzzles[g.state.solved.length]?.id
      )
        fail(409, "This lock is no longer active.");
    };
    const puzzle = g.room.puzzles[g.state.solved.length];
    switch (input.type) {
      case "ready":
        if (g.phase !== "lobby") fail(409, "The mission has started.");
        p.ready = !!input.ready;
        break;
      case "start":
        hostOnly();
        if (
          g.phase !== "lobby" ||
          g.players.length < 2 ||
          !g.players.every((x) => x.ready)
        )
          fail(
            409,
            "At least two players must join and everyone must be ready.",
          );
        g.phase = "playing";
        g.state.started = this.now();
        this.log(
          g,
          "The mission started. Inspect clues, then vote independently.",
        );
        break;
      case "inspect":
        playing();
        if (!puzzle.evidence.some((e) => e.id === input.evidenceId))
          fail(400, "Unknown clue.");
        engine.inspect(g.state, puzzle, input.evidenceId);
        this.log(
          g,
          `${p.name} shared a clue: ${puzzle.evidence.find((e) => e.id === input.evidenceId).title}.`,
        );
        break;
      case "vote": {
        playing();
        if (
          !Number.isInteger(input.choice) ||
          input.choice < 0 ||
          input.choice > 2 ||
          !Array.isArray(input.evidence) ||
          input.evidence.length > 6 ||
          input.evidence.some((id) => !g.state.seen[puzzle.id]?.includes(id))
        )
          fail(400, "Choose an answer and use only inspected clues.");
        if (
          puzzle.required.some((id) => !g.state.seen[puzzle.id]?.includes(id))
        )
          fail(409, "Inspect the required clues first.");
        g.votes[p.id] = {
          choice: input.choice,
          evidence: [...new Set(input.evidence)],
        };
        g.feedback = null;
        break;
      }
      case "resolve": {
        hostOnly();
        playing();
        if (!g.players.every((x) => g.votes[x.id]))
          fail(409, "Wait for every player to vote.");
        const votes = Object.values(g.votes);
        if (!votes.every((v) => v.choice === votes[0].choice)) {
          g.feedback = {
            kind: "discussion",
            message:
              "Your votes differ. Discuss the evidence, then revise your votes.",
          };
          break;
        }
        if (
          puzzle.reasoning &&
          !votes.every(
            (v) =>
              v.evidence.length === puzzle.reasoning.evidenceIds.length &&
              v.evidence.every((id) =>
                puzzle.reasoning.evidenceIds.includes(id),
              ),
          )
        ) {
          g.feedback = {
            kind: "reasoning",
            message:
              "Agree on the supporting clues as well as the answer. Each player must select the evidence that supports the decision.",
          };
          break;
        }
        g.feedback = engine.evaluate(
          g.room,
          g.state,
          votes[0].choice,
          votes[0].evidence,
        );
        if (g.feedback.kind === "correct") {
          g.phase = "reveal";
          this.log(g, `Lock opened: ${puzzle.title}.`);
        } else {
          g.votes = {};
          this.log(
            g,
            "The team tried an answer. Read the feedback and vote again.",
          );
        }
        break;
      }
      case "hint":
        hostOnly();
        playing();
        g.state.hints[puzzle.id] = Math.min(
          3,
          (g.state.hints[puzzle.id] || 0) + 1,
        );
        this.log(g, "The host revealed a team hint.");
        break;
      case "next":
        hostOnly();
        if (g.phase !== "reveal") fail(409, "Finish the current lock first.");
        g.phase =
          g.state.solved.length === g.room.puzzles.length
            ? "complete"
            : "playing";
        g.votes = {};
        g.feedback = null;
        break;
      case "remove":
        hostOnly();
        if (input.playerId === g.host)
          fail(400, "The host cannot remove their own seat.");
        if (!g.players.some((x) => x.id === input.playerId))
          fail(404, "Player not found.");
        g.players = g.players.filter((x) => x.id !== input.playerId);
        delete g.votes[input.playerId];
        this.log(g, "The host removed a player seat.");
        break;
      case "leave":
        if (p.id === g.host)
          fail(400, "The host must end the session instead.");
        g.players = g.players.filter((x) => x.id !== p.id);
        delete g.votes[p.id];
        this.log(g, `${p.name} left the team.`);
        break;
      case "close":
        hostOnly();
        g.phase = "closed";
        this.log(g, "The host closed the session.");
        break;
      default:
        fail(400, "Unknown team action.");
    }
    g.version++;
    g.updated = this.now();
    p.requests.add(input.requestId);
    if (p.requests.size > 30)
      p.requests.delete(p.requests.values().next().value);
    return this.view(g, p);
  }
}
