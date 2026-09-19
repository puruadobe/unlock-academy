import { shuffled, missionSeed } from './section-presentation.mjs';

// Six tested floor plans are shuffled without replacement for each mission.
const layouts = [
  [[-3.5, 0, .35], [3.5, 1, -.4], [-3.6, 3.7, .25], [3.6, 4.1, -.25], [-3.8, -2.5, .25], [3.8, -2.5, -.25]],
  [[-3.6, -1.8, .5], [3.6, 1.5, -.5], [-3.6, 3.6, .25], [3.6, -1.3, -.35], [-3.6, .8, .25], [3.6, 4.6, -.25]],
  [[-3.5, 2.6, .6], [3.5, -1.7, -.5], [3.5, 3.5, -.4], [-3.6, -2.2, .35], [-3.6, .2, .3], [3.6, .9, -.35]],
  [[-3.5, -2, .2], [3.5, -.2, -.2], [-3.5, 2.8, .5], [3.5, 4.3, -.5], [-3.5, .4, .3], [3.5, -2.7, -.3]],
  [[3.6, 2.8, -.4], [-3.6, 1, .4], [3.6, -2.2, -.3], [-3.6, -1.7, .3], [3.6, .3, -.4], [-3.6, 3.6, .4]],
  [[-3.5, 3.9, .6], [3.5, 3.9, -.6], [-3.5, -1.7, .35], [3.5, -1.7, -.35], [-3.5, .9, .4], [3.5, .9, -.4]],
];
const settings = {
  office: { title:'The verification office', subtitle:'Trace the request through the records.', accent:0xffd49a, wall:0x635145, panel:0x8b7058, floor:0x302c2a, sky:0x172738, light:0xffe2bb, ceiling:4.5, station:'desk', landmark:'records' },
  servers: { title:'The identity vault', subtitle:'Follow the activity inside the network.', accent:0x85cfff, wall:0x1e304d, panel:0x2c4567, floor:0x142136, sky:0x091527, light:0x99c6ff, ceiling:5.2, station:'rack', landmark:'network' },
  command: { title:'The response center', subtitle:'Bring the evidence together. Choose your response.', accent:0xffb9a5, wall:0x503346, panel:0x6f4b5b, floor:0x281e2b, sky:0x1c152b, light:0xffc4b3, ceiling:5.8, station:'console', landmark:'command' },
  bridge: { title:'The observation deck', subtitle:'Read the flight records beneath the stars.', accent:0x94dcff, wall:0x314a64, panel:0x526b85, floor:0x172838, sky:0x050d20, light:0xb8dfff, ceiling:5.5, station:'console', landmark:'orrery' },
  engine: { title:'The propulsion bay', subtitle:'Explore the machinery that changes motion.', accent:0xffd18b, wall:0x615343, panel:0x8e7959, floor:0x342c23, sky:0x201b18, light:0xffd5a0, ceiling:5.8, station:'bench', landmark:'engine' },
  workshop: { title:'The energy workshop', subtitle:'Inspect the experiment and follow the evidence.', accent:0x9cebd8, wall:0x315654, panel:0x517c77, floor:0x192e31, sky:0x0c252d, light:0xc4ffe9, ceiling:4.4, station:'bench', landmark:'flywheel' },
  garden: { title:'The observation garden', subtitle:'A new setting. A new question to explore.', accent:0xc6ed9d, wall:0x45604c, panel:0x71966f, floor:0x343e30, sky:0x4b7180, light:0xffefc5, ceiling:5.8, station:'plinth', landmark:'garden' },
  archive: { title:'The pattern archive', subtitle:'Search the collection for useful connections.', accent:0xffd6a3, wall:0x65503e, panel:0x967957, floor:0x37291f, sky:0x30263a, light:0xffdda5, ceiling:5.2, station:'desk', landmark:'archive' },
  vault: { title:'The evidence chamber', subtitle:'Look closely. Decide which clues belong together.', accent:0xd5bdff, wall:0x473760, panel:0x6c558c, floor:0x261e36, sky:0x181327, light:0xd4c2ff, ceiling:5.7, station:'plinth', landmark:'crystal' },
  lookout: { title:'The discovery lookout', subtitle:'Find a fresh perspective on the problem.', accent:0xade3ff, wall:0x365563, panel:0x567d8e, floor:0x223c43, sky:0x3f617f, light:0xd6efff, ceiling:5.6, station:'console', landmark:'orrery' },
  hall: { title:'The synthesis hall', subtitle:'Use what you have learned to finish the journey.', accent:0xffdda2, wall:0x615147, panel:0x927b62, floor:0x39312a, sky:0x282737, light:0xffe4bd, ceiling:6, station:'plinth', landmark:'sculpture' },
};
// Match the current learning task before falling back to the overall subject.
// Do not inspect answers, feedback or hints: scenery must not reveal the solution.
const subjects = [
  { id:'command', kind:'cyber', terms:/\b(containment|incident response|response package|security teams?|revoke|revocation)\b/gi },
  { id:'servers', kind:'cyber', terms:/\b(passwords?|sessions?|authentication|identity|network|account events|audit logs?)\b/gi },
  { id:'office', kind:'cyber', terms:/\b(phishing|verification|verify|supplier|payment|email|cybersecurity|cyber security)\b/gi },
  { id:'workshop', kind:'space', terms:/\b(energy|kinetic|thermal|friction|brak(?:e|es|ing)|heat)\b/gi },
  { id:'engine', kind:'space', terms:/\b(acceleration|thrusters?|propulsion|mass|newton'?s second|force magnitude)\b/gi },
  { id:'bridge', kind:'space', terms:/\b(velocity|coasting|orbit(?:al)?|spacecraft|astronomy|planets?|motion|inertia|space|physics)\b/gi },
  { id:'geometry', kind:'archive', terms:/\b(geometry|shapes?|triangles?|circles?|angles?|symmetry|perimeter|area|fractions?)\b/gi },
  { id:'counting', kind:'archive', terms:/\b(math(?:s|ematics)?|arithmetic|count(?:ing)?|subtra?ction|subtract(?:ing)?|addition|adding|numbers?|multiplication|division)\b/gi },
  { id:'biology', kind:'archive', terms:/\b(biology|cells?|organisms?|dna|ecosystems?|habitats?|photosynthesis|plants?|botany|nature|animals?|leaves|garden)\b/gi },
  { id:'chemistry', kind:'archive', terms:/\b(chemistry|molecules?|atoms?|chemical|reactions?|elements?|acids?|alkali|periodic)\b/gi },
  { id:'history', kind:'archive', terms:/\b(history|historical|ancient|civilizations?|arte?facts?|archaeology|empire|century|timeline)\b/gi },
  { id:'library', kind:'archive', terms:/\b(literature|poetry|poems?|metaphors?|grammar|vocabulary|language|sentences?|narrator|novel|reading)\b/gi },
];
Object.assign(settings, {
  counting:{...settings.hall, title:'The number studio', landmark:'counting', station:'bench'},
  geometry:{...settings.vault, title:'The shape gallery', landmark:'geometry'},
  biology:{...settings.garden, title:'The living laboratory', landmark:'biology'},
  chemistry:{...settings.workshop, title:'The molecule lab', landmark:'chemistry'},
  history:{...settings.archive, title:'The history collection', landmark:'history'},
  library:{...settings.archive, title:'The reading room', landmark:'archive'},
});
export function subjectFor(room, puzzle = {}) {
  const focus = [puzzle.title, puzzle.question, puzzle.objective].filter(Boolean).join(' ');
  const context = [puzzle.story, ...(puzzle.evidence || []).map(e => e.title + ' ' + e.body)].filter(Boolean).join(' ');
  const general = [room.topic, room.title, room.description].filter(Boolean).join(' ');
  const matches = (text, terms) => (text.match(terms) || []).length;
  const ranked = subjects.map(subject => ({...subject,
    score: matches(focus, subject.terms) * 10 + Math.min(6, matches(context, subject.terms)) + Math.min(3, matches(general, subject.terms)),
  })).sort((a,b) => b.score - a.score);
  return ranked[0].score ? ranked[0] : { id:'archive', kind:'archive' };
}
const palette = id => Object.fromEntries(['accent','wall','panel','floor','sky','light','ceiling'].map(key=>[key,settings[id][key]]));
function storyDetail(puzzle, id, slot) {
  const story=[puzzle.title,puzzle.question,puzzle.story].filter(Boolean).join(' ');
  if(id==='counting') {
    if(/\blanterns?\b/i.test(story))return {motif:'lantern',title:'The lantern courtyard',station:'plinth'};
    if(/\b(carrots?|bunnies|basket)\b/i.test(story))return {...palette('garden'),motif:'harvest',title:'The counting garden',station:'bench'};
    if(/\b(bridge|stepping stones?)\b/i.test(story))return {...palette('lookout'),motif:'bridge',title:'The number bridge',station:'plinth'};
    return {motif:['abacus','groups','blocks'][slot%3],title:['The number studio','The counting workshop','The number gallery'][slot%3]};
  }
  return {};
}
// Separate from evidence desks, clear of the hatch and central landmark.
const terminals = [[1.8,-3.5,0],[-1.8,-3.5,0],[1.6,5.4,0],[-1.6,5.4,0],[1.6,3,0],[-1.6,3,0]];
export function environmentFor(room, index, seed = 0) {
  const slot = Math.max(0, index) % layouts.length;
  const puzzle = room.puzzles?.[index] || {};
  const { id, kind } = subjectFor(room, puzzle);
  const key = missionSeed(room, seed);
  const layoutIndex = shuffled([0,1,2,3,4,5], key + '/layouts')[slot];
  const positions = shuffled(layouts[layoutIndex], key + '/' + slot + '/stations').map(p => [...p]);
  const terminal = [...shuffled(terminals, key + '/terminals')[slot]];
  const detail = storyDetail(puzzle, id, slot);
  const title = detail.title || settings[id].title;
  return { ...settings[id], ...detail, id, kind, layoutIndex, positions, terminal, variant:slot,
    title, subtitle:puzzle.objective || puzzle.title || 'Explore the evidence for this question.',
    plaque:[title.toUpperCase(), puzzle.title || room.topic || 'FIELD RESEARCH'],
    focus:puzzle.question || room.topic || 'Explore the evidence',
    color:'#'+(detail.accent ?? settings[id].accent).toString(16).padStart(6,'0'),
    obstacle:{x:0,z:-.7,w:2.1,d:2.1} };
}
export function terminalCollider([x,z]) { return {x,z,w:1,d:.65}; }
export function stationCollider([x,z,rotation]) {
  // Conservatively enclose the rotated workstation, rather than letting the
  // player clip its corners when layouts turn desks toward the entry.
  const c=Math.abs(Math.cos(rotation)), s=Math.abs(Math.sin(rotation));
  return {x,z,w:2*c+1.05*s,d:2*s+1.05*c};
}
