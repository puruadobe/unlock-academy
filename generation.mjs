import {readFile} from 'node:fs/promises';
import {review} from './core.mjs';
export function validateBrief(b){
 if(!b||typeof b!=='object'||Array.isArray(b))throw Error('A design brief is required.');
 for(const [key,max] of [['topic',150],['audience',200],['goal',1000]])if(typeof b[key]!=='string'||!b[key].trim()||b[key].length>max)throw Error('Provide a valid '+key+'.');
 if(!['Beginner','Intermediate','Advanced'].includes(b.difficulty))throw Error('Choose a supported challenge depth.');
 if(![3,4,5].includes(b.locks))throw Error('Choose 3, 4 or 5 locks.');
 if(b.revision!==undefined&&(typeof b.revision!=='string'||b.revision.length>1500))throw Error('Revision request is too long.');
 if(b.draft!==undefined&&JSON.stringify(b.draft).length>90000)throw Error('Draft is too large.');
 if(b.draft!==undefined&&review.audit(b.draft).errors.length)throw Error('Fix invalid draft JSON before requesting a revision.');
 return {topic:b.topic.trim(),audience:b.audience.trim(),goal:b.goal.trim(),difficulty:b.difficulty,locks:b.locks,...(b.draft?{draft:b.draft,revision:b.revision||'Improve clarity and evidence-based reasoning.'}:{})};
}
export function inspectGenerated(text,brief){
 const room=review.parse(text),audit=review.audit(room);
 if(room.puzzles?.length!==brief.locks)audit.errors.push('Expected exactly '+brief.locks+' locks.');
 if(!room.learningPlan)audit.errors.push('Learning plan is required.');
 if(!room.transfer)audit.errors.push('A final application question is required.');
 if(Array.isArray(room.puzzles))room.puzzles.forEach((p,i)=>{if(!p.reasoning)audit.errors.push('Lock '+(i+1)+' needs an evidence-selection challenge.');if(!room.objectives?.includes(p.objective))audit.errors.push('Lock '+(i+1)+' must map to a learning objective.');});
 audit.publishable=audit.errors.length===0;
 return {room,audit};
}
export async function generateDraft(tf,input,emit,modelOverride){
 const brief=validateBrief(input);
 emit({type:'stage',message:'Checking the configured model and room-design tools.'});
 const models=(await tf.models.list()).data;
 const model=modelOverride||(models.length===1?models[0].name:null);
 if(!model)throw Error(models.length?'Several models are configured. Set TRUEFORGE_MODEL on the app server to choose one.':'No model configured. Add one in TrueForge Settings → Models.');
 if(!models.some(m=>m.name===model))throw Error('The selected model is not in TrueForge’s configured model list.');
 const exposed=(await tf.mcpServers.listTools('unlock-academy')).data;
 if(!['get_room_design_guide','review_room_draft'].every(name=>exposed.some(t=>t.name===name)))throw Error('Reconnect the unlock-academy connector so the architect can discover its review tool.');
 const instructions=await readFile(new URL('./architect-instructions.txt',import.meta.url),'utf8');
 const {data:session}=await tf.sessions.create({agent:{spec:{model:{name:model},instructions,mcpServers:[{name:'unlock-academy',enableTools:['get_room_design_guide','review_room_draft'],preload:true}],config:{sandbox:{enabled:false},generativeUi:{enabled:false},askUserQuestions:{enabled:false},dynamicSubAgents:{enabled:false},iterationLimit:12}}}});
 emit({type:'session',id:session.id});
 let prompt='Create a room draft from this author-supplied brief. Do not publish it.\n'+JSON.stringify(brief);
 for(let attempt=0;attempt<2;attempt++){
  emit({type:'stage',message:attempt?'Requesting one repair based on validation feedback.':'Requesting the mission, learning plan, clues, and answer key.'});
  let output='',terminal=null;
  const stream=await tf.sessions.createTurnStream(session.id,{input:[{type:'user.message',content:prompt}]});
  for await(const {data:event} of stream.withMetadata()){
   if(event.type==='model.message.delta'){output+=event.content||'';if(output.length>120000)throw Error('Draft exceeded the output limit. Try a narrower topic.');}
   if(event.type.startsWith('tool.'))emit({type:'tool',name:event.type});
   if(event.type==='turn.done')terminal=event.state?.status;
  }
  if(terminal&&terminal!=='done'&&terminal!=='completed')throw Error('TrueForge did not complete the design turn. Check its session for details.');
  emit({type:'stage',message:'Validating structure, evidence references, and learning-depth fields.'});
  let result,issues;
  try{result=inspectGenerated(output,brief);issues=result.audit.errors;}catch(e){issues=['Return one valid JSON object. '+e.message];}
  if(!issues.length){emit({type:'draft',room:result.room,audit:result.audit,sessionId:session.id});return result;}
  if(attempt===1)throw Error('Draft still needs repair: '+issues.slice(0,4).join(' '));
  prompt='Repair your previous room draft. Return the full JSON only. Do not remove the intended learning depth. Validation feedback: '+JSON.stringify(issues);
 }
}
