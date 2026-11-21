import * as THREE from 'three';

const { Group, Mesh, BoxGeometry, SphereGeometry, CylinderGeometry, CircleGeometry, RingGeometry, ConeGeometry, DodecahedronGeometry, PointLight, Vector3, DoubleSide, MeshStandardMaterial, MeshBasicMaterial } = THREE;
const sm = (color, roughness = 0.5, metalness = 0.1, ex = {}) => new MeshStandardMaterial({ color, roughness, metalness, ...ex });
const bm = (color, ex = {}) => new MeshBasicMaterial({ color, ...ex });
const tb = (c, opacity, ex = {}) => bm(c, { transparent: true, opacity, depthWrite: false, ...ex });
const mw = (id, name, label, slot, damage, range, fireRate, spread, clipSize, maxReserve, auto, explosive, tracerColor, heatGain, blastRadius = 0) => ({
  id, name, label, slot, damage, range, fireRate, spread, clipSize, maxReserve, auto, explosive, tracerColor, heatGain, blastRadius,
});

export const WEAPONS = [
  mw('fist', 'Unarmed', 'UNARMED', 1, 24, 2.7, 0.34, 0.02, 0, 0, false, false, 0xffffff, 8),
  mw('pistol', 'Viper 9mm', 'VIPER 9MM', 2, 34, 80, 0.22, 0.016, 15, 90, false, false, 0xffe066, 16),
  mw('smg', 'Vendaval SMG', 'VENDAVAL SMG', 3, 22, 72, 0.09, 0.038, 32, 192, true, false, 0xffbe3b, 14),
  mw('carbine', 'Corsario Carbine', 'CORSARIO CARBINE', 4, 40, 125, 0.12, 0.014, 28, 120, true, false, 0xffd166, 20),
  mw('launcher', 'Trueno Heavy Launcher', 'TRUENO LAUNCHER', 5, 280, 140, 0.95, 0.008, 1, 8, false, true, 0xff5a36, 60, 10.5),
];

const bx = (p, w, h, d, m, x, y, z, sh = false) => { const o = new Mesh(new BoxGeometry(w, h, d), m); o.position.set(x, y, z); if (sh) o.castShadow = true; p.add(o); return o; };
const clp = (v, a, b) => Math.max(a, Math.min(b, v));

function buildWeapons() {
  const [met, gld, olv, holder] = [sm(0x1e2533, 0.38, 0.72), sm(0xf59e0b, 0.35, 0.65), sm(0x36493c, 0.55, 0.35), new Group()];
  const map = { pistol: new Group(), smg: new Group(), carbine: new Group(), launcher: new Group() };
  for (const [k, w, h, d, m, y, z] of [['pistol', 0.08, 0.09, 0.28, met, 0.03, 0.1], ['pistol', 0.07, 0.14, 0.09, met, -0.05, 0], ['smg', 0.09, 0.11, 0.42, met, 0.03, 0.16], ['smg', 0.06, 0.2, 0.07, gld, -0.09, 0.18], ['carbine', 0.09, 0.12, 0.64, met, 0.03, 0.24], ['carbine', 0.065, 0.22, 0.085, gld, -0.09, 0.25]]) bx(map[k], w, h, d, m, 0, y, z);
  for (const [k, r, l, m, y, z] of [['carbine', 0.022, 0.28, met, 0.04, 0.64], ['launcher', 0.088, 0.92, olv, 0.08, 0.24], ['launcher', 0.105, 0.08, gld, 0.08, 0.66]]) {
    const c = new Mesh(new CylinderGeometry(r, r, l, 10), m); c.rotation.x = 1.571; c.position.set(0, y, z); map[k].add(c);
  }
  for (const g of Object.values(map)) { g.visible = false; holder.add(g); }
  return { holder, map };
}

