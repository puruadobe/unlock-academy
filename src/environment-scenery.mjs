// Built from local geometry. These landmarks suggest a setting without adding
// claims to the lesson; the authored evidence remains the source of truth.
export function buildScenery({THREE,world,env,box,cylinder,mat,textSurface,glow,warmGlow,white,black,edge,panelMat,roof,colliders}) {
  const moving=[];
  const center=new THREE.Group(); center.position.set(0,0,-.7); world.add(center);
  const sphere=(r,material,x,y,z,parent=world)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),material);m.position.set(x,y,z);parent.add(m);return m;};
  const ring=(r,t,material,x,y,z,parent=world)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,48),material);m.position.set(x,y,z);parent.add(m);return m;};
  function label(lines,x,y,z,w=2.4,h=.9){const m=textSurface(lines,w,h,env.color);m.position.set(x,y,z);world.add(m);return m;}
  function plant(x,z){cylinder(.32,.5,edge,x,.25,z);box(.09,1.25,.09,panelMat,x,1.05,z);for(let i=0;i<5;i++){const leaf=sphere(.32,mat(i%2?0x669c65:0x3d7c61),x+Math.sin(i*2)*.25,1+i*.18,z+Math.cos(i*2)*.2);leaf.scale.set(1,.5,1.8);}}
  function shelf(x,z,rotation=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;world.add(g);box(2.45,3.2,.32,black,0,1.6,0,g);for(let y=.4;y<3.2;y+=.62){box(2.4,.09,.46,panelMat,0,y,.15,g);for(let j=0;j<9;j++)box(.13,.27+(j%3)*.08,.2,mat([0xbaa477,0x577976,0x8c637b][j%3]),-1+j*.23,y+.24,.15,g);}}
  const kind=env.landmark;
  const plaque=env.plaque.map(line=>line.length>90?line.slice(0,87)+'…':line);
  // The central silhouette changes from room to room, not just its tint.
  if(kind==='counting' || kind==='geometry') {
    // Manipulatives suggest the subject; their arrangement is decorative,
    // never a worked solution or a second source of numerical evidence.
    cylinder(1,.2,panelMat,0,.75,0,center);cylinder(.35,.7,black,0,.35,0,center);
    if(kind==='counting' && env.motif==='lantern') {
      box(.12,1.8,.12,edge,0,1.65,0,center);
      box(.9,.12,.9,panelMat,0,2.5,0,center);
      const lantern=new THREE.Mesh(new THREE.OctahedronGeometry(.55),warmGlow);lantern.position.y=2;center.add(lantern);
      for(const x of [-5.65,5.65])for(const z of [-3,1,4.5])plant(x,z);
    } else if(kind==='counting' && env.motif==='harvest') {
      cylinder(.72,.45,mat(0x9b805e),0,1.1,0,center);
      for(let j=0;j<3;j++) {
        const carrot=new THREE.Mesh(new THREE.ConeGeometry(.15,.75,16),mat(0xf2a15d));
        carrot.position.set(-.35+j*.35,1.6,0);carrot.rotation.z=Math.PI+(j-1)*.3;center.add(carrot);
        box(.06,.35,.08,mat(0x6aaa70),-.35+j*.35,2.08,0,center);
      }
      for(const x of [-5.65,5.65])for(const z of [-3,1,4.5])plant(x,z);
    } else if(kind==='counting' && env.motif==='bridge') {
      box(1.9,.06,1.25,mat(0x529fb3),0,.9,0,center);
      for(let j=0;j<5;j++)box(.31,.14,.65,panelMat,-.7+j*.35,1.1+Math.sin(j*Math.PI/4)*.2,0,center);
      for(const z of [-.5,.5]) {
        for(const x of [-.82,.82])box(.07,.65,.07,edge,x,1.3,z,center);
        box(1.8,.07,.07,warmGlow,0,1.6,z,center);
      }
    } else if(kind==='counting' && ['groups','blocks'].includes(env.motif)) {
      for(let j=0;j<6;j++) {
        const x=(j%3-1)*.5,y=1.05+Math.floor(j/3)*.45,z=Math.floor(j/3)*.35-.2;
        if(env.motif==='groups')sphere(.2,j%2?glow:warmGlow,x,y,z,center);
        else box(.35,.35,.35,j%2?glow:warmGlow,x,y,z,center);
      }
    } else if(kind==='counting') {
      for(const x of [-.75,.75])box(.08,1.6,.12,edge,x,1.6,0,center);
      for(let row=0;row<3;row++) {
        box(1.5,.035,.035,white,0,1.1+row*.45,0,center);
        for(let j=0;j<5;j++)sphere(.1,(row+env.variant)%2?glow:warmGlow,-.55+j*.25,1.1+row*.45,0,center);
      }
      for(const x of [-5.7,5.7])for(let j=0;j<5;j++)box(.2,.5,.5,j%2?panelMat:edge,x,.25+j*.5,-3+j*.3);
    } else {
      const shape=new THREE.Group();shape.position.y=1.8;center.add(shape);
      const cube=box(.7,.7,.7,warmGlow,-.4,0,0,shape);cube.rotation.set(.2,.3,.1);
      sphere(.38,glow,.45,.35,0,shape);
      ring(.85,.035,white,0,0,0,shape);
      moving.push({object:shape,axis:'y',speed:.1});
    }
    label(plaque,-3.65,2.8,-4.6,3.6,1.5);
    label(['EXHIBIT / LEARNING TOOLS','USE THE EVIDENCE CARDS TO SOLVE'],-3.65,1.4,-4.6,3.6,.65);
  } else if(kind==='biology' || kind==='chemistry') {
    cylinder(.95,.15,edge,0,.8,0,center);cylinder(.5,.75,black,0,.4,0,center);
    const model=new THREE.Group();model.position.y=1.8;center.add(model);
    if(kind==='biology') {
      const cell=sphere(.78,mat(0x65a77b),0,0,0,model);cell.scale.set(1,.65,.8);
      sphere(.26,warmGlow,0,.42,.14,model);
      for(let j=0;j<5;j++){const a=j*1.25;sphere(.1,glow,Math.sin(a)*.5,.35,Math.cos(a)*.3,model);}
      for(const x of [-5.65,5.65])for(const z of [-3,1,4.5])plant(x,z);
    } else {
      sphere(.32,warmGlow,0,0,0,model);
      for(let j=0;j<4;j++) {
        const a=j*Math.PI/2+env.variant*.35;
        const atom=new THREE.Vector3(Math.cos(a)*.68,Math.sin(a)*.68,j%2?.2:-.2);
        sphere(.19,glow,atom.x,atom.y,atom.z,model);
        const bond=cylinder(.045,atom.length(),white,atom.x/2,atom.y/2,atom.z/2,model);
        bond.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),atom.clone().normalize());
      }
      for(const x of [-5.7,5.7])for(let z=-3;z<5;z+=2){box(.25,1.1,.8,panelMat,x,.55,z);cylinder(.12,.5,glow,x,1.35,z);}
    }
    moving.push({object:model,axis:'y',speed:.08});
    label(plaque,-3.65,2.8,-4.6,3.6,1.5);
    label(['ILLUSTRATIVE MODEL','INSPECT THE CARDS FOR LESSON FACTS'],-3.65,1.4,-4.6,3.6,.65);
  } else if(kind==='history') {
    cylinder(.85,.2,panelMat,0,.15,0,center);cylinder(.55,.7,black,0,.6,0,center);
    cylinder(.48,.65,mat(0xb38d62),0,1.2,0,center);cylinder(.28,.3,panelMat,0,1.65,0,center);
    ring(.37,.08,edge,.4,1.4,0,center);
    for(const x of [-5.7,5.7])for(const z of [-3,0,3])shelf(x,z,x<0?Math.PI/2:-Math.PI/2);
    label(plaque,-3.65,2.8,-4.6,3.6,1.5);
    label(['COLLECTION / CONTEXT','COMPARE THE PRIMARY SOURCES'],-3.65,1.4,-4.6,3.6,.65);
  } else if(kind==='records') {
    cylinder(1,.13,panelMat,0,1,0,center);cylinder(.34,1,black,0,.5,0,center);
    for(let i=0;i<5;i++){const file=box(.5,.07,.65,i%2?white:warmGlow,Math.sin(i*2)*.48,1.12+i*.05,Math.cos(i*2)*.4,center);file.rotation.y=i*.4;}
    box(2.8,1.6,.15,mat(0x9b805e),-3.65,2.8,-4.65);
    for(let i=0;i<6;i++){box(.55,.43,.02,white,-4.45+(i%3)*.78,2.4+Math.floor(i/3)*.65,-4.55);sphere(.035,warmGlow,-4.45+(i%3)*.78,2.58+Math.floor(i/3)*.65,-4.5);}
    label(plaque,-3.65,1.5,-4.5,2.8,.65);
    plant(-5.4,4.9);plant(5.4,-3.8);
  } else if(kind==='network') {
    cylinder(.85,.25,edge,0,.15,0,center);cylinder(.53,2.8,black,0,1.6,0,center);
    for(let i=0;i<8;i++){const r=ring(.65,.028,glow,0,.5+i*.32,0,center);r.rotation.x=Math.PI/2;}
    for(const x of [-5.65,5.65])for(const z of [-3,0,3]){
      const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=x<0?Math.PI/2:-Math.PI/2;world.add(g);
      box(1.8,3.65,.6,black,0,1.82,0,g);
      for(let j=0;j<10;j++){box(1.6,.24,.1,edge,0,.35+j*.32,.35,g);box(.65,.035,.02,j%3?glow:warmGlow,-.2,.35+j*.32,.42,g);}
    }
    label(plaque,-3.6,2.65,-4.6,3.5,1.6);
  } else if(kind==='command') {
    cylinder(1,.15,edge,0,1,0,center);cylinder(.65,1,black,0,.5,0,center);
    cylinder(.9,.03,glow,0,1.1,0,center);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;box(.11,.25+i*.08,.11,warmGlow,Math.sin(a)*.65,1.3,Math.cos(a)*.65,center);}
    label(plaque,-3.55,2.9,-4.6,3.65,1.7);
    for(let i=0;i<3;i++)label(['CHANNEL 0'+(i+1),'STANDING BY'],-4.75+i*1.15,1.35,-4.6,1,.7);
    for(const x of [-5.7,5.7])for(let z=-3;z<5;z+=2)box(.1,2.8,.08,warmGlow,x,2,z);
  } else if(kind==='engine') {
    center.rotation.y=.65; center.scale.set(.85,1,.85);
    cylinder(1,.24,edge,0,.15,0,center);
    const barrel=cylinder(.65,2.1,panelMat,0,1.8,0,center);barrel.rotation.x=Math.PI/2;
    for(const z of [-1,-.45,.15,.75])ring(.7,.06,z<0?glow:edge,0,1.8,z,center);
    cylinder(.42,1,black,0,.65,0,center);
    for(const x of [-4.7,4.7]){const pipe=cylinder(.18,11,panelMat,x,env.ceiling-.55,.5,roof);pipe.rotation.x=Math.PI/2;}
    label(plaque,-3.6,2.8,-4.6,3.6,1.3);
    for(let i=0;i<3;i++){box(.8,1.2,.6,edge,-4.6+i*.95,.6,-4.25);box(.7,.15,.62,warmGlow,-4.6+i*.95,1.15,-4.25);}
  } else if(kind==='flywheel') {
    box(2.05,.2,1.5,edge,0,.2,0,center);
    for(const x of [-.6,.6])box(.15,1.4,.7,panelMat,x,.95,0,center);
    const wheel=new THREE.Group();wheel.position.set(0,1.65,0);center.add(wheel);
    ring(.82,.13,white,0,0,0,wheel);cylinder(.15,.9,black,0,1.65,0,center).rotation.x=Math.PI/2;
    for(let i=0;i<6;i++){const spoke=box(.08,1.5,.12,glow,0,0,0,wheel);spoke.rotation.z=i*Math.PI/3;}
    box(.35,.4,.4,warmGlow,.78,1.45,0,center);
    label(plaque,-3.65,2.8,-4.6,3.5,1.4);
    for(let i=0;i<7;i++){box(.08,.5+(i%3)*.2,.06,white,-4.9+i*.42,1.65,-4.55);}
    moving.push({object:wheel,axis:'z',speed:.12});
  } else if(kind==='garden') {
    cylinder(1,.55,mat(0x938477),0,.28,0,center);cylinder(.88,.05,mat(0x34472f),0,.58,0,center);
    box(.16,1.9,.16,panelMat,0,1.45,0,center);
    for(let i=0;i<7;i++){const a=i*2.4;const leaf=sphere(.48,mat(i%2?0x77a75b:0x497b52),Math.sin(a)*.4,1.8+(i%3)*.38,Math.cos(a)*.4,center);leaf.scale.y=.6;}
    for(const x of [-5.65,5.65])for(const z of [-3,1,4.5])plant(x,z);
    for(let z=-3.5;z<=5;z+=2.8){for(const x of [-2.8,2.8]){const beam=box(6,.12,.12,edge,x,5.1,z,roof);beam.rotation.z=x<0?.22:-.22;}}
    label(plaque,-3.65,2.8,-4.6,3.3,1.3);
  } else if(kind==='archive') {
    box(1.9,.16,1.4,panelMat,0,1,0,center);box(1.5,.9,1.15,black,0,.5,0,center);
    for(let i=0;i<4;i++)box(.75,.12,.6,mat(i%2?0xa89376:0x597f85),i%2?.45:-.45,1.15+Math.floor(i/2)*.15,0,center);
    for(const x of [-5.7,5.7])for(const z of [-3,0,3])shelf(x,z,x<0?Math.PI/2:-Math.PI/2);
    shelf(-3.65,-4.6);label(plaque,-3.65,3.7,-4.5,3,1);
  } else if(kind==='crystal') {
    cylinder(1,.2,edge,0,.1,0,center);cylinder(.7,.75,black,0,.55,0,center);
    const jewel=new THREE.Mesh(new THREE.OctahedronGeometry(.85),mat(0xb8a1e8,.18,.65));jewel.position.y=1.9;center.add(jewel);
    const halo=ring(1,.02,glow,0,1.9,0,center);halo.rotation.x=.8;
    moving.push({object:jewel,axis:'y',speed:.18});
    for(const x of [-5.75,5.75])for(let z=-3;z<5;z+=2.5){box(.35,3.8,.45,panelMat,x,1.9,z);box(.04,2.8,.48,glow,x+(x<0?.2:-.2),2,z);}
    label(plaque,-3.65,2.7,-4.6,3.4,1.4);
  } else if(kind==='orrery') {
    cylinder(.9,.2,edge,0,.1,0,center);cylinder(.32,.9,black,0,.6,0,center);
    sphere(.43,glow,0,1.7,0,center);
    for(let i=0;i<3;i++){const r=ring(.72+i*.12,.025,white,0,1.7,0,center);r.rotation.set(.5+i*.5,i*.8,.2);}
    sphere(.13,warmGlow,.8,1.8,.4,center);
    // Wide star window replaces the back-left equipment wall.
    box(3.7,3,.12,black,-3.45,2.6,-4.72);
    for(let i=0;i<60;i++)box(.018,.018,.02,white,-5.15+((i*37)%100)/29,1.2+((i*61)%100)/37,-4.63);
    const planet=sphere(.66,mat(0x5e9db1),-3.8,2.8,-4.3);planet.scale.z=.35;
    const orbit=ring(.9,.03,warmGlow,-3.8,2.8,-4.25);orbit.rotation.x=1.1;
    label(plaque,-3.5,4.2,-4.6,3.5,1);
    for(let z=-3;z<6;z+=3){const rib=new THREE.Mesh(new THREE.TorusGeometry(5.8,.09,8,40,Math.PI),edge);rib.position.set(0,0,z);roof.add(rib);}
  } else {
    cylinder(1,.2,panelMat,0,.1,0,center);cylinder(.65,1,black,0,.65,0,center);
    for(let i=0;i<3;i++){const cube=box(.7,.7,.7,i%2?glow:white,0,1.5+i*.45,0,center);cube.rotation.set(.2,i*.7,.2);}
    for(const x of [-5.7,5.7])for(let z=-3;z<5;z+=2.6){cylinder(.2,4.8,panelMat,x,2.4,z);box(.35,.08,.35,warmGlow,x,3.8,z);}
    label(plaque,-3.65,2.8,-4.6,3.4,1.4);
  }
  colliders.push({...env.obstacle});
  // Wall fixtures never intrude into the walkable paths between evidence desks.
  colliders.push({x:-5.75,z:1,w:.65,d:11.5},{x:5.75,z:1,w:.65,d:11.5});
  return moving;
}
