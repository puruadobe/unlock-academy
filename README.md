# Unlock Academy

A general educational escape-room app. Learners inspect evidence, reason through choices, unlock successive challenges, and leave with a learning debrief. Cybersecurity is the main demonstration; physics uses the same engine. A visual room creator supports any authored topic.

## Run

Requires Node.js 22 or newer.

```sh
npm ci
npm start
```

Open http://127.0.0.1:8788. The app is loopback-only. Open `Unlock-Academy.html` directly for the standalone version: rooms, hints, the room creator, JSON import/export, and learning-note downloads work without a server. The optional TrueForge coach requires the local server.

## Included rooms

- **The Last Transfer**: independently verify a payment change; distinguish a password from an active session; select a containment response. Three locks, fictional messages and logs, progressive hints, and links to background reports.
- **Orbital Rescue**: inertia, F = ma, and energy transformation. Three beginner puzzles using a simplified classical-mechanics model.

The cybersecurity mission is an original teaching scenario, not a reconstruction of a real incident. Its background reading concerns related attack mechanisms. No live targets, credentials, transfers, or account changes are involved.

## Create a room on any topic

Choose **Create a room**, enter the topic, mission, learning objective, and 1–6 locks. Each lock includes two evidence cards, three answer choices, an answer key, an explanation, and a gentle hint. Stronger hints are derived from the authored material. Publishing adds it to this browser's local collection; it does not publish online.

Export rooms as JSON and import them into another browser. Imported rooms are validated for required fields, answer bounds, unique identifiers, evidence references, size, and HTTPS source URLs. User text is rendered as escaped text, not executed as markup. Source lists can be included in imported JSON.

Custom collections are limited to 20 rooms per browser. Progress and custom rooms use localStorage and can be lost if browser data is cleared. Export valuable rooms. Answers are shipped client-side: this is a learning activity, not a tamper-resistant examination. Completion records learning progress, not independently verified mastery.

## AI room creation and learning depth

The studio accepts a topic, audience, learning goal, difficulty, and 3–5 locks. With a configured TrueForge model, an architect agent drafts room JSON using the design guide and reviewer tools. The server validates the result and permits one repair attempt. Actual tool events appear in the run trace. An explicitly authored example is available without a model.

Review evidence, answer keys, progressive hints, and learning objectives before approving a draft for this browser’s collection. The three review acknowledgements cover factual accuracy, answers, and audience suitability; automated checks do not establish factual accuracy. Drafts can be revised or exported. Use **Play-test draft** to try the complete mission before publication. Preview progress stays in memory, restarting affects only the preview, and **Return to draft review** takes you back to the same draft. Unapplied JSON edits must be validated before play-testing.

Cyber puzzles require selecting the evidence supporting an answer. A final transfer question asks learners to apply the lesson in another situation. Learning plans and puzzle objectives give authors a visible teaching structure.

## TrueForge connection

Five real read-only MCP tools are served at `http://127.0.0.1:8788/mcp`:

- `list_rooms`
- `get_learning_context` — evidence and question, without the answer key
- `get_hint` — explicit progressive hint level
- `get_room_design_guide`
- `review_room_draft` — structural and learning-design checks, not factual verification

The connector `unlock-academy` was registered in the local TrueForge instance and tool discovery was verified. At the end of development, TrueForge returned an empty model list, so live model inference was not verified.

1. Keep this app server running.
2. Start TrueForge at http://localhost:8790 and add a model under Settings → Models.
3. Run:

```sh
npm run agent:setup
```

The setup script creates the MCP connector if missing, confirms its tools, and creates the named agent. If exactly one model is configured, it selects that model. If several are configured, specify the exact name:

```sh
TRUEFORGE_MODEL='provider/model-name' npm run agent:setup
```

If the agent already exists, edit it in TrueForge rather than overwriting it through this script. `TRUEFORGE_BASE_URL` and `TRUEFORGE_TOKEN` are optional server-side environment variables for other instances. Never put provider keys in browser code.

Click **Learning coach** in the app. The Node server creates a real TrueForge session and streams responses. The agent is instructed to retrieve the room context before coaching and to offer hints instead of immediately revealing answers. It has no permission to modify game state. Model behavior is not a guaranteed answer-key boundary; the deterministic engine handles grading.

For custom rooms, the current question and evidence are sent as author-supplied context. Questions and this context reach the configured model provider. Avoid personal information and secrets. Session handles last until page reload; session records remain in TrueForge. The app never pretends a disconnected model is running.

This implementation does not execute generated code, create subagents, publish content online, or implement approval-gated writes. It is an educational prototype, not a completed hackathon submission.

## Tests and build

Start the app server first, then:

```sh
npm test
npm run build
```

Twenty-two automated tests cover schema validation, all starter-room solutions, evidence gates, wrong-answer behavior, progress restoration, unsafe imports, answer-key separation, MCP transport, local-origin restrictions, and invalid coach requests. Additional tests cover evidence reasoning, transfer-state persistence, draft review, and generation/repair using mocked model responses. These are not live inference tests. Browser testing covered the cyber mission from beginning to debrief, hint and retry behavior, creating a mathematics room through the UI, and persistence after reload.

## Demo outline

1. Show the room collection and explain that each topic uses the same engine.
2. Enter The Last Transfer. Try answering before inspecting evidence to demonstrate the evidence gate.
3. Open the message and supplier record. Make a wrong choice, read the feedback, and then open the lock.
4. Use the authored hint to explain the second lock. Finish the mission and show the debrief.
5. Show Orbital Rescue to demonstrate another topic.
6. In Create a room, describe the topic-independent fields and export/import flow.
7. If the model is configured, ask the learning coach about a clue and show the actual tools in TrueForge's session trace.

## Files

- `public/rooms.js`: starter content
- `public/engine.js`: subject-independent validation and progression
- `public/app.js`: library, game, authoring UI, persistence, and coach interface
- `core.mjs`: MCP tools and protocol handling
- `server.mjs`: local app server and official TrueForge SDK bridge
- `setup-agent.mjs`: connector and agent registration
- `agent-instructions.txt`: coaching behavior
- `tests/`: validation and integration tests

## Sources and provenance

Cyber background reading:
- https://www.microsoft.com/en-us/security/blog/2024/05/15/threat-actors-misusing-quick-assist-in-social-engineering-attacks-leading-to-ransomware/
- https://blog.cloudflare.com/response-to-salesloft-drift-incident/

TrueForge API and SDK behavior were checked against the official documentation and installed SDK types:
- https://trueforge.dev/api/quickstart
- https://trueforge.dev/create-agent/overview
- https://trueforge.dev/mcp-servers

Built with an AI coding assistant. Human authors should review lesson accuracy before teaching or sharing. No Qodo review or hackathon submission was performed. Check your event's coding-window and review requirements before submitting.