function buildElena() {
  const [root, body, hd] = [new Group(), new Group(), new Group()];
  const [skin, hair, jkt, trm, tee, jns, sho, shd] = [sm(0xd99b72, 0.62), sm(0x1a1423, 0.72), sm(0xff4d6d, 0.48, 0.08), sm(0x111827, 0.55), sm(0xfff3e6, 0.65), sm(0x1d283a, 0.75), sm(0xf8fafc, 0.5), sm(0x090d16, 0.18, 0.85)];
  const disc = new Mesh(new CircleGeometry(0.46, 18), tb(0x050811, 0.38));
  disc.rotation.x = -1.571; disc.position.y = 0.03;
  hd.position.set(0, 1.6, 0); body.add(hd); root.add(disc, body);
  for (const [w, h, d, m, x, y, z, s] of [[0.38, 0.18, 0.24, jns, 0, 0.86, 0, 1], [0.44, 0.5, 0.26, jkt, 0, 1.18, 0, 1], [0.18, 0.42, 0.16, tee, 0, 1.18, 0.065, 0], [0.3, 0.08, 0.28, trm, 0, 1.42, -0.01, 0]]) bx(body, w, h, d, m, x, y, z, Boolean(s));
  for (const [w, h, d, m, x, y, z, rx] of [[0.27, 0.29, 0.27, skin, 0, 0, 0, 0], [0.3, 0.13, 0.3, hair, 0, 0.12, -0.01, 0], [0.26, 0.28, 0.11, hair, 0, -0.02, -0.14, 0], [0.11, 0.24, 0.11, hair, 0, -0.08, -0.22, 0.28], [0.26, 0.075, 0.06, shd, 0, 0.03, 0.13, 0]]) bx(hd, w, h, d, m, x, y, z, m === skin).rotation.x = rx;

  const limb = (x, y, a, b) => { const p = new Group(); p.position.set(x, y, 0); bx(p, ...a, true); bx(p, ...b); body.add(p); return p; };
  const [lArm, rArm] = [-1, 1].map((s) => limb(s * 0.29, 1.38, [0.14, 0.32, 0.14, jkt, 0, -0.14, 0], [0.11, 0.24, 0.11, skin, 0, -0.38, 0]));
  const [lLeg, rLeg] = [-1, 1].map((s) => limb(s * 0.11, 0.8, [0.15, 0.68, 0.16, jns, 0, -0.34, 0], [0.16, 0.11, 0.25, sho, 0, -0.72, 0.04]));

  const wRig = buildWeapons();
  wRig.holder.position.set(0, -0.46, 0.08); wRig.holder.rotation.x = 1.571; rArm.add(wRig.holder);
  const muzM = new Mesh(new ConeGeometry(0.14, 0.38, 7), tb(0xfff3b0, 0.95));
  muzM.rotation.x = 1.571; muzM.position.set(0, 0.05, 0.82); muzM.visible = false;
  const muzL = new PointLight(0xffb703, 0, 14); muzL.position.set(0, 0.05, 0.86);
  wRig.holder.add(muzM, muzL);
  return { root, body, lArm, rArm, lLeg, rLeg, wRig, muzM, muzL, disc };
}

