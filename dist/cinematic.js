import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {MeshoptDecoder} from './vendor/meshopt_decoder.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Original procedural scene. No stock footage, external models, or paid APIs.
const clamp=T.MathUtils.clamp,lerp=T.MathUtils.lerp;
const ease=x=>1-Math.pow(1-clamp(x,0,1),3);
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const materialCache=new Map();function material(color,roughness=.65,metalness=0,extra={}){const key=Object.keys(extra).length?null:color+'|'+roughness+'|'+metalness;if(key&&materialCache.has(key))return materialCache.get(key);const mat=new T.MeshStandardMaterial({color,roughness,metalness,...extra});if(key)materialCache.set(key,mat);return mat}
function mesh(geometry,mat,parent,x=0,y=0,z=0){const o=new T.Mesh(geometry,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function box(w,h,d,mat,parent,x=0,y=0,z=0){return mesh(new T.BoxGeometry(w,h,d),mat,parent,x,y,z)}
function rounded(w,h,d,r,mat,parent,x=0,y=0,z=0){const s=new T.Shape(),a=-w/2,b=-h/2;r=Math.min(r,w*.45,h*.45,d*.45);s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r,curveSegments:8});g.translate(0,0,-d/2+r);return mesh(g,mat,parent,x,y,z)}
function cylinder(radius,length,mat,parent,x=0,y=0,z=0,segments=32){return mesh(new T.CylinderGeometry(radius,radius,length,segments),mat,parent,x,y,z)}
function pipe(points,r,mat,parent){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),56,r,20,false),mat,parent)}
function noiseTexture(kind){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),im=ctx.createImageData(256,256);let seed=723;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;let v=kind==='rubber'?30+rand()*34:kind==='asphalt'?63+rand()*37:155+rand()*20;if(kind==='asphalt'&&rand()>.97)v+=52;im.data[i]=v;im.data[i+1]=v;im.data[i+2]=v;im.data[i+3]=255}ctx.putImageData(im,0,0);const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(kind==='asphalt'?8:3,kind==='asphalt'?8:3);return tex}
function contactTexture(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(0,0,0,.85)');g.addColorStop(.4,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c)}
function mergeStaticMeshes(root,excluded=new Set()){
 root.updateMatrixWorld(true);const inv=new T.Matrix4().copy(root.matrixWorld).invert(),groups=new Map();
 root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;let parent=o,skip=false;while(parent&&parent!==root){if(excluded.has(parent)){skip=true;break}parent=parent.parent}if(skip)return;const g=o.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));const key=o.material.uuid+Object.keys(g.attributes).sort().join(',')+Boolean(g.index);if(!groups.has(key))groups.set(key,{material:o.material,geometries:[],objects:[]});const group=groups.get(key);group.geometries.push(g);group.objects.push(o)});
 for(const {material,geometries,objects}of groups.values()){const joined=mergeGeometries(geometries,false);if(!joined){geometries.forEach(g=>g.dispose());continue}for(const o of objects)o.removeFromParent();const m=new T.Mesh(joined,material);m.castShadow=true;m.receiveShadow=true;root.add(m);geometries.forEach(g=>g.dispose())}
}
function environment(renderer){const scene=new T.Scene();scene.background=new T.Color('#526172');const wall=material('#526172',1);box(12,8,12,wall,scene);const colors=['#a6c6eb','#f3d7ae','#ffffff','#33475e'];for(let i=0;i<4;i++){const panel=mesh(new T.PlaneGeometry(5,4),new T.MeshBasicMaterial({color:colors[i],side:T.DoubleSide}),scene,Math.cos(i*Math.PI/2)*4,2,Math.sin(i*Math.PI/2)*4);panel.lookAt(0,1,0)}const generator=new T.PMREMGenerator(renderer);const env=generator.fromScene(scene,.02).texture;generator.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose()});return env}

