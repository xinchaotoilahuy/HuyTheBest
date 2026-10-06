import * as THREE from 'three';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {FontLoader} from './vendor/FontLoader.js';
import {TextGeometry} from './vendor/TextGeometry.js';
import {Canvas3DRenderer} from './canvas3d.js';

const colors={school:'#00778e',score:'#3151c8',subjects:'#7531c1',chat:'#c82c49',math:'#0c814c',planner:'#ac650a',poster:'#c12d86',source:'#087183',writer:'#946015'};
const white=new THREE.Color('#ffffff');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const velocity=t=>{
  const base=t<.45?.5*Math.pow(t/.45,3):1-.5*Math.pow((1-t)/.55,4);
  return base+(t>.7?.02*Math.sin((t-.7)/.3*Math.PI):0);
};
let font=null,fontPromise=null,engine=null,initializing=null;

function loadTypeface(){
  if(font)return Promise.resolve(font);
  if(!fontPromise)fontPromise=fetch(new URL('./vendor/CinemaBold.typeface.json?v=vi-3d-2',import.meta.url))
    .then(response=>{if(!response.ok)throw new Error('Unable to load 3D typeface');return response.json();})
    .then(data=>font=new FontLoader().parse(data))
    .catch(error=>{fontPromise=null;throw error;});
  return fontPromise;
}

function configureRenderer(renderer){
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.transmissionResolutionScale=.5;
  return renderer;
}

function disposeModel(root){
  const geometry=new Set(),materials=new Set(),textures=new Set();
  root.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const key of ['map','normalMap','roughnessMap','alphaMap'])if(m[key])textures.add(m[key]);}});
  textures.forEach(t=>t.dispose());geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}

