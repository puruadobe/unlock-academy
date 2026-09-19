# Play together: prerequisites and hosting

Multiplayer is an optional cooperative mode. Solo rooms, draft review, and authoring continue to work separately. All participants in a team must use the same running app server. A join code locates a team on that server; it does not connect separate installations.

## What the current version supports

- One host and up to seven other players, using display names and an eight-character join code.
- A lobby with a ready check; the host starts once at least two players are ready.
- Starter rooms and rooms already published to the host browser’s local collection.
- Shared inspected clues, private votes until everyone votes, discussion, revised votes, and server-side answer checks.
- Every player selects the supporting evidence on puzzles that require it.
- Host-controlled hints, progression, seat removal, and session closure.
- A shared final debrief. Team results are not written to solo progress.
- Reconnection after a page reload in the same tab, while the server and session remain alive. Each player’s seat token is kept in sessionStorage, not in the join URL.

Players discuss in person or on their own voice call. There is no built-in chat, audio, competitive scoring, account login, or cross-device saved profile. A host who closes their tab must reopen the same tab/session to recover their seat; there is no host migration yet. A disconnected player can be removed by the host so the remaining team can continue.

## Do we need a database?

**Not for this single-server demo.** Team state lives in a bounded, in-memory store on the Node server. Clients poll once per second. No external database, Redis, WebSocket service, or TrueForge connection is needed to play an already-authored room.

The limits are deliberate:

- Maximum 100 sessions on one server; maximum 8 players per session. These are implementation limits, not load-tested capacity claims.
- Sessions expire after one hour without a successful team action, or four hours from creation. Polling alone does not keep a session alive.
- Restarting, redeploying, or stopping the server loses team sessions.
- Join is allowed only in the lobby. Reloading with an existing seat token can resume an active mission.
- The generated standalone HTML file supports solo play only; multiplayer needs the server.

## Setup choices

| Use case | Shared resource | Database needed now? | Requirements |
| --- | --- | --- | --- |
| Two-tab demo on one computer | One local Node server | No | Node 22+, dependencies, two independent browser tabs |
| Friends on the same Wi-Fi | Host computer and its reachable LAN address | No | Same network, incoming TCP port allowed, no Wi-Fi client isolation |
| Remote internet players | One continuously running HTTPS app instance | No for an ephemeral demo | Public URL, reverse proxy/TLS, runtime support, no automatic scale-out |
| Durable games or multiple instances | Shared session store and persistent records | Yes/shared storage | Redis or equivalent, database, authentication, recovery, deployment and monitoring work |

## 1. Same-computer demo

```sh
npm ci
npm start
```

Open `http://127.0.0.1:8788` in two independently opened tabs (or two browsers). In the first, select **Play together → Host a mission**. In the second, select **Play together → Join your team** and enter the code. Use different display names. Both mark ready; the host starts.

A browser’s **Duplicate tab** action may copy sessionStorage and therefore the same seat. Open a fresh tab and type the URL instead. If a tab is already in a team, use **Leave team** or **End session** before creating another seat.

No provider key is needed. AI room creation remains a separate host-side feature.

## 2. Same-Wi-Fi play

Find the host computer’s LAN IPv4 address in its network settings. Stop the loopback-only server, then start it with that exact origin. For example, replace `192.168.1.50` with your real address:

```sh
TEAM_ORIGIN=http://192.168.1.50:8788 npm start
```

`TEAM_ORIGIN` opts the listener into `0.0.0.0` and allowlists that origin/host. Everyone opens `http://192.168.1.50:8788` and uses **Play together**. `localhost` on a friend’s laptop refers to their laptop, not yours.

Prerequisites:

1. The host computer stays awake and the Node process keeps running.
2. Players can reach the host on the same trusted network; guest Wi-Fi often blocks device-to-device access.
3. The host’s firewall permits incoming TCP 8788 for this app. Do not disable the firewall globally.
4. All players use the exact same URL. A changed LAN address requires restarting with the new `TEAM_ORIGIN`.

This LAN mode uses HTTP; use it only on a trusted network with non-sensitive training content. Do not put names, messages, or lesson material into it that you would not share with the group. Remote clients can play and create team sessions, but the server rejects remote access to the AI authoring, coach, and MCP routes. Keys remain server-side.

## 3. Internet hosting: deployment prerequisites

A static host alone cannot run this multiplayer server. Use a service or VM that runs a long-lived Node process and supports an incoming HTTP port. This project has not been deployed publicly or load-tested yet.

For a small, ephemeral demo:

- Deploy one Node 22+ instance with `npm ci` and `npm start`.
- Set `PORT` to the platform’s internal port and `TEAM_ORIGIN` to the exact public HTTPS origin, for example `https://learn.example.com`.
- Terminate TLS at a reverse proxy and preserve the incoming public `Host` header.
- Keep exactly one instance/worker. Load balancing multiple memory-only instances can send players to different session stores. Sticky routing alone does not provide restart recovery.
- Choose an always-on configuration for the demo. Sleeping instances and deployments erase in-memory games.
- Keep TrueForge and provider credentials off the player-facing deployment if AI authoring is not needed there.
- At the public reverse proxy, expose only static player assets and `/api/teams` routes. Explicitly block `/api/draft`, `/api/coach`, `/api/status`, and `/mcp`. A reverse proxy running on loopback appears local to Node, so the app’s direct remote-address check alone is insufficient to protect those routes behind such a proxy.
- Add edge rate limiting and request-body limits. The app bounds session count, body size, player count, and join/create attempts, but does not implement comprehensive public abuse protection.

Do not port-forward a development laptop as a production deployment. Use a properly configured HTTPS deployment for remote groups. Public hosting and associated billing have not been provisioned by this change.

## 4. What to add for a production multiplayer service

| Area | Next implementation |
| --- | --- |
| Session consistency | Redis with atomic/versioned updates and expiration; events or pub/sub for multiple instances |
| Durable data | PostgreSQL or equivalent for published room versions, accounts, teams, and opted-in learning records |
| Identity | Host authentication, invitation controls, protected seat recovery, and authorization on room access |
| Recovery | Host reassignment, reconnect grace periods, restart recovery, idempotent durable actions |
| Networking | HTTPS everywhere; SSE/WebSockets or efficient polling with a deployment-aware connection strategy |
| Operations | Load tests, metrics, logs without tokens/keys, backups, health checks, and resource budgets |
| Privacy | Defined retention, deletion/export controls, and consent appropriate to the learner group |
| Gameplay | Team application question, roles, optional timer, facilitator view, accessible collaboration tools |

The server grades team actions and rejects stale versions and unauthorized host actions. This is still a learning app, not a secure examination: starter answers also ship with solo assets, and hosts can supply their own room JSON. Join codes and per-seat bearer tokens provide lightweight demo access, not account authentication. No claim of cheating prevention is made.

## Troubleshooting

- **Team not found:** verify the shared server URL and join code; the server may have restarted or the session expired.
- **Same person in two tabs:** the browser copied the seat token; use a fresh independent tab/browser.
- **Start is disabled:** at least two players must join, and all must mark ready.
- **Vote is disabled:** someone must inspect the required clues.
- **Votes differ:** discuss, then update votes. The host checks the decision again.
- **A player is away:** the host can remove the seat. Its token stops working immediately.
- **The team changed:** another action arrived first; wait for the refresh, then retry.
- **Cannot reach from another device:** check `TEAM_ORIGIN`, the LAN IP, port, firewall, and guest-network isolation.
- **AI unavailable but team works:** expected; gameplay does not depend on TrueForge.
