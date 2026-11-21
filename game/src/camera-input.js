import * as THREE from 'three';

/* Input Controller & Collision-Aware Spring Camera Rig */

const MODES=[
{ name:'CHASE',fd:6.4,fh:2.55,cd:9.4,ch:3.5,fov:58 },
{ name:'PANORAMIC',fd:9.2,fh:3.9,cd:13.2,ch:5.2,fov:62 },
{ name:'ACTION',fd:4.6,fh:2.05,cd:7.2,ch:2.65,fov:55 }
];

export function createInputAndCamera(camera,canvas,world) {
const dSet=new Set(),jSet=new Set();
let pLock=false,mL=false,mR=false,jmL=false,blockedUi=false;
let yaw=0,pitch=0.16,mIdx=0,shot=null,posed=false,shT=0,shS=0;

const cPos=new THREE.Vector3(200,8,-100),cLook=new THREE.Vector3(200,2,-110);
const dPos=new THREE.Vector3(),dLook=new THREE.Vector3();
const fwdV=new THREE.Vector3(0,0,-1),rgtV=new THREE.Vector3(1,0,0);
const aimO=new THREE.Vector3(),aimD=new THREE.Vector3(0,0,-1);

const input={ keys:dSet,isDown:(c) => dSet.has(c),wasPressed:(c) => jSet.has(c),weaponSlot:0,yaw:0,pitch:0.16 };
const dlgOpen=() => Boolean(document.querySelector('dialog[open]'));

window.addEventListener('keydown',(e) => {
 const c=e.code,sd=document.getElementById('start-dialog');
 if (sd?.open&&(c === 'KeyW'||c === 'Space'||c === 'Enter')) sd.close('play');
 if (c === 'KeyP') { jSet.add('KeyP');return;}
 if (c === 'KeyM'&&!e.metaKey&&!e.ctrlKey) jSet.add('KeyM');
 if (blockedUi||dlgOpen()) return;
 if (!dSet.has(c)) jSet.add(c);
 dSet.add(c);
 if (c === 'Space'||c.startsWith('Arrow')) e.preventDefault();
});
window.addEventListener('keyup',(e) => dSet.delete(e.code));
canvas?.addEventListener('mousedown',(e) => {
 if (blockedUi||dlgOpen()) return;
 if (e.button === 0) {
   mL=jmL=true;
   if (!pLock) try { canvas.requestPointerLock?.()?.catch?.(() => {});} catch {}
 } else if (e.button === 2) mR=true;
});
canvas?.addEventListener('contextmenu',(e) => e.preventDefault());
window.addEventListener('mouseup',(e) => { if (e.button === 0) mL=false;if (e.button === 2) mR=false;});
window.addEventListener('mousemove',(e) => {
 if (!blockedUi&&!dlgOpen()&&!shot&&(pLock||mR||mL)) {
   yaw -= (e.movementX||0)*0.0026;
   pitch=Math.max(-0.32,Math.min(0.72,pitch+(e.movementY||0)*0.0022));
 }
});
document.addEventListener('pointerlockchange',() => { pLock=document.pointerLockElement === canvas;});
window.addEventListener('blur',() => { dSet.clear();mL=mR=false;});

function pollInput() {
 const b=blockedUi||dlgOpen(),has=(k) => !b&&dSet.has(k),jp=(k) => !b&&jSet.has(k);
 const fw=has('KeyW')||has('ArrowUp'),bk=has('KeyS')||has('ArrowDown');
 const lf=has('KeyA')||has('ArrowLeft'),rg=has('KeyD')||has('ArrowRight');
 const sh=has('ShiftLeft')||has('ShiftRight'),sp=has('Space');
 input.forward=fw;input.backward=bk;input.left=lf;input.right=rg;
 input.moveX=(rg ? 1 :0)-(lf ? 1 :0);input.moveZ=(fw ? 1 :0)-(bk ? 1 :0);
 input.throttle=fw ? 1 :0;input.brake=bk ? 1 :0;input.steer=(lf ? 1 :0)-(rg ? 1 :0);
 input.sprint=input.boost=sh;input.handbrake=sp;
 input.spacePressed=input.rollPressed=jp('Space');
 input.interactPressed=jp('KeyF')||jp('KeyE');
 input.firing=input.leftMouseDown=!b&&(mL||has('KeyJ'));
 input.firePressed=!b&&(jmL||jp('KeyJ'));
 input.aiming=input.rightMouseDown=!b&&(mR||has('KeyQ'));
 input.reloadPressed=input.justRadio=jp('KeyR');
 input.justMap=jSet.has('KeyM');
 input.justPause=jSet.has('KeyP')||(!dlgOpen()&&jSet.has('Escape'));
 input.weaponSlot=0;
 if (!b) for (let s=1;s <= 5;s++) if (jSet.has(`Digit${s}`)) input.weaponSlot=s;
 input.justWeaponSlot=input.weaponSlot-1;
 if (jp('KeyC')||jp('KeyV')) mIdx=(mIdx+1) % MODES.length;
 input.yaw=yaw;input.pitch=pitch;
 return input;
}

function setManualShotCamera(pos,lookAt,fov=56) {
 const toV=(v) => Array.isArray(v) ? new THREE.Vector3(v[0],v[1],v[2]) :new THREE.Vector3(v.x||0,v.y||0,v.z||0);
 shot={ pos:toV(pos),lookAt:toV(lookAt),fov };
 camera.fov=fov;camera.updateProjectionMatrix();
 camera.position.copy(shot.pos);camera.lookAt(shot.lookAt);
 cPos.copy(shot.pos);cLook.copy(shot.lookAt);
 yaw=Math.atan2(shot.lookAt.x-shot.pos.x,shot.lookAt.z-shot.pos.z);
}

function update(dt,p) {
 if (shot) { camera.position.copy(shot.pos);camera.lookAt(shot.lookAt);return;}
 if (!p) return;
 const pr=MODES[mIdx],v=p.inVehicle||null;
 const px=v ? v.x :p.x,py=v ? (v.y||0) :(p.y||0),pz=v ? v.z :p.z;

 if (v) {
   const spd=Math.abs(v.speedKmh||(v.speed||0)*3.6);
   if (!mR&&spd > 4) {
     let d=v.heading-yaw;
     while (d > Math.PI) d -= Math.PI*2;
     while (d < -Math.PI) d += Math.PI*2;
     yaw += d*Math.min(1,dt*4.2);
   }
   const dist=pr.cd+Math.min(2.4,spd*0.015)+(v.boosting ? 1.8 :0),ah=4.5+Math.min(4,spd*0.03);
   dPos.set(px-Math.sin(yaw)*dist,py+pr.ch+pitch*3.2,pz-Math.cos(yaw)*dist);
   dLook.set(px+Math.sin(yaw)*ah,py+1.35,pz+Math.cos(yaw)*ah);
   const tf=pr.fov+Math.min(8,spd*0.045)+(v.boosting ? 5 :0);
   if (Math.abs(camera.fov-tf) > 0.08) { camera.fov += (tf-camera.fov)*Math.min(1,dt*6);camera.updateProjectionMatrix();}
 } else {
   const aim=Boolean(input.aiming||p.aiming),dist=aim ? 3.25 :pr.fd,sh=aim ? 0.72 :0.32;
   const cy=Math.cos(yaw),sy=Math.sin(yaw);
   dPos.set(px-sy*dist-cy*sh,py+(aim ? 1.88 :pr.fh+pitch*2.4),pz-cy*dist+sy*sh);
   dLook.set(px+sy*14-cy*(aim ? 0.35 :0.1),py+1.52-pitch*4.2,pz+cy*14+sy*(aim ? 0.35 :0.1));
   const tf=aim ? 46 :pr.fov;
   if (Math.abs(camera.fov-tf) > 0.08) { camera.fov += (tf-camera.fov)*Math.min(1,dt*8);camera.updateProjectionMatrix();}
 }

 if (world) {
   const col=world.resolveCircleCollision?.(dPos.x,dPos.z,1.1);
   if (col&&typeof col.x === 'number') { dPos.x=col.x;dPos.z=col.z;}
   const mg=(world.getGroundHeight ? world.getGroundHeight(dPos.x,dPos.z) :0)+1.25;
   if (dPos.y < mg) dPos.y=mg;
 }

 if (!posed) { cPos.copy(dPos);cLook.copy(dLook);posed=true;}
 else { const a=1-Math.exp(-10.5*dt);cPos.lerp(dPos,a);cLook.lerp(dLook,a);}

 camera.position.copy(cPos);
 if (shT > 0) {
   const m=shS*((shT=Math.max(0,shT-dt)) / 0.28);
   camera.position.x += Math.sin(shT*65)*m;camera.position.y += Math.cos(shT*53)*m*0.7;
 }
 camera.lookAt(cLook);input.yaw=yaw;input.pitch=pitch;
}

return {
 camera,input,
 get yaw() { return yaw;},set yaw(v) { yaw=v;input.yaw=v;},
 get pitch() { return pitch;},set pitch(v) { pitch=v;input.pitch=v;},
 position:cPos,target:cLook,pollInput,
 endFrame:() => { jSet.clear();jmL=false;},update,
 snapToTarget:() => { posed=false;},setManualShotCamera,
 addShake:(s=0.35,d=0.28) => { shS=Math.max(shS,s);shT=Math.max(shT,d);},
 getAimRay:() => { camera.getWorldPosition(aimO);camera.getWorldDirection(aimD);return { origin:aimO,dir:aimD,direction:aimD };}
};
}