function bathroom(env){
 const scene=new T.Scene();scene.background=new T.Color('#0a131c');scene.environment=env;scene.fog=new T.FogExp2('#101b27',.13);
 const chrome=material('#b8c2c8',.23,.95,{bumpMap:noiseTexture('rubber'),bumpScale:.00045}),gasket=material('#1a2229',.92),tile=material('#38434b',.3,.04),wood=material('#22262a',.88),ceramic=material('#c6cdcf',.24);
 const floor=mesh(new T.PlaneGeometry(12,12),tile,scene);floor.rotation.x=-Math.PI/2;
 for(let i=-6;i<=6;i++){box(.006,.002,8,material('#19252d',.8),scene,i*.48,.002,0);box(8,.002,.006,material('#19252d',.8),scene,0,.002,i*.48)}
 box(6,3,.12,material('#3b4145',.93,0,{map:noiseTexture('plaster')}),scene,0,1.4,-.62);
 box(2.2,.08,.8,ceramic,scene,0,1.72,-.1);box(.08,1.64,.75,wood,scene,-.96,.86,-.1);box(.08,1.64,.75,wood,scene,.96,.86,-.1);
 // Open cabinet panels and a real U-shaped trap with compression fittings.
 const door=box(.72,1.55,.035,wood,scene,-1.18,.85,.55);door.rotation.y=-.7;
 cylinder(.052,.51,chrome,scene,0,1.39,0);
 pipe([[0,1.18,0],[0,.86,0],[.03,.68,0],[.18,.63,0],[.33,.69,0],[.36,.87,0],[.36,1.03,0],[.36,1.1,-.15],[.36,1.1,-.52]],.048,chrome,scene);
 for(const [x,y,z]of [[0,1.19,0],[.36,1.02,0]]){cylinder(.074,.078,chrome,scene,x,y,z,6);cylinder(.076,.009,gasket,scene,x,y-.039,z);cylinder(.061,.008,chrome,scene,x,y+.045,z)}
 const wallRing=mesh(new T.TorusGeometry(.083,.013,12,40),chrome,scene,.36,1.1,-.54);
 cylinder(.04,.08,chrome,scene,-.4,.93,-.49).rotation.x=Math.PI/2;
 pipe([[-.4,.93,-.45],[-.4,1.28,-.32],[-.34,1.57,-.12]],.012,chrome,scene);
 const valve=box(.11,.02,.04,chrome,scene,-.4,.93,-.38);valve.rotation.z=.2;
 const water=new T.MeshPhysicalMaterial({color:'#9bc2d4',metalness:.04,roughness:.045,transparent:true,opacity:.78,transmission:.22,ior:1.333,thickness:.018,clearcoat:1,envMapIntensity:1.4});
 const source=new T.Vector3(.058,1.145,.017),dropGeometry=new T.SphereGeometry(.0045,14,12);
 const drops=Array.from({length:4},()=>mesh(dropGeometry,water,scene));
 const puddle=mesh(new T.CircleGeometry(.23,64),new T.MeshPhysicalMaterial({color:'#667b85',roughness:.04,metalness:.18,transparent:true,opacity:.38,clearcoat:1}),scene,.058,.005,.017);puddle.rotation.x=-Math.PI/2;puddle.scale.y=.74;
 const ripples=Array.from({length:3},()=>{const r=mesh(new T.TorusGeometry(.04,.0014,6,50),new T.MeshBasicMaterial({color:'#a1bac3',transparent:true,opacity:.22}),scene,source.x,.008,source.z);r.rotation.x=-Math.PI/2;return r});
 const ambient=new T.HemisphereLight('#8aaace','#101824',.5);scene.add(ambient);
 const warm=new T.SpotLight('#ffd3a0',26,7,.65,.75,1.8);warm.position.set(-1.8,2.6,1.5);warm.target.position.set(0,.6,0);warm.castShadow=true;warm.shadow.mapSize.set(1024,1024);warm.shadow.bias=-.0002;scene.add(warm,warm.target);
 const blue=new T.PointLight('#8dbce9',7,4,2);blue.position.set(1.5,1.9,-.2);scene.add(blue);
 return {scene,update(time,camera,mobile){camera.fov=mobile?52:46;camera.position.set(lerp(.68,.55,time/2.6),.21,lerp(1.65,1.42,time/2.6));camera.lookAt(.06,.50,0);camera.updateProjectionMatrix();const cycle=.36,life=Math.sqrt(2*source.y/9.81);drops.forEach((d,i)=>{const age=(time+i*cycle)/cycle%4*cycle;d.visible=age<life;if(d.visible){d.position.set(source.x,source.y-4.905*age*age,source.z);d.scale.set(1,1+age*2.8,1)}});ripples.forEach((r,i)=>{const a=(time+i*.36+.09)%1.08;r.scale.setScalar(.2+a*3.3);r.material.opacity=Math.max(0,.25-a*.25)});puddle.scale.x=1+Math.min(time,2.6)*.035}};
}

