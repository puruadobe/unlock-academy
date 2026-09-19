import { readFileSync } from "node:fs";
import vm from "node:vm";
const ctx = { URL };
vm.createContext(ctx);
vm.runInContext(
  readFileSync(new URL("./public/rooms.js", import.meta.url), "utf8") +
    "\nglobalThis.rooms=STARTER_ROOMS;",
  ctx,
);
vm.runInContext(
  readFileSync(new URL("./public/engine.js", import.meta.url), "utf8") +
    "\nglobalThis.engine=RoomEngine;",
  ctx,
);
export const rooms = JSON.parse(JSON.stringify(ctx.rooms));
export const engine = ctx.engine;
vm.runInContext(readFileSync(new URL('./public/draft.js',import.meta.url),'utf8')+'\nglobalThis.review=DraftReview;',ctx);
export const review=ctx.review;
export const tools = [
 {name:'review_room_draft',description:'Check a proposed learning-room JSON object for schema errors, evidence links, objective alignment and missing depth features. This is not fact checking and never publishes.',inputSchema:{type:'object',properties:{room:{type:'object'}},required:['room'],additionalProperties:false}},
  {
    name: "list_rooms",
    description: "List the starter educational escape rooms.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_learning_context",
    description:
      "Get a room and one puzzle, including evidence but excluding the answer key. Read this before coaching a learner.",
    inputSchema: {
      type: "object",
      properties: {
        room_id: { type: "string", enum: rooms.map((r) => r.id) },
        puzzle_id: { type: "string" },
      },
      required: ["room_id", "puzzle_id"],
      additionalProperties: false,
    },
  },
  {
    name: "get_hint",
    description:
      "Get an authored hint for a puzzle. Level 1 is gentle; level 3 may disclose the intended answer. Start with level 1.",
    inputSchema: {
      type: "object",
      properties: {
        room_id: { type: "string", enum: rooms.map((r) => r.id) },
        puzzle_id: { type: "string" },
        level: { type: "integer", minimum: 1, maximum: 3 },
      },
      required: ["room_id", "puzzle_id", "level"],
      additionalProperties: false,
    },
  },
  {
    name: "get_room_design_guide",
    description:
      "Get the subject-independent template and design principles for creating a learning escape room.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
].map((t) => ({
  ...t,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
}));
export function callTool(name, args = {}) {
  const t = tools.find((t) => t.name === name);
  if (!t) throw Error("Unknown tool");
  if (
    !args ||
    typeof args !== "object" ||
    Array.isArray(args) ||
    Object.keys(args).some((k) => !Object.hasOwn(t.inputSchema.properties, k))
  )
    throw Error("Invalid arguments");
  if(name==='review_room_draft') return review.audit(args.room);
  if (name === "list_rooms")
    return rooms.map(({ id, topic, title, objectives }) => ({
      id,
      topic,
      title,
      objectives,
    }));
  if (name === "get_room_design_guide")
    return {
      workflow: [
        "Choose a topic and a specific learning objective.",
        "Invent a fictional mission requiring that understanding.",
        "Create 1–6 locks with two useful evidence cards each.",
        "Write three choices and a deterministic answer key.",
        "Write explanations and three progressively stronger hints.",
        "Add learningPlan with audience, prerequisites, bigQuestion.",
        "Map each puzzle.objective to a room objective; add puzzle.reasoning with prompt, evidenceIds, explanation.",
        "Add a room.transfer question, 3 options, answer index and explanation in a new context.",
        "Call review_room_draft before returning; have a human review facts before publishing locally.",
      ],
      fields: ["topic", "title", "description", "objectives", "puzzles"],
      authoring:
        "Use Create a room in the app. Any topic is supported through authored content; this tool does not publish or generate verified facts.",
    };
  const r = rooms.find((r) => r.id === args.room_id);
  const p = r?.puzzles.find((p) => p.id === args.puzzle_id);
  if (!p) throw Error("Unknown room or puzzle");
  if (name === "get_hint") {
    if (!Number.isInteger(args.level) || args.level < 1 || args.level > 3)
      throw Error("Hint level must be 1–3");
    return {
      hint: p.hints[args.level - 1],
      level: args.level,
      fictional: true,
    };
  }
  return {
    topic: r.topic,
    title: r.title,
    objectives: r.objectives,
    sources: r.sources,
    fiction: r.fiction,
    puzzle: {
      id: p.id,
      title: p.title,
      story: p.story,
      question: p.question,
      evidence: p.evidence,
      options: p.options,
    },
  };
}
export function rpc(m) {
  if (
    !m ||
    Array.isArray(m) ||
    m.jsonrpc !== "2.0" ||
    typeof m.method !== "string"
  )
    return {
      jsonrpc: "2.0",
      id: m?.id ?? null,
      error: { code: -32600, message: "Invalid request" },
    };
  if (m.id === undefined) return null;
  const p = m.params || {};
  let result;
  if (m.method === "initialize")
    result = {
      protocolVersion: ["2025-03-26", "2025-06-18", "2025-11-25"].includes(
        p.protocolVersion,
      )
        ? p.protocolVersion
        : "2025-03-26",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "unlock-academy", version: "1.0.0" },
    };
  else if (m.method === "ping") result = {};
  else if (m.method === "tools/list") result = { tools };
  else if (m.method === "tools/call") {
    try {
      result = {
        content: [
          { type: "text", text: JSON.stringify(callTool(p.name, p.arguments)) },
        ],
      };
    } catch (e) {
      result = { isError: true, content: [{ type: "text", text: e.message }] };
    }
  } else
    return {
      jsonrpc: "2.0",
      id: m.id,
      error: { code: -32601, message: "Method not found" },
    };
  return { jsonrpc: "2.0", id: m.id, result };
}
