"use strict";

// Self-contained vector illustrations: no remote image dependencies, and every
// dynamic label is escaped. The original evidence remains available as text.
const EvidenceVisuals = (() => {
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const text = (x, y, value, size = 15, color = '#b9d4df') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Arial, sans-serif">${escape(value)}</text>`;
  const panel = (x,y,w,h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#172e40" stroke="#42647b"/>`;
  const line = (x1,y1,x2,y2,color='#7297ab',width=2) => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
  const ship = (x,y,scale=1) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-93 6L-46-21H43L85 7 43 31H-46Z" fill="#b3c9d5" stroke="#ecf8ff" stroke-width="2"/><path d="M-49-20L-64-52-7-20M-49 31L-61 55-5 31" fill="#557888" stroke="#a8c5d4" stroke-width="2"/><path d="M39-11L67 7 40 20H12V-11Z" fill="#143f5a" stroke="#7acdec" stroke-width="2"/><path d="M-93-2H-110V16H-93" fill="#567180"/><path d="M-18-13V24M-8-13V24" stroke="#698b99" stroke-width="3"/></g>`;
  const documentArt = () => `${panel(177,59,247,190)}<path d="M365 59v45h59" fill="#29475b" stroke="#7297ab"/>${line(204,126,355,126,'#8fddcc',5)}${line(204,150,391,150)}${line(204,171,370,171)}${line(204,192,388,192)}${line(204,213,329,213)}`;
  function create(room, puzzle, evidence) {
    let art = '', caption = 'Illustrated evidence record. Read the complete source below.';
    const id = evidence.id;
    const reading = label => evidence.body.split('\n').find(l=>l.toLowerCase().startsWith(label.toLowerCase()+':'))?.split(':').slice(1).join(':').trim() || 'See source record';
    if (room.id === 'orbital-rescue') {
      if (id === 'mass') {
        art = ship(258,137,1.1) + `<path d="M119 208h280l-20 26H140Z" fill="#416077" stroke="#90b2c7"/><path d="M150 248h216" stroke="#6fcbd6" stroke-width="3"/>` + panel(376,85,180,111) + text(394,113,'TOTAL MASS',12,'#8cdbc9') + text(394,155,reading('Total mass'),29,'#effaff') + line(345,143,375,143,'#8cdbc9',2);
        caption = 'Mass measurement of the whole spacecraft, including its contents.';
      } else if (id === 'force') {
        art = ship(252,157,1.05) + '<path d="M136 147l-70 14 70 13" fill="#ffb967"/><path d="M388 154h135m-22-17 22 17-22 17" fill="none" stroke="#84e4d3" stroke-width="7" stroke-linecap="round"/>' + text(377,106,'NET FORCE',12,'#8cdbc9') + text(377,135,reading('Net force'),27,'#effaff') + text(210,246,'F = m × a',22,'#b9d4df');
        caption = 'Thruster force readout. Use the separate mass record with this measurement.';
      } else if (id === 'sensor') {
        art = ship(235,161) + '<path d="M342 166h185m-19-15 19 15-19 15" fill="none" stroke="#84e4d3" stroke-width="5"/>' + text(328,105,'VELOCITY',12,'#8cdbc9') + text(328,133,'100 m/s',30,'#effaff') + text(161,247,'NET EXTERNAL FORCE: ZERO',16);
        caption = 'The last recorded velocity and net external force, in an inertial reference frame.';
      } else if (id === 'law') {
        art = '<path d="M89 79q104-30 210 3v159q-104-34-210-5Zm210 3q106-33 212-3v157q-106-30-212 5Z" fill="#c0d4dc" stroke="#ebf9ff" stroke-width="3"/><path d="M299 86v145" stroke="#6c8c9e" stroke-width="3"/>' + text(119,127,'FLIGHT',24,'#163345') + text(119,160,'HANDBOOK',21,'#163345') + text(333,128,'Net force = 0',21,'#163345') + text(333,166,'Constant velocity',17,'#214c5a') + line(124,195,258,195,'#688d9d',3) + line(336,195,477,195,'#688d9d',3);
        caption = 'The flight handbook explains motion when the net force is zero.';
      } else if (id === 'before' || id === 'after') {
        const warm = id === 'after';
        art = `<path d="M75 222h450" stroke="#698394" stroke-width="5"/><rect x="151" y="111" width="106" height="97" rx="9" fill="#7da4bd" stroke="#d8effc" stroke-width="3"/><path d="M151 111l28-27h106l-28 27M257 111l28-27v94l-28 30" fill="#456b85" stroke="#c7e4f1" stroke-width="2"/><rect x="367" y="129" width="77" height="81" rx="8" fill="${warm?'#bc633a':'#396986'}" stroke="${warm?'#ffc581':'#9fd7eb'}" stroke-width="3"/><path d="M${warm?'290':'299'} 163h${warm?'38':'52'}m-10-8 10 8-10 8" fill="none" stroke="#8cdecd" stroke-width="4"/>` + (warm ? '<path d="M381 117q-12-15 0-28t0-27M406 117q-12-15 0-28t0-27M431 117q-12-15 0-28t0-27" stroke="#ffbf76" stroke-width="3" fill="none"/>' : '') + text(155,257,warm?'Slower component':'Moving component',16) + text(369,257,warm?'Warm brake':'Cool brake',16,warm?'#ffc581':'#9fd7eb');
        caption = warm ? 'After contact: the component slows while the brake and contact surfaces warm.' : 'Before contact: a moving component approaches a cool brake.';
      }
    } else if (room.id === 'last-transfer') {
      if (id === 'mail' || id === 'branding') {
        art = panel(108,63,384,192) + `<path d="M109 63h382v34H109Z" fill="#28465b"/><circle cx="129" cy="80" r="4" fill="#ffbd81"/><circle cx="144" cy="80" r="4" fill="#8cdecd"/>` + text(136,126,'SUPPLIER ACCOUNTS',13,'#9ddbcf') + text(136,157,'Updated payment details',23,'#eef8ff') + line(138,185,460,185) + line(138,207,418,207) + line(138,228,359,228);
        if (id === 'branding') art += '<circle cx="462" cy="202" r="36" fill="#193b4eee" stroke="#ffc581" stroke-width="5"/><path d="m488 228 33 33" stroke="#ffc581" stroke-width="10" stroke-linecap="round"/>';
        caption = id === 'mail' ? 'Illustrated payment-change message. The full request appears below.' : 'A familiar-looking message. Visual appearance alone is not proof of authorization.';
      } else if (id === 'directory') {
        art = panel(98,67,403,181) + '<circle cx="169" cy="138" r="29" fill="#244e60" stroke="#84c9c7"/><circle cx="169" cy="130" r="10" fill="#b2d8df"/><path d="M150 156q19-24 38 0" fill="#b2d8df"/>' + text(226,117,'CEDAR WORKS',25,'#f0faff') + text(226,150,'Existing supplier directory',15) + text(226,178,'Relationship: two years',15) + line(127,203,474,203) + text(128,229,'Previously established contact record',15,'#9ee3d1');
        caption = 'The stored supplier record provides a contact route established before the message.';
      } else if (id === 'password' || id === 'sessions') {
        const rows = evidence.body.split('\n').filter(l=>/^\d\d:\d\d/.test(l)).slice(0,3);
        art = line(111,95,111,239,'#6ca4b2',3);
        rows.forEach((row,i)=>{const y=100+i*65; const label=row.slice(8); art += `<circle cx="111" cy="${y}" r="7" fill="${i===2?'#ffbd81':'#8cdecd'}"/>` + text(140,y+4,row.slice(0,5),21,'#effaff') + text(227,y+4,label.length>35?label.slice(0,33)+'…':label,14);});
        caption = id === 'sessions' ? 'Session S-042 activity in chronological order. See the full audit entries below.' : 'Account events in chronological order. See the full audit entries below.';
      } else if (id === 'terms') {
        art = panel(63,88,145,140)+panel(226,88,145,140)+panel(389,88,145,140)+'<circle cx="132" cy="131" r="16" fill="none" stroke="#8cdecd" stroke-width="6"/><path d="M132 147v31m0-12h17" stroke="#8cdecd" stroke-width="6"/><rect x="267" y="113" width="65" height="43" rx="5" fill="none" stroke="#90cfee" stroke-width="4"/><path d="M284 172h32M300 157v15" stroke="#90cfee" stroke-width="4"/><circle cx="461" cy="143" r="25" fill="none" stroke="#ffbd81" stroke-width="4"/><path d="m443 125 36 36" stroke="#ffbd81" stroke-width="4"/>'+text(99,207,'Password',15)+text(273,207,'Session',15)+text(420,207,'Revocation',15);
        caption = 'Three distinct concepts: authenticating, maintaining access, and ending access.';
      } else if (id === 'status') {
        art = panel(110,63,380,198);
        [['PAYMENT','Not released'],['BANK CHANGE','Not approved'],['SESSION','Still active']].forEach(([label,value],i)=>{const y=106+i*61; art+=text(131,y,label,12,'#8cdecd')+text(286,y,value,17,'#ffcf9c'); if(i<2)art+=line(130,y+21,468,y+21,'#355467');});
        caption = 'A snapshot of the payment, pending change, and suspicious access.';
      } else if (id === 'playbook') {
        art = panel(139,58,333,208);
        ['Hold sensitive changes','Preserve messages and logs','Notify authorized responders','Review and revoke access'].forEach((label,i)=>{const y=101+i*43;art+=`<rect x="161" y="${y-13}" width="18" height="18" rx="4" fill="#1c453e" stroke="#8cdecd"/><path d="m165 ${y-4} 4 4 6-8" stroke="#8cdecd" fill="none" stroke-width="2"/>`+text(196,y,label,15);});
        caption = 'An illustrated checklist from the response card; full instructions remain below.';
      } else if (id === 'shortcut') {
        art = '<path d="M123 74h349q17 0 17 17v117q0 17-17 17H196l-58 29 12-29h-27q-17 0-17-17V91q0-17 17-17Z" fill="#203e53" stroke="#668ca4" stroke-width="2"/>'+text(135,114,'COLLEAGUE CHAT',12,'#ffcf9c')+text(135,156,'“Can we just delete the message',20,'#edf7ff')+text(135,187,'and pay the invoice?”',20,'#edf7ff');
        caption = 'A colleague’s suggestion, shown as a fictional chat excerpt.';
      }
    }
    if (!art) art = documentArt();
    const alt = `${evidence.title}. ${caption}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 306" role="img"><title>${escape(alt)}</title><defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#223f52" stroke-width=".65"/></pattern></defs><rect width="600" height="306" rx="16" fill="#0d2030"/><rect width="600" height="306" rx="16" fill="url(#grid)"/>${text(24,30,'ACADEMY / '+(evidence.type || 'EVIDENCE').slice(0,30),11,'#8caabf')}${art}${text(24,288,'ILLUSTRATED TRAINING RECORD',10,'#88a7bb')}</svg>`;
    return { svg, alt, caption };
  }
  return { create };
})();
