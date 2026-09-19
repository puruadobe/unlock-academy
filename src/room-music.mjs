// Original, locally synthesized ambient scores. No downloads or audio services.
const profiles = {
  cyber: { name:'Quiet signals', bpm:72, tone:'sine', cutoff:1400, echo:.28, chords:[[50,57,60,64],[46,53,57,60],[48,55,58,62],[45,52,57,60]], melody:[2,null,3,null,1,2,null,0], pulse:true },
  space: { name:'Across the stars', bpm:54, tone:'sine', cutoff:1100, echo:.48, chords:[[48,55,59,64],[45,52,55,59],[41,48,52,57],[43,50,55,59]], melody:[3,null,null,2,null,1,null,null], pulse:false },
  nature: { name:'Garden light', bpm:66, tone:'sine', cutoff:2100, echo:.33, chords:[[50,57,61,66],[47,54,57,61],[43,50,54,59],[45,52,57,61]], melody:[1,null,2,3,null,2,null,0], pulse:false },
  discovery: { name:'Little discoveries', bpm:76, tone:'triangle', cutoff:1900, echo:.22, chords:[[53,60,65,69],[50,57,62,65],[46,53,58,62],[48,55,60,64]], melody:[0,2,null,1,3,null,2,null], pulse:false },
  workshop: { name:'Gentle momentum', bpm:80, tone:'triangle', cutoff:1300, echo:.25, chords:[[45,52,55,59],[48,55,59,64],[43,50,55,59],[41,48,52,57]], melody:[1,null,2,null,3,null,2,0], pulse:true },
  study: { name:'Pages of wonder', bpm:60, tone:'triangle', cutoff:1600, echo:.3, chords:[[48,55,59,64],[53,60,64,69],[45,52,55,60],[43,50,55,59]], melody:[2,null,null,1,3,null,2,null], pulse:false },
  history: { name:'Echoes of time', bpm:58, tone:'sine', cutoff:1300, echo:.4, chords:[[50,57,60,65],[46,53,57,62],[43,50,55,58],[45,52,57,60]], melody:[3,null,2,null,1,null,null,2], pulse:false },
};
export function musicProfileFor(env = {}) {
  env ??= {};
  let id = 'study';
  if (env.kind === 'cyber') id = 'cyber';
  else if (['garden','biology'].includes(env.id) || env.motif === 'harvest') id = 'nature';
  else if (['counting','geometry'].includes(env.id)) id = 'discovery';
  else if (['engine','workshop','chemistry'].includes(env.id)) id = 'workshop';
  else if (env.kind === 'space' || env.id === 'lookout') id = 'space';
  else if (env.id === 'history') id = 'history';
  return {id,...profiles[id]};
}
export function barNotes(profile, bar, variation = 0) {
  const beat = 60 / profile.bpm, duration = beat * 4;
  const chord = profile.chords[(Math.floor(bar / 2) + variation) % profile.chords.length];
  const notes = chord.map(note=>({note,at:0,duration:duration*1.15,voice:'pad',level:.032}));
  notes.push({note:chord[0]-12,at:0,duration:duration*.95,voice:'bass',level:.04});
  profile.melody.forEach((degree,i)=>{
    if(degree !== null) notes.push({note:chord[(degree + (bar%2))%chord.length]+12,at:i*beat/2,duration:beat*1.6,voice:'bell',level:.065});
    if(profile.pulse && i%2===0) notes.push({note:chord[(i/2)%chord.length],at:i*beat/2,duration:beat*.7,voice:'pulse',level:.027});
  });
  return {duration,notes};
}
const STORAGE_KEY = 'unlock-academy-music-v1';
export function createRoomMusic({audioFactory=()=>new (globalThis.AudioContext || globalThis.webkitAudioContext)(), storage,
  every=setInterval, cancelEvery=clearInterval, later=setTimeout, cancelLater=clearTimeout} = {}) {
  let enabled=true, volume=.25, context=null, master=null, environment=null, track=null;
  let hidden=false, ducked=false, timer=null, suspendTimer=null, generation=0, unavailable=false, needsGesture=false;
  const listeners=new Set();
  try {
    storage ??= globalThis.localStorage;
    const saved=JSON.parse(storage?.getItem(STORAGE_KEY) || 'null');
    if(typeof saved?.enabled==='boolean') enabled=saved.enabled;
    if(typeof saved?.volume==='number' && Number.isFinite(saved.volume)) volume=Math.max(0,Math.min(1,saved.volume));
  } catch { /* Music still works when browser storage is unavailable. */ }
  const status=()=>({enabled,volume,playing:!!track && context?.state==='running',unavailable,needsGesture,profile:musicProfileFor(environment).name});
  const notify=()=>listeners.forEach(fn=>fn(status()));
  const persist=()=>{try{storage?.setItem(STORAGE_KEY,JSON.stringify({enabled,volume}));}catch{}};
  function gain(param,value,seconds=.2) {
    const now=context.currentTime;
    param.cancelScheduledValues(now); param.setTargetAtTime(value,now,seconds/3);
  }
  function updateVolume() { if(master) gain(master.gain,volume*.7*(ducked ? .35 : 1)); }
  function stopTrack(old, fade=.7) {
    if(!old) return;
    gain(old.bus.gain,0,fade);
    for(const voice of old.voices) for(const oscillator of voice.oscillators) {try{oscillator.stop(context.currentTime+fade);}catch{}}
    later(()=>{for(const node of old.nodes)node.disconnect();},(fade+.1)*1000);
  }
  function tone(layer, event, at) {
    const ctx=context, envelope=ctx.createGain(), filter=ctx.createBiquadFilter();
    filter.type='lowpass'; filter.frequency.value=layer.profile.cutoff;
    envelope.connect(filter); filter.connect(layer.bus);
    const attack=event.voice==='pad'?.8:event.voice==='bass'?.2:.015;
    const end=at+event.duration;
    envelope.gain.setValueAtTime(0,at);
    envelope.gain.linearRampToValueAtTime(event.level,at+Math.min(attack,event.duration*.25));
    envelope.gain.exponentialRampToValueAtTime(.0001,end);
    const oscillators=[ctx.createOscillator(),ctx.createOscillator()];
    oscillators.forEach((osc,i)=>{
      osc.type=event.voice==='pad'?'sine':layer.profile.tone;
      osc.frequency.value=440*2**((event.note-69)/12);
      osc.detune.value=i===0?-3:3;
      osc.connect(envelope); osc.start(at); osc.stop(end+.05);
    });
    const voice={oscillators}; layer.voices.add(voice);
    let ended=0;
    for(const osc of oscillators)osc.onended=()=>{
      osc.disconnect();
      if(++ended===oscillators.length){envelope.disconnect();filter.disconnect();layer.voices.delete(voice);}
    };
  }
  function schedule() {
    if(!track || context.state!=='running')return;
    // A suspended/background tab never tries to replay a backlog of notes.
    if(track.next<context.currentTime-.2)track.next=context.currentTime+.06;
    while(track.next<context.currentTime+.2) {
      const bar=barNotes(track.profile,track.bar++,environment?.variant || 0);
      for(const event of bar.notes)tone(track,event,track.next+event.at);
      track.next+=bar.duration;
    }
  }
  function startTrack() {
    const old=track, profile=musicProfileFor(environment);
    const bus=context.createGain(), delay=context.createDelay(2), feedback=context.createGain(), wet=context.createGain();
    bus.gain.value=0;bus.connect(master);
    delay.delayTime.value=60/profile.bpm*.75;feedback.gain.value=.23;wet.gain.value=profile.echo;
    bus.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(master);
    track={profile,bus,nodes:[bus,delay,feedback,wet],voices:new Set(),bar:0,next:context.currentTime+.06};
    gain(bus.gain,1,1.2); stopTrack(old);
    cancelEvery(timer);timer=every(schedule,100);schedule();notify();
  }
  async function play() {
    const token=++generation;
    cancelLater(suspendTimer);
    if(!enabled || hidden || !environment)return;
    try {
      if(!context){context=audioFactory();master=context.createGain();master.gain.value=0;master.connect(context.destination);}
      needsGesture=context.state!=='running';notify();
      await context.resume();
      if(token!==generation)return;
      needsGesture=context.state!=='running';
      if(needsGesture){notify();return;}
      unavailable=false;updateVolume();startTrack();
    } catch(error) {
      if(token!==generation)return;
      needsGesture=error?.name==='NotAllowedError';unavailable=!needsGesture;notify();
    }
  }
  function pause() {
    ++generation;cancelEvery(timer);timer=null;
    const old=track;track=null;stopTrack(old,.15);
    cancelLater(suspendTimer);
    if(context)suspendTimer=later(()=>{context.suspend().catch(()=>{});},250);
    notify();
  }
  return {
    status,
    subscribe(fn){listeners.add(fn);fn(status());return()=>listeners.delete(fn);},
    enter(env){environment=env;if(enabled && !hidden)void play();else notify();},
    leave(){environment=null;pause();},
    toggle(){enabled=needsGesture || (enabled && !track)?true:!enabled;persist();if(enabled)void play();else pause();notify();},
    setVolume(value){if(!Number.isFinite(value))return;volume=Math.max(0,Math.min(1,value));persist();updateVolume();notify();},
    setHidden(value){if(hidden===value)return;hidden=value;if(hidden)pause();else if(enabled && environment)void play();},
    setDucked(value){if(ducked===value)return;ducked=value;updateVolume();},
  };
}