class Model {
  constructor(kind,software=false){
    this.kind=kind;this.software=software;this.group=new THREE.Group();this.parts=[];this.accents=[];
    const accent=new THREE.Color(colors[kind]);
    this.materials={
      paper:new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.3,metalness:0,clearcoat:.7,clearcoatRoughness:.28}),
      porcelain:new THREE.MeshPhysicalMaterial({color:'#eef5fb',roughness:.2,metalness:.08,clearcoat:1,clearcoatRoughness:.12}),
      ink:new THREE.MeshStandardMaterial({color:'#173446',roughness:.3,metalness:.12}),
      accent:new THREE.MeshPhysicalMaterial({color:accent.clone().lerp(white,.08),roughness:.2,metalness:.12,clearcoat:1,clearcoatRoughness:.1}),
      light:new THREE.MeshPhysicalMaterial({color:accent.clone().lerp(white,.78),roughness:.23,metalness:.03,clearcoat:1}),
      metal:new THREE.MeshPhysicalMaterial({color:'#cfdfeb',roughness:.18,metalness:.84,clearcoat:.8}),
      glass:new THREE.MeshPhysicalMaterial({color:accent.clone().lerp(white,.66),roughness:.1,metalness:0,transmission:.55,thickness:.7,ior:1.45,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.3}),
      glow:new THREE.MeshStandardMaterial({color:accent.clone().lerp(white,.55),emissive:accent,emissiveIntensity:.85,roughness:.3}),
    };
    this.build();
    this.measure();this.compact=null;
  }
  measure(){
    this.group.updateMatrixWorld(true);this.box=new THREE.Box3().setFromObject(this.group);
    this.center=this.box.getCenter(new THREE.Vector3());this.size=this.box.getSize(new THREE.Vector3());this.floorY=this.box.min.y-.15;
  }
  fit(aspect){
    if(this.kind!=='writer')return;
    const compact=aspect<1.65;if(compact===this.compact)return;this.compact=compact;
    const [ai,page]=this.parts;
    ai.position.x=compact?-1.55:-2.35;page.position.x=compact?1.3:2.1;
    ai.object.scale.setScalar(compact?.92:1.2);page.object.scale.setScalar(compact?.9:1.13);
    this.connection.scale.x=compact?.6:1;
    const saved=this.parts.map(p=>({p,position:p.object.position.clone(),rotation:p.object.quaternion.clone()}));
    this.parts.forEach(p=>{p.object.position.copy(p.position);p.object.quaternion.copy(p.quaternion);});this.measure();
    saved.forEach(({p,position,rotation})=>{p.object.position.copy(position);p.object.quaternion.copy(rotation);});
  }
  add(object,parent=this.group){parent.add(object);return object;}
  boxMesh(w,h,d,material=this.materials.accent,r=.08,parent=this.group){
    const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,this.software?1:2,Math.min(r,w/3,h/3,d/3)),material);
    m.castShadow=true;m.receiveShadow=true;return this.add(m,parent);
  }
  cylinder(radius,height,material=this.materials.accent,parent=this.group){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,this.software?32:48,1),material);
    m.castShadow=true;m.receiveShadow=true;return this.add(m,parent);
  }
  sphere(radius,material=this.materials.glass,parent=this.group){
    const m=new THREE.Mesh(new THREE.SphereGeometry(radius,this.software?20:40,this.software?12:24),material);m.castShadow=true;return this.add(m,parent);
  }
  torus(radius,tube,material=this.materials.metal,parent=this.group){
    const m=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,this.software?8:12,this.software?48:72),material);m.castShadow=true;return this.add(m,parent);
  }
  tube(points,radius=.023,material=this.materials.metal,parent=this.group){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const m=new THREE.Mesh(new THREE.TubeGeometry(curve,this.software?24:40,radius,this.software?6:8,false),material);return this.add(m,parent);
  }
  letters(text,size=.6,depth=.1,material=this.materials.paper,parent=this.group){
    text=text.normalize('NFC');
    const geometry=new TextGeometry(text,{font,size,depth,curveSegments:this.software?3:5,bevelEnabled:true,bevelThickness:Math.min(.012,depth*.28),bevelSize:Math.min(.009,size*.025),bevelSegments:this.software?1:2});
    geometry.computeBoundingBox();const b=geometry.boundingBox;geometry.translate(-(b.max.x+b.min.x)/2,-(b.max.y+b.min.y)/2,-depth/2);
    const m=new THREE.Mesh(geometry,material);m.castShadow=true;return this.add(m,parent);
  }
  label(lines,w,h,{background=null,color='#153746',fontSize=74,bold=false,serif=false,align='center'}={},parent=this.group){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*h/w);
    const ctx=canvas.getContext('2d');
    if(background){ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height);}
    ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';
    ctx.font=`${bold?'700':'500'} ${fontSize}px ${serif?'Editorial':'Cinema'},sans-serif`;
    const rows=Array.isArray(lines)?lines:[lines];const lineHeight=fontSize*1.42;
    rows.forEach((row,i)=>ctx.fillText(row,align==='left'?70:512,canvas.height/2+(i-(rows.length-1)/2)*lineHeight,880));
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    const material=new THREE.MeshBasicMaterial({map:texture,transparent:!background,depthWrite:!!background,toneMapped:false});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);return this.add(mesh,parent);
  }
  animated(object,{delay=0,from=[0,0,-1.2],rotation=[0,0,0],float=.035,phase=0,mode='float'}={}){
    this.parts.push({object,position:object.position.clone(),quaternion:object.quaternion.clone(),delay,from:new THREE.Vector3(...from),rotation:new THREE.Euler(...rotation),float,phase,mode});
    return object;
  }
  groupAt(x,y,z,parent=this.group){const g=new THREE.Group();g.position.set(x,y,z);this.add(g,parent);return g;}
  base(w,d,x=0,z=0,y=-1.35){
    const b=this.boxMesh(w,.24,d,this.materials.porcelain,.1);b.position.set(x,y,z);return b;
  }
  build(){
    this[this.kind]();
  }
  book(title,x,y,z,{color=this.materials.accent,rotation=0}={}){
    const g=this.groupAt(x,y,z);g.rotation.set(-.12,rotation,-.07);
    const pages=this.boxMesh(1.35,1.85,.34,this.materials.paper,.025,g);
    for(const side of [-1,1]){const cover=this.boxMesh(1.47,1.98,.075,color,.035,g);cover.position.z=side*.22;}
    const spine=this.boxMesh(.12,1.98,.49,color,.045,g);spine.position.x=-.675;
    for(let i=0;i<5;i++){const line=this.boxMesh(1.1,.013,.008,this.materials.light,.001,g);line.position.set(.04,-.75+i*.35,.174);}
    const name=this.letters(title,.255,.028,this.materials.paper,g);
    const bounds=name.geometry.boundingBox;name.scale.setScalar(Math.min(1,1.15/(bounds.max.x-bounds.min.x)));
    name.position.set(0,.08,.286);
    return g;
  }
  school(){
    const book=this.book('Sinh học',-1.12,-.05,.2,{rotation:.5});
    this.animated(book,{from:[-1.2,.1,-1.8],rotation:[.2,-.5,-.2],float:.035});
    const house=this.groupAt(1.13,-.27,0);house.rotation.y=-.36;
    const body=this.boxMesh(1.4,1.05,1,this.materials.porcelain,.075,house);body.position.y=-.18;
    const shape=new THREE.Shape();shape.moveTo(-.83,0);shape.lineTo(.83,0);shape.lineTo(0,.67);shape.closePath();
    const roof=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:1.17,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2,steps:1}),this.materials.accent);roof.position.set(0,.34,-.585);roof.castShadow=true;this.add(roof,house);
    const door=this.boxMesh(.34,.62,.07,this.materials.accent,.045,house);door.position.set(-.24,-.39,.525);
    const window=this.boxMesh(.35,.34,.08,this.materials.glass,.035,house);window.position.set(.35,-.15,.53);
    this.animated(house,{delay:150,from:[.8,-.4,-1.8],rotation:[0,.5,.08],float:.015,phase:2});
    const name=this.letters('VÕ KHẢI',.25,.06,this.materials.accent);name.position.set(0,1.25,.08);
    this.tube([[-.1,1.03,-.1],[-.74,.88,0],[-1.15,.81,.1]],.018,this.materials.metal);
    this.tube([[.1,1.03,-.1],[.71,.95,-.1],[1.14,.89,-.1]],.018,this.materials.metal);
    this.group.rotation.y=-.18;
  }
  score(){
    this.base(4.1,1.75,0,0,-1.33);
    for(const [i,count,height] of [[0,'400',2.4],[1,'300',1.8]]){
      const g=this.groupAt(i===0?-1.02:1.02,-1.19,0);
      const bar=this.boxMesh(1.05,height,.88,i===0?this.materials.accent:this.materials.light,.08,g);bar.position.y=height/2;
      const number=this.letters(count,.44,.08,i===0?this.materials.accent:this.materials.ink,g);number.position.set(0,height+.39,.25);
      this.animated(g,{from:[0,-.7,-1.3],rotation:[.08,0,0],float:.008,phase:0});
    }
    this.group.rotation.y=-.29;
  }
  subjects(){
    const physics=this.book('Vật lí',-1.08,0,.14,{rotation:.6});
    const informatics=this.book('Toán',1.13,.08,-.12,{color:this.materials.light,rotation:-.5});
    informatics.children.filter(o=>o.geometry?.type==='TextGeometry').forEach(o=>o.material=this.materials.accent);
    this.animated(physics,{from:[-1.25,0,-1.5],rotation:[0,-.8,-.14],float:.035});
    this.animated(informatics,{delay:180,from:[1.25,0,-1.5],rotation:[0,.8,.16],float:.035,phase:Math.PI});
    const plus=this.letters('+',.48,.09,this.materials.metal);plus.position.set(.02,.12,.33);
    this.group.rotation.y=-.14;
  }
  chat(){
    const calendar=this.groupAt(0,0,0);calendar.rotation.set(-.07,-.2,-.045);
    const back=this.boxMesh(2.35,2.3,.35,this.materials.paper,.095,calendar);
    const top=this.boxMesh(2.35,.49,.095,this.materials.accent,.045,calendar);top.position.set(0,.91,.21);
    const date=this.letters('12/10',.46,.055,this.materials.ink,calendar);date.position.set(0,.13,.27);
    for(const x of [-.7,.7]){const ring=this.torus(.15,.039,this.materials.metal,calendar);ring.rotation.x=Math.PI/2;ring.position.set(x,1.15,.08);}
    const line=this.boxMesh(1.7,.025,.025,this.materials.light,.006,calendar);line.position.set(0,-.5,.2);
    this.animated(calendar,{from:[0,.8,-2],rotation:[.35,.4,-.15],float:.025});
    for(const [i,x,y] of [[0,-1.42,-.7],[1,1.45,.28]]){
      const chip=this.groupAt(x,y,.65);chip.rotation.y=i===0?.2:-.2;
      this.boxMesh(.72,.8,.25,this.materials.glass,.08,chip);
      const q=this.letters('?',.42,.055,this.materials.accent,chip);q.position.z=.17;
      this.animated(chip,{delay:260+i*100,from:[x*.4,.5,-1.5],rotation:[0,i===0?-.6:.6,0],float:.07,phase:i*2.2});
    }
    this.group.rotation.y=-.12;
  }
  math(){
    for(let row=0;row<3;row++)for(let column=0;column<3;column++){
      const cube=this.boxMesh(.56,.56,.56,(row+column)%2?this.materials.light:this.materials.accent,.055);
      cube.position.set((column-1)*.65,(1-row)*.65-.14,0);
      this.animated(cube,{delay:(row+column)*75,from:[0,-.5,-1.4-column*.2],rotation:[.22,.25,.08],float:.009,phase:row+column});
    }
    const formula=this.groupAt(0,1.24,.16);
    const three=this.letters('3',.6,.09,this.materials.ink,formula);three.position.x=-.73;
    const power=this.letters('2',.29,.065,this.materials.accent,formula);power.position.set(-.37,.28,0);
    const rest=this.letters('= 9',.6,.09,this.materials.ink,formula);rest.position.x=.52;
    this.animated(formula,{delay:260,from:[0,.7,-1.8],rotation:[-.15,0,0],float:.012});
    this.group.rotation.y=-.28;
  }
  planner(){
    const dial=this.groupAt(0,0,0);dial.rotation.set(-.06,-.22,0);
    const rim=this.cylinder(1.18,.24,this.materials.metal,dial);rim.rotation.x=Math.PI/2;
    const face=this.cylinder(1.1,.16,this.materials.paper,dial);face.rotation.x=Math.PI/2;face.position.z=.18;
    const bezel=this.torus(1.115,.065,this.materials.accent,dial);bezel.position.z=.26;
    for(let i=0;i<12;i++){
      const theta=i*Math.PI/6;const tick=this.boxMesh(.023,.085,.016,this.materials.accent,.004,dial);tick.position.set(Math.sin(theta)*.97,Math.cos(theta)*.97,.275);tick.rotation.z=-theta;
    }
    const sixty=this.letters('60',.68,.055,this.materials.ink,dial);sixty.position.set(0,.06,.28);
    const minutes=this.letters('Phút',.19,.03,this.materials.accent,dial);minutes.position.set(0,-.42,.28);
    this.animated(dial,{from:[0,-.6,-2],rotation:[.45,-.8,.12],float:.025});
    this.group.rotation.y=-.13;
  }
  poster(){
    const words=['Nét','phấn','yêu','thương'];
    words.forEach((word,i)=>{
      const g=this.groupAt(i%2?1.12:-1.05,i<2?.6:-.6,(i%2)*.16);g.rotation.y=i%2?-.12:.1;g.rotation.z=i%2?-.045:.045;
      const text=this.letters(word,i===3?.36:.4,.17,i%2?this.materials.accent:this.materials.ink,g);
      const base=this.boxMesh(i===3?2.15:1.7,.13,.95,this.materials.light,.055,g);base.position.set(0,-.36,0);
      const number=this.letters(String(i+1),.19,.045,this.materials.accent,g);number.position.set(0,-.47,.53);
      this.animated(g,{delay:i*95,from:[0,-.8,-1.6],rotation:[.2,i%2?.3:-.3,.1],float:.02,phase:i});
    });
    this.group.rotation.y=-.17;
  }
  source(){
    const quote=this.groupAt(-.54,.35,-.2);quote.rotation.set(-.04,.16,-.08);
    for(let i=2;i>=0;i--){const page=this.boxMesh(2.25,2.3,.07,i===0?this.materials.paper:this.materials.light,.035,quote);page.position.set(i*.04,-i*.035,-i*.1);}
    const heading=this.letters('“ ”',.64,.05,this.materials.accent,quote);heading.position.set(0,.58,.095);
    const first=this.letters('Một tài liệu',.205,.025,this.materials.ink,quote);first.position.set(0,.12,.095);
    const second=this.letters('của trường',.205,.025,this.materials.ink,quote);second.position.set(0,-.26,.095);
    this.animated(quote,{from:[-.7,.7,-1.8],rotation:[.2,.5,-.2],float:.024});
    const original=this.groupAt(1.31,-.7,.5);original.rotation.y=-.16;
    this.boxMesh(1.12,1.15,.46,this.materials.glass,.09,original);
    const q=this.letters('?',.69,.085,this.materials.accent,original);q.position.z=.29;
    this.animated(original,{delay:240,from:[.7,-.5,-1.6],rotation:[0,-.7,.15],float:.03,phase:2.2});
    this.tube([[.25,-.34,.1],[.49,-.61,.29],[.64,-.68,.41]],.021,this.materials.metal);
    this.group.rotation.y=-.13;
  }
  writer(){
    const ai=this.groupAt(-2.35,0,0);ai.rotation.y=.16;
    const blue=new THREE.MeshPhysicalMaterial({color:'#219bc1',roughness:.18,metalness:.16,clearcoat:1,clearcoatRoughness:.1});
    const core=this.boxMesh(1.7,1.7,1.3,blue,.17,ai);
    core.position.y=.05;
    const blueGlass=new THREE.MeshPhysicalMaterial({color:'#56c8e6',roughness:.12,transmission:.55,thickness:.35,ior:1.45,clearcoat:1});
    const window=this.boxMesh(1.44,1.44,.2,blueGlass,.13,ai);window.position.set(0,.05,.76);
    const type=this.letters('AI',.63,.12,this.materials.paper,ai);type.position.set(0,.12,.9);
    for(let i=0;i<5;i++)for(const side of [-1,1]){
      const pin=this.boxMesh(.22,.105,.2,this.materials.metal,.025,ai);pin.position.set(side*.98,(i-2)*.27,.05);
    }
    const orbit=this.torus(1.23,.026,this.materials.metal,ai);orbit.rotation.x=.55;orbit.rotation.y=.4;orbit.position.y=.02;
    this.animated(ai,{from:[-1.4,.2,-2],rotation:[0,-.65,-.12],float:.07});
    this.accents.push({object:orbit,axis:'z',speed:.12});
    ai.scale.setScalar(1.2);

    const page=this.groupAt(2.1,.16,.12);page.rotation.set(-.09,-.16,-.04);
    for(let i=3;i>=0;i--){const sheet=this.boxMesh(2.1,2.65,.055,i===0?this.materials.paper:this.materials.light,.032,page);sheet.position.set((i-1.5)*.045,-i*.035,-i*.09);}
    const title=this.letters('Giảm rác',.205,.017,this.materials.ink,page);title.position.set(0,.72,.065);
    const subtitle=this.letters('trong lớp',.205,.017,this.materials.ink,page);subtitle.position.set(0,.37,.065);
    const name=this.letters('HUY',.225,.025,this.materials.accent,page);name.position.set(0,1.05,.065);
    for(let i=0;i<5;i++){const line=this.boxMesh(i===4?.95:1.6,.024,.012,i===0?this.materials.accent:this.materials.light,.004,page);line.position.set(i===4?-.33:0,.05-i*.22,.04);}
    const check=this.tube([[-.67,-.94,.07],[-.52,-1.08,.07],[-.3,-.81,.07]],.025,this.materials.accent,page);
    const pencil=this.groupAt(1.25,-.28,.15,page);pencil.rotation.z=-.23;
    const shaft=this.cylinder(.065,1.75,this.materials.accent,pencil);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.065,.18,12),this.materials.metal);tip.position.y=-.96;tip.rotation.z=Math.PI;this.add(tip,pencil);
    this.animated(page,{delay:160,from:[1.3,.7,-1.8],rotation:[.25,.65,.14],float:.03,phase:2.4});
    page.scale.setScalar(1.13);
    this.connection=this.groupAt(0,0,0);
    this.tube([[-1.25,.03,.4],[-.45,.14,.6],[.55,.14,.6]],.017,this.materials.metal,this.connection);
    const arrow=new THREE.Mesh(new THREE.ConeGeometry(.1,.25,16),this.materials.accent);arrow.rotation.z=-Math.PI/2;arrow.position.set(.63,.14,.6);this.add(arrow,this.connection);
    const pulse=this.sphere(.055,this.materials.glow,this.connection);pulse.position.set(-1.15,.03,.4);
    this.accents.push({object:pulse,mode:'transfer'});
    this.group.rotation.y=-.18;
  }
}