function exterior(env,mobile,renderer,textures,vehicle){
 const scene=new T.Scene();scene.background=new T.Color('#080f18');scene.environment=env;scene.fog=new T.FogExp2('#0a1420',.052);
 const [asphalt,normal,rough]=textures;const road=new T.MeshPhysicalMaterial({color:'#545e64',map:asphalt,normalMap:normal,normalScale:new T.Vector2(.22,.22),roughnessMap:rough,roughness:.48,metalness:.02,clearcoat:.32,clearcoatRoughness:.3,envMapIntensity:.3});
 const ground=mesh(new T.PlaneGeometry(60,60),road,scene);ground.rotation.x=-Math.PI/2;
 const concrete=material('#455057',.77),siding=material('#394249',.83),dark=material('#101820',.8),warmMat=new T.MeshBasicMaterial({color:'#e1b77d'});
 const curb=box(.22,.13,17,concrete,scene,-2.3,.065,1);box(.2,.13,17,concrete,scene,4.2,.065,1);
 // Residential context: porch, siding, doorway and practical warm lights.
 box(8,3.8,.16,siding,scene,-3,1.9,6.8);box(4,4,.15,material('#252e37',.92),scene,5,2,8.5);
 for(let y=.2;y<3.8;y+=.17)box(8,.008,.018,material('#202b35',.9),scene,-3,y,6.70);
 box(1.1,2.15,.1,dark,scene,-2.4,1.07,6.65);box(.06,2.25,.06,concrete,scene,-3,1.13,6.52);box(.06,2.25,.06,concrete,scene,-1.8,1.13,6.52);box(1.3,.07,.06,concrete,scene,-2.4,2.25,6.52);
 box(1.4,.06,.8,concrete,scene,-2.4,.03,6.2);
 for(const x of [-5.3,.1]){box(1.0,1.1,.02,material('#152331',.32,.1),scene,x,1.8,6.6);box(.035,1.1,.03,concrete,scene,x,1.8,6.57)}
 mesh(new T.SphereGeometry(.06,16,10),warmMat,scene,-1.55,2.1,6.2);const porch=new T.PointLight('#ffd19a',8,9,2);porch.position.set(-1.55,2.1,6.1);porch.castShadow=!mobile;scene.add(porch);
 scene.add(new T.HemisphereLight('#6684a5','#111519',.3));const moon=new T.DirectionalLight('#a8bfd7',.55);moon.position.set(4,8,-4);moon.castShadow=true;moon.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);moon.shadow.camera.left=-7;moon.shadow.camera.right=7;moon.shadow.camera.top=7;moon.shadow.camera.bottom=-7;moon.shadow.normalBias=.004;scene.add(moon);
 const van=new T.Group();scene.add(van);const trim=material('#1b2229',.6),shadowTex=contactTexture(),wheels=[];
 // CC0 unbranded service van. Preserve real wheel arches, glazing and proportions.
 vehicle.updateMatrixWorld(true);const wheelParts=[],tires=[];
 vehicle.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;if(/tyre|tire|rim.?barrel|plastic.?wheel.?cover|wheel.?cover/i.test(o.name)&&!/arch|well|steering/i.test(o.name))wheelParts.push(o);if(/tyre|tire/i.test(o.name))tires.push(o);if(o.material){const m=o.material;if(['white','paint','stripe1','stripe2'].includes(m.name)){m.color.set('#b8c0c3');m.roughness=.32;m.metalness=.18}if(m.name==='lamp'){m.emissive=new T.Color('#ffddaa');m.emissiveIntensity=.6}}});
 const pivots=tires.map(t=>{const center=new T.Box3().setFromObject(t).getCenter(new T.Vector3());const p=new T.Group();p.position.copy(center);vehicle.add(p);wheels.push(p);return {p,center,front:center.x<0}});
 for(const part of wheelParts){const c=new T.Box3().setFromObject(part).getCenter(new T.Vector3());const dest=pivots.find(p=>p.front===(c.x<0)&&Math.sign(p.center.z)===Math.sign(c.z));if(dest)dest.p.attach(part)}
 mergeStaticMeshes(vehicle,new Set(wheels));wheels.forEach(w=>mergeStaticMeshes(w));vehicle.rotation.y=-Math.PI/2;vehicle.scale.setScalar(.82);van.add(vehicle);
 for(const {center} of pivots){const contact=mesh(new T.PlaneGeometry(.55,.6),new T.MeshBasicMaterial({map:shadowTex,transparent:true,opacity:.75,depthWrite:false}),van,-center.z*.82,.01,center.x*.82);contact.rotation.x=-Math.PI/2;contact.castShadow=false}
 for(const x of [-.7,.7]){const head=new T.SpotLight('#ffedd0',22,18,.37,.7,1.5);head.position.set(x,.95,-2.45);head.target.position.set(x,.02,-11);head.castShadow=!mobile;head.shadow.mapSize.set(512,512);van.add(head,head.target)}
 // Faint local rain, kept sparse and excluded from the mobile render.
 let rain=null;if(!mobile){const positions=new Float32Array(180*3);let seed=983;for(let i=0;i<positions.length;i++){seed=(seed*1664525+1013904223)>>>0;positions[i]=(seed/4294967296-.5)*18}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));rain=new T.Points(g,new T.PointsMaterial({color:'#bdcad3',size:.014,transparent:true,opacity:.2,depthWrite:false}));rain.position.y=6;scene.add(rain)}
 mergeStaticMeshes(scene,new Set([van]));return {scene,wheelCount:wheels.length,update(time,camera,isMobile){const approach=ease((time-2.5)/2.45);van.position.set(-.45,0,3-3.2*approach);wheels.forEach(w=>w.rotation.z=-3.2*approach/.31);if(rain)rain.position.y=6-(time*.9)%1;
 const dolly=smooth((time-4.8)/3.5);camera.fov=isMobile?38:43;camera.position.set(lerp(2.6,3.1,dolly),.24,lerp(-4.5,-4.8,dolly));camera.lookAt(isMobile?.1:-.55,.3,-.4);camera.updateProjectionMatrix();}};
}