export function createPlayerCombatSystem(scene, world, vm, ls, audio) {
  const [ac, fx] = [buildElena(), new Group()];
  scene.add(ac.root, fx);
  const [sx0, sz0] = [world?.safehouse?.x ?? 210, (world?.safehouse?.z ?? -120) + 8];
  const gAt = (x, z) => Math.max(0, world?.getGroundHeight ? world.getGroundHeight(x, z) : 0);
  const st = {
    x: sx0, y: gAt(sx0, sz0), z: sz0, hd: 0, vx: 0, vz: 0, iv: null, nv: null, hp: 100, mHp: 100, ar: 50, mAr: 100, cs: 12500, rp: 100, wI: 1,
    ws: WEAPONS.map((w) => ({ ...w, ammoInClip: w.clipSize, ammoReserve: w.maxReserve, unlocked: true })),
    am: false, sp: false, rl: false, mf: 0, tr: [], ex: [], pk: { turboEcu: false, kevlarWeave: false, radarScrambler: false, extendedMags: false },
  };
  let [wPh, fCd, rT, rH, pTog] = [0, 0, 0, 0, false];
  const syncW = () => { const id = st.ws[st.wI]?.id; for (const [k, m] of Object.entries(ac.wRig.map)) m.visible = k === id; };
  syncW();

  function setPosition(x, z, h = st.hd) {
    Object.assign(st, { x, z, hd: h, vx: 0, vz: 0, y: gAt(x, z) });
    const v = st.iv;
    if (v) { Object.assign(v, { x, z, heading: h, y: v.isBoat ? 0.15 : st.y }); v.mesh?.position.set(x, v.y, z); if (v.mesh) v.mesh.rotation.y = h; }
    ac.root.position.set(x, st.y, z); ac.root.rotation.y = h;
  }

  function enterVehicle(v, ws) {
    if (!v || v.destroyed) return false;
    const stolen = v.driverType && v.driverType !== 'none' && v.driverType !== 'player';
    st.iv = v; v.driverType = 'player'; st.nv = null;
    Object.assign(st, { x: v.x, y: v.y ?? 0, z: v.z, hd: v.heading ?? st.hd });
    if (st.pk.turboEcu) { v.nitro = Math.max(v.nitro ?? 100, 100); v.turboBoostMul = 1.22; }
    ac.root.visible = v.type === 'rayo' || v.type === 'marlin'; ac.disc.visible = false;
    if (stolen) ws?.addHeat?.((v.isPolice ? 55 : 26) * (st.pk.radarScrambler ? 0.65 : 1), 'carjack');
    audio?.playDoor?.(); return true;
  }

  function exitVehicle() {
    const v = st.iv;
    if (!v) return false;
    v.driverType = 'none'; st.iv = null;
    Object.assign(st, { x: v.x - Math.cos(v.heading) * 2.3, z: v.z + Math.sin(v.heading) * 2.3, vx: 0, vz: 0 });
    st.y = gAt(st.x, st.z); ac.root.visible = ac.disc.visible = true;
    ac.root.position.set(st.x, st.y, st.z); ac.root.rotation.y = st.hd;
    audio?.playDoor?.(); return true;
  }

  const tryToggleVehicle = (ws) => (st.iv ? exitVehicle() : enterVehicle(st.nv || vm?.findNearestInteractable?.(st.x, st.z, 5.2), ws));
  const selectWeapon = (i) => { st.wI = Math.max(0, Math.min(st.ws.length - 1, i | 0)); syncW(); return st.ws[st.wI]; };
  const addCash = (n) => (st.cs = Math.max(0, Math.round(st.cs + n)));
  const addRespect = (n) => (st.rp = Math.max(0, Math.round(st.rp + n)));

  function reloadWeapon() {
    const w = st.ws[st.wI];
    if (!w || w.clipSize <= 0 || w.ammoInClip >= w.clipSize || w.ammoReserve <= 0) return false;
    const t = Math.min(w.clipSize - w.ammoInClip, w.ammoReserve);
    w.ammoInClip += t; w.ammoReserve -= t; fCd = Math.max(fCd, 0.32); return true;
  }

  function spawnExplosion(c, sc = 1) {
    const g = new Group(); g.position.copy(c);
    const core = new Mesh(new SphereGeometry(1.05 * sc, 12, 10), tb(0xfff7cc, 0.98));
    const fb = new Mesh(new SphereGeometry(1.85 * sc, 12, 10), tb(0xff6d00, 0.9));
    const sr = new Mesh(new RingGeometry(0.9 * sc, 1.6 * sc, 20), tb(0xffbe3b, 0.9, { side: DoubleSide }));
    core.position.y = 0.95 * sc; fb.position.y = 1.1 * sc; fb.renderOrder = 3; core.renderOrder = 4;
    sr.rotation.x = -1.571; sr.position.y = 0.14;
    const lt = new PointLight(0xff6d00, 5.2, 30 * sc); lt.position.y = 2;
    const puffs = [0, 1, 2, 3, 4].map((i) => {
      const a = i * 1.256;
      const m = new Mesh(new DodecahedronGeometry((0.42 + (i % 3) * 0.15) * sc, 0), tb(0x222730, 0.55));
      m.position.set(Math.cos(a) * 0.85 * sc, (1.75 + i * 0.34) * sc, Math.sin(a) * 0.85 * sc); g.add(m);
      return { mesh: m, vx: Math.cos(a) * 1.8, vy: 2.9 + i * 0.45, vz: Math.sin(a) * 1.8 };
    });
    g.add(fb, core, sr, lt); fx.add(g);
    const ex = { group: g, core, fireball: fb, shockRing: sr, light: lt, puffs, age: 0, duration: 1.55 };
    st.ex.push(ex); audio?.playExplosion?.();
    return ex;
  }

  function spawnVisualShotEffect(f, t, boom = false) {
    const [s, e] = [f, t].map((p) => (p instanceof Vector3 ? p.clone() : new Vector3(p.x, p.y, p.z)));
    const d = e.clone().sub(s);
    const beam = new Mesh(new CylinderGeometry(0.022, 0.022, Math.max(0.25, d.length()), 6, 1, true), tb((st.ws[st.wI] || WEAPONS[3]).tracerColor || 0xffd166, 0.95));
    beam.position.copy(s).addScaledVector(d, 0.5); beam.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), d.clone().normalize());
    const spark = new Mesh(new SphereGeometry(0.15, 8, 8), tb(0xfff7cc, 0.96));
    spark.position.copy(e); fx.add(beam, spark);
    st.tr.push({ beam, spark, age: 0, duration: 0.28 }); st.mf = 0.14; ac.muzM.visible = true; ac.muzL.intensity = 3.2;
    if (boom) spawnExplosion(e, 1.15);
  }

  const downPed = (p, c, r, ws) => { p.dead = true; if (p.mesh) p.mesh.rotation.x = -Math.PI * 0.48; if (p.isHostile) { addCash(c); addRespect(r); } else ws?.addHeat?.(24, 'assault'); };
  const dmgVeh = (v, dmg, heat, ws) => {
    vm.damageVehicle ? vm.damageVehicle(v, dmg, () => spawnExplosion(new Vector3(v.x, (v.y ?? 0) + 0.65, v.z), 1.2)) : (v.hp = Math.max(0, (v.hp ?? 100) - dmg));
    if (v.isPolice) ws?.addHeat?.(heat, 'police_hit');
  };

  function fireWeapon(aimO, aimD, ws) {
    const w = fCd <= 0 ? st.ws[st.wI] : null;
    if (!w) return false;
    if (w.clipSize > 0) { if (w.ammoInClip <= 0) { reloadWeapon(); return false; } w.ammoInClip -= 1; }
    fCd = w.fireRate;
    const o = aimO instanceof Vector3 ? aimO.clone() : new Vector3(st.x + Math.sin(st.hd) * 0.45, st.y + 1.38, st.z + Math.cos(st.hd) * 0.45);
    const dir = aimD instanceof Vector3 ? aimD.clone().normalize() : new Vector3(Math.sin(st.hd), 0, Math.cos(st.hd)).normalize();
    if (w.id !== 'fist') { st.hd = Math.atan2(dir.x, dir.z); ac.root.rotation.y = st.hd; ws?.addHeat?.(w.heatGain * (st.pk.radarScrambler ? 0.65 : 1), 'gunfire'); }
    audio?.playWeaponFire?.(w.id); ls?.alertNearby?.(st.x, st.z, 36);

    let [best, hV, hP] = [w.range, null, null];
    const ph = ls?.hitTestRay?.(o, dir, best);
    if (ph && ph.distance < best) { best = ph.distance; hP = ph.pedestrian || ph.entity || ph; }
    for (const v of vm?.vehicles || []) if (v !== st.iv && !v.destroyed) {
      const c = new Vector3(v.x, (v.y ?? 0) + 0.9, v.z); const pr = c.clone().sub(o).dot(dir);
      if (pr > 0 && pr < best && o.clone().addScaledVector(dir, pr).distanceTo(c) < 1.85) { best = pr; hV = v; hP = null; }
    }
    const hit = o.clone().addScaledVector(dir, best); hit.y = Math.max(0.15, hit.y);
    if (w.id !== 'fist') { const mz = new Vector3(); ac.muzM.getWorldPosition(mz); spawnVisualShotEffect(mz.lengthSq() > 0.01 ? mz : o, hit, w.explosive); }
    if (w.explosive) {
      const r = w.blastRadius || 10;
      for (const v of vm?.vehicles || []) if (v !== st.iv && !v.destroyed) { const d = Math.hypot(v.x - hit.x, v.z - hit.z); if (d <= r) dmgVeh(v, w.damage * (1 - d / (r * 1.15)), 35, ws); }
      for (const p of ls?.pedestrians || []) if (!p.dead) { const d = Math.hypot(p.x - hit.x, p.z - hit.z); if (d <= r && (p.hp = (p.hp ?? 60) - w.damage * (1 - d / (r * 1.2))) <= 0) downPed(p, 250, 20, ws); }
      ls?.alertNearby?.(hit.x, hit.z, 42);
      return true;
    }
    if (hV) dmgVeh(hV, w.damage, 28, ws);
    else if (hP && (hP.hp = (hP.hp ?? 60) - w.damage) <= 0 && !hP.dead) downPed(hP, 200, 15, ws);
    return true;
  }

  function buyUpgrade(id, cost = 0) {
    const k = { turbo_ecu: 'turboEcu', kevlar_weave: 'kevlarWeave', radar_scrambler: 'radarScrambler', extended_mags: 'extendedMags' }[id] || id;
    if (st.cs < cost || st.pk[k]) return false;
    st.cs -= cost; st.pk[k] = true;
    if (k === 'kevlarWeave') Object.assign(st, { mAr: 150, ar: 150, mHp: 125, hp: 125 });
    else if (k === 'extendedMags') for (const w of st.ws) if (w.clipSize > 0) Object.assign(w, { clipSize: Math.round(w.clipSize * 1.5), maxReserve: Math.round(w.maxReserve * 1.5), ammoInClip: Math.round(w.clipSize * 1.5), ammoReserve: Math.round(w.maxReserve * 1.5) });
    else if (k === 'turboEcu' && st.iv) Object.assign(st.iv, { turboBoostMul: 1.22, nitro: 100 });
    audio?.playUiConfirm?.(); return true;
  }

  function takeDamage(amt) {
    if (rT > 0.12) return;
    const a = st.ar > 0 ? Math.min(st.ar, amt * 0.72) : 0; st.ar -= a;
    if ((st.hp = Math.max(0, st.hp - (amt - a))) <= 0) {
      exitVehicle();
      const sh = world?.safehouse ?? { x: 210, z: -120, heading: 0 };
      setPosition(sh.x, sh.z + 6, sh.heading || 0);
      Object.assign(st, { hp: st.mHp, ar: Math.min(st.mAr, 50), cs: Math.max(0, st.cs - 500) });
    }
  }

  const getSaveData = () => ({
    x: +st.x.toFixed(1), z: +st.z.toFixed(1), heading: +st.hd.toFixed(3), hp: st.hp | 0, maxHp: st.mHp, armor: st.ar | 0, maxArmor: st.mAr,
    cash: st.cs, respect: st.rp, weaponIndex: st.wI, perks: { ...st.pk },
    weapons: st.ws.map((w) => ({ id: w.id, ammoInClip: w.ammoInClip, ammoReserve: w.ammoReserve })),
  });

  function loadSaveData(d) {
    if (!d) return;
    exitVehicle();
    for (const p of 'maxHp:mHp,hp:hp,maxArmor:mAr,armor:ar,cash:cs,respect:rp'.split(',')) {
      const [dk, sk] = p.split(':'); if (typeof d[dk] === 'number') st[sk] = dk === 'hp' ? Math.max(1, d[dk]) : d[dk];
    }
    if (d.perks) Object.assign(st.pk, d.perks);
    for (const s of d.weapons || []) { const w = st.ws.find((x) => x.id === s.id); if (w) Object.assign(w, { ammoInClip: s.ammoInClip ?? w.clipSize, ammoReserve: s.ammoReserve ?? w.maxReserve }); }
    if (typeof d.weaponIndex === 'number') selectWeapon(d.weaponIndex);
    if (typeof d.x === 'number' && typeof d.z === 'number') setPosition(d.x, d.z, d.heading ?? 0);
  }

  function update(dt, inp = {}, cam = null, ws = null) {
    fCd = Math.max(0, fCd - dt);
    if (st.mf > 0 && (st.mf -= dt) <= 0) { ac.muzM.visible = false; ac.muzL.intensity = 0; }
    for (let i = st.tr.length - 1; i >= 0; i--) {
      const tr = st.tr[i]; const t = (tr.age += dt) / tr.duration;
      if (t >= 1) { for (const m of [tr.beam, tr.spark]) { fx.remove(m); m.geometry.dispose(); m.material.dispose(); } st.tr.splice(i, 1); }
      else { tr.beam.material.opacity = 0.94 * (1 - t); tr.spark.scale.setScalar(1 + t * 1.6); tr.spark.material.opacity = 0.9 * (1 - t); }
    }
    for (let i = st.ex.length - 1; i >= 0; i--) {
      const ex = st.ex[i]; const t = (ex.age += dt) / ex.duration;
      if (t >= 1) { fx.remove(ex.group); st.ex.splice(i, 1); } else {
        ex.core.scale.setScalar(1 + t * 1.45); ex.core.material.opacity = Math.max(0, 0.98 * (1 - t * 1.35));
        ex.fireball.scale.setScalar(1 + t * 1.9); ex.fireball.material.opacity = Math.max(0, 0.9 * (1 - t * 1.1));
        ex.shockRing.scale.setScalar(1 + t * 5.2); ex.shockRing.material.opacity = Math.max(0, 0.9 * (1 - t));
        ex.light.intensity = Math.max(0, 5.2 * (1 - t * 1.15));
        for (const p of ex.puffs) { p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt; p.mesh.scale.setScalar(1 + t * 1.25); p.mesh.material.opacity = Math.max(0, 0.55 * (1 - t)); }
      }
    }
    if (inp.weaponSlot >= 1 && inp.weaponSlot <= 5) selectWeapon(inp.weaponSlot - 1);
    if (inp.reloadPressed && !st.iv) reloadWeapon();
    const ks = inp.keys; const hk = (k) => (ks?.has ? ks.has(k) : Boolean(ks?.[k]));
    const tog = Boolean(inp.interactPressed || inp.toggleVehicle || inp.enterExitPressed || hk('KeyF') || hk('KeyE'));
    if (tog && !pTog) tryToggleVehicle(ws);
    pTog = tog;

    if (st.iv) {
      const v = st.iv;
      if (v.destroyed) { exitVehicle(); takeDamage(35); return; }
      Object.assign(st, { x: v.x, y: v.y ?? 0, z: v.z, vx: v.vx ?? 0, vz: v.vz ?? 0, hd: v.heading ?? st.hd, nv: null });
      const rd = v.type === 'rayo' || v.type === 'marlin'; ac.root.visible = rd;
      if (rd) {
        ac.root.position.set(v.x, (v.y ?? 0) + (v.type === 'rayo' ? 0.35 : 0.42), v.z);
        ac.root.rotation.y = v.heading; ac.body.rotation.x = v.type === 'rayo' ? 0.28 : 0.05;
        ac.lArm.rotation.x = ac.rArm.rotation.x = -0.75; ac.lLeg.rotation.x = ac.rLeg.rotation.x = -0.55;
      }
      return;
    }

    ac.root.visible = ac.disc.visible = true;
    st.nv = vm?.findNearestInteractable?.(st.x, st.z, 5) ?? null;
    const fwd = (inp.forward ? 1 : 0) - (inp.backward ? 1 : 0) || inp.moveZ || 0;
    const str = (inp.right ? 1 : 0) - (inp.left ? 1 : 0) || inp.moveX || 0;
    const yaw = typeof cam?.yaw === 'number' ? cam.yaw : st.hd;
    st.am = Boolean(inp.aiming || inp.rightMouseDown);
    st.sp = Boolean((inp.sprint || inp.boost) && !st.am && (fwd || str));
    if ((inp.rollPressed || inp.spacePressed) && rT <= 0 && (fwd || str)) { rT = 0.46; st.rl = true; rH = st.hd; }

    let [mx, mz] = [0, 0];
    if (rT > 0) {
      rT = Math.max(0, rT - dt); mx = Math.sin(rH) * 10.5; mz = Math.cos(rH) * 10.5;
      ac.body.rotation.x = (1 - rT / 0.46) * 6.283;
      if (rT <= 0) { st.rl = false; ac.body.rotation.x = 0; }
    } else {
      const [rx, rz] = [Math.sin(yaw) * fwd - Math.cos(yaw) * str, Math.cos(yaw) * fwd + Math.sin(yaw) * str];
      const mag = Math.hypot(rx, rz); const spd = st.sp ? 8.6 : st.am ? 3.8 : 5.4;
      if (mag > 0.01) { mx = (rx / mag) * spd; mz = (rz / mag) * spd; if (!st.am) st.hd = Math.atan2(mx, mz); }
      if (st.am && typeof cam?.yaw === 'number') st.hd = cam.yaw;
    }

    let [nx, nz] = [clp(st.x + mx * dt, -472, 535), clp(st.z + mz * dt, -472, 472)];
    if (world?.isWater?.(nx, nz)) { nx = st.x; nz = st.z; }
    const col = world?.resolveCircleCollision?.(nx, nz, 0.48);
    if (col) { nx = col.x; nz = col.z; }
    const idt = 1 / Math.max(dt, 0.001);
    st.vx = (nx - st.x) * idt; st.vz = (nz - st.z) * idt;
    st.x = nx; st.z = nz; st.y = gAt(nx, nz);
    ac.root.position.set(st.x, st.y, st.z); ac.root.rotation.y = st.hd;

    if (Math.hypot(st.vx, st.vz) > 0.25 && rT <= 0) {
      wPh += dt * (st.sp ? 13.5 : 8.5);
      const sw = Math.sin(wPh) * (st.sp ? 0.68 : 0.46);
      ac.lLeg.rotation.x = sw; ac.rLeg.rotation.x = -sw;
      ac.lArm.rotation.x = -sw * 0.8; ac.rArm.rotation.x = st.am ? -1.42 : sw * 0.8;
      ac.body.position.y = Math.abs(Math.cos(wPh)) * 0.045;
    } else if (rT <= 0) {
      ac.lLeg.rotation.x *= 0.82; ac.rLeg.rotation.x *= 0.82;
      ac.lArm.rotation.x = st.am ? -0.95 : ac.lArm.rotation.x * 0.82;
      ac.rArm.rotation.x = st.am ? -1.48 : ac.rArm.rotation.x * 0.82;
      ac.body.position.y = 0;
    }

    if (inp.firePressed || (st.ws[st.wI]?.auto && (inp.firing || inp.leftMouseDown))) {
      let [ao, ad] = [null, null];
      if (cam?.getAimRay) ({ origin: ao, direction: ad } = cam.getAimRay());
      else if (cam?.camera) { ao = new Vector3(st.x, st.y + 1.42, st.z); ad = cam.camera.getWorldDirection(new Vector3()); }
      fireWeapon(ao, ad, ws);
    }
  }

  setPosition(sx0, sz0, 0);
  const api = {
    mesh: ac.root, setPosition, enterVehicle, exitVehicle, tryToggleVehicle, selectWeapon, reloadWeapon,
    fireWeapon, takeDamage, addCash, addRespect, buyUpgrade, spawnVisualShotEffect, spawnExplosion,
    getSaveData, loadSaveData, update, get currentWeapon() { return st.ws[st.wI]; },
  };
  for (const p of 'x,y,z,heading:hd,vx,vz,inVehicle:iv,nearbyVehicle:nv,hp,maxHp:mHp,armor:ar,maxArmor:mAr,cash:cs,respect:rp,weaponIndex:wI,weapons:ws,aiming:am,sprinting:sp,rolling:rl,muzzleFlashTimer:mf,activeTracers:tr,activeExplosions:ex,perks:pk'.split(',')) {
    const [pub, sk = pub] = p.split(':');
    Object.defineProperty(api, pub, { enumerable: true, get: () => st[sk], set: (v) => { st[sk] = v; } });
  }
  return api;
}