class Studio {
  constructor(renderer,environment){
    this.renderer=renderer;this.environment=environment;this.scene=new THREE.Scene();this.scene.environment=environment.texture;
    this.camera=new THREE.PerspectiveCamera(32,1,.1,100);this.target=new THREE.Vector3();
    this.key=new THREE.DirectionalLight('#ffffff',4.2);this.key.position.set(-4,7,6);this.key.castShadow=true;
    this.key.shadow.mapSize.set(1024,1024);this.key.shadow.camera.left=-7;this.key.shadow.camera.right=7;this.key.shadow.camera.top=7;this.key.shadow.camera.bottom=-7;this.key.shadow.camera.near=.1;this.key.shadow.camera.far=24;this.key.shadow.normalBias=.035;this.key.shadow.bias=-.0002;this.key.shadow.radius=3;this.scene.add(this.key);
    const fill=new THREE.DirectionalLight('#c5e5ff',1.3);fill.position.set(6,2,5);this.scene.add(fill);
    const rim=new THREE.DirectionalLight('#ffffff',2.6);rim.position.set(1,6,-5);this.scene.add(rim);
    this.scene.add(new THREE.HemisphereLight('#ffffff','#9ca7b5',2.3));
    this.floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.ShadowMaterial({opacity:.17}));this.floor.rotation.x=-Math.PI/2;this.floor.receiveShadow=true;this.scene.add(this.floor);
    this.pointer=new THREE.Vector2();this.pointerCurrent=new THREE.Vector2();this.stage=null;this.model=null;this.raf=0;this.lastFrame=0;this.start=0;this.pulseStart=-10000;this.inView=true;this.off=false;this.lite=false;this.staticFrame=false;
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.visibilityObserver=new IntersectionObserver(entries=>{const entry=entries.find(e=>e.target===this.stage);if(!entry)return;this.inView=entry.isIntersecting;if(this.inView)this.wake();else this.stop();},{rootMargin:'100px'});
    this.preferenceObserver=new MutationObserver(()=>this.preferences());
    this.preferenceObserver.observe(document.body,{attributes:true,attributeFilter:['class']});this.preferenceObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();else this.wake();});
    window.addEventListener('pagehide',()=>this.stop());
    this.onContextLost=e=>{e.preventDefault();this.useSoftware();this.wake();};
    if(!renderer.isSoftware)renderer.domElement.addEventListener('webglcontextlost',this.onContextLost);
  }
  useSoftware(){
    if(this.renderer.isSoftware)return;
    const old=this.renderer;old.domElement.removeEventListener('webglcontextlost',this.onContextLost);
    this.renderer=configureRenderer(new Canvas3DRenderer());
    this.renderer.domElement.setAttribute('aria-hidden','true');
    if(this.stage){old.domElement.replaceWith(this.renderer.domElement);this.stage.dataset.renderer='canvas3d';}
    this.scene.environment=null;this.environment.dispose?.();this.environment={texture:null};old.dispose();
    this.preferences();
  }
  mount(stage){
    if(this.stage===stage)return;
    this.unmount();this.stage=stage;this.model=new Model(stage.dataset.model,this.renderer.isSoftware);this.scene.add(this.model.group);
    this.rootQuaternion=this.model.group.quaternion.clone();this.floor.position.y=this.model.floorY;
    stage.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-hidden','true');
    this.pointer.set(0,0);this.pointerCurrent.set(0,0);
    this.onPointer=e=>{if(e.pointerType==='touch'||this.lite||this.off)return;const r=stage.getBoundingClientRect();this.pointer.set(clamp((e.clientX-r.left)/r.width-.5,-.5,.5),clamp((e.clientY-r.top)/r.height-.5,-.5,.5));this.wake();};
    this.onLeave=()=>{this.pointer.set(0,0);this.wake();};
    stage.addEventListener('pointermove',this.onPointer,{passive:true});stage.addEventListener('pointerleave',this.onLeave,{passive:true});
    this.inView=true;this.lastFrame=0;
    this.resizeObserver.observe(stage);this.visibilityObserver.observe(stage);this.start=performance.now();this.preferences();this.resize();
    this.stop();this.animate(performance.now());stage.classList.add('model-ready');stage.dataset.renderer=this.renderer.isSoftware?'canvas3d':'webgl';this.wake();
  }
  unmount(){
    this.stop();if(!this.stage)return;
    this.resizeObserver.unobserve(this.stage);this.visibilityObserver.unobserve(this.stage);
    this.stage.removeEventListener('pointermove',this.onPointer);this.stage.removeEventListener('pointerleave',this.onLeave);
    this.blurAnimation?.cancel();this.stage.classList.remove('model-ready');this.renderer.domElement.remove();
    if(this.model){this.scene.remove(this.model.group);disposeModel(this.model.group);this.model=null;}
    this.stage=null;
  }
  preferences(){
    this.off=document.body.classList.contains('motion-off');this.lite=document.body.classList.contains('performance');
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.lite?1:innerWidth<760?1.2:1.5));
    this.floor.material.opacity=document.documentElement.dataset.theme==='dark'?.35:.17;
    if(this.off){this.blurAnimation?.cancel();this.pulseStart=-10000;this.pointer.set(0,0);this.pointerCurrent.set(0,0);this.start=performance.now()-3000;this.stop();}
    this.resize();this.wake();
  }
  resize(){
    if(!this.stage||!this.model)return;
    const {width,height}=this.stage.getBoundingClientRect();if(width<1||height<1)return;
    this.renderer.setSize(width,height,false);this.camera.aspect=width/height;
    this.model.fit(this.camera.aspect);this.floor.position.y=this.model.floorY;
    const size=this.model.size,center=this.model.center;const tan=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));
    const distance=Math.max((size.y+.6)/(2*tan),(size.x+.6)/(2*tan*this.camera.aspect),4.8);
    this.target.copy(center);this.camera.position.set(center.x,center.y+distance*.2,center.z+distance);this.camera.lookAt(center);this.camera.updateProjectionMatrix();this.wake();
  }
  impulse(){
    if(!this.model||this.off)return Promise.resolve();
    this.pulseStart=performance.now();this.blurAnimation?.cancel();
    if(this.renderer.domElement.animate){this.blurAnimation=this.renderer.domElement.animate([{filter:'blur(0px)'},{filter:`blur(${this.lite?.3:1.1}px)`,offset:.27},{filter:'blur(0px)',offset:.7},{filter:'blur(0px)'}],{duration:1250,easing:'cubic-bezier(.22,1,.36,1)'});this.blurAnimation.finished.catch(()=>{});}
    this.wake();return Promise.resolve();
  }
  stop(){if(this.raf){cancelAnimationFrame(this.raf);this.raf=0;}}
  wake(){if(!this.stage||document.hidden||!this.inView)return;if(!this.raf)this.raf=requestAnimationFrame(t=>this.animate(t));}
  animate(now){
    this.raf=0;if(!this.stage||!this.model)return;
    const minimumFrame=this.renderer.isSoftware?1000/24:this.lite||innerWidth<760?1000/30:1000/45;
    if(now-this.lastFrame<minimumFrame){this.wake();return;}
    this.lastFrame=now;const elapsed=now-this.start,t=now/1000;
    this.pointerCurrent.lerp(this.pointer,.075);
    const pulse=clamp((now-this.pulseStart)/1250,0,1);const envelope=pulse<1?Math.sin(pulse*Math.PI)*Math.exp(-pulse*1.7):0;
    const turn=new THREE.Quaternion().setFromEuler(new THREE.Euler(-this.pointerCurrent.y*.2-envelope*.06,this.pointerCurrent.x*.28+envelope*.1,0));
    this.model.group.quaternion.copy(this.rootQuaternion).multiply(turn);
    let assembling=false;
    for(const item of this.model.parts){
      const p=this.off?1:clamp((elapsed-item.delay)/1100,0,1);if(p<1)assembling=true;
      const ease=velocity(p),fade=1-ease;item.object.position.copy(item.position).addScaledVector(item.from,fade);
      const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(item.rotation.x*fade,item.rotation.y*fade,item.rotation.z*fade));
      item.object.quaternion.copy(item.quaternion).multiply(rotation);
      if(!this.off)item.object.position.z+=envelope*.38;
      if(!this.off&&!this.lite&&p===1)item.object.position.y+=Math.sin(t*.82+item.phase)*item.float;
    }
    if(!this.off&&!this.lite)for(const a of this.model.accents){
      if(a.mode==='transfer'){const progress=(t*.3)%1;a.object.position.set(-1.15+progress*1.7,.03+Math.sin(progress*Math.PI)*.11,.4+Math.sin(progress*Math.PI)*.2);}
      else a.object.rotation[a.axis]+=a.speed*(minimumFrame/1000);
    }
    try{this.renderer.render(this.scene,this.camera);}
    catch(error){if(this.renderer.isSoftware)throw error;this.useSoftware();this.renderer.render(this.scene,this.camera);}
    if(!this.off&&(!this.lite||assembling||pulse<1||this.pointerCurrent.distanceTo(this.pointer)>.002))this.wake();
  }
}

