export const ROOM_CONNECTOR = 'unlock-academy';
export const DEFAULT_OPENAI_MODEL = 'openai/gpt-5-4-mini';
const DESIGN_TOOLS = ['get_room_design_guide', 'review_room_draft'];

export function modelOverride(env = process.env) {
  // Accept the common misspelling, while keeping TRUEFORGE_MODEL authoritative.
  return env.TRUEFORGE_MODEL?.trim() || env.TRUEFORGE_MODE?.trim() || undefined;
}

export function selectRoomModel(models, override) {
  const names = [...new Set((Array.isArray(models) ? models : [])
    .map(model => model.name).filter(name => typeof name === 'string' && name))];
  if (!names.length) throw Error('No model configured. Add an OpenAI model in TrueForge Settings → Models.');
  if (override?.trim()) {
    const selected = override.trim();
    if (!names.includes(selected)) {
      throw Error(`The selected model "${selected}" is not configured in TrueForge. Choose one of: ${names.join(', ')}. Clear TRUEFORGE_MODEL / TRUEFORGE_MODE to select OpenAI automatically.`);
    }
    return selected;
  }
  if (names.includes(DEFAULT_OPENAI_MODEL)) return DEFAULT_OPENAI_MODEL;
  const openai = names.filter(name => name.startsWith('openai/')).sort();
  if (openai.length) return openai[0];
  // Preserve single-provider installations and explicit provider overrides.
  if (names.length === 1) return names[0];
  throw Error('No OpenAI model is configured. Add one in TrueForge Settings → Models, or set TRUEFORGE_MODEL to a configured model name.');
}

export function roomToolsUrl(env = process.env) {
  return env.TRUEFORGE_MCP_URL || `http://127.0.0.1:${env.PORT || 8788}/mcp`;
}

export async function ensureRoomTools(tf, url = roomToolsUrl()) {
  let tools;
  try {
    tools = (await tf.mcpServers.listTools(ROOM_CONNECTOR)).data;
  } catch (error) {
    if (error.statusCode !== 404) throw error;
    // Only create a missing registration. Never overwrite an existing connector
    // or treat a provider/authentication failure as permission to reconfigure it.
    try {
      await tf.settings.mcpServers.get(ROOM_CONNECTOR);
      throw Error('The room connector exists but its tools are unavailable. Check its URL in TrueForge and keep the app server running.');
    } catch (lookupError) {
      if (lookupError.statusCode !== 404) throw lookupError;
    }
    try {
      await tf.settings.mcpServers.create({ manifest: {
        name: ROOM_CONNECTOR,
        description: 'Read-only learning context, hints, and room-design validation.',
        type: 'remote',
        url,
      } });
    } catch (createError) {
      // Another concurrent draft may have registered the same connector.
      if (createError.statusCode !== 409) throw createError;
    }
    tools = (await tf.mcpServers.listTools(ROOM_CONNECTOR)).data;
  }
  if (!Array.isArray(tools) || !DESIGN_TOOLS.every(name => tools.some(tool => tool.name === name))) {
    throw Error('The room connector is missing its design or review tool. Check that it points to this app’s /mcp endpoint.');
  }
  return tools;
}
