/* Shared review checks: structural checks, not a factual-verification service. */
const DraftReview = (() => {
  function audit(room) {
    const errors = RoomEngine.validate(room);
    const warnings = [];
    if (errors.length) return {errors, warnings, checks:[], publishable:false};
    if (!room.learningPlan) warnings.push('Add an audience, prerequisites, and a central question.');
    if (!room.transfer) warnings.push('Add a final application question in a new situation.');
    for (const [i,p] of room.puzzles.entries()) {
      if (!room.objectives.includes(p.objective)) warnings.push('Lock '+(i+1)+': link it to one of the learning objectives.');
      if (!p.reasoning) warnings.push('Lock '+(i+1)+': add an evidence-selection challenge.');
      if (new Set(p.options.map(x=>x.trim().toLowerCase())).size!==3) errors.push('Lock '+(i+1)+': answer choices must be distinct.');
      if (new Set(p.hints).size!==3) warnings.push('Lock '+(i+1)+': make all three hints different.');
      if (p.reasoning && p.reasoning.evidenceIds.length===p.evidence.length) warnings.push('Lock '+(i+1)+': every clue is supporting evidence; consider a plausible irrelevant clue.');
    }
    if (!room.sources?.length) warnings.push('No source links supplied. A reviewer must check factual claims independently.');
    return {errors,warnings,publishable:errors.length===0,checks:[{label:'Room structure and evidence references',passed:true},{label:'Distinct answer choices',passed:errors.length===0},{label:'Objectives mapped to every lock',passed:room.puzzles.every(p=>room.objectives.includes(p.objective))},{label:'Evidence-selection challenges',passed:room.puzzles.every(p=>!!p.reasoning)},{label:'Application question',passed:!!room.transfer}],notice:'These checks do not establish factual accuracy, pedagogical quality, or real-world competence.'};
  }
  function parse(text) {
    if (typeof text!=='string'||text.length>120000) throw Error('Model output is empty or too large.');
    const clean=text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
    return JSON.parse(clean);
  }
  return {audit,parse};
})();
if(typeof module!=='undefined') module.exports=DraftReview;
