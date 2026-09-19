"use strict";

// The artwork is local SVG so rooms work offline. Buttons are overlaid on the
// scene instead of embedded in the SVG, keeping every clue keyboard accessible.
const RoomScenes = (() => {
  const sceneMap = {
    "last-transfer": {
      kind: "cyber",
      puzzles: {
        verify: {
          title: "Supplier desk",
          intro: "Follow the contact trail. Which objects provide an independent check?",
          targets: {
            mail: [23, 62, "Payment email"],
            directory: [68, 51, "Verified supplier record"],
            branding: [44, 18, "Email appearance"],
          },
        },
        session: {
          title: "Access console",
          intro: "Trace what happened before and after the password change.",
          targets: {
            password: [24, 60, "Account events"],
            sessions: [67, 47, "Session activity"],
            terms: [45, 18, "Identity field guide"],
          },
        },
        contain: {
          title: "Incident response desk",
          intro: "Identify what is at risk, then find the authorized response.",
          targets: {
            status: [23, 61, "Current situation"],
            playbook: [68, 51, "Incident response card"],
            shortcut: [45, 18, "Colleague chat"],
          },
        },
      },
    },
    "orbital-rescue": {
      kind: "space",
      puzzles: {
        motion: {
          title: "Flight deck view",
          intro: "Read the instruments before deciding what the ship will do.",
          targets: {
            sensor: [22, 61, "Sensor reading"],
            law: [68, 48, "Flight handbook"],
          },
        },
        force: {
          title: "Thruster bay",
          intro: "Pair the ship’s mass with the force readout to predict its motion.",
          targets: {
            mass: [24, 61, "Mass display"],
            force: [68, 48, "Thruster readout"],
          },
        },
        energy: {
          title: "Docking camera",
          intro: "Compare the objects before and after the brake makes contact.",
          targets: {
            before: [22, 61, "Before docking"],
            after: [68, 48, "After braking"],
          },
        },
      },
    },
  };

  function cyberArt() {
    return `<svg class="scene-art" viewBox="0 0 760 380" role="img" aria-label="Illustrated cybersecurity investigation desk"><defs><linearGradient id="cyber-bg" x1="0" x2="1"><stop stop-color="#26243d"/><stop offset="1" stop-color="#4c3a69"/></linearGradient><linearGradient id="screen" x1="0" x2="1"><stop stop-color="#bda9ed"/><stop offset="1" stop-color="#8ee1cf"/></linearGradient></defs><rect width="760" height="380" rx="20" fill="url(#cyber-bg)"/><circle cx="640" cy="52" r="92" fill="#b49ce8" opacity=".12"/><circle cx="92" cy="337" r="125" fill="#79dac3" opacity=".08"/><path d="M0 292 760 243v137H0z" fill="#1e1d30"/><rect x="62" y="87" width="277" height="178" rx="12" fill="#171827" stroke="#8177a7" stroke-width="5"/><rect x="78" y="104" width="245" height="135" rx="6" fill="url(#screen)" opacity=".9"/><rect x="93" y="121" width="91" height="10" rx="5" fill="#fff" opacity=".8"/><rect x="93" y="148" width="179" height="8" rx="4" fill="#4f4078" opacity=".7"/><rect x="93" y="167" width="152" height="8" rx="4" fill="#4f4078" opacity=".6"/><path d="M170 265h68l23 30H147z" fill="#666077"/><rect x="459" y="104" width="179" height="127" rx="10" fill="#faf5ec" transform="rotate(7 459 104)"/><path d="M483 136h122M483 158h94M483 180h110M483 202h74" stroke="#766b93" stroke-width="8" stroke-linecap="round" opacity=".7"/><circle cx="647" cy="255" r="47" fill="#7ae0c6" opacity=".7"/><circle cx="647" cy="255" r="24" fill="#2f5160"/><path d="M593 276c40 22 87 20 131-6" fill="none" stroke="#c5b4ef" stroke-width="5" stroke-linecap="round"/></svg>`;
  }

  function spaceArt() {
    return `<svg class="scene-art" viewBox="0 0 760 380" role="img" aria-label="Illustrated spacecraft scene"><defs><radialGradient id="planet" cx="30%" cy="30%"><stop stop-color="#ffd7a5"/><stop offset="1" stop-color="#c67267"/></radialGradient><linearGradient id="ship" x1="0" x2="1"><stop stop-color="#e9e4ff"/><stop offset="1" stop-color="#9d8fd8"/></linearGradient></defs><rect width="760" height="380" rx="20" fill="#151b37"/><g fill="#e5dcff"><circle cx="82" cy="57" r="3"/><circle cx="165" cy="120" r="2"/><circle cx="250" cy="48" r="4"/><circle cx="604" cy="60" r="3"/><circle cx="692" cy="154" r="2"/><circle cx="539" cy="108" r="2"/><circle cx="352" cy="87" r="2"/></g><circle cx="639" cy="100" r="106" fill="url(#planet)"/><path d="M510 139c55-36 143-38 228-4" fill="none" stroke="#f6bd93" stroke-width="15" opacity=".45"/><path d="M142 246c43-99 142-155 247-124 55 17 99 58 118 111-94 61-223 70-365 13z" fill="url(#ship)"/><path d="m155 252-59 50 91-17M392 137l-15-72 64 55" fill="#a59ad3"/><circle cx="337" cy="194" r="38" fill="#263257" stroke="#e5dcff" stroke-width="7"/><circle cx="337" cy="194" r="21" fill="#8ee5d0"/><path d="M442 226c44 4 83-5 117-26" fill="none" stroke="#ffca88" stroke-width="17" stroke-linecap="round"/><rect x="70" y="280" width="250" height="39" rx="19" fill="#252b52" stroke="#6870ae" stroke-width="2"/><path d="M99 299h88M207 299h76" stroke="#a5fae2" stroke-width="7" stroke-linecap="round"/></svg>`;
  }

  function archiveArt() {
    return `<svg class="scene-art" viewBox="0 0 760 380" role="img" aria-label="Illustrated research room"><defs><linearGradient id="archive" x1="0" x2="1"><stop stop-color="#355e5d"/><stop offset="1" stop-color="#8ba873"/></linearGradient></defs><rect width="760" height="380" rx="20" fill="url(#archive)"/><circle cx="105" cy="79" r="74" fill="#d9dfa9" opacity=".16"/><path d="M0 295h760v85H0z" fill="#284543"/><rect x="70" y="83" width="234" height="177" rx="10" fill="#f7f2e7"/><path d="M100 119h174M100 149h139M100 179h161M100 209h117" stroke="#80968a" stroke-width="10" stroke-linecap="round"/><rect x="440" y="83" width="185" height="163" rx="12" fill="#213b41" stroke="#a5c58c" stroke-width="5"/><circle cx="532" cy="165" r="46" fill="none" stroke="#e5e4ba" stroke-width="10"/><path d="m564 197 42 42" stroke="#e5e4ba" stroke-width="13" stroke-linecap="round"/><path d="M99 296h528" stroke="#e1dcbd" stroke-width="12" stroke-linecap="round" opacity=".7"/></svg>`;
  }

  function makeFallback(puzzle) {
    const slots = [[22, 61], [68, 48], [45, 18], [46, 76], [83, 76], [82, 18]];
    return {
      kind: "archive",
      title: "Research table",
      intro: "Open the objects on the table to gather the information you need.",
      targets: Object.fromEntries(
        puzzle.evidence.map((e, index) => [
          e.id,
          [...slots[index], e.title],
        ]),
      ),
    };
  }

  function create(room, puzzle, seen, onInspect) {
    const mapped = sceneMap[room.id]?.puzzles?.[puzzle.id];
    const scene = mapped
      ? { ...mapped, kind: sceneMap[room.id].kind }
      : makeFallback(puzzle);
    const section = document.createElement("section");
    section.className = `interactive-scene ${scene.kind}`;
    const header = document.createElement("div");
    header.className = "scene-heading";
    const eyebrow = document.createElement("span");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "EXPLORE THE ROOM";
    const title = document.createElement("h3");
    title.textContent = scene.title;
    const prompt = document.createElement("p");
    prompt.textContent = scene.intro;
    header.append(eyebrow, title, prompt);
    const stage = document.createElement("div");
    stage.className = "scene-stage";
    stage.innerHTML = scene.kind === "cyber" ? cyberArt() : scene.kind === "space" ? spaceArt() : archiveArt();
    puzzle.evidence.forEach((e, index) => {
      const target = scene.targets[e.id] || [18 + ((index * 25) % 68), index % 2 ? 48 : 72, e.title];
      const button = document.createElement("button");
      const inspected = seen.includes(e.id);
      button.type = "button";
      button.className = "scene-hotspot" + (inspected ? " inspected" : "") + (puzzle.required.includes(e.id) ? " required" : "");
      button.style.setProperty("--pin-x", `${target[0]}%`);
      button.style.setProperty("--pin-y", `${target[1]}%`);
      button.setAttribute("aria-label", `Open ${target[2]}${inspected ? ", inspected" : ""}`);
      const icon = document.createElement("span");
      icon.className = "scene-hotspot-icon";
      icon.textContent = inspected ? "✓" : "+";
      const label = document.createElement("span");
      label.className = "scene-hotspot-label";
      label.textContent = target[2];
      button.append(icon, label);
      button.onclick = () => onInspect(e);
      stage.append(button);
    });
    const note = document.createElement("p");
    note.className = "scene-instruction";
    note.textContent = "Glowing markers hold the evidence. Required evidence has a purple ring.";
    section.append(header, stage, note);
    return section;
  }

  return { create };
})();
