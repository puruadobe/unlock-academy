import * as THREE from 'three';
import { movePlayer } from './movement.mjs';
import { sectionOrder } from './section-presentation.mjs';
import { environmentFor, stationCollider, terminalCollider } from './room-environments.mjs';
import { buildScenery } from './environment-scenery.mjs';
import { createRoomMusic } from './room-music.mjs';

// A single live renderer owns the room. It is reused when evidence changes and
// disposed when the learner leaves or advances, including GPU resources.
let active = null;
const music = createRoomMusic();
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const themes = {
  cyber: { accent: 0x72f4ce, secondary: 0xffb66f, title: 'NORTHSTAR / INVESTIGATION UNIT', zone: 'The verification lab', color: '#72f4ce' },
  space: { accent: 0x7eceff, secondary: 0xffb66f, title: 'ODYSSEY / ORBITAL STATION', zone: 'The flight deck', color: '#7eceff' },
  archive: { accent: 0xc3e798, secondary: 0xffc18a, title: 'ACADEMY / FIELD RESEARCH', zone: 'The discovery lab', color: '#c3e798' },
};
function el(tag, cls, text) {
  const n = document.createElement(tag);
  n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
function button(text, cls, action) {
  const n = el('button', cls, text); n.type = 'button'; n.onclick = action; return n;
}
function musicControls(environment) {
  const root=el('div','game-music'); root.setAttribute('role','group');root.setAttribute('aria-label','Background music');
  const toggle=button('♫ Play music','game-action',()=>music.toggle());
  const track=el('span','game-music-track');
  const volumeLabel=el('label','game-music-volume','Volume');
  const volume=el('input','');volume.type='range';volume.min='0';volume.max='100';volume.step='5';volume.setAttribute('aria-label','Music volume');
  volume.oninput=()=>music.setVolume(Number(volume.value)/100);
  volumeLabel.append(volume);root.append(toggle,track,volumeLabel);
  const unsubscribe=music.subscribe(status=>{
    toggle.textContent=status.unavailable?'Music unavailable':status.playing?'♫ Music on':status.enabled?'♫ Play music':'♫ Music off';
    toggle.setAttribute('aria-label',status.playing?'Mute background music':'Play background music');
    toggle.setAttribute('aria-pressed',String(status.playing));toggle.disabled=status.unavailable;
    track.textContent=status.profile;volume.value=String(Math.round(status.volume*100));
    volume.setAttribute('aria-valuetext',Math.round(status.volume*100)+' percent');
  });
  const visibility=()=>music.setHidden(document.hidden);
  const duck=()=>music.setDucked(!!document.querySelector('dialog[open]'));
  const dialogs=new MutationObserver(duck);
  document.querySelectorAll('dialog').forEach(dialog=>dialogs.observe(dialog,{attributes:true,attributeFilter:['open']}));
  document.addEventListener('visibilitychange',visibility);
  visibility();duck();music.enter(environment);
  return {root,dispose(){unsubscribe();dialogs.disconnect();document.removeEventListener('visibilitychange',visibility);}};
}
function create(room, puzzle, seen, onInspect, options = {}) {
  if (active?.room === room && active.puzzle === puzzle && active.seed === options.seed) {
    active.update(seen, options); return active.root;
  }
  const wasExpanded = active?.root.classList.contains('expanded');
  dispose(false);
  const index = room.puzzles.indexOf(puzzle);
  const environment = environmentFor(room, index, options.seed);
  const nextEnvironment = index + 1 < room.puzzles.length ? environmentFor(room, index + 1, options.seed) : null;
  const kind = environment.kind;
  const evidence = sectionOrder(room, puzzle, options.seed).evidence;
  const theme = { ...themes[kind], accent:environment.accent, color:environment.color };
  const root = el('section', 'game-room');
  root.style.setProperty('--game-accent', theme.color);
  root.dataset.environment = environment.id;
  root.dataset.layout = String(environment.layoutIndex);
  if (wasExpanded) { root.classList.add('expanded'); document.body.classList.add('game-expanded'); }
  root.setAttribute('aria-label', 'Interactive 3D puzzle room');
  const bar = el('div', 'game-bar');
  const identity = el('div', 'game-identity');
  identity.append(el('span', 'game-live-dot'), el('span', '', environment.title.toUpperCase()));
  const actions = el('div', 'game-actions');
  const stage = el('div', 'game-viewport');
  const viewport = el('div', 'game-canvas');
  const hud = el('div', 'game-hud');
  const mission = el('div', 'game-objective');
  const missionNumber = el('span', 'game-overline', `SECTOR ${String(room.puzzles.indexOf(puzzle) + 1).padStart(2, '0')} / ${String(room.puzzles.length).padStart(2, '0')}`);
  const title = el('h3', '', environment.title);
  const objective = el('p', '', environment.subtitle);
  mission.append(missionNumber, title, objective);
  const progress = el('div', 'game-progress');
  const count = el('strong', '', '');
  progress.append(el('span', 'game-overline', 'EVIDENCE RECOVERED'), count);
  hud.append(mission, progress);
  const crosshair = el('div', 'game-crosshair', '+'); crosshair.setAttribute('aria-hidden', 'true');
  const prompt = el('div', 'game-target-prompt', 'Drag to look around · Click a glowing object to inspect');
  const toast = el('div', 'game-toast'); toast.setAttribute('role', 'status');
  const map = el('div', 'game-minimap');
  map.setAttribute('aria-hidden', 'true');
  map.append(el('span', 'map-label', 'ROOM SCANNER'), el('div', 'map-exit'));
  const mapPlayer = el('i', 'map-player'); map.append(mapPlayer);
  const markers = el('div', 'game-markers');
  const footer = el('div', 'game-controls');
  const keysText = el('div', 'game-key-guide');
  keysText.innerHTML = '<span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</span><span><kbd>↔</kbd> Drag to look</span><span><kbd>E</kbd> Interact</span>';
  const terminalButton = button('◇ Decision terminal', 'game-terminal-button', () => options.onTerminal?.());
  const inventory = el('div', 'game-inventory');
  inventory.setAttribute('aria-label', 'Evidence inventory');
  footer.append(keysText, terminalButton);
  stage.append(viewport, hud, markers, crosshair, prompt, toast, map);
  const sound = musicControls(environment);
  root.append(bar, sound.root, stage, footer, inventory);
  const arrival = el('div', 'game-arrival');
  arrival.setAttribute('role', 'status');
  arrival.append(el('span','game-overline',`ENTERING SECTOR ${String(index+1).padStart(2,'0')}`),el('strong','',environment.title),el('span','',puzzle.title));
  const dismissArrival = () => {
    if (arrival.contains(document.activeElement)) viewport.querySelector('canvas')?.focus({preventScroll:true});
    arrival.remove();
  };
  arrival.append(button('Start exploring →','game-action',dismissArrival));
  stage.append(arrival);
  let arrivalTimer = setTimeout(dismissArrival, reduceMotion ? 1200 : 2800);
  const destination = el('span','game-destination',nextEnvironment ? `NEXT / ${nextEnvironment.title}` : 'NEXT / Mission debrief');
  inventory.after(destination);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch {
    clearTimeout(arrivalTimer);
    stage.replaceChildren(el('div', 'game-fallback', '3D rendering is unavailable in this browser. You can still inspect every clue below and use the decision terminal.'));
    const update = (ids, next) => { options = next; count.textContent = `${ids.length} / ${puzzle.evidence.length}`; };
    evidence.forEach(e => inventory.append(button(e.title, 'game-item', () => onInspect(e))));
    bar.append(identity);
    active = { root, room, puzzle, seed:options.seed, update, dispose() { sound.dispose(); document.body.classList.remove('game-expanded'); } }; update(seen, options); return root;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(environment.sky);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  viewport.append(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '3D room. Use W A S D or arrow keys to move, drag to look, E to inspect. Evidence buttons below provide a keyboard alternative.');
  const world = new THREE.Scene();
  world.background = new THREE.Color(environment.sky);
  world.fog = new THREE.Fog(environment.sky, 18, 48);
  const camera = new THREE.PerspectiveCamera(65, 1, 0.05, 90);
  camera.position.set(0, 1.85, 6.2);
  const player = new THREE.Vector3(0, 1.85, 6.2);
  let yaw = 0, pitch = -0.03, overview = false, dead = false, solved = !!options.solved;
  let frame = 0, lastTime = 0, doorAmount = 0, hover = null, pointerDown = null, lastPointer = null;
  const keys = new Set(), colliders = [], targets = [], meshes = [], textures = [], materials = [];
  const events = new AbortController();
  const on = (target, type, fn, opts = {}) => target.addEventListener(type, fn, { ...opts, signal: events.signal });
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(0, 0);
  const projected = new THREE.Vector3();
  let pointerInside = false;
  function mat(color, roughness = .65, metalness = .25, emissive = 0) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: .6 }); materials.push(m); return m;
  }
  const wallMat = mat(environment.wall), panelMat = mat(environment.panel), floorMat = mat(environment.floor, .75), black = mat(0x0b171e), edge = mat(0x435760, .4, .7);
  const glow = mat(theme.accent, .25, .2, theme.accent), warmGlow = mat(theme.secondary, .3, .2, theme.secondary);
  const white = mat(0xb8cbd1, .4, .65);
  function box(w, h, d, material, x, y, z, parent = world) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(radius, h, material, x, y, z, parent = world) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, h, 24), material);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function textSurface(lines, width = 2, height = 1, tint = theme.color) {
    const c = document.createElement('canvas'); c.width = 768; c.height = Math.round(768 * height / width);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#09171e'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#18343d'; ctx.lineWidth = 1;
    for (let y = 0; y < c.height; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(768, y); ctx.stroke(); }
    ctx.fillStyle = tint; ctx.fillRect(30, 24, 9, 28);
    let y = 45;
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? tint : '#a4bbc2';
      ctx.font = `${i === 0 ? 'bold 27' : '21'}px monospace`;
      const words = line.split(' '); let chunk = '';
      for (const word of words) {
        if (ctx.measureText(chunk + word).width > 680) { ctx.fillText(chunk, 55, y); y += 30; chunk = ''; }
        chunk += word + ' ';
      }
      ctx.fillText(chunk, 55, y); y += i === 0 ? 58 : 36;
    });
    ctx.fillStyle = tint;
    for (let i = 0; i < 25; i++) ctx.fillRect(55 + i * 12, c.height - 28, 5, 9 + (i % 4) * 2);
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const m = new THREE.MeshBasicMaterial({ map: texture }); materials.push(m);
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height), m);
  }
  world.add(new THREE.HemisphereLight(environment.light, environment.floor, 2.3));
  const keyLight = new THREE.DirectionalLight(environment.light, 3.3); keyLight.position.set(1, 7, 4); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024); keyLight.shadow.camera.left = -9; keyLight.shadow.camera.right = 9;
  keyLight.shadow.camera.top = 9; keyLight.shadow.camera.bottom = -9; keyLight.shadow.normalBias = .04; world.add(keyLight);
  for (const x of [-4, 4]) { const light = new THREE.PointLight(theme.accent, 20, 10, 2); light.position.set(x, 2.8, -2); world.add(light); }
  const orangeLight = new THREE.PointLight(theme.secondary, 15, 8, 2); orangeLight.position.set(0, 3, -4); world.add(orangeLight);
  // Architectural shell, tiled floor and suspended light rails.
  box(12.5, .25, 13, floorMat, 0, -.15, 1);
  const roofHeight = environment.ceiling;
  const ceiling = box(12.4, .16, 13, wallMat, 0, roofHeight, 1);
  if (['garden','bridge','lookout'].includes(environment.id)) { ceiling.material = mat(environment.sky,.9,0); }
  const ceilingDetails = new THREE.Group(); world.add(ceilingDetails);
  for (let z = -3; z <= 5; z += 4) {
    box(2.8, .1, 1.4, black, 0, roofHeight-.16, z, ceilingDetails);
    for (let i = 0; i < 9; i++) box(2.5, .08, .04, edge, 0, roofHeight-.23, z - .55 + i * .14, ceilingDetails);
  }
  const naturalFloor = ['office','archive','garden','hall','counting','history','library','biology'].includes(environment.id);
  for (let x = -6; x <= 6; x += naturalFloor ? .5 : 1.5) box(.015, .008, 13, edge, x, -.018, 1);
  for (let z = -5; z <= 7; z += naturalFloor ? 3 : 1.5) box(12, .008, .012, edge, 0, -.018, z);
  box(4.9, roofHeight, .25, wallMat, -3.65, roofHeight/2, -5);
  box(4.9, roofHeight, .25, wallMat, 3.65, roofHeight/2, -5);
  box(2.5, roofHeight-3.55, .25, wallMat, 0, (roofHeight+3.55)/2, -5);
  box(.2, roofHeight, 12.2, wallMat, -6.1, roofHeight/2, 1);
  box(.2, roofHeight, 12.2, wallMat, 6.1, roofHeight/2, 1);
  for (const x of [-5.94, 5.94]) {
    for (let z = -4.8; z < 7; z += 2) { box(.1, 3.8, .09, edge, x, 2, z); box(.11, .05, 1.4, glow, x, .3, z + .8); }
  }
  for (const x of [-4.2, 4.2]) {
    box(.12, .15, 9.2, black, x, roofHeight-.35, .1, ceilingDetails);
    box(.05, .035, 8.6, glow, x, roofHeight-.46, .1, ceilingDetails);
    box(.04, .02, 10.7, glow, x, .015, .55);
  }
  for (const z of [-4.7, 0, 4.5]) box(12, .22, .17, edge, 0, roofHeight-.15, z, ceilingDetails);
  // Back hatch; the panels physically slide when the actual puzzle is solved.
  box(2.7, 3.6, .5, black, 0, 1.8, -5.02);
  box(2.32, 3.1, .06, mat(0x041c20), 0, 1.55, -4.72);
  const leftDoor = box(1.08, 3.1, .2, panelMat, -.55, 1.55, -4.55);
  const rightDoor = box(1.08, 3.1, .2, panelMat, .55, 1.55, -4.55);
  box(.045, 2.8, .035, warmGlow, .49, 0, .12, leftDoor);
  box(.045, 2.8, .035, warmGlow, -.49, 0, .12, rightDoor);
  for (const x of [-1.3, 1.3]) box(.07, 3.45, .07, glow, x, 1.78, -4.68);
  const doorLabel = textSurface([kind === 'space' ? 'AIRLOCK / EXIT' : 'NEXT SECTION / EXIT', 'SOLVE TO RELEASE'], 2.1, .6, '#ffb66f'); doorLabel.position.set(0, 3.53, -4.68); world.add(doorLabel);
  for (let z = -3.8; z < 4; z += 1.15) { const chevron = box(.3, .015, .05, warmGlow, 0, .005, z); chevron.rotation.y = -.6; }
  // Scenic window, with geometry outside instead of a flat background image.
  box(3.1, 2.2, .13, black, 3.75, 2.45, -4.8);
  box(2.85, 1.95, .02, mat(0x071723, .15, .5), 3.75, 2.45, -4.71);
  if (kind === 'space') {
    const planet = new THREE.Mesh(new THREE.SphereGeometry(.72, 40, 32), mat(0x639eae, .85));
    planet.position.set(3.9, 2.65, -4.57); planet.scale.z = .35; world.add(planet);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.9, .02, 6, 70), warmGlow); ring.position.copy(planet.position); ring.rotation.x = 1; ring.rotation.z = -.35; world.add(ring);
    for (let i = 0; i < 28; i++) { const star = box(.018, .018, .015, white, 2.5 + ((i * 37) % 100) / 40, 1.6 + ((i * 61) % 100) / 57, -4.65); star.castShadow = false; }
  } else if (kind === 'cyber') {
    for (let i = 0; i < 11; i++) {
      const h = .25 + ((i * 19) % 10) * .13;
      box(.18, h, .05, panelMat, 2.48 + i * .25, 1.49 + h / 2, -4.64);
      for (let j = 0; j < h * 6; j++) box(.045, .03, .018, j % 2 ? glow : warmGlow, 2.48 + i * .25, 1.54 + j * .15, -4.60);
    }
  }
  if (kind === 'archive') {
    const task = textSurface(['CURRENT QUESTION', environment.focus], 2.8, 1.85);
    task.position.set(3.75, 2.45, -4.57); world.add(task);
  }
  box(3, .035, .04, glow, 3.75, 1.4, -4.58);
  const movingScenery = buildScenery({ THREE, world, env:environment, box, cylinder, mat, textSurface, glow, warmGlow, white, black, edge, panelMat, roof:ceilingDetails, colliders });
  // Evidence positions and furniture shapes follow the current environment.
  const positions = environment.positions;
  function targetFor(group, anchor, label, action, evidence) {
    const target = { group, anchor, label, action, evidence };
    group.traverse(child => { if (child.isMesh) { child.userData.target = target; meshes.push(child); } });
    const pin = button('', 'game-pin', () => activate(target)); pin.setAttribute('aria-label', label);
    const number = el('span', 'game-pin-number', evidence ? String(puzzle.evidence.indexOf(evidence) + 1).padStart(2, '0') : '◇');
    const pinText = el('span', 'game-pin-text', label); pin.append(number, pinText); markers.append(pin);
    target.pin = pin; target.number = number; targets.push(target); return target;
  }
  evidence.forEach((e, i) => {
    const p = positions[i % positions.length];
    const group = new THREE.Group(); group.position.set(p[0], 0, p[1]); group.rotation.y = p[2]; world.add(group);
    const station = environment.station;
    let screenY=1.72;
    if (station === 'rack') {
      box(1.8,2.5,.8,black,0,1.25,0,group);
      for(let j=0;j<4;j++){box(1.55,.15,.05,edge,0,.3+j*.25,.44,group);box(.4,.025,.02,glow,-.35,.3+j*.25,.48,group);}
      screenY=1.85;
    } else if (station === 'plinth') {
      cylinder(.64,1.12,panelMat,0,.56,0,group);
      cylinder(.75,.08,edge,0,1.15,0,group);
      box(.22,.5,.2,edge,0,1.42,-.1,group);
      screenY=1.9;
    } else {
      box(2,.12,1.05,station === 'desk' ? panelMat : edge,0,1,0,group);
      for(const x of [-.8,.8])box(.15,1,.7,black,x,.5,0,group);
      if(station === 'bench') {
        box(1.5,.28,.65,panelMat,0,.55,0,group);
        cylinder(.13,.32,warmGlow,.76,1.22,.1,group);
      } else if(station === 'console') {
        box(1.85,.3,.7,panelMat,0,1.1,0,group);
        for(let j=0;j<5;j++)box(.14,.04,.14,j%2?glow:warmGlow,-.55+j*.25,1.27,.3,group);
      } else {
        for(let j=0;j<3;j++)box(.4,.035,.45,white,.65,1.1+j*.04,.2,group);
      }
      box(.26,.3,.25,edge,0,1.2,-.12,group);
      box(.88,.04,.27,black,-.25,1.09,.24,group);
    }
    const screenZ = station === 'rack' ? .48 : -.12;
    box(1.5,.95,.12,black,0,screenY,screenZ-.07,group);
    const screen = textSurface(['0'+(puzzle.evidence.indexOf(e)+1)+' / '+(e.type || 'EVIDENCE'),e.title,'SELECT TO INVESTIGATE'],1.38,.82);
    screen.position.set(0,screenY+.01,screenZ); group.add(screen);
    colliders.push(stationCollider(p));
    group.updateMatrixWorld(true);
    const anchor = new THREE.Vector3(0, 2.4, -.15); group.localToWorld(anchor);
    const target = targetFor(group, anchor, e.title, () => onInspect(e), e);
    target.inventory = button('', 'game-item', () => activate(target)); inventory.append(target.inventory);
    const mapDot = el('i', 'map-clue'); mapDot.style.left = `${50 + p[0] * 6.5}%`; mapDot.style.top = `${14 + (p[1] + 5) * 6}%`; map.append(mapDot); target.mapDot = mapDot;
  });
  // A different answer-terminal position for every section.
  const [terminalX, terminalZ] = environment.terminal;
  const terminal = new THREE.Group(); terminal.position.set(terminalX, 0, terminalZ); world.add(terminal);
  box(.48, 1.15, .48, edge, 0, .575, 0, terminal);
  const screenCase = box(.9, .65, .12, black, 0, 1.43, 0, terminal); screenCase.rotation.x = -.15;
  const terminalScreen = textSurface(['DECISION', 'AUTHORIZE EXIT'], .8, .52, '#ffb66f'); terminalScreen.position.set(0, 1.45, .09); terminalScreen.rotation.x = -.15; terminal.add(terminalScreen);
  const terminalTarget = targetFor(terminal, new THREE.Vector3(terminalX, 2.1, terminalZ), 'Decision terminal', () => options.onTerminal?.());
  const doorTarget = { group: leftDoor, anchor: new THREE.Vector3(0, 1.6, -4.5), label: 'Exit hatch', action() { if (solved) options.onExit?.(); else options.onTerminal?.(); } };
  leftDoor.userData.target = rightDoor.userData.target = doorTarget; meshes.push(leftDoor, rightDoor);
  const exitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  materials.push(exitMaterial);
  const exitTrigger = box(2.1, 3, .03, exitMaterial, 0, 1.5, -4.35);
  exitTrigger.userData.target = doorTarget; meshes.push(exitTrigger);
  colliders.push(terminalCollider(environment.terminal));
  const terminalDot = el('i', 'map-clue'); terminalDot.style.background = '#ffb66f';
  terminalDot.style.left = `${50+terminalX*6.5}%`; terminalDot.style.top = `${14+(terminalZ+5)*6}%`; map.append(terminalDot);
  const clueSummary = el('span', 'game-inventory-label', 'FIELD NOTES'); inventory.prepend(clueSummary);
  let toastTimer, departureTimer, departing = false;
  function notify(message) { toast.textContent = message; toast.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 3400); }
  function activate(target) { if (departing || document.querySelector('dialog[open]')) return; keys.clear(); target.action(); }
  function resetView() { player.set(0, 1.85, 6.2); yaw = 0; pitch = -.03; overview = false; viewButton.textContent = '⌖ Room overview'; canvas.focus({ preventScroll: true }); }
  const viewButton = button('⌖ Room overview', 'game-action', () => { overview = !overview; keys.clear(); viewButton.textContent = overview ? '↳ First-person view' : '⌖ Room overview'; });
  const resetButton = button('↺ Reset view', 'game-action', resetView);
  const expandButton = button('⛶ Expand', 'game-action', () => {
    const expanded = root.classList.toggle('expanded');
    document.body.classList.toggle('game-expanded', expanded);
    expandButton.textContent = expanded ? '↙ Exit expanded view' : '⛶ Expand';
  });
  if (wasExpanded) expandButton.textContent = '↙ Exit expanded view';
  actions.append(viewButton, resetButton, expandButton); bar.append(identity, actions);
  const mobile = el('div', 'game-touch-pad'); mobile.setAttribute('aria-label', 'Movement controls');
  function step(code) {
    const input = { x: code === 'KeyD' || code === 'ArrowRight' ? 1 : code === 'KeyA' || code === 'ArrowLeft' ? -1 : 0, z: code === 'KeyS' || code === 'ArrowDown' ? 1 : code === 'KeyW' || code === 'ArrowUp' ? -1 : 0 };
    Object.assign(player, movePlayer(player, input, yaw, .04, colliders));
  }
  for (const [label, code] of [['↑','KeyW'],['←','KeyA'],['↓','KeyS'],['→','KeyD']]) {
    const b = button(label, 'game-touch-key', () => {}); b.setAttribute('aria-label', {KeyW:'Move forward',KeyA:'Move left',KeyS:'Move backward',KeyD:'Move right'}[code]);
    on(b, 'pointerdown', event => { event.preventDefault(); overview = false; step(code); keys.add(code); b.setPointerCapture(event.pointerId); });
    on(b, 'pointerup', () => keys.delete(code)); on(b, 'pointercancel', () => keys.delete(code)); mobile.append(b);
  }
  stage.append(mobile);
  on(canvas, 'pointerdown', e => { canvas.focus({ preventScroll: true }); pointerDown = { x: e.clientX, y: e.clientY }; lastPointer = { ...pointerDown }; canvas.setPointerCapture(e.pointerId); });
  on(canvas, 'pointermove', e => {
    const rect = canvas.getBoundingClientRect(); pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1); pointerInside = true;
    if (pointerDown && !overview) { yaw -= (e.clientX - lastPointer.x) * .004; pitch = THREE.MathUtils.clamp(pitch - (e.clientY - lastPointer.y) * .004, -.9, .8); lastPointer = { x: e.clientX, y: e.clientY }; }
  });
  on(canvas, 'pointerup', e => {
    if (pointerDown && Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) < 6) { pick(); if (hover) activate(hover); }
    pointerDown = lastPointer = null;
  });
  on(canvas, 'pointercancel', () => { pointerDown = lastPointer = null; });
  on(canvas, 'pointerleave', () => { pointerInside = false; });
  const validKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  on(canvas, 'keydown', e => {
    if (validKeys.includes(e.code)) { e.preventDefault(); overview = false; if (!e.repeat) step(e.code); keys.add(e.code); }
    if (e.code === 'KeyE' && !e.repeat) { e.preventDefault(); if (hover) activate(hover); else notify('Look at a glowing workstation or click its marker.'); }
  });
  on(window, 'keyup', e => keys.delete(e.code));
  on(window, 'blur', () => { keys.clear(); pointerDown = null; });
  on(canvas, 'blur', () => keys.clear());
  on(document, 'visibilitychange', () => { keys.clear(); lastTime = 0; });
  on(root, 'keydown', e => { if (e.code === 'Escape') { keys.clear(); root.classList.remove('expanded'); document.body.classList.remove('game-expanded'); expandButton.textContent = '⛶ Expand'; } });
  function pick() {
    raycaster.setFromCamera(pointerInside ? pointer : new THREE.Vector2(0, 0), camera);
    hover = raycaster.intersectObjects(world.children, true)[0]?.object.userData.target || null;
  }
  function resize() {
    const { width, height } = viewport.getBoundingClientRect(); if (!width || !height) return;
    renderer.setSize(width, height, false); camera.aspect = width / height;
    camera.fov = camera.aspect < 1 ? 87 : 65; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(viewport);
  let displayedDoorState = false;
  function update(ids, next) {
    const previous = seen; seen = [...ids]; options = next; const wasSolved = solved; solved = !!next.solved;
    count.textContent = `${seen.length.toString().padStart(2,'0')} / ${puzzle.evidence.length.toString().padStart(2,'0')}`;
    for (const t of targets.filter(t => t.evidence)) {
      const collected = seen.includes(t.evidence.id);
      t.pin.classList.toggle('collected', collected); t.mapDot.classList.toggle('collected', collected);
      t.number.textContent = collected ? '✓' : String(puzzle.evidence.indexOf(t.evidence) + 1).padStart(2,'0');
      t.inventory.textContent = `${collected ? '✓' : '○'} ${t.evidence.title}`;
      t.inventory.classList.toggle('collected', collected);
      t.inventory.setAttribute('aria-label', `${t.evidence.title}${collected ? ', inspected' : ', not inspected'}`);
    }
    const ready = puzzle.required.every(id => seen.includes(id));
    terminalButton.textContent = solved ? `✓ ${nextEnvironment ? 'Enter '+nextEnvironment.title : 'View mission debrief'} →` : ready ? '◇ Evidence ready · solve the lock' : '◇ Decision terminal';
    terminalButton.onclick = () => solved ? options.onExit?.() : options.onTerminal?.();
    objective.textContent = solved ? (nextEnvironment ? `Exit unlocked. Next stop: ${nextEnvironment.title}.` : 'Exit unlocked. Your mission debrief is ready.') : ready ? 'Evidence collected. Make your decision at the amber terminal.' : environment.subtitle;
    root.classList.toggle('is-solved', solved);
    if (solved !== displayedDoorState) {
      const label = textSurface(solved ? ['ACCESS GRANTED', 'PROCEED TO NEXT SECTOR'] : [kind === 'space' ? 'AIRLOCK / EXIT' : 'NEXT SECTION / EXIT', 'SOLVE TO RELEASE'], 2.1, .6, solved ? theme.color : '#ffb66f');
      doorLabel.material = label.material; label.geometry.dispose(); displayedDoorState = solved;
    }
    if (seen.length > previous.length) notify(ready ? 'EVIDENCE COMPLETE / Decision terminal ready' : 'EVIDENCE RECOVERED / Added to your field notes');
    if (solved && !wasSolved) notify('ACCESS GRANTED / Exit hatch released');
  }
  function animate(time) {
    if (dead) return;
    frame = requestAnimationFrame(animate);
    if (document.hidden || !root.isConnected) { lastTime = 0; return; }
    const dt = lastTime ? Math.min((time-lastTime)/1000, .05) : 0; lastTime = time;
    const modal = !!document.querySelector('dialog[open]');
    if (modal || departing) keys.clear();
    if (!overview) {
      let x = Number(keys.has('KeyD') || keys.has('ArrowRight'))-Number(keys.has('KeyA') || keys.has('ArrowLeft'));
      let z = Number(keys.has('KeyS') || keys.has('ArrowDown'))-Number(keys.has('KeyW') || keys.has('ArrowUp'));
      Object.assign(player, movePlayer(player, { x, z }, yaw, dt, colliders));
      if (solved && !modal && player.z < -3.65 && Math.abs(player.x) < .8 && z < 0) { keys.clear(); options.onExit?.(); return; }
      camera.position.copy(player); camera.rotation.order = 'YXZ'; camera.rotation.set(pitch, yaw, 0);
    } else { camera.position.set(0, 8.9, 11.8); camera.lookAt(0, .4, -.4); }
    doorAmount = THREE.MathUtils.damp(doorAmount, solved ? 1 : 0, reduceMotion ? 100 : 3, dt);
    leftDoor.position.x = -.55-doorAmount*1.05; rightDoor.position.x = .55+doorAmount*1.05;
    ceiling.visible = ceilingDetails.visible = !overview;
    world.updateMatrixWorld(); camera.updateMatrixWorld();
    pick();
    prompt.textContent = hover ? `${hover.evidence && seen.includes(hover.evidence.id) ? '✓ REVISIT' : 'E / CLICK'}  ·  ${hover === doorTarget && solved ? 'Exit unlocked — continue' : hover.label}` : overview ? 'Room overview · Select a workstation to inspect its evidence' : 'Drag to look around · Click a glowing object to inspect';
    crosshair.classList.toggle('on-target', !!hover);
    canvas.style.cursor = pointerDown ? 'grabbing' : hover ? 'pointer' : 'grab';
    const rect = stage.getBoundingClientRect();
    const placedPins = [];
    for (const t of targets) {
      projected.copy(t.anchor).project(camera);
      const visible = projected.z < 1 && projected.z > -1 && Math.abs(projected.x) < .93 && Math.abs(projected.y) < .78;
      t.pin.hidden = !visible;
      if (visible) {
        const w=t.pin.offsetWidth, h=t.pin.offsetHeight, margin=w/2+10;
        const x=THREE.MathUtils.clamp((projected.x+1)*rect.width/2,margin,rect.width-margin);
        const anchorY=(1-projected.y)*rect.height/2;
        let y=anchorY;
        // Random desk assignments can project onto each other. Keep their
        // clickable labels separate while staying near the physical objects.
        for(const offset of [0,-1,1,-2,2,-3,3,-4,4]) {
          const candidate=THREE.MathUtils.clamp(anchorY+offset*(h+8),h/2+10,rect.height-h/2-70);
          if(placedPins.every(p=>Math.abs(x-p.x)>(w+p.w)/2+8 || Math.abs(candidate-p.y)>(h+p.h)/2+8)) { y=candidate; break; }
        }
        placedPins.push({x,y,w,h});
        t.pin.style.left=x+'px'; t.pin.style.top=y+'px';
      }
    }
    mapPlayer.style.left = `${50+player.x*6.5}%`; mapPlayer.style.top = `${14+(player.z+5)*6}%`; mapPlayer.style.transform = `translate(-50%,-50%) rotate(${-yaw}rad)`;
    if (!reduceMotion && !modal && !departing) for (const item of movingScenery) item.object.rotation[item.axis] += dt*item.speed;
    renderer.render(world, camera);
  }
  const instance = { root, room, puzzle, seed:options.seed, update, depart(done) {
    if (departing) return;
    departing = true; keys.clear(); root.inert = true; root.classList.add('is-departing');
    departureTimer = setTimeout(done, reduceMotion ? 0 : 260);
  }, dispose() {
    sound.dispose(); dead = true; document.body.classList.remove('game-expanded'); cancelAnimationFrame(frame); clearTimeout(toastTimer); clearTimeout(arrivalTimer); clearTimeout(departureTimer); observer.disconnect(); events.abort();
    world.traverse(o => o.geometry?.dispose()); new Set(materials).forEach(m => m.dispose()); textures.forEach(t => t.dispose()); keyLight.shadow.dispose(); renderer.dispose(); renderer.forceContextLoss();
  } };
  active = instance; update(seen, options); frame = requestAnimationFrame(animate);
  return root;
}
function dispose(stopMusic = true) { active?.dispose(); active = null; if(stopMusic) music.leave(); }
window.RoomScenes = { create, dispose, sectionOrder, depart(done) { if (active?.depart) active.depart(done); else done(); } };
