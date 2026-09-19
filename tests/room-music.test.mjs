import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoomMusic, musicProfileFor, barNotes } from '../src/room-music.mjs';

function setup(saved) {
  const intervals=new Map(),timeouts=new Map(),nodes=[],writes=[];let id=0,resumes=0;
  const param=()=>({value:0,setTargetAtTime(value){this.value=value;},cancelScheduledValues(){},setValueAtTime(value){this.value=value;},linearRampToValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(value){this.value=value;}});
  const node=()=>{const n={gain:param(),frequency:param(),detune:param(),delayTime:param(),connect(){},disconnect(){this.disconnected=true;},start(at){this.started=at;},stop(at){this.stopped=at;}};nodes.push(n);return n;};
  const context={state:'suspended',currentTime:0,destination:{},createGain:node,createBiquadFilter:node,createOscillator:node,createDelay:node,
    async resume(){resumes++;this.state='running';},async suspend(){this.state='suspended';}};
  const music=createRoomMusic({audioFactory:()=>context,storage:{getItem:()=>JSON.stringify(saved),setItem:(key,value)=>writes.push(JSON.parse(value))},
    every:fn=>{intervals.set(++id,fn);return id;},cancelEvery:key=>intervals.delete(key),later:fn=>{timeouts.set(++id,fn);return id;},cancelLater:key=>timeouts.delete(key)});
  return {music,context,nodes,writes,intervals,timeouts,get resumes(){return resumes;},flush(){const tasks=[...timeouts.values()];timeouts.clear();tasks.forEach(fn=>fn());}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('soundtracks follow learning themes and garden story details',()=>{
  const examples=[['servers','cyber','cyber'],['bridge','space','space'],['engine','space','workshop'],['counting','archive','discovery'],['biology','archive','nature'],['chemistry','archive','workshop'],['library','archive','study'],['history','archive','history']];
  for(const [id,kind,expected] of examples)assert.equal(musicProfileFor({id,kind}).id,expected);
  assert.equal(musicProfileFor({id:'counting',motif:'harvest'}).id,'nature');
  assert.equal(musicProfileFor({id:'unrecognized'}).id,'study');
});

test('all scores have bounded playable notes, distinct melodies, and complete looping harmony',()=>{
  const profiles=['servers','bridge','engine','counting','biology','library','history'].map(id=>musicProfileFor({id,kind:id==='servers'?'cyber':id==='bridge'?'space':'archive'}));
  assert.equal(new Set(profiles.map(p=>JSON.stringify(p.chords))).size,7);
  for(const profile of profiles)for(let bar=0;bar<16;bar++) {
    const score=barNotes(profile,bar,bar%6);
    assert.ok(score.duration>=3 && score.duration<=5);
    assert.ok(score.notes.some(n=>n.voice==='bell'));
    for(const n of score.notes) {
      assert.ok(n.note>=28 && n.note<=90);
      assert.ok(n.at>=0 && n.at<score.duration);
      assert.ok(n.duration>0 && n.duration<6);
      assert.ok(n.level>0 && n.level<.1);
    }
  }
});

test('mute and volume persist; muted rooms never create an audio context',async()=>{
  const h=setup({enabled:false,volume:.4});
  h.music.enter({id:'counting'});await settle();
  assert.equal(h.resumes,0);assert.equal(h.nodes.length,0);
  h.music.toggle();await settle();assert.equal(h.music.status().playing,true);
  h.music.setVolume(.15);assert.equal(h.music.status().volume,.15);
  h.music.toggle();h.flush();await settle();
  assert.equal(h.music.status().playing,false);assert.equal(h.context.state,'suspended');assert.equal(h.intervals.size,0);
  assert.deepEqual(h.writes.at(-1),{enabled:false,volume:.15});
  h.music.enter({id:'history'});await settle();assert.equal(h.resumes,1);
});

test('section transitions replace the scheduler, fade old voices, and stop on leaving',async()=>{
  const h=setup();h.music.enter({id:'servers',kind:'cyber'});await settle();
  assert.equal(h.music.status().profile,'Quiet signals');assert.equal(h.intervals.size,1);
  const oldOscillators=h.nodes.filter(n=>n.started!==undefined);
  h.music.enter({id:'biology'});await settle();
  assert.equal(h.music.status().profile,'Garden light');assert.equal(h.intervals.size,1);
  assert.ok(oldOscillators.every(n=>n.stopped===.7),'Old score ends during the crossfade');
  h.music.leave();h.flush();await settle();
  assert.equal(h.intervals.size,0);assert.equal(h.music.status().playing,false);assert.equal(h.context.state,'suspended');
});

test('reading ducks volume; background tabs pause without changing the music preference',async()=>{
  const h=setup();h.music.enter({id:'bridge',kind:'space'});await settle();
  const master=h.nodes[0],normal=master.gain.value;
  h.music.setDucked(true);assert.ok(master.gain.value<normal*.5);
  h.music.setDucked(false);assert.equal(master.gain.value,normal);
  h.music.setHidden(true);h.flush();await settle();
  assert.equal(h.music.status().playing,false);assert.equal(h.music.status().enabled,true);
  h.music.setHidden(false);await settle();assert.equal(h.music.status().playing,true);assert.equal(h.intervals.size,1);
  h.music.leave();h.flush();
});

test('late resume cannot start a score after leaving; browser autoplay failures are recoverable',async()=>{
  const h=setup();let resume;
  h.context.resume=()=>new Promise(resolve=>{resume=resolve;});
  h.music.enter({id:'library'});h.music.leave();resume();await settle();
  assert.equal(h.intervals.size,0);assert.equal(h.music.status().playing,false);h.flush();
  const blocked=setup();blocked.context.resume=async()=>{throw Object.assign(new Error('gesture'),{name:'NotAllowedError'});};
  blocked.music.enter({id:'counting'});await settle();
  assert.equal(blocked.music.status().needsGesture,true);assert.equal(blocked.music.status().unavailable,false);
  blocked.context.resume=async()=>{blocked.context.state='running';};blocked.music.toggle();await settle();
  assert.equal(blocked.music.status().playing,true);blocked.music.leave();blocked.flush();
});
