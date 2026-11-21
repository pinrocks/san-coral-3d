import * as THREE from 'three';

const { Group, Mesh, TorusGeometry, CylinderGeometry, OctahedronGeometry, MeshBasicMaterial, MeshStandardMaterial, DoubleSide } = THREE;
const SAVE_KEY = 'san_coral_save_slots_v1';
const [EL, MA, CR, SE] = ['ELENA NAVARRO', 'MATEO RÍOS', 'CAPT. VALERIA CRUZ', 'DON SERRANO'];
const rch = (x, z, radius, label, ex = {}) => ({ type: 'reach', x, z, radius, label, ...ex });
const cmb = (x, z, radius, hostiles, label, ex = {}) => ({ type: 'combat', x, z, radius, hostiles, label, ...ex });
const mkM = (id, number, act, title, giver, district, startX, startZ, rewardCash, rewardRespect, summary, lines, steps) => ({
  id, number, act, title, giver, district, startX, startZ, rewardCash, rewardRespect, summary,
  dialogues: lines.map(([speaker, text]) => ({ speaker, text })), steps,
});

const [A1, A2, A3] = ['Act I', 'Act II', 'Act III'];
export const STORY_MISSIONS = [
  mkM('m1_coastal_getaway', 1, A1, 'Coral Ignition', MA, 'Playa Coral', 312, -155, 6500, 120, 'Boost a Veloz GT off Playa Coral Blvd and stash it at Villa Solis.',
    [[MA, 'Guardia impounded our Veloz by the palms. Boost it fast.'], [EL, 'Keys are optional, Mateo. Open the Villa Solis shutter.']],
    [rch(320, -185, 10, 'Steal Veloz GT on Playa Coral Blvd', { nv: 1, sv: 'veloz' }), rch(320, 145, 14, 'Sprint south down promenade', { ws: 2 }), rch(210, -112, 12, 'Deliver coupe to Villa Solis', { ch: 1 })]),
  mkM('m2_boulevard_sprint', 2, A1, 'Neon Slipstream', MA, 'Playa Coral', 314, -245, 8500, 150, 'Win a twilight sprint along the oceanfront strip.',
    [[MA, 'Serrano’s crew thinks they own the strip. Hit every gate.'], [EL, 'Tell them to watch my taillights in the surf.']],
    [rch(320, -90, 14, 'Gate 1 · Art-Deco Hotel Row', { tl: 65 }), rch(320, 95, 14, 'Gate 2 · Palm Promenade'), rch(336, 225, 15, 'Cross Marina finish arch')]),
  mkM('m3_mirador_ambush', 3, A1, 'Mirador Crossfire', MA, 'Barrio Mirador', -215, -45, 10500, 180, 'Break Serrano’s plaza ambush on foot and extract.',
    [[MA, 'Heads up! That meet under the awnings is a trap!'], [EL, 'Packed the Vendaval. Clearing the plaza.']],
    [cmb(-242, -28, 22, 4, 'Clear ambush in Barrio Mirador', { ws: 1 }), rch(-55, -65, 13, 'Regroup at Financial Plaza')]),
  mkM('m4_esmeralda_run', 4, A2, 'Emerald Wake', MA, 'Marina del Faro', 372, 232, 14000, 220, 'Pilot a Marlin Jet to Cayo Esmeralda for the ledger.',
    [[MA, 'Serrano keeps shell-bank drives on Cayo Esmeralda.'], [CR, 'Harbor units: unauthorized boat outbound from Slip 4.']],
    [rch(388, 242, 12, 'Board Marlin Jet at Marina slip', { sv: 'marlin' }), rch(452, 38, 18, 'Reach Cayo Esmeralda cove', { ws: 3 }), rch(392, -95, 16, 'Land ledger at Playa Coral jetty', { ch: 1 })]),
  mkM('m5_convoy_heist', 5, A2, 'Armored Tide', MA, 'Puerto Industrial', -240, 195, 18500, 260, 'Ambush Serrano’s Toro 4x4 convoy in Puerto Industrial.',
    [[SE, 'Double the dockyard guards on my port revenue.'], [EL, 'Too slow, Serrano. Convoy spotted by the cranes.']],
    [cmb(-285, 248, 24, 4, 'Disable convoy in Puerto Industrial', { tv: 'toro', ws: 3 }), rch(-175, -285, 14, 'Haul cases to Colinas Doradas', { ch: 1 })]),
  mkM('m6_plaza_shootout', 6, A2, 'Glass Tower Takedown', MA, 'Distrito Financiero', -15, -35, 22000, 300, 'Raid Serrano’s brokers in Distrito Financiero.',
    [[CR, 'Guardia Tactical, seal Financial Plaza!'], [EL, 'Got the wire ledger, Mateo. Punching out!']],
    [cmb(24, -12, 24, 5, 'Clear enforcers at Financial Plaza', { ws: 3 }), rch(210, -118, 13, 'Evade Guardia & reach Villa Solis', { ch: 1 })]),
  mkM('m7_dockyard_sabotage', 7, A3, 'Harbor Inferno', EL, 'Marina del Faro', 315, 215, 28000, 360, 'Torch Serrano’s fleet on Marina del Faro pier.',
    [[EL, 'Serrano’s rigs and boats are on the pier. Lighting them up.'], [MA, 'Harbor cruisers incoming! Clear the pier!']],
    [cmb(342, 236, 24, 4, 'Wreck Serrano’s pier rig & guards', { tv: 'toro', ws: 3 }), rch(248, 32, 15, 'Escape along Playa Coral Blvd', { ch: 1 })]),
  mkM('m8_causeway_breach', 8, A3, 'Causeway Lockdown', CR, 'Autopista Costera', 255, -42, 35000, 440, 'Breach a 4-star roadblock and Halcón-1 on the causeway.',
    [[CR, 'Halcón-1 has visual! Lock down Cayo Esmeralda bridge!'], [EL, 'Hitting nitro straight through the gap!']],
    [rch(355, -40, 16, 'Charge Cayo Esmeralda causeway', { ws: 4 }), rch(472, -40, 16, 'Breach blockade onto Cayo Esmeralda'), rch(210, -118, 14, 'Lose Halcón-1 & return to Villa Solis', { ch: 1 })]),
  mkM('m9_high_tide_finale', 9, A3, 'High Tide', SE, 'Colinas Doradas', -105, -285, 65000, 750, 'Storm Serrano’s compound, survive 5-star Lockdown, and claim San Coral.',
    [[SE, 'You think San Coral belongs to street drivers, Navarro?'], [EL, 'High tide’s in, Serrano. Your syndicate washes out.']],
    [cmb(-128, -315, 26, 6, 'Defeat Serrano’s guard in Colinas Doradas', { tv: 'toro', ws: 4 }), rch(320, -38, 16, 'Survive 5-Star Lockdown to Playa Coral', { ws: 5 }), rch(210, -120, 14, 'Return victorious to Villa Solis', { ch: 1 })]),
];

