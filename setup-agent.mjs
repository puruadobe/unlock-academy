import { TrueForge } from "@truefoundry/trueforge-sdk";
import { readFileSync } from "node:fs";
const tf = new TrueForge({
  baseUrl: process.env.TRUEFORGE_BASE_URL || "http://localhost:8790",
  ...(process.env.TRUEFORGE_TOKEN
    ? { token: process.env.TRUEFORGE_TOKEN }
    : {}),
});
try {
  try {
    await tf.settings.mcpServers.get("unlock-academy");
  } catch (e) {
    if (e.statusCode !== 404) throw e;
    await tf.settings.mcpServers.create({
      manifest: {
        name: "unlock-academy",
        description: "Read-only escape-room evidence and learning hints.",
        type: "remote",
        url: "http://127.0.0.1:8788/mcp",
      },
    });
  }
  console.log(
    "MCP tools:",
    (await tf.mcpServers.listTools("unlock-academy")).data
      .map((t) => t.name)
      .join(", "),
  );
  const models = (await tf.models.list()).data;
  let model = process.env.TRUEFORGE_MODEL;
  if (!model && models.length === 1) model = models[0].name;
  if (!model) {
    console.log(
      models.length
        ? "Set TRUEFORGE_MODEL to one of your configured model names, then rerun."
        : "Connector is ready. Add a model in TrueForge Settings → Models, then rerun npm run agent:setup.",
    );
    if (models.length) console.log(models.map((m) => m.name).join("\n"));
    process.exitCode = 2;
  } else {
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
  }
} catch (e) {
  console.error(
    "Setup failed. Status:",
    e.statusCode || "connection unavailable",
  );
  if (e.statusCode === 409)
    console.error("Agent already exists; edit it in TrueForge if needed.");
  process.exitCode = 1;
}
