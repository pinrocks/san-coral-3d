import * as THREE from 'three';

/* Deterministic In-Engine Scene Staging for ?shot=1|2|3|4&seed=7 */

export function stageDeterministicShot(shotId,ctx) {
const { world:W,vehicleMgr:VM,lifeSim:LS,playerSys:P,wantedSys:WS,missionSys:M,cameraRig:C,hud:H,audio:A }=ctx;
H.closeAllDialogs();WS.clearWanted();M.abandonMission();LS.clearAll();VM.clearDynamicVehicles();
M.seedDemoSaveSlot();
P.loadSaveData({ hp:100,maxHp:125,armor:120,maxArmor:150,cash:48500,respect:1030,perks:{ turboEcu:true,kevlarWeave:true,radarScrambler:false,extendedMags:false } });

const cars=(list) => list.map(([t,x,z,h,colorHex,speed=0,driverType='ai']) => {
  const v=VM.spawnVehicle(t,x,z,h,{ colorHex,speed,driverType,persistent:true });
  if (speed) { v.vx=Math.sin(h) * speed;v.vz=Math.cos(h) * speed;}
  return v;
});
const peds=(list) => list.forEach(([x,z,heading,shirtColor,isHostile]) => {
  const p=LS.spawnPedestrian(x,z,{ heading,shirtColor,isHostile:Boolean(isHostile),persistent:true });
  if (p.lb?.ll) { p.lb.ll.rotation.x=0.38;p.lb.rl.rotation.x=-0.38;}
});
const gps=(x1,z1,x2,z2) => (M.gpsRoute=W.roadGraph.computeRoute(x1,z1,x2,z2));

if (shotId === 1) {
  W.setTimeOfDay(0.65);A.setStation(1);P.selectWeapon(3);
  const h=Math.PI - 0.28,coupe=VM.spawnVehicle('veloz',321.6,66,h,{ colorHex:'#ff385c',speed:41.1,drifting:true,boosting:true,persistent:true });
  P.enterVehicle(coupe);coupe.vx=Math.sin(Math.PI - 0.1) * 41.1;coupe.vz=Math.cos(Math.PI - 0.1) * 41.1;
  WS.spawnStagePursuit(321.6,66,Math.PI,4,{
    cruiserAX:316,cruiserAZ:57.5,cruiserAHeading:Math.PI + 0.18,cruiserBX:326.2,cruiserBZ:50.8,cruiserBHeading:Math.PI - 0.24,
    withRoadblock:false,heliX:325.8,heliY:16,heliZ:36,spotX:321.6,spotZ:63
  });
  cars([['bravo',315.4,34,0.02,'#ffbe3b',18],['rayo',324.8,39.5,Math.PI,'#18e0cf',22],['marlin',412,28,Math.PI - 0.15,'#18e0cf',24]]);
  peds([[309.2,61,Math.PI,'#ffbe3b'],[331.6,58,0.15,'#18e0cf'],[332.2,46,Math.PI,'#ff4d6d'],[309.4,48,0.1,'#38bdf8']]);
  for (let i=0;i < 6;i++) VM.update(0.045,coupe,{ throttle:1,brake:0,steer:0.55,handbrake:true,boost:true },A);
  Object.assign(coupe,{ x:321.6,z:66,heading:h,drifting:true,boosting:true,speedKmh:148,gear:5,nitro:84 });
  coupe.mesh.position.set(coupe.x,W.getGroundHeight(coupe.x,coupe.z),coupe.z);coupe.mesh.rotation.y=h;
  for (const nf of (coupe.parts.nf || coupe.parts.nitroFlames || [])) nf.visible=true;
  P.x=coupe.x;P.z=coupe.z;P.heading=h;
  const gpsRoute=gps(321,66,210,-120);
  H.setHudOverrides({ wantedLevel:4,wantedLabel:'HEAT 4 · METRO STRIKE',weaponName:'CORSARIO CARBINE',weaponAmmo:'28 / 120',speedKmh:148,gear:5,missionTag:'ACT II · MISSION 05',missionTitle:'COASTAL HIGH TIDE',missionObjective:'Outrun Halcon-1 & Guardia interceptors north to Villa Solis',gpsRoute,beacon:{ x:210,z:-120 } });
  C.setManualShotCamera({ x:315,y:5.5,z:81.2 },{ x:329.5,y:2.9,z:34 },58);
  return;
}

if (shotId === 2) {
  W.setTimeOfDay(0.38);P.selectWeapon(1);P.setPosition(309.4,-139,0.12);P.aiming=false;
  P.update(0.08,{ forward:true,moveZ:1 },{ yaw:0.12 },WS);P.setPosition(309.4,-138.6,0.12);
  cars([['bravo',313.6,-133.2,0.06,'#ffbe3b',0,'parked'],['rayo',314.2,-125.6,-0.25,'#18e0cf',0,'parked'],['veloz',322.8,-118,0.02,'#ff4d6d',16]]);
  peds([[307.6,-134.2,3.05,'#18e0cf'],[310.8,-131,-2.9,'#ff4d6d'],[306.9,-127.5,0.18,'#ffbe3b'],[311.5,-122.8,2.85,'#c084fc'],[308.2,-119.5,-0.15,'#4ade80']]);
  M.placeStageRing(309.2,-124.5);
  const gpsRoute=gps(309,-138,-210,-60);
  H.setHudOverrides({ wantedLevel:0,wantedLabel:'CLEAR · PLAYA CORAL',weaponName:'VIPER 9MM',weaponAmmo:'15 / 90',worldPrompt:'Steal Bravo V8',worldPromptKey:'F',missionTag:'ACT II · STORY CONTACT',missionTitle:'MIRADOR WIRE',missionObjective:'Step into Mateo\'s golden briefing beacon or commandeer the Bravo V8',dialogue:{ speaker:'MATEO RÍOS',text:'Elena, Serrano\'s couriers just docked at Marina del Faro. Grab the V8 and meet me on Pier 2.' },gpsRoute,beacon:{ x:309.2,z:-124.5 } });
  C.setManualShotCamera({ x:307.5,y:3.15,z:-144.8 },{ x:310.6,y:1.95,z:-124 },54);
  return;
}

if (shotId === 3) {
  W.setTimeOfDay(0.64);P.selectWeapon(3);P.setPosition(341.8,252,0.26);P.aiming=true;
  P.update(0.03,{ aiming:true,rightMouseDown:true },{ yaw:0.26 },WS);
  const [suv]=cars([['toro',346.2,269.5,-2.55,'#1e293b',0,'parked'],['marlin',368.5,250,0.25,'#ff4d6d',22],['marlin',385,284,-0.45,'#38bdf8',19]]);
  VM.damageVehicle(suv,999);
  for (let i=0;i < 4;i++) VM.update(0.05,null,{},A);
  const from=new THREE.Vector3(342.1,W.getGroundHeight(341.8,252) + 1.42,252.6);
  P.spawnVisualShotEffect(from,new THREE.Vector3(346.2,W.getGroundHeight(346.2,269.5) + 1.2,269.5),true);
  P.spawnVisualShotEffect(from.clone().add(new THREE.Vector3(0.08,0.04,0.1)),new THREE.Vector3(349,2,267.5),false);
  peds([[349.4,266.8,-2.8,'#b91c1c',true],[343,273.5,-2.9,'#b91c1c',true]]);
  WS.setWantedLevel(3,{ immediate:true });WS.deployRoadblock(338.8,279,0.15);
  const gpsRoute=gps(341,252,460,-35);
  H.setHudOverrides({ wantedLevel:3,wantedLabel:'HEAT 3 · TACTICAL INTERCEPT',weaponName:'CORSARIO CARBINE',weaponAmmo:'24 / 120',showReticle:true,firing:true,missionTag:'ACT II · MISSION 06',missionTitle:'HARBOR SMUGGLER BREACH',missionObjective:'Neutralize Serrano\'s convoy on Pier 2 & seize the Marlin Jet boat',dialogue:{ speaker:'ELENA NAVARRO',text:'Convoy armor is blown — clearing the pier and taking the Marlin Jet to Cayo Esmeralda!' },gpsRoute,beacon:{ x:368.5,z:250 } });
  C.setManualShotCamera({ x:339.8,y:3.1,z:246.8 },{ x:347.8,y:2.3,z:270 },54);
  return;
}

if (shotId === 4) {
  W.setTimeOfDay(0.59);P.setPosition(214,-116,1.45);P.selectWeapon(3);
  cars([['veloz',322,145,0.04,'#ff385c',22],['bravo',316,162,3.12,'#ffbe3b',18],['rayo',324.5,174,0.08,'#18e0cf',24],['marlin',378,218,0.3,'#18e0cf',18]]);
  VM.update(0.05,null,{},A);
  peds([[331.5,150,0.1,'#ffbe3b'],[332.5,164,3,'#18e0cf']]);
  const gpsRoute=gps(210,-120,385,240);
  H.setHudOverrides({ wantedLevel:0,wantedLabel:'SAFEHOUSE · VILLA SOLIS',cash:48500,weaponName:'CORSARIO CARBINE',weaponAmmo:'28 / 120',gpsRoute });
  C.setManualShotCamera({ x:288,y:16.5,z:112 },{ x:355,y:3.2,z:215 },55);
  H.openSafehouse('overview');
}
}
