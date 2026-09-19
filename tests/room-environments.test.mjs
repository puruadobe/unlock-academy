import test from 'node:test';
import assert from 'node:assert/strict';
import { environmentFor, stationCollider, terminalCollider } from '../src/room-environments.mjs';
import { sectionOrder } from '../src/section-presentation.mjs';
import { movePlayer } from '../src/movement.mjs';
import { rooms, engine } from '../core.mjs';

const custom = {id:'custom-room',topic:'Math',title:'Counting workshop',puzzles:Array.from({length:6},(_,i)=>({id:'task-'+i,title:'Subtract numbers',question:'How many remain?',options:['A','B','C'],evidence:Array.from({length:6},(_,j)=>({id:'e'+j,title:'Clue '+j}))}))};

test('six sections have unique stable floor plans, terminals and answer permutations', () => {
  for (const seed of [1,42,1789865400000]) {
    const environments=custom.puzzles.map((_,i)=>environmentFor(custom,i,seed));
    assert.equal(new Set(environments.map(e=>e.layoutIndex)).size,6);
    assert.equal(new Set(environments.map(e=>JSON.stringify(e.terminal))).size,6);
    assert.equal(new Set(custom.puzzles.map(p=>JSON.stringify(sectionOrder(custom,p,seed).options))).size,6);
    for(let i=0;i<6;i++) {
      assert.deepEqual(environmentFor(custom,i,seed),environments[i]);
      const order=sectionOrder(custom,custom.puzzles[i],seed);
      assert.deepEqual([...order.options].sort(),[0,1,2]);
      assert.deepEqual(order.evidence.map(e=>e.id).sort(),['e0','e1','e2','e3','e4','e5']);
      assert.deepEqual(sectionOrder(custom,custom.puzzles[i],seed),order);
    }
  }
  assert.notDeepEqual(environmentFor(custom,0,1),environmentFor(custom,0,42));
});

test('shuffled choices preserve the authored answer, feedback, reasoning and saved progress', () => {
  for(const room of rooms) {
    const original=JSON.stringify(room);
    for(const seed of [1,42,1789865400000]) {
      let state=engine.initial(); state.started=seed;
      for(const puzzle of room.puzzles) {
        const order=sectionOrder(room,puzzle,state.started);
        order.evidence.forEach(e=>engine.inspect(state,puzzle,e.id));
        const wrong=order.options.find(i=>i!==puzzle.answer);
        assert.equal(engine.evaluate(room,state,wrong).message,puzzle.feedback[wrong]);
        const correct=order.options[order.options.indexOf(puzzle.answer)];
        assert.equal(engine.evaluate(room,state,correct,puzzle.reasoning?.evidenceIds || []).kind,'correct');
        state=engine.restore(room,JSON.parse(JSON.stringify(state)));
        assert.deepEqual(sectionOrder(room,puzzle,state.started),order);
      }
      assert.deepEqual(sectionOrder(room,room.transfer,seed).options.slice().sort(),[0,1,2]);
    }
    assert.equal(JSON.stringify(room),original,'Presentation must not mutate authored data');
  }
});

test('scenery follows the current question, even in imported rooms with different IDs', () => {
  assert.deepEqual(rooms[0].puzzles.map((_,i)=>environmentFor({...rooms[0],id:'imported-cyber'},i).id),['office','servers','command']);
  assert.deepEqual(rooms[1].puzzles.map((_,i)=>environmentFor({...rooms[1],id:'imported-physics'},i).id),['bridge','engine','workshop']);
  for(const [question,id] of [
    ['Subtract the numbers. How many remain?','counting'],
    ['Which triangle has equal angles?','geometry'],
    ['How do cells use photosynthesis?','biology'],
    ['Which atoms form the molecule?','chemistry'],
    ['Which ancient artifact belongs on this timeline?','history'],
    ['Which metaphor does the poem use?','library'],
    ['Which choice follows from these clues?','archive'],
  ]) {
    const room={id:'same-id',topic:'Learning',puzzles:[{question}]};
    assert.equal(environmentFor(room,0).id,id,question);
    assert.equal(environmentFor(room,0).focus,question);
  }
  for(const [story,motif] of [['Count the lanterns','lantern'],['Feed the moon bunnies carrot cubes','harvest'],['Repair the bridge','bridge']]) {
    const env=environmentFor({topic:'Subtraction',puzzles:[{title:story,question:'Subtract numbers'}]},0);
    assert.equal(env.motif,motif);
  }
  const mixed={...rooms[0],puzzles:[{question:'Subtract these numbers',title:'Arithmetic'}]};
  assert.equal(environmentFor(mixed,0).id,'counting','Current question takes priority over the overall mission topic');
  assert.ok(custom.puzzles.every((_,i)=>environmentFor(custom,i).id==='counting'),'Stay relevant across all six math sections');
});

test('every shuffled floor plan and terminal combination is reachable with all six stations', () => {
  // Collect all 36 combinations, not just a lucky seed. Geometry is independent
  // of subject and evidence ordering, so this covers every shuffled assignment.
  const combinations=new Map();
  for(let seed=0;seed<100;seed++)for(let i=0;i<6;i++) {
    const env=environmentFor(custom,i,seed);
    combinations.set(env.layoutIndex+':'+env.terminal.join(','),env);
  }
  assert.equal(combinations.size,36);
  for (const [key,env] of combinations) {
    const obstacles=[env.obstacle,...env.positions.map(stationCollider),terminalCollider(env.terminal),
      {x:-5.75,z:1,w:.65,d:11.5},{x:5.75,z:1,w:.65,d:11.5}];
    const queue=[[0,0]],visited=new Set(['0,0']),reachable=[];
    for(let head=0;head<queue.length;head++) {
      const [ix,iz]=queue[head],point={x:ix*.16,z:6.2+iz*.16};reachable.push(point);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const visit=(ix+dx)+','+(iz+dz);if(visited.has(visit))continue;
        const next=movePlayer(point,{x:dx,z:dz},0,.05,obstacles);
        if(Math.abs(next.x-(point.x+dx*.16))>1e-8||Math.abs(next.z-(point.z+dz*.16))>1e-8)continue;
        visited.add(visit);queue.push([ix+dx,iz+dz]);
      }
    }
    assert.ok(reachable.some(p=>Math.abs(p.x)<.8&&p.z< -3.65),key+': blocked exit');
    for(const [x,z,angle] of [...env.positions,env.terminal]) {
      const front={x:x+Math.sin(angle)*1.35,z:z+Math.cos(angle)*1.35};
      assert.ok(reachable.some(p=>Math.hypot(p.x-front.x,p.z-front.z)<.5),key+': unreachable station at '+x+', '+z);
    }
    for(let i=0;i<env.positions.length;i++) {
      const a=stationCollider(env.positions[i]),b=terminalCollider(env.terminal);
      assert.ok(Math.abs(a.x-b.x)>=(a.w+b.w)/2 || Math.abs(a.z-b.z)>=(a.d+b.d)/2,key+': overlapping terminal and evidence');
    }
  }
});
