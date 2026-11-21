/* Street-Grid Radar Minimap,Tropical HUD & Safehouse Dialogs */

const HEAT=['CLEAR · NO HEAT','HEAT 1 · PATROL','HEAT 2 · PURSUIT','HEAT 3 · INTERCEPT','HEAT 4 · METRO STRIKE','HEAT 5 · LOCKDOWN'];
const PINS=[['PLAYA CORAL',255,-210],['MARINA DEL FARO',290,260],['FINANCIERO',0,-40],['BARRIO MIRADOR',-265,-40],['INDUSTRIAL',-280,270],['COLINAS DORADAS',-120,-320],['CAYO ESMERALDA',485,-35]];
const $=(id)=>document.getElementById(id);
const txt=(id,v)=>{ const e=$(id);if (e) e.textContent=v;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const cash=(n)=>'$'+Math.max(0,Math.round(Number(n)||0)).toLocaleString('en-US');
const clock=(t=0.5)=>{ const m=(((t % 1)+1) % 1*1440) | 0;return `${String((m / 60) | 0).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;};
const dot=(c,x,y,r,col,st)=>{ c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,6.29);c.fill();if (st) { c.strokeStyle=st;c.lineWidth=2;c.stroke();} };
const box=(c,x,y,w,h,col)=>{ c.fillStyle=col;c.fillRect(x,y,w,h);};

export function createHudAndMenus(sys) {
const { world: W,vehicleMgr: VM,lifeSim: LS,playerSys: P,wantedSys: WS,missionSys: M,audio: A }=sys;
const startDlg=$('start-dialog'),shDlg=$('safehouse-dialog'),shBody=$('sh-body');
const stars=Array.from(document.querySelectorAll('#w-stars .star'));
const miniCv=$('mm-cv'),miniCtx=miniCv?.getContext('2d');
const mapCv=$('sh-map'),mapCtx=mapCv?.getContext('2d');
let flash=0,toastT=0,wp=null,ovr=null,tab='overview';

const showToast=(t,s,d=3)=>{ const b=$('toast');if (!b) return;txt('t-tit',t);txt('t-sub',s);b.hidden=false;toastT=d;txt('sr-status',`${t}: ${s}`);};
const setTab=(next='overview')=>{
 tab=next;if (shBody) shBody.dataset.activeTab=tab;
 for (const b of document.querySelectorAll('.sh-tab')) b.classList.toggle('is-active',b.dataset.tab===tab);
 drawCanvas(mapCv,mapCtx,false);
};

function renderSafehouseDeck() {
 if (!shDlg) return;
 txt('sh-cash',cash(P.cash));
 $('s-list').innerHTML=M.getSlotsSummary().map((s,i)=>
  `<div class="slot-row${s.occupied?' is-populated':''}"><div>${s.occupied
   ?`<span class="sm">Save Slot ${i+1}: ${s.actLabel} · ${s.progressPct}% · ${cash(s.cash)}</span><span class="ss">${s.savedAt||s.district} · Respect ${s.respect}</span>`
   :`<span class="sm">Save Slot ${i+1}: Empty</span><span class="ss">Ready to record campaign</span>`}</div>`+
  `<div class="sbtns"><button type="button" class="btn-tiny gold" data-save-slot="${i}">SAVE</button>`+
  `<button type="button" class="btn-tiny turquoise" data-load-slot="${i}"${s.occupied?'':' disabled'}>LOAD</button></div></div>`
 ).join('');
 const ms=M.missions,done=new Set(M.completedIds);
 txt('c-prog',`${done.size>=6?'ACT III':done.size>=3?'ACT II':'ACT I'} · ${Math.round((done.size / ms.length)*100)}% (${done.size}/${ms.length})`);
 const vis=tab==='missions'?ms:[ms[0],ms[4],ms[5]].filter(Boolean);
 $('m-list').innerHTML=vis.map((m,i)=>{
  const d=done.has(m.id),act=M.activeMission?.id===m.id,cur=act||(!M.activeMission&&!d&&i===vis.length - 1);
  return `<div class="mission-row${d?' is-done':''}${cur?' is-current':''}">`+
   `<div><span class="mt">${m.act} · ${m.title}</span><span class="ms">${m.giver} · ${cash(m.rewardCash)}</span></div>`+
   `<button type="button" class="btn-tiny ${act?'coral':d?'':'turquoise'}" data-mid="${m.id}">${act?'ACTIVE':d?'DONE':'START'}</button></div>`;
 }).join('');
 $('a-list').innerHTML=M.activities.slice(0,3).map((a)=>`<button type="button" class="btn-tiny" data-aid="${a.id}">★ ${a.shortTitle||a.title}</button>`).join('');
 $('u-grid').innerHTML=M.upgrades.map((u)=>{
  const own=Boolean(P.perks[u.perkKey]||P.perks[u.id]);
  return `<div class="upgrade-card"><div><strong>${u.name}</strong><span>${u.summary||u.desc}</span></div>`+
   `<button type="button" class="btn-tiny ${own?'turquoise':'gold'}" data-uid="${u.id}"${own?' disabled':''}>${own?'OWNED':cash(u.cost)}</button></div>`;
 }).join('');
 txt('b-rad',`♫ ${A.getStationName()}`);txt('b-aud',A.isMuted()?'AUDIO: MUTED':'AUDIO: ON');
 drawCanvas(mapCv,mapCtx,false);
}

function drawCanvas(cv,ctx,mini) {
 if (!ctx||!cv||!W) return;
 const w=cv.width,h=cv.height,v=P.inVehicle;
 const cx=v?v.x : P.x,cz=v?v.z : P.z,hdg=v?v.heading : P.heading;
 const sx=mini?0.92 : w / 1040,sy=mini?0.92 : h / 960;
 const pt=mini?(x,z)=>({ x: w*0.5+(x - cx)*sx,y: h*0.5+(z - cz)*sy }) : (x,z)=>({ x: ((x+480) / 1040)*w,y: ((z+480) / 960)*h });

 box(ctx,0,0,w,h,'#091829');
 const bx=pt(340,0).x,wx=pt(396,0).x;
 if (bx < w) box(ctx,Math.max(0,bx),0,w - Math.max(0,bx),h,mini?'#8b7452' : '#c8aa78');
 if (wx < w) {
   box(ctx,Math.max(0,wx),0,w - Math.max(0,wx),h,'#0b697d');
   ctx.strokeStyle='#18e0cf';ctx.lineWidth=mini?3 : 2;ctx.beginPath();ctx.moveTo(wx,0);ctx.lineTo(wx,h);ctx.stroke();
 }
 const i1=pt(430,-180),i2=pt(540,120);
 box(ctx,i1.x,i1.y,i2.x - i1.x,i2.y - i1.y,'#163044');

 const rg=W.roadGraph;
 ctx.fillStyle='#1c2f4d';ctx.strokeStyle='#29456e';ctx.lineWidth=1;
 for (const b of rg.buildings) {
   if (mini&&(Math.abs(b.x - cx) > 280||Math.abs(b.z - cz) > 280)) continue;
   const p=pt(b.x - b.w*0.5,b.z - b.d*0.5);
   ctx.fillRect(p.x,p.y,Math.max(2,b.w*sx),Math.max(2,b.d*sy));
   if (mini) ctx.strokeRect(p.x,p.y,b.w*sx,b.d*sy);
 }
 ctx.lineCap='round';
 for (const s of rg.segments) {
   const p1=pt(s.x1,s.z1),p2=pt(s.x2,s.z2);
   ctx.strokeStyle=s.isBridge?(mini?'#18e0cf' : '#ffbe3b') : '#4d668a';
   ctx.lineWidth=mini?Math.max(4,(s.width||14)*sx*0.72) : (s.isBridge?4 : Math.max(1.8,(s.width||14)*0.16));
   ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
 }
 const rt=ovr?.gpsRoute||(M.gpsRoute.length > 1?M.gpsRoute : wp?.route);
 if (rt?.length > 1) {
   ctx.strokeStyle='#ffbe3b';ctx.lineWidth=mini?7 : 3.5;ctx.lineJoin='round';ctx.beginPath();
   rt.forEach((q,i)=>{ const p=pt(q.x,q.z);if (i) ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});
   ctx.stroke();
 }

 if (!mini) {
  ctx.font='800 12px system-ui,sans-serif';ctx.textAlign='center';
  for (const [lbl,dx,dz] of PINS) { const p=pt(dx,dz),lx=clamp(p.x,64,w - 64),ly=clamp(p.y,12,h - 10);box(ctx,lx - 60,ly - 9,120,15,'rgba(8,13,24,.78)');ctx.fillStyle='#e8f4ff';ctx.fillText(lbl,lx,ly+3);}
  const sh=pt(W.safehouse.x,W.safehouse.z),pp=pt(P.x,P.z);
  dot(ctx,sh.x,sh.y,6.5,'#2ee59d');dot(ctx,pp.x,pp.y,7,'#ff4d6d','#fff');
  return;
 }
 for (const c of VM.vehicles) {
  if (c===v||c.destroyed||c.isPolice||Math.abs(c.x - cx) > 220||Math.abs(c.z - cz) > 220) continue;
  const p=pt(c.x,c.z);box(ctx,p.x - 3,p.y - 3,6,6,c.isBoat?'#18e0cf':'#9bb3d4');
 }
 for (const ped of LS.pedestrians) {
  if (ped.dead||Math.abs(ped.x - cx) > 160||Math.abs(ped.z - cz) > 160) continue;
  const p=pt(ped.x,ped.z);dot(ctx,p.x,p.y,ped.isHostile?4.5:2.6,ped.isHostile?'#ff4d6d':'#67e8f9');
 }
 const red=Math.sin(flash*11) > 0;
 for (const u of WS.getMinimapUnits()) {
  const p=pt(u.x,u.z);
  if (u.type==='heli') {
   ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,10,0,6.29);
   ctx.moveTo(p.x - 11,p.y - 11);ctx.lineTo(p.x+11,p.y+11);ctx.moveTo(p.x+11,p.y - 11);ctx.lineTo(p.x - 11,p.y+11);ctx.stroke();
  } else if (u.type==='roadblock') box(ctx,p.x - 8,p.y - 3,16,6,'#ffbe3b');
  else dot(ctx,p.x,p.y,6.5,(u.sirenPhase?u.sirenPhase==='red':red)?'#ff4d6d':'#3b82f6');
 }
 const bc=ovr?.beacon||M.activeBeacon;
 if (bc) { const b=pt(bc.x,bc.z);dot(ctx,clamp(b.x,18,w - 18),clamp(b.y,18,h - 18),9,'#ffbe3b','#09101d');}
 ctx.save();ctx.translate(w*0.5,h*0.5);ctx.rotate(Math.atan2(Math.sin(hdg),-Math.cos(hdg)));
 ctx.fillStyle='#ff4d6d';ctx.strokeStyle='#fff';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(10,10);ctx.lineTo(0,5);ctx.lineTo(-10,10);ctx.closePath();
 ctx.fill();ctx.stroke();ctx.restore();
}

const openSafehouse=(t='overview')=>{ if (!shDlg) return;if (startDlg?.open) startDlg.close('safehouse');setTab(t);renderSafehouseDeck();if (!shDlg.open) shDlg.showModal();};
startDlg?.addEventListener('close',()=>{ startDlg.returnValue='';A.unlock();});
shDlg?.addEventListener('close',()=>{ shDlg.returnValue='';});
$('b-menu')?.addEventListener('click',()=>openSafehouse());
$('b-cont')?.addEventListener('click',()=>openSafehouse());
shDlg?.addEventListener('click',(e)=>{
 const b=e.target.closest('button');if (!b) return;
 const d=b.dataset;
 if (d.tab) { setTab(d.tab);renderSafehouseDeck();}
 else if (d.saveSlot !== undefined) { M.saveSlot(+d.saveSlot);A.playUiClick();showToast('GAME SAVED',`Slot ${+d.saveSlot+1}`);renderSafehouseDeck();}
 else if (d.loadSlot !== undefined&&M.loadSlot(+d.loadSlot)) { A.playMissionChime();showToast('SAVE LOADED',`Slot ${+d.loadSlot+1}`);renderSafehouseDeck();}
 else if (d.mid) { M.startMission(d.mid);A.playMissionChime();shDlg.close('mission');}
 else if (d.aid) { M.startActivity(d.aid);A.playUiClick();shDlg.close('activity');}
 else if (d.uid) {
   const ok=M.purchaseUpgrade(d.uid);showToast(ok?'INSTALLED' : 'NEED CASH',d.uid);
   if (ok) A.playMissionChime();renderSafehouseDeck();
 } else if (b.id==='b-rad') { A.cycleStation();renderSafehouseDeck();}
 else if (b.id==='b-aud') { A.toggleMute();renderSafehouseDeck();}
 else if (b.id==='b-heat'&&WS.level > 0&&P.cash >= 500) { P.addCash(-500);WS.clearWanted();A.playMissionChime();showToast('HEAT CLEARED','Guardia jammed');renderSafehouseDeck();}
 else if (b.id==='b-exp') {
   const u=URL.createObjectURL(new Blob([M.exportSaveJson()],{ type: 'application/json' }));
   const a=document.createElement('a');a.href=u;a.download='san-coral-save.json';a.click();URL.revokeObjectURL(u);showToast('EXPORTED','san-coral-save.json');
 } else if (b.id==='b-imp') $('f-imp')?.click();
});
$('f-imp')?.addEventListener('change',async (e)=>{
 const f=e.target.files?.[0];if (!f) return;
 if (M.importSaveJson(await f.text())) { M.loadSlot(0);showToast('IMPORTED','Restored');renderSafehouseDeck();}
});
mapCv?.addEventListener('click',(e)=>{
 const r=mapCv.getBoundingClientRect(),wx=((e.clientX - r.left) / r.width)*1040 - 480,wz=((e.clientY - r.top) / r.height)*960 - 480;
 wp={ route: W.roadGraph.computeRoute(P.x,P.z,wx,wz) };
 const dn=String(W.getDistrictAt(wx,wz));M.setCustomWaypoint(wx,wz,dn);
 txt('wp-lbl',`GPS -> ${dn.toUpperCase()}`);A.playUiClick();drawCanvas(mapCv,mapCtx,false);
});

function update(dt) {
 flash += dt;if (toastT > 0&&(toastT -= dt) <= 0) $('toast').hidden=true;
 const ov=ovr||{},v=P.inVehicle,px=v?v.x:P.x,pz=v?v.z:P.z;
 const heat=ov.wantedLevel ?? WS.level,seen=WS.inSight !== false,wb=$('w-box');
 wb.dataset.heat=String(heat);
 if (heat > 0) wb.dataset.alert=Math.sin(flash*10) > 0?'police':'blue';else delete wb.dataset.alert;
 stars.forEach((s,i)=>{ s.classList.toggle('is-lit',i < heat);s.classList.toggle('is-evading',i < heat&&!seen&&Math.sin(flash*14) < 0);});
 txt('w-lbl',ov.wantedLabel||WS.statusLabel||HEAT[heat]||HEAT[0]);
 txt('h-cash',cash(ov.cash ?? P.cash));txt('h-resp',`RESPECT ${Math.round(P.respect)}`);
 $('hp-fill').style.width=`${clamp((P.hp / P.maxHp)*100,0,100)}%`;txt('hp-val',Math.round(P.hp));
 $('armor-fill').style.width=`${clamp((P.armor / P.maxArmor)*100,0,100)}%`;txt('armor-val',Math.round(P.armor));
 const wi=P.weaponIndex,wo=P.weapons[wi];
 txt('w-slot',`[${wi+1}]`);txt('wp-name',String(ov.weaponName||wo.name).toUpperCase());
 txt('wp-ammo',ov.weaponAmmo||(wo.id==='fist'?'MELEE · READY':`${wo.ammoInClip} / ${wo.ammoReserve}`));
 const am=M.activeMission;
 if (ov.missionTitle||am) {
  const mt=(ov.missionTag||`${am.act} · STORY MISSION`).toUpperCase();
  txt('m-tag',mt);txt('h-act',mt);txt('m-tit',String(ov.missionTitle||am.title).toUpperCase());
  txt('m-obj',ov.missionObjective||M.currentStep?.objective||am.summary);
 } else {
  txt('m-tag','SAN CORAL · OPEN WORLD');txt('m-tit','VILLA SOLIS SYNDICATE WIRE');
  txt('m-obj','Enter a golden mission ring or press [P] for Campaign Deck');
 }
 const ret=$('aim-reticle');
 ret.hidden=!Boolean(ov.showReticle||(!v&&(P.aiming||P.muzzleFlashTimer > 0)));
 ret.classList.toggle('is-firing',Boolean(ov.firing||P.muzzleFlashTimer > 0));
 const pr=$('w-prm'),nv=!v?VM.findNearestInteractable(px,pz,5.2):null;
 if (ov.worldPrompt) { pr.hidden=false;txt('p-key',ov.worldPromptKey||'F');txt('p-txt',ov.worldPrompt);}
 else if (nv) { pr.hidden=false;txt('p-key','F');txt('p-txt',`${nv.isBoat?'Board':'Steal'} ${nv.name}`);}
 else if (!v&&Math.hypot(px - W.safehouse.x,pz - W.safehouse.z) < 9) { pr.hidden=false;txt('p-key','P');txt('p-txt','Open Villa Solis Safehouse');}
 else pr.hidden=true;
 const dg=ov.dialogue||M.activeDialogue;
 $('d-box').hidden=!(dg&&dg.text);
 if (dg?.text) { txt('d-spk',String(dg.speaker).toUpperCase());txt('d-txt',dg.text);}
 txt('h-dist',String(W.getDistrictAt(px,pz)).toUpperCase());txt('h-clk',clock(W.getTimeOfDay()));
 $('v-hud').hidden=!v;$('f-hud').hidden=Boolean(v);
 if (v) {
  txt('speed-val',ov.speedKmh ?? Math.round(Math.abs(v.speedKmh)));txt('v-name',String(v.name).toUpperCase());
  txt('gear-pill',v.isBoat?'TWIN JET':`GEAR ${ov.gear||v.gear}`);$('nitro-fill').style.width=`${clamp(v.nitro,8,100)}%`;
  txt('r-txt',A.getStationName());
 }
 drawCanvas(miniCv,miniCtx,true);
}

return {
 openStartOverlay: ()=>{ if (startDlg&&!startDlg.open) startDlg.showModal();},
 openSafehouse,
 closeAllDialogs: ()=>{ if (startDlg?.open) startDlg.close('play');if (shDlg?.open) shDlg.close('resume');},
 isMenuOpen: ()=>Boolean(startDlg?.open||shDlg?.open),
 renderSafehouseDeck,showToast,setHudOverrides: (o)=>{ ovr=o;},update
};
}
