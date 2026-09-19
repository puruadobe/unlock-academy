(() => {
  const SEAT_KEY = "unlock-team-seat-v1";
  let seat = null,
    snapshot = null,
    polling = false,
    busy = false,
    renderKey = "",
    voteDraft = null;
  try {
    seat = JSON.parse(sessionStorage.getItem(SEAT_KEY) || "null");
  } catch {}
  const status = (text) => {
    $("teamStatus").textContent = text;
  };
  function remember() {
    try {
      if (seat) sessionStorage.setItem(SEAT_KEY, JSON.stringify(seat));
      else sessionStorage.removeItem(SEAT_KEY);
    } catch {
      status("This tab cannot remember its seat after reload. Keep it open.");
    }
  }
  async function request(path, body, authenticated = true) {
    const response = await fetch("/api/teams" + path, {
      method: body ? "POST" : "GET",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(authenticated && seat
          ? { Authorization: "Bearer " + seat.token }
          : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(8000),
    });
    const result = await response.json();
    if (!response.ok) {
      const error = Error(result.error || "Team request failed.");
      error.status = response.status;
      throw error;
    }
    return result;
  }
  function forget() {
    seat = null;
    snapshot = null;
    renderKey = "";
    voteDraft = null;
    remember();
    $("teamEntrance").hidden = false;
    $("teamSession").hidden = true;
  }
  async function poll() {
    if (!seat || polling || busy) return;
    polling = true;
    try {
      const next = await request("/" + seat.code);
      if (
        !seat ||
        next.code !== seat.code ||
        next.version < (snapshot?.version ?? -1)
      )
        return;
      snapshot = next;
      render();
      status("Connected · team updates every second");
    } catch (e) {
      status("Connection interrupted: " + e.message);
      if ([401, 404].includes(e.status)) forget();
    } finally {
      polling = false;
    }
  }
  async function act(type, extra = {}) {
    if (busy || !snapshot) return;
    busy = true;
    const buttons = $("teamSession").querySelectorAll("button");
    buttons.forEach((b) => (b.disabled = true));
    try {
      snapshot = await request("/" + seat.code + "/action", {
        type,
        ...extra,
        version: snapshot.version,
        puzzleId: snapshot.puzzle?.id,
        requestId: crypto.randomUUID(),
      });
      renderKey = "";
      if (type === "leave") {
        forget();
        status("You left the team.");
      } else {
        render();
        status("Team updated.");
      }
    } catch (e) {
      status(e.message);
      renderKey = "";
      render();
    } finally {
      busy = false;
    }
  }
  function captureVote() {
    const p = snapshot?.puzzle;
    if (!p) return;
    const selected = $("teamSession").querySelector(
      'input[name="teamAnswer"]:checked',
    );
    voteDraft = {
      puzzleId: p.id,
      choice: selected ? Number(selected.value) : null,
      evidence: [
        ...$("teamSession").querySelectorAll(
          'input[name="teamEvidence"]:checked',
        ),
      ].map((e) => e.value),
    };
  }
  function render() {
    if (!snapshot) return;
    const s = snapshot,
      host = s.me === s.host,
      p = s.puzzle;
    const key = s.version + ":" + s.players.map((x) => x.online).join(",");
    if (key === renderKey) return;
    if (renderKey && p && $("teamSession").dataset.puzzle === p.id)
      captureVote();
    renderKey = key;
    $("teamEntrance").hidden = true;
    $("teamSession").hidden = false;
    $("teamSession").dataset.puzzle = p?.id || "";
    if (voteDraft?.puzzleId !== p?.id)
      voteDraft = p
        ? {
            puzzleId: p.id,
            choice: s.myVote?.choice ?? null,
            evidence: s.myVote?.evidence || [],
          }
        : null;
    const button = (type, label, disabled = false) =>
      `<button class="secondary" data-team-act="${type}" ${disabled ? "disabled" : ""}>${label}</button>`;
    let html = `<div class="team-session-heading"><div><span class="eyebrow">JOIN CODE</span><strong class="team-code">${esc(s.code)}</strong></div><div><h2>${esc(s.title)}</h2><p>${s.solved} / ${s.total} locks opened · ${s.players.length} players · ${host ? "You are hosting" : "Team member"}</p></div></div>`;
    html +=
      '<div class="team-columns"><aside class="team-panel"><h3>Your team</h3><ul class="team-roster">' +
      s.players
        .map(
          (x) =>
            `<li><div><strong>${esc(x.name)}${x.id === s.me ? " (you)" : ""}</strong><span>${x.id === s.host ? "Host · " : ""}${x.online ? "Connected" : "Away"} · ${s.phase === "lobby" ? (x.ready ? "Ready" : "Getting ready") : x.voted ? "Voted" : "Thinking"}</span></div>${host && x.id !== s.host && s.phase !== "closed" ? `<button class="text-button" data-remove="${x.id}" aria-label="Remove ${esc(x.name)}">Remove</button>` : ""}</li>`,
        )
        .join("") +
      "</ul>";
    if (host && s.phase !== "closed") html += button("close", "End session");
    if (!host && s.phase !== "closed") html += button("leave", "Leave team");
    html +=
      '<h3>Team activity</h3><ol class="team-activity">' +
      s.activity
        .slice(-6)
        .map((e) => "<li>" + esc(e.text) + "</li>")
        .join("") +
      '</ol></aside><section class="team-panel team-challenge">';
    if (s.phase === "lobby") {
      const me = s.players.find((x) => x.id === s.me);
      html +=
        '<span class="eyebrow">THE LOBBY</span><h2>Gather your team.</h2><p>Share the code above. Everyone explores the same mission, with independent votes before the group reveal.</p>' +
        button("ready", me.ready ? "Not ready yet" : "I’m ready");
      if (host)
        html += button(
          "start",
          "Start team mission ↗",
          s.players.length < 2 || !s.players.every((x) => x.ready),
        );
      html +=
        '<p class="small">All players must be ready. Late joins are closed once the mission starts. The host can remove a disconnected seat so the team can continue.</p>';
    }
    if (p) {
      html +=
        `<span class="eyebrow">LOCK ${s.solved + 1} / ${s.total}</span><h2>${esc(p.title)}</h2><p>${esc(p.story)}</p>${p.objective ? '<p class="small">Practice: ' + esc(p.objective) + "</p>" : ""}<h3>Shared evidence board</h3><div class="team-evidence">` +
        p.evidence
          .map(
            (e) =>
              `<article><button class="secondary" data-clue="${esc(e.id)}" ${p.seen.includes(e.id) ? "disabled" : ""}>${esc(e.title)} ${p.seen.includes(e.id) ? "✓" : p.required.includes(e.id) ? "· Required" : "· Optional"}</button>${p.seen.includes(e.id) ? "<pre>" + esc(e.body) + "</pre>" : ""}</article>`,
          )
          .join("") +
        "</div>";
      html +=
        `<h3>${esc(p.question)}</h3><fieldset class="team-vote"><legend>Your independent answer</legend>` +
        p.options
          .map(
            (o, i) =>
              `<label><input type="radio" name="teamAnswer" value="${i}" ${voteDraft?.choice === i ? "checked" : ""}>${esc(o)}</label>`,
          )
          .join("") +
        "</fieldset>";
      if (p.reasoningPrompt)
        html +=
          `<fieldset class="team-vote"><legend>${esc(p.reasoningPrompt)}</legend>` +
          p.evidence
            .map(
              (e) =>
                `<label><input type="checkbox" name="teamEvidence" value="${esc(e.id)}" ${voteDraft?.evidence.includes(e.id) ? "checked" : ""} ${p.seen.includes(e.id) ? "" : "disabled"}>${esc(e.title)}</label>`,
            )
            .join("") +
          "</fieldset>";
      html +=
        button(
          "vote",
          s.myVote ? "Update my vote" : "Cast my vote",
          p.required.some((id) => !p.seen.includes(id)),
        ) +
        '<p class="small">Votes stay private until everyone has voted. Discuss your choices together; no chat is recorded.</p>';
      if (s.votes.length)
        html +=
          '<div class="team-votes"><h3>Compare your votes</h3>' +
          s.votes
            .map(
              (v) =>
                "<p><strong>" +
                esc(v.name) +
                "</strong>: " +
                esc(p.options[v.choice]) +
                "</p>",
            )
            .join("") +
          "</div>";
      if (host)
        html +=
          button(
            "resolve",
            "Check team decision",
            !s.players.every((x) => x.voted),
          ) + button("hint", "Reveal a team hint", p.hints.length >= 3);
      if (p.hints.length)
        html +=
          "<h3>Team hints</h3>" +
          p.hints
            .map((h) => '<p class="review-warning">' + esc(h) + "</p>")
            .join("");
    }
    if (s.feedback)
      html += `<div class="feedback-box ${s.feedback.kind === "correct" ? "correct" : ""}" role="status"><h3>${s.feedback.kind === "correct" ? "Lock opened ✓" : "Discuss and try again"}</h3><p>${esc(s.feedback.message)}</p>${s.feedback.lesson ? "<p>" + esc(s.feedback.lesson) + "</p>" : ""}${s.feedback.unlock ? "<p>" + esc(s.feedback.unlock) + "</p>" : ""}</div>`;
    if (s.phase === "reveal")
      html += host
        ? button(
            "next",
            s.solved === s.total ? "See team debrief ↗" : "Next lock →",
          )
        : "<p>Waiting for the host to continue.</p>";
    if (s.debrief)
      html +=
        '<span class="eyebrow">MISSION COMPLETE</span><h2>You found the way together.</h2><p>' +
        s.debrief.attempts +
        " team answer attempts. Take turns explaining one lesson in your own words.</p>" +
        s.debrief.lessons
          .map(
            (l) =>
              '<article class="lesson"><h3>' +
              esc(l.title) +
              "</h3><p>" +
              esc(l.explanation) +
              "</p></article>",
          )
          .join("") +
        "<h3>What you practiced</h3><ul>" +
        s.debrief.objectives.map((o) => "<li>" + esc(o) + "</li>").join("") +
        "</ul>";
    if (s.phase === "closed")
      html +=
        '<h2>This session has ended.</h2><p>The host closed the mission. Create or join another team when you’re ready.</p><button class="primary" id="teamNew">Back to team setup</button>';
    html += "</section></div>";
    $("teamSession").innerHTML = html;
    $("teamSession")
      .querySelectorAll("[data-team-act]")
      .forEach(
        (b) =>
          (b.onclick = () => {
            const type = b.dataset.teamAct;
            if (type === "close" && !confirm("End this session for everyone?"))
              return;
            if (type === "ready")
              act(type, { ready: !s.players.find((x) => x.id === s.me).ready });
            else if (type === "vote") {
              captureVote();
              if (voteDraft.choice === null) {
                status("Choose an answer before voting.");
                return;
              }
              act(type, {
                choice: voteDraft.choice,
                evidence: voteDraft.evidence,
              });
            } else act(type);
          }),
      );
    $("teamSession")
      .querySelectorAll("[data-clue]")
      .forEach(
        (b) =>
          (b.onclick = () => act("inspect", { evidenceId: b.dataset.clue })),
      );
    $("teamSession")
      .querySelectorAll("[data-remove]")
      .forEach(
        (b) =>
          (b.onclick = () => {
            if (confirm("Remove this seat from the team?"))
              act("remove", { playerId: b.dataset.remove });
          }),
      );
    $("teamSession")
      .querySelectorAll("input")
      .forEach((input) => (input.onchange = captureVote));
    if ($("teamNew")) $("teamNew").onclick = forget;
  }
  async function enter(event, host) {
    event.preventDefault();
    if (busy) return;
    if (!/^https?:$/.test(location.protocol)) {
      status(
        "Play together needs the app server. Run npm start and open the local address.",
      );
      return;
    }
    busy = true;
    try {
      const input = host
        ? {
            name: $("teamHostName").value,
            room: rooms().find((r) => r.id === $("teamRoom").value),
          }
        : { name: $("teamJoinName").value };
      const result = await request(
        host ? "" : "/" + $("teamCode").value.trim().toUpperCase() + "/join",
        input,
        false,
      );
      seat = { code: result.code, token: result.token };
      snapshot = result.snapshot;
      renderKey = "";
      voteDraft = null;
      remember();
      render();
      status("You’re connected. Share the code with your team.");
    } catch (e) {
      status(e.message);
    } finally {
      busy = false;
    }
  }
  $("teamHostForm").onsubmit = (e) => enter(e, true);
  $("teamJoinForm").onsubmit = (e) => enter(e, false);
  $("teamNav").onclick = () => {
    navigate("team");
    $("teamRoom").innerHTML = rooms()
      .map(
        (r) =>
          '<option value="' + esc(r.id) + '">' + esc(r.title) + "</option>",
      )
      .join("");
    if (seat) poll();
  };
  setInterval(poll, 1000);
  if (seat) poll();
})();
