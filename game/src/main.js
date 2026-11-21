import * as THREE from 'three';
import { createRng } from './rng.js';
import { createCityWorld } from './world-city.js';
import { createVehicleManager } from './vehicles.js';
import { createLifeSimulation } from './traffic-peds.js';
import { createPlayerCombatSystem } from './player-combat.js';
import { createWantedSystem } from './wanted-police.js';
import { createMissionAndSaveSystem } from './missions-story.js';
import { createAudioEngine } from './audio-radio.js';
import { createInputAndCamera } from './camera-input.js';
import { createHudAndMenus } from './hud-menus.js';
import { stageDeterministicShot } from './stage-shots.js';

/* San Coral:High Tide — Main 60 FPS WebGL Bootstrap */

const q=new URLSearchParams(window.location.search),shotParam=+(q.get('shot') || 0),isShot=shotParam >= 1 && shotParam <= 4;
const canvas=document.getElementById('game-canvas');
const renderer=new THREE.WebGLRenderer({ canvas,antialias:true,powerPreference:'high-performance' });
renderer.setPixelRatio(isShot ? 2 :Math.min(window.devicePixelRatio || 1,2));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.14;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(58,window.innerWidth / Math.max(1,window.innerHeight),0.35,1150);
const rng=createRng(+(q.get('seed') || 7)),audio=createAudioEngine();
const world=createCityWorld(scene,renderer,rng);
const vehicleMgr=createVehicleManager(scene,world,rng.fork ? rng.fork(11) :rng);
const lifeSim=createLifeSimulation(scene,world,vehicleMgr,rng.fork ? rng.fork(23) :rng);
const playerSys=createPlayerCombatSystem(scene,world,vehicleMgr,lifeSim,audio);
const wantedSys=createWantedSystem(scene,world,vehicleMgr,playerSys,audio,rng.fork ? rng.fork(37) :rng);
const missionSys=createMissionAndSaveSystem(scene,world,vehicleMgr,lifeSim,playerSys,wantedSys,audio);
const cameraRig=createInputAndCamera(camera,canvas,world);
const systems={ scene,camera,renderer,rng,audio,world,vehicleMgr,lifeSim,playerSys,wantedSys,missionSys,cameraRig,hud:null };
const hud=(systems.hud=createHudAndMenus(systems));

window.addEventListener('resize',()=>{
 const w=window.innerWidth,h=Math.max(1,window.innerHeight);
 camera.aspect=w / h;camera.updateProjectionMatrix();renderer.setSize(w,h);
});
window.addEventListener('pointerdown',()=>audio.unlock(),{ once:true });
window.addEventListener('keydown',()=>audio.unlock(),{ once:true });
let frameCount=0,settled=0,lastT=performance.now(),fps=60;
if (isShot) {
 window.__SAN_CORAL_READY=false;stageDeterministicShot(shotParam,systems);
 const v=playerSys.inVehicle;
 world.update(0.016,{ x:v?v.x:playerSys.x,y:v?(v.y||0):playerSys.y,z:v?v.z:playerSys.z });
 hud.update(0.016);
} else {
 world.setTimeOfDay(0.56);
 if (!missionSys.getSlotsSummary().some((s)=>s?.occupied)) missionSys.seedDemoSaveSlot();
 playerSys.setPosition(311.5,-122,0.08);playerSys.selectWeapon(3);playerSys.cash=24500;playerSys.armor=75;
 for (const [t,x,z,h,colorHex] of [
  ['veloz',313.8,-118.6,0.04,'#ff385c'],['bravo',316.2,-128.5,0.02,'#ffbe3b'],
  ['rayo',308.2,-114.5,-0.35,'#18e0cf'],['marlin',world.marinaSlip.x,world.marinaSlip.z,world.marinaSlip.heading,'#18e0cf']
 ]) vehicleMgr.spawnVehicle(t,x,z,h,{ colorHex,driverType:'parked',persistent:true });
 lifeSim.spawnAmbientAround?.(311.5,-122,{ cars:10,peds:16 });
 cameraRig.yaw=0.08;cameraRig.snapToTarget();cameraRig.update(0.016,playerSys);hud.openStartOverlay();
}
function animate(now) {
 requestAnimationFrame(animate);
 const dt=Math.min(0.05,Math.max(0.004,((now - lastT)*0.001)||0.016));
 lastT=now;fps += ((1 / dt) - fps)*0.1;frameCount++;
 if (isShot) { renderer.render(scene,camera);if (++settled>=4) window.__SAN_CORAL_READY=true;return;}
 const inp=cameraRig.pollInput(),shDlg=document.getElementById('safehouse-dialog');
 if (inp.justPause) { if (shDlg?.open) shDlg.close('resume');else hud.openSafehouse('overview');}
 else if (inp.justMap) { if (shDlg?.open) shDlg.close('map');else hud.openSafehouse('map');}
 if (inp.justRadio&&playerSys.inVehicle) hud.showToast('FM RADIO TUNED',audio.cycleStation().name,1.8);
 if (!shDlg?.open) {
  playerSys.update(dt,inp,cameraRig,wantedSys);vehicleMgr.update(dt,playerSys.inVehicle,inp,audio);
  const v=playerSys.inVehicle;
  if (v) { playerSys.x=v.x;playerSys.y=v.y||0;playerSys.z=v.z;playerSys.heading=v.heading;}
  lifeSim.update(dt,playerSys,wantedSys.level);wantedSys.update(dt);missionSys.update(dt);cameraRig.update(dt,playerSys);
  world.update(dt,{ x:playerSys.x,y:playerSys.y,z:playerSys.z });
  audio.update(dt,{ vehicle:v,wantedLevel:wantedSys.level,playerX:playerSys.x });
 } else world.update(dt*0.35,{ x:playerSys.x,y:playerSys.y,z:playerSys.z });
 hud.update(dt);cameraRig.endFrame();renderer.render(scene,camera);
}
requestAnimationFrame(animate);
window.__SAN_CORAL={ ...systems,getFrameCount:()=>frameCount,getFps:()=>Math.round(fps),startGame:()=>hud.closeAllDialogs(),stageShot:(id)=>stageDeterministicShot(id,systems) };