const mkAct = (id, title, category, district, startX, startZ, targetX, targetZ, timeLimit, rewardCash, rewardRespect, ex) => ({
  id, title, category, district, startX, startZ, targetX, targetZ, timeLimit, rewardCash, rewardRespect, ...ex,
});
export const SIDE_ACTIVITIES = [
  mkAct('act_sunset_race', 'Sunset Street Race', 'Street Sprint', 'Playa Coral', 314, -215, 320, 235, 55, 7500, 95, { vehicleHint: 'veloz', description: 'Coastal sprint to Marina del Faro.' }),
  mkAct('act_harbor_trial', 'Harbor Boat Time-Trial', 'Marine Trial', 'Marina del Faro', 386, 236, 452, -18, 60, 9000, 115, { vehicleHint: 'marlin', description: 'Marlin Jet run to Cayo Esmeralda.' }),
  mkAct('act_syndicate_bounty', 'Syndicate Bounty', 'Hit Contract', 'Puerto Industrial', -246, 205, -278, 242, 90, 11000, 140, { hostiles: 3, description: 'Eliminate Serrano’s dockyard lieutenants.' }),
];

const mkUpg = (id, perkKey, name, cost, summary) => ({ id, perkKey, name, cost, summary, description: summary });
export const SAFEHOUSE_UPGRADES = [
  mkUpg('turbo_ecu', 'turboEcu', 'Turbo ECU', 9500, '+22% Nitro torque & fast recovery.'),
  mkUpg('kevlar_weave', 'kevlarWeave', 'Kevlar Weave', 12000, 'Max Armor 150 & Max Health 125.'),
  mkUpg('radar_scrambler', 'radarScrambler', 'Radar Scrambler', 15500, '-35% heat gain & +40% evasion speed.'),
  mkUpg('extended_mags', 'extendedMags', 'Extended Mags', 11000, '+50% magazine & reserve ammo.'),
];

