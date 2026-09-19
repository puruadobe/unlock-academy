import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { rooms } from '../core.mjs';
const context = vm.createContext({});
vm.runInContext(await readFile(new URL('../public/evidence-visuals.js', import.meta.url), 'utf8'), context);
const visuals = vm.runInContext('EvidenceVisuals', context);
test('all starter evidence has an illustration, accessible description, and caption', () => {
  for (const room of rooms) for (const puzzle of room.puzzles) for (const evidence of puzzle.evidence) {
    const v = visuals.create(room, puzzle, evidence);
    assert.ok(v.svg.startsWith('<svg'));
    assert.ok(v.svg.includes('</svg>'));
    assert.ok(v.alt.includes(evidence.title));
    assert.ok(v.caption.length > 20);
    assert.ok(!v.svg.includes('https://'));
  }
});
test('mass and force diagrams display the actual source measurement', () => {
  const room = rooms.find(r => r.id === 'orbital-rescue');
  const puzzle = room.puzzles.find(p => p.id === 'force');
  const mass = {...puzzle.evidence[0], body:'Total mass: 1,250 kg'};
  const force = {...puzzle.evidence[1], body:'Net force: 2,500 N\nUse F = m × a.'};
  assert.ok(visuals.create(room,puzzle,mass).svg.includes('1,250 kg'));
  assert.ok(visuals.create(room,puzzle,force).svg.includes('2,500 N'));
});
test('imported room labels cannot inject markup into an evidence image', () => {
  const evidence = {id:'custom',type:'<script>bad()</script>',title:'</title><script>bad()</script>',body:'<img onerror="bad()">'};
  const v = visuals.create({id:'custom-room'}, {}, evidence);
  assert.ok(!v.svg.includes('<script>'));
  assert.ok(v.svg.includes('&lt;script&gt;'));
  assert.ok(v.caption.includes('source below'));
});