async function initialize(){
  if(engine)return engine;if(initializing)return initializing;
  initializing=(async()=>{
    await loadTypeface();
    let renderer,environment={texture:null};
    try{
      const canvas=document.createElement('canvas');const context=canvas.getContext('webgl2',{antialias:true,alpha:true,powerPreference:'high-performance'});
      renderer=context?new THREE.WebGLRenderer({canvas,context,antialias:true,alpha:true,powerPreference:'high-performance'}):new Canvas3DRenderer();
      if(!renderer.isSoftware){const room=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);try{environment=pmrem.fromScene(room,.045);}finally{pmrem.dispose();room.dispose();}}
    }catch(error){renderer?.dispose?.();renderer=new Canvas3DRenderer();}
    configureRenderer(renderer);
    engine=new Studio(renderer,environment);return engine;
  })().catch(error=>{initializing=null;throw error;});return initializing;
}

async function prepare(root){
  const stage=root?.querySelector('.sculpt-stage');
  if(!stage){engine?.unmount();return;}
  const studio=await initialize();if(stage.isConnected)studio.mount(stage);
}
export const Sculpture={prepare,handles:root=>!!engine?.stage&&root.contains(engine.stage),impulse:()=>engine?.impulse()};
window.Sculpture=Sculpture;
loadTypeface().catch(()=>{});
