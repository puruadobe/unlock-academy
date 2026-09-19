"use strict";
const $ = (id) => document.getElementById(id),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const KEY = "unlock-academy-v1";
let custom = [],
  states = {},
  previewRoom = null,
  previewState = null,
  currentId = null,
  choice = null,
  screen = "library",
  pending = null,
  coachSession = null,
  coachBusy = false;
try {
  const data = JSON.parse(localStorage.getItem(KEY) || "{}");
  custom = Array.isArray(data.custom)
    ? data.custom
        .filter(
          (r) =>
            !RoomEngine.validate(r).length &&
            !STARTER_ROOMS.some((x) => x.id === r.id),
        )
        .slice(0, 20)
    : [];
  states = data.states && typeof data.states === "object" ? data.states : {};
} catch {
  $("saveStatus").textContent =
    "Browser storage unavailable. Progress will last for this visit only.";
}
const rooms = () => [...STARTER_ROOMS, ...custom],
  room = () => previewRoom || rooms().find((r) => r.id === currentId),
  state = () => previewRoom ? previewState : states[currentId];
function save() {
  if (previewRoom) return true;
  try {
    localStorage.setItem(KEY, JSON.stringify({ custom, states }));
    return true;
  } catch {
    $("saveStatus").textContent =
      "Could not save locally. Export your room or debrief before closing.";
    return false;
  }
}
function navigate(to) {
  if (to !== "play") { previewRoom = null; previewState = null; }
  $("previewBanner").hidden = !previewRoom;
  $("saveStatus").hidden = !!previewRoom;
  screen = to;
  for (const id of ["library", "play", "studio"]) $(id).hidden = id !== to;
  $("libraryNav").classList.toggle("active", to === "library");
  $("studioNav").classList.toggle("active", to === "studio");
  if (to === "library") renderLibrary();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function download(name, data, type = "application/json") {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function renderLibrary() {
  $("roomCount").textContent =
    rooms().length + " rooms · endless possibilities";
  $("roomGrid").replaceChildren();
  for (const r of rooms()) {
    const s = RoomEngine.restore(r, states[r.id]),
      done = s.solved.length === r.puzzles.length;
    const card = document.createElement("article");
    card.className = "room-card";
    card.innerHTML =
      '<div class="room-cover ' +
      (r.color === "orange" ? "orange" : r.color === "green" ? "green" : "") +
      '"><span class="topic">' +
      esc(r.topic) +
      '</span><span class="symbol" aria-hidden="true">' +
      esc(r.icon || "✦") +
      '</span></div><div class="room-card-body"><h3>' +
      esc(r.title) +
      "</h3><p>" +
      esc(r.subtitle || r.description) +
      '</p><div class="room-details"><span>' +
      esc(r.duration || "Self-paced") +
      "</span><span>" +
      r.puzzles.length +
      " " +
      (r.puzzles.length === 1 ? "lock" : "locks") +
      "</span><span>" +
      esc(r.level || "Custom room") +
      '</span></div><button class="primary">' +
      (done ? "View debrief" : s.started ? "Continue mission" : "Enter room") +
      ' ↗</button><div class="room-card-actions"><button class="text-button export">Export room ↓</button><span class="small">' +
      (done
        ? "Completed"
        : s.solved.length
          ? s.solved.length + " locks opened"
          : "") +
      "</span></div></div>";
    card.querySelector(".primary").onclick = () => start(r.id);
    card.querySelector(".export").onclick = () =>
      download(r.id + ".json", JSON.stringify(r, null, 2));
    $("roomGrid").append(card);
  }
  const add = document.createElement("div");
  add.className = "create-card";
  add.innerHTML =
    '<span class="plus" aria-hidden="true">+</span><h3>A room for your curiosity</h3><p>History, biology, literature, or something entirely your own.</p><button class="secondary">Create a learning room ↗</button>';
  add.querySelector("button").onclick = () => navigate("studio");
  $("roomGrid").append(add);
}
function startPreview(draft) {
  const errors = RoomEngine.validate(draft);
  if (errors.length) throw Error(errors.join(" "));
  previewRoom = JSON.parse(JSON.stringify(draft));
  previewRoom.id = "preview-" + crypto.randomUUID();
  currentId = previewRoom.id;
  previewState = RoomEngine.initial();
  previewState.started = Date.now();
  choice = null;
  pending = null;
  coachSession = null;
  navigate("play");
  renderMission();
}
$("returnToDraft").onclick = () => navigate("studio");
function start(id) {
  previewRoom = null;
  previewState = null;
  currentId = id;
  states[id] = RoomEngine.restore(room(), states[id]);
  if (!state().started) state().started = Date.now();
  choice = null;
  pending = null;
  save();
  navigate("play");
  renderMission();
}
function renderMission() {
  const r = room(),
    s = state();
  $("missionTopic").textContent = r.topic;
  $("missionLabel").textContent = "YOUR LEARNING MISSION";
  $("missionTitle").textContent = r.title;
  $("lockCount").textContent = s.solved.length + " / " + r.puzzles.length;
  $("fiction").textContent =
    r.fiction || "An educational scenario created by a local author.";
  $("lockRail").replaceChildren();
  r.puzzles.forEach((p, i) => {
    const d = document.createElement("div");
    d.className =
      "lock-stop " +
      (i < s.solved.length ? "done" : i === s.solved.length ? "active" : "");
    d.textContent =
      (i < s.solved.length ? "✓ " : "0" + (i + 1) + " · ") + p.title;
    $("lockRail").append(d);
  });
  const complete = s.solved.length === r.puzzles.length && !pending;
  $("puzzleArea").hidden = complete;
  $("debrief").hidden = !complete;
  if (complete) {
    renderDebrief();
    return;
  }
  const p = pending?.puzzle || r.puzzles[s.solved.length];
  $("puzzleEyebrow").textContent =
    p.eyebrow || "EVIDENCE → REASONING → DISCOVERY";
  $("puzzleTitle").textContent = p.title;
  $("puzzleStory").textContent = p.story;
  $("puzzleQuestion").textContent = p.question;
  $("puzzleObjective").textContent=p.objective?'You are practicing: '+p.objective:'';
  renderEvidence(p);
  renderReasoning(p);
  $("answerChoices").replaceChildren();
  p.options.forEach((option, i) => {
    const l = document.createElement("label");
    l.className = "answer";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.value = i;
    input.checked = choice === i;
    input.disabled = !!pending;
    input.onchange = () => {
      choice = i;
    };
    const span = document.createElement("span");
    span.textContent = option;
    l.append(input, span);
    $("answerChoices").append(l);
  });
  $("submitAnswer").disabled = !!pending;
  $("feedback").replaceChildren();
  if (pending) showFeedback(pending.result, p);
  renderHints(p);
}
function renderEvidence(p) {
  const seen = state().seen[p.id] || [];
  $("evidenceCount").textContent =
    seen.length + " / " + p.evidence.length + " inspected";
  $("evidenceGrid").replaceChildren();
  for (const e of p.evidence) {
    const b = document.createElement("button");
    b.className = "evidence-card" + (seen.includes(e.id) ? " seen" : "");
    b.innerHTML =
      '<span class="eyebrow">' +
      esc(e.type || "EVIDENCE") +
      "</span><strong>" +
      esc(e.title) +
      "</strong><small>" +
      (seen.includes(e.id)
        ? "✓ Inspected"
        : p.required.includes(e.id)
          ? "Required · Open ↗"
          : "Optional · Open ↗") +
      "</small>";
    b.onclick = () => {
      RoomEngine.inspect(state(), p, e.id);
      save();
      $("evidenceType").textContent = e.type || "EVIDENCE";
      $("evidenceTitle").textContent = e.title;
      $("evidenceBody").textContent = e.body;
      $("evidenceClue").textContent = e.clue;
      $("evidenceDialog").showModal();
      renderEvidence(p);
      renderReasoning(p);
    };
    $("evidenceGrid").append(b);
  }
}
function renderHints(p) {
  const n = state().hints[p.id] || 0;
  $("hintCount").textContent = n + " / 3 hints used";
  $("hintButton").disabled = n >= 3 || !!pending;
  $("hintButton").textContent =
    n >= 3 ? "All hints revealed" : "✦ Give me a nudge";
  $("hints").replaceChildren();
  p.hints.slice(0, n).forEach((h, i) => {
    const el = document.createElement("p");
    el.textContent = "Hint " + (i + 1) + ": " + h;
    $("hints").append(el);
  });
}
function showFeedback(result, p) {
  $("feedback").replaceChildren();
  const box = document.createElement("div");
  box.className =
    "feedback-box" + (result.kind === "correct" ? " correct" : "");
  if (result.kind === "correct") {
    const title = document.createElement("h3");
    title.textContent = "Lock opened ✓";
    const msg = document.createElement("p");
    msg.textContent = result.unlock;
    const lesson = document.createElement("p");
    lesson.textContent = result.lesson+(p.reasoning?' '+p.reasoning.explanation:'');
    const next = document.createElement("button");
    next.className = "primary full";
    next.textContent =
      state().solved.length === room().puzzles.length
        ? "See what you learned →"
        : "Continue to the next lock →";
    next.onclick = () => {
      pending = null;
      choice = null;
      renderMission();
      $("missionTitle").scrollIntoView({ behavior: "smooth" });
    };
    box.append(title, msg, lesson, next);
  } else box.textContent = result.message;
  $("feedback").append(box);
}
$("submitAnswer").onclick = () => {
  const p = room().puzzles[state().solved.length];
  const selectedEvidence=[...document.querySelectorAll('#reasoningChoices input:checked')].map(x=>x.value);
  const result = RoomEngine.evaluate(room(), state(), choice, selectedEvidence);
  if (result.kind === "correct") {
    pending = { puzzle: p, result };
    save();
    renderMission();
  } else {
    save();
    showFeedback(result, p);
  }
};
$("hintButton").onclick = () => {
  const p = room().puzzles[state().solved.length];
  state().hints[p.id] = Math.min(3, (state().hints[p.id] || 0) + 1);
  save();
  renderHints(p);
};
function renderDebrief() {
  const r = room(),
    s = state(),
    attempts = Object.values(s.attempts).reduce((a, b) => a + b, 0),
    hints = Object.values(s.hints).reduce((a, b) => a + b, 0);
  $("debrief").innerHTML =
    '<div class="debrief-top"><span class="eyebrow">MISSION COMPLETE / UNDERSTANDING UNLOCKED</span><h2>You found your way through.</h2><p>' +
    esc(r.title) +
    ' is complete. The real reward is being able to explain your decisions.</p></div><div class="debrief-stats"><div><strong>' +
    r.puzzles.length +
    "</strong><span>concepts practiced</span></div><div><strong>" +
    attempts +
    "</strong><span>answers explored</span></div><div><strong>" +
    hints +
    '</strong><span>hints used</span></div></div><div class="lessons">' +
    r.puzzles
      .map(
        (p, i) =>
          '<article class="lesson"><span class="eyebrow">LESSON 0' +
          (i + 1) +
          "</span><h3>" +
          esc(p.title) +
          "</h3><p>" +
          esc(p.explanation) +
          "</p></article>",
      )
      .join("") +
    "</div><h3>Take these ideas with you</h3><ul>" +
    r.objectives.map((o) => '<li class="small">' + esc(o) + "</li>").join("") +
    '</ul><div class="source-list">' +
    (r.sources?.length
      ? '<p class="small">Background reading about real attack mechanisms. This fictional mission does not reconstruct those incidents.</p>' +
        r.sources
          .map(
            (s) =>
              '<a href="' +
              esc(s.url) +
              '" target="_blank" rel="noopener noreferrer">' +
              esc(s.title) +
              " ↗</a>",
          )
          .join("")
      : '<p class="small">' +
        (STARTER_ROOMS.some((x) => x.id === r.id)
          ? "A simplified lesson in classical mechanics."
          : "Author-created lesson. Check its claims and sources before using it for instruction.") +
        "</p>") +
    '</div><div class="section-heading debrief-actions"><button id="exportDebrief" class="primary">Keep my learning notes ↓</button><button id="anotherRoom" class="secondary">Explore another room ↗</button></div>';
  $("exportDebrief").onclick = () =>
    download(
      r.id + "-learning-notes.txt",
      [
        r.title,
        "Mission complete",
        "",
        ...r.puzzles.flatMap((p) => [p.title, p.explanation, ""]),
        "Learning objectives:",
        ...r.objectives,
        "",
        ...(r.sources || []).map((s) => s.title + "\n" + s.url),
      ].join("\n"),
      "text/plain;charset=utf-8",
    );
  $("anotherRoom").onclick = () => navigate("library");
  renderTransfer(r,s);
}
$("restartRoom").onclick = () => {
  if (previewRoom) { startPreview(previewRoom); return; }
  if (confirm("Restart this room and clear its saved progress?")) {
    states[currentId] = RoomEngine.initial();
    start(currentId);
  }
};
$("home").onclick = (e) => {
  e.preventDefault();
  navigate("library");
};
$("libraryNav").onclick = () => navigate("library");
$("backLibrary").onclick = () => navigate("library");
$("studioNav").onclick = () => navigate("studio");
$("startFeatured").onclick = () => start("last-transfer");
$("closeEvidence").onclick = () => $("evidenceDialog").close();
$("finishEvidence").onclick = () => $("evidenceDialog").close();
function puzzleForm() {
  const count = $("puzzleForms").children.length;
  if (count >= 6) return;
  const div = document.createElement("section");
  div.className = "puzzle-form";
  div.innerHTML =
    '<div class="section-heading"><h3>Lock <span class="lock-index"></span></h3><button type="button" class="text-button remove">Remove lock</button></div><label>Lock title<input data-field="title" required maxlength="100" placeholder="The first discovery"></label><label>Scene<textarea data-field="story" required maxlength="1600" rows="2" placeholder="What situation is the learner facing?"></textarea></label><label>Question<input data-field="question" required maxlength="500" placeholder="What should they decide or explain?"></label><div class="form-row"><label>Evidence 1<textarea data-field="evidence1" required maxlength="2400" rows="3" placeholder="A fact, observation, document, or calculation."></textarea></label><label>Evidence 2<textarea data-field="evidence2" required maxlength="2400" rows="3" placeholder="A second piece of information that helps solve the lock."></textarea></label></div><label>Choice A<input data-field="a" required maxlength="500"></label><label>Choice B<input data-field="b" required maxlength="500"></label><label>Choice C<input data-field="c" required maxlength="500"></label><label>Correct choice<select data-field="answer"><option value="0">A</option><option value="1">B</option><option value="2">C</option></select></label><label>Why is that the answer?<textarea data-field="explanation" required maxlength="1600" rows="3" placeholder="Connect the evidence to the answer; explain the concept."></textarea></label><label>A gentle hint<input data-field="hint" required maxlength="800" placeholder="Point toward a useful clue without giving away the answer."></label>';
  div.querySelector(".remove").onclick = () => {
    if ($("puzzleForms").children.length > 1) {
      div.remove();
      renumber();
    }
  };
  $("puzzleForms").append(div);
  renumber();
}
function renumber() {
  [...$("puzzleForms").children].forEach((p, i) => {
    p.querySelector(".lock-index").textContent = i + 1;
    p.querySelector(".remove").disabled =
      $("puzzleForms").children.length === 1;
  });
  $("addPuzzle").disabled = $("puzzleForms").children.length >= 6;
}
$("addPuzzle").onclick = puzzleForm;
$("roomForm").onsubmit = (e) => {
  e.preventDefault();
  if (custom.length >= 20) {
    $("studioErrors").textContent =
      "Your local collection has reached 20 custom rooms. Export rooms before creating a new collection in another browser.";
    return;
  }
  const r = {
    id: "custom-" + Date.now().toString(36),
    topic: $("draftTopic").value.trim(),
    title: $("draftTitle").value.trim(),
    description: $("draftStory").value.trim(),
    subtitle: $("draftStory").value.trim().slice(0, 140),
    objectives: [$("draftObjective").value.trim()],
    duration: "Self-paced",
    level: "Custom room",
    color: "green",
    icon: "✧",
    sources: [],
    fiction: "An educational scenario created by a local author.",
    puzzles: [...$("puzzleForms").children].map((el, i) => {
      const v = (k) =>
          el.querySelector('[data-field="' + k + '"]').value.trim(),
        answer = Number(v("answer")),
        options = [v("a"), v("b"), v("c")];
      return {
        id: "lock-" + (i + 1),
        title: v("title"),
        story: v("story"),
        question: v("question"),
        evidence: [
          {
            id: "e1",
            title: "Evidence 1",
            type: "CLUE",
            body: v("evidence1"),
            clue: "How does this information connect to the question?",
          },
          {
            id: "e2",
            title: "Evidence 2",
            type: "CLUE",
            body: v("evidence2"),
            clue: "Compare this with the other piece of evidence.",
          },
        ],
        required: ["e1", "e2"],
        options,
        answer,
        feedback: options.map((_, j) =>
          j === answer
            ? "Correct. Your reasoning matches the evidence."
            : "Not quite. Compare both clues and try another explanation.",
        ),
        explanation: v("explanation"),
        hints: [
          v("hint"),
          "Read both clues together and eliminate choices that contradict them.",
          "The intended answer is: " + options[answer],
        ],
        unlock: "You connected the evidence and opened this lock.",
      };
    }),
  };
  const errors = RoomEngine.validate(r);
  if (errors.length) {
    $("studioErrors").textContent = errors.join(" ");
    return;
  }
  custom.push(r);
  const saved = save();
  $("studioErrors").textContent = saved
    ? ""
    : "Room is available for this visit, but local storage failed. Export it to keep a copy.";
  if (saved) {
    $("roomForm").reset();
    $("puzzleForms").replaceChildren();
    puzzleForm();
  }
  navigate("library");
};
$("importRoom").onchange = async () => {
  try {
    const f = $("importRoom").files[0];
    if (!f) return;
    if (f.size > 150000) throw Error("Room file must be smaller than 150 KB.");
    const r = JSON.parse(await f.text());
    const errors = RoomEngine.validate(r);
    if (errors.length) throw Error(errors.slice(0, 3).join(" "));
    if (custom.length >= 20) throw Error("Local collection limit reached.");
    r.id = "custom-" + Date.now().toString(36);
    r.level = "Imported room";
    r.color = "green";
    custom.push(r);
    const saved = save();
    $("importStatus").textContent = saved
      ? "Imported. Find it in your room collection."
      : "Imported for this visit only. Browser storage is unavailable.";
    renderLibrary();
  } catch (e) {
    $("importStatus").textContent = "Import failed: " + e.message;
  } finally {
    $("importRoom").value = "";
  }
};
$("downloadTemplate").onclick = () =>
  download(
    "example-learning-room.json",
    JSON.stringify(STARTER_ROOMS[1], null, 2),
  );
async function openCoach() {
  $("coachDialog").showModal();
  if (!/^https?:$/.test(location.protocol)) {
    $("coachStatus").textContent =
      "Offline mode. Start the local app server and configure TrueForge to use the coach.";
    return;
  }
  try {
    const r = await fetch("/api/status", { signal: AbortSignal.timeout(4000) });
    const d = await r.json();
    $("coachStatus").textContent = d.message;
  } catch {
    $("coachStatus").textContent =
      "Coach server unavailable. All rooms and authored hints still work.";
  }
}
$("coachNav").onclick = openCoach;
$("studioCoach").onclick = openCoach;
$("closeCoach").onclick = () => $("coachDialog").close();
function chat(text, kind = "") {
  const el = document.createElement("div");
  el.className = "chat-entry " + kind;
  el.textContent = text;
  $("chat").append(el);
  return el;
}
$("coachForm").onsubmit = async (e) => {
  e.preventDefault();
  if (coachBusy) return;
  if (!/^https?:$/.test(location.protocol)) {
    openCoach();
    return;
  }
  const q = $("coachQuestion").value.trim();
  if (!q) return;
  coachBusy = true;
  $("askCoach").disabled = true;
  chat(q, "user");
  const reply = chat("Connecting to your learning coach…");
  let output = "";
  try {
    const r = room(),
      s = state();
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: q,
        roomId: r?.id || null,
        puzzleId: r?.puzzles[s?.solved.length]?.id || null,
        session: coachSession,
        customContext:
          r && !STARTER_ROOMS.some((x) => x.id === r.id)
            ? {
                topic: r.topic,
                title: r.title,
                question:
                  r.puzzles[s?.solved.length]?.question || "Room complete",
                evidence:
                  r.puzzles[s?.solved.length]?.evidence.map((e) => ({
                    title: e.title,
                    body: e.body,
                  })) || [],
              }
            : null,
      }),
      signal: AbortSignal.timeout(150000),
    });
    if (!response.ok) {
      const err = await response.json();
      throw Error(err.error || "Request failed");
    }
    const reader = response.body.getReader(),
      decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line) continue;
        const d = JSON.parse(line);
        if (d.type === "session") coachSession = d.id;
        if (d.type === "text") {
          output += d.text;
          reply.textContent = output;
        }
        if (d.type === "event")
          $("trace").textContent = "TrueForge · " + d.name;
        if (d.type === "done")
          $("trace").textContent = "TrueForge turn · " + d.status;
        if (d.type === "error") throw Error(d.message);
      }
      if (done) break;
    }
    if (!output)
      reply.textContent =
        "No text response. Check the session in TrueForge for details.";
    $("coachQuestion").value = "";
  } catch (err) {
    reply.textContent =
      (output ? output + "\n\n" : "") + "Coach unavailable: " + err.message;
  } finally {
    coachBusy = false;
    $("askCoach").disabled = false;
  }
};