function mkBeacon(col = 0xffbe3b, sc = 1) {
  const group = new Group();
  const ring = new Mesh(new TorusGeometry(2.25 * sc, 0.14 * sc, 10, 28), new MeshBasicMaterial({ color: col }));
  ring.rotation.x = Math.PI * 0.5; ring.position.y = 0.16;
  const colM = new Mesh(new CylinderGeometry(2.1 * sc, 2.1 * sc, 4.4 * sc, 20, 1, true), new MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, side: DoubleSide, depthWrite: false }));
  colM.position.y = 2.25 * sc;
  const dia = new Mesh(new OctahedronGeometry(0.52 * sc, 0), new MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.55, roughness: 0.25, metalness: 0.4 }));
  dia.position.y = 3.2 * sc;
  group.add(ring, colM, dia);
  return { group, diamond: dia };
}

const rdSlots = () => { try { const p = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') : null; return Array.isArray(p) ? [p[0] || null, p[1] || null, p[2] || null] : [null, null, null]; } catch { return [null, null, null]; } };
const wrSlots = (s) => { try { if (typeof localStorage !== 'undefined') localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* ignore */ } };

export function createMissionAndSaveSystem(scene, world, vm, ls, ps, ws, audio) {
  const mGrp = new Group(); scene.add(mGrp);
  let slots = rdSlots();
  const st = { am: null, cs: null, si: 0, stT: null, ab: null, rt: [], ad: null, dn: [], hs: [], tv: null, cw: null };
  const gY = (x, z) => Math.max(0, world?.getGroundHeight ? world.getGroundHeight(x, z) : 0);
  const safeP = (x, z) => {
    const w = Boolean(world?.isWater?.(x, z)); const c = !w ? world?.resolveCircleCollision?.(x, z, 2.6) : null;
    const [sx, sz] = c ? [c.x, c.z] : [x, z];
    return { x: sx, y: w ? 0.15 : gY(sx, sz), z: sz };
  };
  const mkList = (arr, col, sc) => arr.map((it) => { const mk = mkBeacon(col, sc); const p = safeP(it.startX, it.startZ); it.startX = p.x; it.startZ = p.z; mk.group.position.set(p.x, p.y, p.z); mGrp.add(mk.group); return { it, mk }; });
  const [sRings, aRings] = [mkList(STORY_MISSIONS, 0xffbe3b, 1), mkList(SIDE_ACTIVITIES, 0x18e0cf, 0.88)];
  const [objM, stgM, shM] = [mkBeacon(0xff4d6d, 1.18), mkBeacon(0xffbe3b, 1.05), mkBeacon(0x18e0cf, 0.95)];
  objM.group.visible = stgM.group.visible = false;
  const sh = world?.safehouse ?? { x: 210, z: -120, name: 'Villa Solis Safehouse' };
  shM.group.position.set(sh.x, gY(sh.x, sh.z), sh.z); mGrp.add(objM.group, stgM.group, shM.group);

  let [q, rT, clk] = [[], 0, 0];
  const triggerDialogue = (speaker, text, timer = 5.5) => { st.ad = { speaker, text, timer }; };
  const refreshGps = () => {
    const t = st.ab || st.cw;
    if (!t || !ps) { st.rt = []; return; }
    const r = world?.roadGraph?.computeRoute?.(ps.x, ps.z, t.x, t.z);
    st.rt = Array.isArray(r) && r.length >= 2 ? r : [{ x: ps.x, z: ps.z }, { x: t.x, z: t.z }];
  };
  const abandonMission = () => { Object.assign(st, { am: null, cs: null, ab: null, stT: null, rt: [], tv: null }); st.hs.length = 0; objM.group.visible = false; };

  function activateStep(idx, o = {}) {
    if (!st.am) return;
    const s = st.am.steps[idx];
    if (!s) {
      const f = st.am;
      if (!f.isActivity && !st.dn.includes(f.id)) st.dn.push(f.id);
      ps?.addCash?.(f.rewardCash || 5000); ps?.addRespect?.(f.rewardRespect || 100);
      triggerDialogue(EL, `Contract complete: ${f.title} (+$${(f.rewardCash || 0).toLocaleString()} · +${f.rewardRespect || 0} Respect)`, 5.5);
      abandonMission(); audio?.playMissionComplete?.();
      return;
    }
    st.hs.length = 0; st.tv = null; st.si = idx;
    const lbl = o.customObjective || s.label;
    st.cs = { ...s, label: lbl, objective: lbl };
    st.stT = s.tl ?? s.timeLimit ?? null;
    const y = gY(s.x, s.z);
    st.ab = { x: s.x, y, z: s.z, radius: s.radius || 14, label: st.cs.label };
    objM.group.position.set(s.x, y, s.z); objM.group.visible = true;
    if (!o.skipSpawns) {
      if (s.sv) vm?.spawnVehicle?.(s.sv, s.x + 2.5, s.z + 2.5, 0);
      if (s.tv) st.tv = vm?.spawnVehicle?.(s.tv, s.x, s.z, 0.5, { colorHex: 0x1f2937 }) ?? null;
      if (s.hostiles && ls?.spawnPedestrian) for (let i = 0; i < s.hostiles; i++) {
        const a = (i / s.hostiles) * Math.PI * 2;
        const p = ls.spawnPedestrian(s.x + Math.cos(a) * 5.5, s.z + Math.sin(a) * 5.5, { isHostile: true, hp: 70 });
        if (p) st.hs.push(p);
      }
      if (s.ws && !o.skipWanted) ws?.setWantedLevel?.(Math.max(ws.level || 0, s.ws));
    }
    refreshGps();
  }

  function startMission(id, o = {}) {
    const f = STORY_MISSIONS.find((m) => m.id === id) || STORY_MISSIONS[0];
    if (!f) return null;
    st.am = { ...f, isActivity: false };
    if (!o.skipDialogue && f.dialogues?.length) { const [a, ...r] = f.dialogues; triggerDialogue(a.speaker, a.text, a.duration || 5.2); q = r.slice(); }
    activateStep(typeof o.stepIndex === 'number' ? o.stepIndex : 0, o);
    audio?.playUiConfirm?.();
    return st.am;
  }

  function startActivity(id) {
    const a = SIDE_ACTIVITIES.find((x) => x.id === id);
    if (!a) return null;
    const step = a.hostiles ? cmb(a.targetX, a.targetZ, 22, a.hostiles, `${a.title}: Eliminate ${a.hostiles} targets`, { timeLimit: a.timeLimit }) : rch(a.targetX, a.targetZ, 16, `${a.title}: Finish in ${a.timeLimit}s`, { timeLimit: a.timeLimit });
    st.am = { id: a.id, act: a.category, title: a.title, giver: 'FIXER CONTRACT', district: a.district, rewardCash: a.rewardCash, rewardRespect: a.rewardRespect, isActivity: true, steps: [step] };
    triggerDialogue(MA, `${a.title} live—reward $${a.rewardCash.toLocaleString()}.`, 4.5);
    activateStep(0); audio?.playUiConfirm?.();
    return st.am;
  }

  function saveSlot(i = 0, ex = {}) {
    const idx = Math.max(0, Math.min(2, i | 0)); const n = st.dn.length;
    const dO = world?.getDistrictAt?.(ps?.x ?? 210, ps?.z ?? -120);
    slots[idx] = {
      slotIndex: idx, savedAt: ex.savedAt || 'Villa Solis',
      actLabel: ex.actLabel || (n >= 6 ? 'Act III' : n >= 3 ? 'Act II' : 'Act I'),
      progressPct: ex.progressPct ?? Math.min(100, Math.round((n / STORY_MISSIONS.length) * 100)),
      completedIds: (ex.completedIds || st.dn).slice(),
      cash: ex.cash ?? ps?.cash ?? 12500, respect: ex.respect ?? ps?.respect ?? 100,
      district: ex.district || (typeof dO === 'string' ? dO : dO?.name || 'Playa Coral'),
      timeOfDay: ex.timeOfDay ?? world?.getTimeOfDay?.() ?? 0.67, player: ex.player || ps?.getSaveData?.() || null,
    };
    wrSlots(slots); audio?.playUiConfirm?.(); return slots[idx];
  }

  function loadSlot(i = 0) {
    const idx = Math.max(0, Math.min(2, i | 0)); const d = slots[idx];
    if (!d) return false;
    abandonMission(); st.dn = (d.completedIds || []).slice();
    if (d.player && ps?.loadSaveData) ps.loadSaveData(d.player);
    else if (ps) { ps.cash = d.cash ?? ps.cash; ps.respect = d.respect ?? ps.respect; }
    if (typeof d.timeOfDay === 'number') world?.setTimeOfDay?.(d.timeOfDay);
    ws?.clearWanted?.(); triggerDialogue('VILLA SOLIS', `Loaded Slot ${idx + 1}: ${d.actLabel} · ${d.progressPct}%`, 4);
    audio?.playUiConfirm?.(); return true;
  }

  const getSlotsSummary = () => [0, 1, 2].map((i) => {
    const s = slots[i]; const o = Boolean(s);
    return {
      slotIndex: i, occupied: o,
      title: o ? `Save Slot ${i + 1}: ${s.actLabel} · ${s.progressPct}% · $${Number(s.cash).toLocaleString()}` : `Save Slot ${i + 1}: Empty`,
      actLabel: o ? s.actLabel : 'New Game', progressPct: o ? s.progressPct : 0, cash: o ? s.cash : 0, respect: o ? s.respect : 0,
      district: o ? s.district : 'Villa Solis', savedAt: s?.savedAt, completedCount: s?.completedIds?.length || 0, totalMissions: STORY_MISSIONS.length,
    };
  });

  function seedDemoSaveSlot() {
    const ids = STORY_MISSIONS.slice(0, 5).map((m) => m.id); st.dn = ids.slice();
    slots[0] = { slotIndex: 0, savedAt: 'Villa Solis · 18:42', actLabel: 'Act II', progressPct: 56, completedIds: ids, cash: 48500, respect: 1030, district: 'Playa Coral', timeOfDay: 0.67, player: { x: 210, z: -114, heading: 0, hp: 100, maxHp: 125, armor: 120, maxArmor: 150, cash: 48500, respect: 1030, weaponIndex: 3, perks: { turboEcu: true, kevlarWeave: true, radarScrambler: false, extendedMags: false } } };
    slots[1] = { slotIndex: 1, savedAt: 'Playa Coral · 11:15', actLabel: 'Act I', progressPct: 22, completedIds: STORY_MISSIONS.slice(0, 2).map((m) => m.id), cash: 21000, respect: 370, district: 'Barrio Mirador', timeOfDay: 0.38, player: null };
    wrSlots(slots); return getSlotsSummary();
  }

  const exportSaveJson = () => JSON.stringify({ schema: 'san-coral-saves/v1', slots });
  const importSaveJson = (raw) => { try { const p = JSON.parse(raw); const a = Array.isArray(p) ? p : p?.slots; if (!Array.isArray(a)) return false; slots = [a[0] || null, a[1] || null, a[2] || null]; wrSlots(slots); return true; } catch { return false; } };
  const setCustomWaypoint = (x, z, label = 'Waypoint') => { st.cw = typeof x === 'number' && typeof z === 'number' ? { x, z, label } : null; refreshGps(); };
  const placeStageRing = (x, z) => { stgM.group.position.set(x, gY(x, z), z); stgM.group.visible = true; return stgM.group; };
  const purchaseUpgrade = (id) => { const u = SAFEHOUSE_UPGRADES.find((x) => x.id === id || x.perkKey === id); return u && ps?.buyUpgrade ? ps.buyUpgrade(u.id, u.cost) : false; };

  function getMinimapBeacons() {
    const out = [{ x: sh.x, z: sh.z, type: 'safehouse', label: sh.name || 'Villa Solis' }];
    if (st.ab) out.push({ x: st.ab.x, z: st.ab.z, type: 'objective', label: st.ab.label });
    else {
      for (const e of sRings) if (e.mk.group.visible) out.push({ x: e.it.startX, z: e.it.startZ, type: 'mission', label: `${e.it.act}: ${e.it.title}` });
      for (const e of aRings) out.push({ x: e.it.startX, z: e.it.startZ, type: 'activity', label: e.it.title });
    }
    return out;
  }

  function update(dt) {
    clk += dt;
    for (const e of sRings) { e.mk.group.visible = !st.am && !st.dn.includes(e.it.id); if (e.mk.group.visible) { e.mk.diamond.rotation.y = clk * 2.2; e.mk.diamond.position.y = 3.15 + Math.sin(clk * 3.1) * 0.25; } }
    for (const e of aRings) { e.mk.group.visible = !st.am; if (e.mk.group.visible) e.mk.diamond.rotation.y = -clk * 2.4; }
    if (stgM.group.visible) stgM.diamond.rotation.y = clk * 2.4;
    if (st.ad && (st.ad.timer -= dt) <= 0) { const nx = q.shift(); st.ad = nx ? { speaker: nx.speaker, text: nx.text, timer: nx.duration || 5 } : null; }
    if (!ps) return;
    if (!st.am) {
      for (const e of sRings) if (e.mk.group.visible && Math.hypot(ps.x - e.it.startX, ps.z - e.it.startZ) < 3.4) { startMission(e.it.id); return; }
      for (const e of aRings) if (Math.hypot(ps.x - e.it.startX, ps.z - e.it.startZ) < 3.4) { startActivity(e.it.id); return; }
      if (st.cw) { if ((rT -= dt) <= 0) { rT = 0.5; refreshGps(); } if (Math.hypot(ps.x - st.cw.x, ps.z - st.cw.z) < 8) { st.cw = null; st.rt = []; } }
      return;
    }
    objM.diamond.rotation.y = clk * 2.8; objM.diamond.position.y = 3.3 + Math.sin(clk * 3.6) * 0.28;
    if ((rT -= dt) <= 0) { rT = 0.4; refreshGps(); }
    if (typeof st.stT === 'number' && (st.stT -= dt) <= 0) { triggerDialogue(MA, 'Time expired! Try again.', 4.5); abandonMission(); return; }
    const s = st.cs;
    if (!s) return;
    const d = Math.hypot(ps.x - s.x, ps.z - s.z);
    if (s.type === 'reach' && d <= (s.radius || 14) && (!s.nv || Boolean(ps.inVehicle))) { if (s.ch) ws?.clearWanted?.(); activateStep(st.si + 1); }
    else if (s.type === 'combat' && !st.hs.some((h) => h && !h.dead && (h.hp ?? 1) > 0) && !(st.tv && !st.tv.destroyed) && d <= (s.radius || 28) * 1.6) activateStep(st.si + 1);
  }

  const api = {
    missions: STORY_MISSIONS, activities: SIDE_ACTIVITIES, upgrades: SAFEHOUSE_UPGRADES,
    startMission, startActivity, abandonMission, saveSlot, loadSlot, getSlotsSummary, seedDemoSaveSlot,
    exportSaveJson, importSaveJson, setCustomWaypoint, triggerDialogue, placeStageRing, getMinimapBeacons, purchaseUpgrade, update,
  };
  for (const p of 'activeMission:am,currentStep:cs,stepTimer:stT,activeBeacon:ab,gpsRoute:rt,activeDialogue:ad,completedIds:dn'.split(',')) {
    const [pub, sk] = p.split(':');
    Object.defineProperty(api, pub, { enumerable: true, get: () => st[sk], set: (v) => { st[sk] = v; } });
  }
  return api;
}
