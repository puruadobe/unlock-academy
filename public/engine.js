const RoomEngine = (() => {
  const safeId = (v) =>
    typeof v === "string" &&
    /^[a-z0-9-]{1,80}$/.test(v) &&
    !["constructor", "prototype", "__proto__"].includes(v);
  const text = (v, max = 1000) =>
    typeof v === "string" && v.trim().length > 0 && v.length <= max;
  function validate(room) {
    const errors = [];
    if (!room || typeof room !== "object" || Array.isArray(room))
      return ["Room must be an object."];
    for (const k of ["id", "topic", "title", "description"])
      if (!text(room[k], k === "description" ? 1600 : 100))
        errors.push("Missing or too long: " + k);
    if (!/^[a-z0-9-]{1,80}$/.test(room.id || ""))
      errors.push("Room ID must use lowercase letters, numbers, and hyphens.");
    if (
      !Array.isArray(room.objectives) ||
      room.objectives.length < 1 ||
      room.objectives.length > 6 ||
      room.objectives.some((x) => !text(x, 300))
    )
      errors.push("Provide 1–6 short learning objectives.");
    if (
      !Array.isArray(room.puzzles) ||
      room.puzzles.length < 1 ||
      room.puzzles.length > 6
    )
      return [...errors, "Provide 1–6 puzzles."];
    if (room.learningPlan !== undefined) {
      const lp=room.learningPlan;
      if (!lp || !text(lp.audience,300) || !text(lp.bigQuestion,600) || !Array.isArray(lp.prerequisites) || lp.prerequisites.length>6 || lp.prerequisites.some(x=>!text(x,300))) errors.push("Invalid learning plan.");
    }
    if (room.transfer !== undefined) {
      const t=room.transfer;
      if (!t || !text(t.question,1600) || !Array.isArray(t.options) || t.options.length!==3 || t.options.some(x=>!text(x,500)) || !Number.isInteger(t.answer) || t.answer<0 || t.answer>2 || !text(t.explanation,1600)) errors.push("Invalid application question.");
    }
    const ids = new Set();
    room.puzzles.forEach((p, i) => {
      const at = "Puzzle " + (i + 1) + ": ";
      if (!p || typeof p !== "object") {
        errors.push(at + "invalid object");
        return;
      }
      if (!safeId(p.id) || ids.has(p.id))
        errors.push(at + "unique ID required");
      ids.add(p.id);
      for (const k of ["title", "story", "question", "explanation", "unlock"])
        if (!text(p[k], 1600)) errors.push(at + "missing or too long " + k);
      if (
        !Array.isArray(p.options) ||
        p.options.length !== 3 ||
        p.options.some((x) => !text(x, 500))
      )
        errors.push(at + "exactly 3 answer choices required");
      if (!Number.isInteger(p.answer) || p.answer < 0 || p.answer > 2)
        errors.push(at + "answer must be 0, 1, or 2");
      if (
        !Array.isArray(p.feedback) ||
        p.feedback.length !== 3 ||
        p.feedback.some((x) => !text(x, 800))
      )
        errors.push(at + "3 feedback messages required");
      if (
        !Array.isArray(p.hints) ||
        p.hints.length !== 3 ||
        p.hints.some((x) => !text(x, 800))
      )
        errors.push(at + "3 hints required");
      if (
        !Array.isArray(p.evidence) ||
        p.evidence.length < 2 ||
        p.evidence.length > 6
      ) {
        errors.push(at + "2–6 evidence cards required");
        return;
      }
      const eids = new Set();
      p.evidence.forEach((e) => {
        if (
          !e ||
          !safeId(e.id) ||
          eids.has(e.id) ||
          !text(e.title, 150) ||
          !text(e.body, 2400) ||
          !text(e.clue, 800)
        )
          errors.push(at + "invalid evidence card");
        if (e) eids.add(e.id);
      });
      if (p.objective !== undefined && !text(p.objective,300)) errors.push(at+"invalid objective");
      if (p.reasoning !== undefined) {
        const r=p.reasoning;
        if (!r || !text(r.prompt,800) || !Array.isArray(r.evidenceIds) || r.evidenceIds.length<1 || new Set(r.evidenceIds).size!==r.evidenceIds.length || r.evidenceIds.some(id=>!eids.has(id)) || !text(r.explanation,1600)) errors.push(at+"invalid evidence reasoning");
      }
      if (
        !Array.isArray(p.required) ||
        !p.required.length ||
        p.required.some((id) => !eids.has(id))
      )
        errors.push(at + "required evidence IDs must match cards");
    });
    if (
      room.sources !== undefined &&
      (!Array.isArray(room.sources) ||
        room.sources.length > 10 ||
        room.sources.some((s) => {
          try {
            return (
              !text(s.title, 200) ||
              !text(s.url, 1500) ||
              new URL(s.url).protocol !== "https:"
            );
          } catch {
            return true;
          }
        }))
    )
      errors.push("Sources must have titles and valid HTTPS URLs.");
    return errors;
  }
  function initial() {
    return {
      solved: [],
      seen: {},
      attempts: {},
      hints: {},
      started: null,
      finished: null,
      transferChoice: null,
      transferAttempts: 0,
    };
  }
  function restore(room, input) {
    const state = initial();
    if (!input || typeof input !== "object") return state;
    for (const p of room.puzzles) {
      if (
        Array.isArray(input.solved) &&
        input.solved.includes(p.id) &&
        state.solved.length === room.puzzles.indexOf(p)
      )
        state.solved.push(p.id);
      state.seen[p.id] = Array.isArray(input.seen?.[p.id])
        ? input.seen[p.id].filter((id) => p.evidence.some((e) => e.id === id))
        : [];
      state.attempts[p.id] = Number.isInteger(input.attempts?.[p.id])
        ? Math.max(0, Math.min(10000, input.attempts[p.id]))
        : 0;
      state.hints[p.id] = Number.isInteger(input.hints?.[p.id])
        ? Math.max(0, Math.min(3, input.hints[p.id]))
        : 0;
    }
    state.started =
      Number.isFinite(input.started) && input.started > 0
        ? input.started
        : null;
    state.finished =
      state.solved.length === room.puzzles.length &&
      Number.isFinite(input.finished)
        ? input.finished
        : null;
    if (room.transfer && Number.isInteger(input.transferChoice) && input.transferChoice>=0 && input.transferChoice<3) state.transferChoice=input.transferChoice;
    state.transferAttempts=Number.isInteger(input.transferAttempts)?Math.max(0,Math.min(10000,input.transferAttempts)):0;
    return state;
  }
  function inspect(state, puzzle, id) {
    if (!puzzle.evidence.some((e) => e.id === id))
      throw Error("Unknown evidence");
    state.seen[puzzle.id] = [
      ...new Set([...(state.seen[puzzle.id] || []), id]),
    ];
  }
  function evaluate(room, state, choice, selectedEvidence = []) {
    const p = room.puzzles[state.solved.length];
    if (!p) return { kind: "complete" };
    if (!Number.isInteger(choice) || choice < 0 || choice > 2)
      return { kind: "invalid", message: "Choose one answer first." };
    const missing = p.required.filter((id) => !state.seen[p.id]?.includes(id));
    if (missing.length)
      return {
        kind: "evidence",
        message: "Inspect the required evidence before making your decision.",
      };
    state.attempts[p.id] = (state.attempts[p.id] || 0) + 1;
    if (choice !== p.answer)
      return { kind: "retry", message: p.feedback[choice] };
    if (p.reasoning) {
      const expected=p.reasoning.evidenceIds;
      const selected=Array.isArray(selectedEvidence)?[...new Set(selectedEvidence)]:[];
      if (selected.length!==expected.length || selected.some(id=>!expected.includes(id))) return {kind:"reasoning",message:"Your answer is on track. Now select only the evidence that directly supports it; a familiar detail may be irrelevant."};
    }
    state.solved.push(p.id);
    if (state.solved.length === room.puzzles.length)
      state.finished = Date.now();
    return {
      kind: "correct",
      message: p.feedback[choice],
      lesson: p.explanation,
      unlock: p.unlock,
    };
  }
  return { validate, initial, restore, inspect, evaluate };
})();
if (typeof module !== "undefined") module.exports = RoomEngine;
