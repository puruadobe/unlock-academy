import test from 'node:test';
import assert from 'node:assert/strict';
import {selectRoomModel,modelOverride,ensureRoomTools,roomToolsUrl} from '../trueforge-config.mjs';
const models = names => names.map(name => ({name}));
const required = [{name:'get_room_design_guide'},{name:'review_room_draft'}];
const httpError = statusCode => Object.assign(Error(`HTTP ${statusCode}`), {statusCode});

test('multiple configured OpenAI models select the default without an env var', () => {
  const available = models(['openai/gpt-5-5','openai/gpt-5-4-mini','openai/gpt-5-6-sol']);
  assert.equal(selectRoomModel(available),'openai/gpt-5-4-mini');
  assert.equal(selectRoomModel(available.toReversed()),'openai/gpt-5-4-mini');
});
test('automatic fallback only picks a configured OpenAI model, independent of list order', () => {
  const available=models(['other/model','openai/z-model','openai/a-model']);
  assert.equal(selectRoomModel(available),'openai/a-model');
  assert.equal(selectRoomModel(available.toReversed()),'openai/a-model');
  assert.equal(selectRoomModel(models(['other/single'])),'other/single');
});
test('explicit overrides win and nonexistent models fail before starting a turn', () => {
  const available=models(['openai/gpt-5-4-mini','openai/gpt-5-5']);
  assert.equal(selectRoomModel(available,' openai/gpt-5-5 '),'openai/gpt-5-5');
  assert.throws(()=>selectRoomModel(available,'openai/missing'),/not configured/);
  assert.throws(()=>selectRoomModel([]),/No model configured/);
  assert.throws(()=>selectRoomModel(models(['other/a','other/b'])),/No OpenAI model/);
});
test('TRUEFORGE_MODEL takes precedence and TRUEFORGE_MODE remains a supported alias', () => {
  assert.equal(modelOverride({TRUEFORGE_MODEL:' primary ',TRUEFORGE_MODE:'alias'}),'primary');
  assert.equal(modelOverride({TRUEFORGE_MODE:' alias '}),'alias');
  assert.equal(modelOverride({TRUEFORGE_MODEL:' '}),undefined);
  assert.equal(roomToolsUrl({PORT:'9000'}),'http://127.0.0.1:9000/mcp');
  assert.equal(roomToolsUrl({TRUEFORGE_MCP_URL:'https://example.com/mcp'}),'https://example.com/mcp');
});
test('a missing room connector is registered at the app URL before tool discovery', async () => {
  let calls=0, created;
  const tf={mcpServers:{listTools:async()=>{if(++calls===1)throw httpError(404);return {data:required};}},settings:{mcpServers:{get:async()=>{throw httpError(404);},create:async value=>{created=value;}}}};
  assert.deepEqual(await ensureRoomTools(tf,'http://127.0.0.1:9000/mcp'),required);
  assert.equal(created.manifest.url,'http://127.0.0.1:9000/mcp');
  assert.equal(created.manifest.name,'unlock-academy');
});
test('healthy existing connectors are read without configuration changes', async () => {
  const tf={mcpServers:{listTools:async()=>({data:required})}};
  assert.deepEqual(await ensureRoomTools(tf),required);
});
test('authentication and existing-connector failures never create or overwrite a connector', async () => {
  let mutations=0;
  const settings={mcpServers:{get:async()=>({data:{name:'unlock-academy'}}),create:async()=>{mutations++;}}};
  await assert.rejects(()=>ensureRoomTools({settings,mcpServers:{listTools:async()=>{throw httpError(401);}}}),/401/);
  await assert.rejects(()=>ensureRoomTools({settings,mcpServers:{listTools:async()=>{throw httpError(404);}}}),/exists but its tools are unavailable/);
  assert.equal(mutations,0);
});
test('concurrent registration conflicts are tolerated and missing design tools are rejected', async () => {
  let calls=0;
  const tf={mcpServers:{listTools:async()=>{if(++calls===1)throw httpError(404);return {data:required};}},settings:{mcpServers:{get:async()=>{throw httpError(404);},create:async()=>{throw httpError(409);}}}};
  assert.deepEqual(await ensureRoomTools(tf),required);
  await assert.rejects(()=>ensureRoomTools({mcpServers:{listTools:async()=>({data:[]})}}),/missing its design or review tool/);
});