function renderReasoning(p) {
  const box=$("reasoningChoices");
  const selected=box.dataset.puzzle===currentId+':'+p.id?[...box.querySelectorAll('input:checked')].map(x=>x.value):[];
  box.dataset.puzzle=currentId+':'+p.id;
  box.replaceChildren();
  if(!p.reasoning) return;
  const title=document.createElement('h3');title.textContent=p.reasoning.prompt;box.append(title);
  const note=document.createElement('p');note.className='small';note.textContent='Select only the supporting clues. Open a card to make it available here.';box.append(note);
  p.evidence.forEach(e=>{const label=document.createElement('label');label.className='reasoning-option';const input=document.createElement('input');input.type='checkbox';input.value=e.id;input.checked=selected.includes(e.id);input.disabled=!!pending||!state().seen[p.id]?.includes(e.id);const text=document.createElement('span');text.textContent=e.title;label.append(input,text);box.append(label)});
}
function renderTransfer(r,s) {
  if(!r.transfer)return;
  const t=r.transfer,section=document.createElement('section');section.className='transfer-panel';
  section.innerHTML='<span class="eyebrow">ONE MORE STEP / APPLY IT SOMEWHERE NEW</span><h3>'+esc(t.question)+'</h3><p class="small">The story has changed. Which principle still applies?</p>';
  t.options.forEach((option,i)=>{const b=document.createElement('button');b.className='secondary transfer-option';b.textContent=option;b.onclick=()=>{s.transferChoice=i;s.transferAttempts=(s.transferAttempts||0)+1;save();renderDebrief()};section.append(b)});
  if(s.transferChoice!==null&&s.transferChoice!==undefined){const result=document.createElement('p');result.className='feedback-box'+(s.transferChoice===t.answer?' correct':'');result.textContent=s.transferChoice===t.answer?'You applied the principle. '+t.explanation:'Not yet. Revisit the lesson and consider how it applies in this new situation.';section.append(result)}
  $('debrief').append(section);
}
puzzleForm();
renderLibrary();
