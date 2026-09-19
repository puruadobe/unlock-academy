import { TrueForge } from "@truefoundry/trueforge-sdk";
import { readFileSync } from "node:fs";
import { ensureRoomTools, selectRoomModel, modelOverride } from "./trueforge-config.mjs";
const tf = new TrueForge({
  baseUrl: process.env.TRUEFORGE_BASE_URL || "http://localhost:8790",
  ...(process.env.TRUEFORGE_TOKEN
    ? { token: process.env.TRUEFORGE_TOKEN }
    : {}),
});
try {
  const tools = await ensureRoomTools(tf);
  console.log("MCP tools:", tools.map(t => t.name).join(", "));
  const model = selectRoomModel((await tf.models.list()).data, modelOverride());
  console.log("Selected model:", model);
  const result = await tf.agents.create({
    name: "unlock-academy",
    description:
      "A Socratic coach for evidence-based learning escape rooms on any topic.",
    manifest: {
      model: { name: model },
      instructions: readFileSync(
        new URL("./agent-instructions.txt", import.meta.url),
        "utf8",
      ),
      mcpServers: [
        {
          name: "unlock-academy",
          enableTools: ["@read-only"],
          preload: true,
        },
      ],
      config: {
        sandbox: { enabled: false },
        generativeUi: { enabled: false },
        askUserQuestions: { enabled: false },
        dynamicSubAgents: { enabled: false },
        iterationLimit: 10,
      },
    },
  });
  console.log("Created agent:", result.data.name);
} catch (e) {
  console.error(
    "Setup failed. Status:",
    e.statusCode || e.message || "connection unavailable",
  );
  if (e.statusCode === 409)
    console.error("Agent already exists; edit it in TrueForge if needed.");
  process.exitCode = 1;
}