export async function createCinematic(host,{onReveal=()=>{},onFinish=()=>{},onReady=()=>{}}={}){
 const mobile=matchMedia('(max-width:600px)').matches;
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(1);renderer.shadowMap.enabled=false;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
 renderer.domElement.setAttribute('aria-label','Rendered 3D scene: a plumbing leak and service van arriving on a wet driveway');renderer.domElement.dataset.scene='ready';host.append(renderer.domElement);
 const loader=new T.TextureLoader();const textures=await Promise.all(['asphalt-color.webp','asphalt-normal.webp','asphalt-roughness.webp'].map(f=>loader.loadAsync('/assets/pbr/'+f)));textures.forEach(tex=>{tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(20,20);tex.anisotropy=4});textures[0].colorSpace=T.SRGBColorSpace;const model=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/assets/service-van-detailed.glb');const env=environment(renderer),inside=bathroom(env),outside=exterior(env,mobile,renderer,textures,model.scene),camera=new T.PerspectiveCamera(45,1,.04,80);
 const fade=document.createElement('div');fade.className='cinematic-cut';fade.setAttribute('aria-hidden','true');host.append(fade);
 let raf=0,startTime=0,active=false,elapsed=0,lastDraw=0,revealed=false,disposed=false,audio=null,frameCount=0,renderWidth=mobile?540:960,adapted=false;
 const duration=mobile?5:8.5;
 const resize=()=>{const r=host.getBoundingClientRect();const scale=Math.min(1,renderWidth/Math.max(1,r.width));renderer.setSize(Math.max(1,r.width*scale),Math.max(1,r.height*scale),false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();if(!active)draw(elapsed||8.5)};
 const draw=t=>{const timeline=mobile?(t<1.4?t:2.5+(t-1.4)*6/3.6):t;const current=timeline<2.5?inside:outside;current.update(current===inside?t:timeline,camera,mobile);renderer.render(current.scene,camera);fade.style.opacity=String(1-Math.min(1,Math.abs(timeline-2.5)/.15));renderer.domElement.dataset.scene=timeline<2.5?'leak':timeline<5.1?'response':timeline<6.5?'arrival':'hero';renderer.domElement.dataset.elapsed=t.toFixed(2);renderer.domElement.dataset.wheels=String(outside.wheelCount);renderer.domElement.dataset.frames=String(++frameCount);renderer.domElement.dataset.drawCalls=String(renderer.info.render.calls)};
 const finish=()=>{active=false;cancelAnimationFrame(raf);elapsed=duration;draw(duration);if(audio){audio.pause();audio.currentTime=0}onReveal();onFinish()};
 const tick=now=>{if(!active||disposed)return;elapsed=Math.min(duration,(now-startTime)/1000);if(now-lastDraw>(mobile?32:16)){draw(elapsed);lastDraw=now}if(!adapted&&elapsed>1.4&&frameCount/Math.max(elapsed,.1)<25){adapted=true;renderWidth=mobile?360:640;resize()}if(elapsed>duration*.72&&!revealed){revealed=true;onReveal()}if(elapsed>=duration){finish();return}raf=requestAnimationFrame(tick)};
 const api={play(){if(disposed)return;cancelAnimationFrame(raf);elapsed=0;frameCount=0;revealed=false;active=true;draw(0);startTime=performance.now();raf=requestAnimationFrame(tick)},skip:finish,preview(t){active=false;cancelAnimationFrame(raf);elapsed=clamp(t,0,duration);draw(elapsed)},stop(){active=false;cancelAnimationFrame(raf);audio?.pause()},setSound(enabled){if(!audio){audio=new Audio('/assets/cinematic-ambience.wav');audio.volume=.38}if(enabled){audio.currentTime=Math.min(elapsed,audio.duration||elapsed);audio.play().catch(()=>{})}else audio.pause()},get active(){return active},get duration(){return duration},dispose(){disposed=true;api.stop();observer.disconnect();sceneCleanup(inside.scene);sceneCleanup(outside.scene);env.dispose();renderer.dispose();host.replaceChildren()}};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();draw(0);draw(duration);onReady();return api;
}
function sceneCleanup(scene){const mats=new Set(),geometries=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const mat of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){mats.add(mat);for(const k of ['map','bumpMap','normalMap'])if(mat[k])textures.add(mat[k])}});geometries.forEach(x=>x.dispose());mats.forEach(x=>x.dispose());textures.forEach(x=>x.dispose())}
