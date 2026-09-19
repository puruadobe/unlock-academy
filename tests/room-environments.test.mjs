import test from 'node:test';
import assert from 'node:assert/strict';
import { environmentFor, stationCollider } from '../src/room-environments.mjs';
import { movePlayer } from '../src/movement.mjs';

test('every supported lock has its own environment and evidence layout', () => {
  for (const id of ['last-transfer','orbital-rescue','custom-room']) {
    const environments=Array.from({length:6},(_,i)=>environmentFor({id},i));
    assert.equal(new Set(environments.map(e=>e.id)).size,6);
    assert.equal(new Set(environments.map(e=>JSON.stringify(e.positions))).size,6);
    assert.ok(environments.every(e=>e.positions.length===6));
    assert.deepEqual(environmentFor({id},2),environmentFor({id},2),'Revisiting a clue must not change its room');
  }
});

test('all six evidence stations and the exit remain reachable around new landmarks', () => {
  for (let i=0;i<6;i++) {
    const env=environmentFor({id:'custom-room'},i);
    const obstacles=[env.obstacle,...env.positions.map(stationCollider),
      {x:-5.75,z:1,w:.65,d:11.5},{x:5.75,z:1,w:.65,d:11.5},
      {x:1.9,z:-3.45,w:.8,d:.6}];
    const queue=[[0,0]],visited=new Set(['0,0']),reachable=[];
    for(let head=0;head<queue.length;head++) {
      const [ix,iz]=queue[head],point={x:ix*.16,z:6.2+iz*.16};reachable.push(point);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const key=(ix+dx)+','+(iz+dz);if(visited.has(key))continue;
        const next=movePlayer(point,{x:dx,z:dz},0,.05,obstacles);
        if(Math.abs(next.x-(point.x+dx*.16))>1e-8||Math.abs(next.z-(point.z+dz*.16))>1e-8)continue;
        visited.add(key);queue.push([ix+dx,iz+dz]);
      }
    }
    assert.ok(reachable.some(p=>Math.abs(p.x)<.8&&p.z< -3.65),`Sector ${i+1}: blocked exit`);
    for(const [x,z,angle] of env.positions) {
      // Reach the front of the station, beyond its padded collision boundary.
      const front={x:x+Math.sin(angle)*1.35,z:z+Math.cos(angle)*1.35};
      assert.ok(reachable.some(p=>Math.hypot(p.x-front.x,p.z-front.z)<.5),`Sector ${i+1}: unreachable evidence at ${x}, ${z}`);
    }
  }
});
