import * as THREE from 'three';

const { Group, Mesh, BoxGeometry, SphereGeometry, CylinderGeometry, CircleGeometry, ConeGeometry, PointLight, Vector3, DoubleSide, MeshStandardMaterial, MeshBasicMaterial } = THREE;
const STAR_THRESHOLDS = [0, 35, 95, 185, 310, 470];
const STAR_LABELS = ['CLEAR', 'PATROL ALERT', 'ACTIVE PURSUIT', 'TACTICAL INTERCEPT', 'METRO STRIKE', 'CITYWIDE LOCKDOWN'];
const sm = (color, roughness = 0.45, metalness = 0.2, ex = {}) => new MeshStandardMaterial({ color, roughness, metalness, ...ex });
const bm = (color, ex = {}) => new MeshBasicMaterial({ color, ...ex });
const bx = (p, w, h, d, m, x, y, z) => { const o = new Mesh(new BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o; };

function buildHalconHelicopter() {
  const [root, bg, mr, tr] = [new Group(), new Group(), new Group(), new Group()];
  root.add(bg);
  const [nv, wh, dk, cy] = [sm(0x0f1d35, 0.36, 0.45), sm(0xf8fafc, 0.4, 0.2), sm(0x111827, 0.5, 0.6), sm(0x18e0cf, 0.3, 0.2, { emissive: 0x0b7285, emissiveIntensity: 0.45 })];
  for (const [w, h, d, m, x, y, z, rx] of [[1.9, 0.95, 4.4, nv, 0, 0, 0, 0], [1.75, 0.85, 3.1, wh, 0, 0.78, 0.15, 0], [1.94, 0.2, 4.2, cy, 0, 0.36, 0.05, 0], [0.45, 0.48, 4.2, nv, 0, 0.55, -3.6, 0], [0.16, 1.35, 0.85, wh, 0, 1.05, -5.45, -0.2]]) bx(bg, w, h, d, m, x, y, z).rotation.x = rx;
  const nose = new Mesh(new SphereGeometry(0.95, 12, 10), sm(0x38bdf8, 0.12, 0.85, { transparent: true, opacity: 0.72 }));
  nose.scale.set(0.92, 0.85, 1.35); nose.position.set(0, 0.38, 1.85); bg.add(nose);
  for (const s of [-1, 1]) {
    const bar = new Mesh(new CylinderGeometry(0.06, 0.06, 3.8, 8), dk);
    bar.rotation.x = 1.571; bar.position.set(s * 1.05, -0.95, 0.2); bg.add(bar);
    for (const sz of [1.1, -0.9]) { const st = new Mesh(new CylinderGeometry(0.05, 0.05, 0.75, 6), dk); st.position.set(s * 0.85, -0.58, sz); st.rotation.z = s * 0.32; bg.add(st); }
  }
  mr.position.set(0, 1.42, 0.15); mr.add(new Mesh(new CylinderGeometry(0.12, 0.14, 0.35, 8), dk));
  for (let i = 0; i < 4; i++) { const ry = i * 1.571; bx(mr, 0.28, 0.035, 4.9, dk, Math.sin(ry) * 2.45, 0.1, Math.cos(ry) * 2.45).rotation.y = ry; }
  const disc = new Mesh(new CircleGeometry(4.9, 24), bm(0xcbd5e1, { side: DoubleSide, transparent: true, opacity: 0.2, depthWrite: false }));
  disc.rotation.x = -1.571; disc.position.y = 0.11; mr.add(disc);
  tr.position.set(0.28, 1.1, -5.55); bx(tr, 0.05, 1.35, 0.14, dk, 0, 0, 0); bx(tr, 0.05, 0.14, 1.35, dk, 0, 0, 0);
  bg.add(mr, tr);
  const bulb = (c, x, y, z, r = 0.18) => { const b = new Mesh(new SphereGeometry(r, 8, 8), bm(c)); b.position.set(x, y, z); bg.add(b); return b; };
  const [strobeRed, strobeBlue, searchLamp] = [bulb(0xff2a55, -0.55, -0.52, 0.8), bulb(0x2563eb, 0.55, -0.52, 0.8), bulb(0xfffbeb, 0, -0.48, 2.15, 0.24)];
  const cg = new ConeGeometry(5.6, 1, 20, 1, true); cg.translate(0, -0.5, 0);
  const spotlightCone = new Mesh(cg, bm(0xe0f7ff, { transparent: true, opacity: 0.22, side: DoubleSide, depthWrite: false }));
  const groundPool = new Mesh(new CircleGeometry(5.4, 24), bm(0xe0f7ff, { transparent: true, opacity: 0.28, depthWrite: false }));
  groundPool.rotation.x = -1.571;
  const poolLight = new PointLight(0xdaf4ff, 0, 26);
  root.visible = spotlightCone.visible = groundPool.visible = false;
  return { mesh: root, bodyGroup: bg, mainRotor: mr, tailRotor: tr, strobeRed, strobeBlue, searchLamp, spotlightCone, groundPool, poolLight, active: false, x: 0, y: 24, z: 0, heading: 0, orbitAngle: 0 };
}

function buildBarricadeProp() {
  const [g, org, wht, leg] = [new Group(), sm(0xf97316, 0.5, 0.1), sm(0xf8fafc, 0.45, 0.1), sm(0x334155, 0.6, 0.2)];
  for (const [w, h, d, m, x, y] of [[2.4, 0.34, 0.14, org, 0, 0.78], [0.55, 0.35, 0.15, wht, -0.6, 0.78], [0.55, 0.35, 0.15, wht, 0.6, 0.78], [0.12, 0.9, 0.6, leg, -0.9, 0.45], [0.12, 0.9, 0.6, leg, 0.9, 0.45]]) bx(g, w, h, d, m, x, y, 0);
  const f = new Mesh(new SphereGeometry(0.14, 8, 8), bm(0xff3b5c));
  f.position.set(0, 0.12, 0.55); g.add(f);
  return g;
}

export function createWantedSystem(scene, world, vm, ps, audio, rng) {
  const [grp, h] = [new Group(), buildHalconHelicopter()];
  grp.add(h.mesh, h.spotlightCone, h.groundPool, h.poolLight);
  scene.add(grp);

  const gAt = (x, z) => Math.max(0, world?.getGroundHeight ? world.getGroundHeight(x, z) : 0);
  const st = { lv: 0, hs: 0, is: false, cd: 0, mc: 16, sl: STAR_LABELS[0], un: [], rb: [] };
  let [spT, rbC, clk, shT] = [0, 0, 0, 0];
  const maxCd = (l) => (l <= 0 ? 0 : 10 + l * 5);
  const showH = (v) => { h.active = h.mesh.visible = h.spotlightCone.visible = h.groundPool.visible = v; if (!v) h.poolLight.intensity = 0; };
  const clrRb = () => { for (const r of st.rb) { for (const p of r.props) grp.remove(p); for (const v of r.vehicles) vm?.removeVehicle?.(v); } st.rb.length = 0; };

  function addHeat(pts) {
    if (pts <= 0) return st.lv;
    st.hs = Math.min(620, st.hs + pts); st.is = true;
    let n = 0;
    for (let i = 5; i >= 1; i--) if (st.hs >= STAR_THRESHOLDS[i]) { n = i; break; }
    st.lv = n;
    if (n > 0) { st.mc = maxCd(n); st.cd = st.mc; st.sl = STAR_LABELS[n]; }
    return n;
  }

  function clearWanted() {
    Object.assign(st, { lv: 0, hs: 0, is: false, cd: 0, mc: 0, sl: STAR_LABELS[0] });
    showH(false);
    for (const u of st.un) if (u.vehicle) { u.vehicle.sirenOn = false; vm?.removeVehicle?.(u.vehicle); }
    st.un.length = 0; clrRb(); audio?.setSirenActive?.(false);
  }

  function setWantedLevel(stars, o = {}) {
    const c = Math.max(0, Math.min(5, stars | 0));
    if (!c) { clearWanted(); return 0; }
    Object.assign(st, { lv: c, hs: STAR_THRESHOLDS[c] + 12, mc: maxCd(c), is: !o.evading, sl: STAR_LABELS[c] });
    st.cd = o.evading ? Math.max(4, st.mc * 0.55) : st.mc;
    showH(c >= 4);
    if (c >= 4 && o.immediate && ps) Object.assign(h, { x: ps.x + 18, z: ps.z + 20, y: 22 });
    return c;
  }

  function aimSpot(tx, ty, tz) {
    const lp = new Vector3(); h.searchLamp.getWorldPosition(lp);
    const vc = new Vector3(tx, ty + 0.08, tz).sub(lp);
    h.spotlightCone.position.copy(lp); h.spotlightCone.scale.set(1, Math.max(2, vc.length()), 1);
    h.spotlightCone.quaternion.setFromUnitVectors(new Vector3(0, -1, 0), vc.normalize());
    h.groundPool.position.set(tx, ty + 0.09, tz); h.poolLight.position.set(tx, ty + 3.2, tz);
    h.poolLight.intensity = h.active ? 2.4 : 0;
  }

  function spawnUnit(kind = 'patrulla', pos = null) {
    if (!vm?.spawnVehicle || !ps) return null;
    let [sx, sz, sh] = [ps.x, ps.z, ps.heading || 0];
    if (pos) { sx = pos.x; sz = pos.z; sh = pos.heading ?? Math.atan2(ps.x - sx, ps.z - sz); } else {
      const a = (rng?.next ? rng.next() : Math.random()) * Math.PI * 2;
      const d = kind === 'marlin' ? 42 : 48 + (rng?.next ? rng.next() * 24 : 12);
      sx += Math.sin(a) * d; sz += Math.cos(a) * d;
      if (kind === 'marlin') sx = Math.max(408, sx);
      else { const sn = world?.roadGraph?.getNearestRoadPoint?.(sx, sz); if (sn) { sx = sn.x; sz = sn.z; } }
      sh = Math.atan2(ps.x - sx, ps.z - sz);
    }
    const v = vm.spawnVehicle(kind, sx, sz, sh, { isPolice: true, sirenOn: true, driverType: 'police', colorHex: kind === 'toro' ? 0x111827 : undefined });
    if (!v) return null;
    Object.assign(v, { isPolice: true, sirenOn: st.lv >= 1, driverType: 'police' });
    const u = { vehicle: v, role: kind === 'toro' ? 'swat' : kind === 'marlin' ? 'boat' : 'police' };
    st.un.push(u);
    return u;
  }

  function deployRoadblock(ax, az, hd) {
    if (!vm?.spawnVehicle) return null;
    clrRb();
    const [px, pz, o] = [Math.cos(hd), -Math.sin(hd), { isPolice: true, sirenOn: true, driverType: 'police' }];
    const vehicles = [vm.spawnVehicle(st.lv >= 5 ? 'toro' : 'patrulla', ax - px * 3.1, az - pz * 3.1, hd + Math.PI * 0.42, o), vm.spawnVehicle('patrulla', ax + px * 3.1, az + pz * 3.1, hd - Math.PI * 0.42, o)].filter(Boolean);
    for (const v of vehicles) Object.assign(v, { isPolice: true, sirenOn: true });
    const gy = gAt(ax, az);
    const props = [-1.4, 1.4].map((off) => { const p = buildBarricadeProp(); p.position.set(ax + px * off + Math.sin(hd) * 2.2, gy, az + pz * off + Math.cos(hd) * 2.2); p.rotation.y = hd; grp.add(p); return p; });
    const rb = { x: ax, z: az, heading: hd, vehicles, props };
    st.rb.push(rb); rbC = 22;
    return rb;
  }

  function spawnStagePursuit(px, pz, ph, stars = 4, o = {}) {
    clearWanted(); setWantedLevel(stars, { immediate: true });
    const [fx, fz, rx, rz] = [Math.sin(ph), Math.cos(ph), Math.cos(ph), -Math.sin(ph)];
    const cA = spawnUnit('patrulla', { x: o.cruiserAX ?? px - fx * 13.5 - rx * 3.2, z: o.cruiserAZ ?? pz - fz * 13.5 - rz * 3.2, heading: o.cruiserAHeading ?? ph + 0.08 });
    if (cA?.vehicle) cA.vehicle.speed = o.chaseSpeed ?? 26;
    if (stars >= 2) {
      const cB = spawnUnit('patrulla', { x: o.cruiserBX ?? px - fx * 19.5 + rx * 3.8, z: o.cruiserBZ ?? pz - fz * 19.5 + rz * 3.8, heading: o.cruiserBHeading ?? ph - 0.06 });
      if (cB?.vehicle) cB.vehicle.speed = o.chaseSpeed ?? 25;
    }
    if (stars >= 3 && o.withRoadblock !== false) { const rbd = o.roadblockDist ?? 38; deployRoadblock(px + fx * rbd, pz + fz * rbd, ph); }
    if (stars >= 3 && o.withHarborBoat) spawnUnit('marlin', { x: o.boatX ?? Math.max(408, px + 26), z: o.boatZ ?? pz + 14, heading: o.boatHeading ?? ph });
    if (stars >= 4) {
      showH(true);
      Object.assign(h, { x: o.heliX ?? px + fx * 22 + rx * 10, y: o.heliY ?? 19.5, z: o.heliZ ?? pz + fz * 22 + rz * 10 });
      h.heading = Math.atan2(px - h.x, pz - h.z);
      h.mesh.position.set(h.x, h.y, h.z); h.mesh.rotation.y = h.heading;
      h.bodyGroup.rotation.x = 0.14; h.mainRotor.rotation.y = 0.65;
      aimSpot(o.spotX ?? px + fx * 2.5, gAt(px, pz), o.spotZ ?? pz + fz * 2.5);
    }
  }

  function getMinimapUnits() {
    const ph = Math.sin(clk * 11) > 0 ? 'red' : 'blue';
    const list = st.un.filter((u) => u.vehicle && !u.vehicle.destroyed).map((u) => ({ x: u.vehicle.x, z: u.vehicle.z, heading: u.vehicle.heading || 0, type: u.role, sirenPhase: ph }));
    for (const r of st.rb) list.push({ x: r.x, z: r.z, heading: r.heading, type: 'roadblock', sirenPhase: 'red' });
    if (h.active && h.mesh.visible) list.push({ x: h.x, z: h.z, heading: h.heading, type: 'heli', sirenPhase: 'blue' });
    return list;
  }

  function steerUnit(u, dt) {
    const v = u.vehicle;
    if (!v || v.destroyed || v.driverType === 'player') return;
    const [dx, dz] = [ps.x - v.x, ps.z - v.z]; const dist = Math.hypot(dx, dz);
    if (dist > 175) { vm?.removeVehicle?.(v); u.removed = true; return; }
    let df = Math.atan2(dx, dz) - (v.heading || 0);
    while (df > Math.PI) df -= Math.PI * 2;
    while (df < -Math.PI) df += Math.PI * 2;
    const trn = (st.lv >= 4 ? 2.6 : 2.1) * dt;
    v.heading = (v.heading || 0) + Math.max(-trn, Math.min(trn, df));
    v.speed = (v.speed ?? 0) + ((dist < 8 ? 7 : 18 + st.lv * 3.4) - (v.speed ?? 0)) * Math.min(1, dt * 2.8);
    v.speedKmh = Math.round(Math.abs(v.speed) * 3.6);
    v.vx = Math.sin(v.heading) * v.speed; v.vz = Math.cos(v.heading) * v.speed;
    let [nx, nz] = [v.x + v.vx * dt, v.z + v.vz * dt];
    if (!v.isBoat && world?.isWater?.(nx, nz)) { v.heading += Math.PI * 0.65; nx = v.x; nz = v.z; }
    const col = !v.isBoat ? world?.resolveCircleCollision?.(nx, nz, 1.35) : null;
    if (col) { nx = col.x; nz = col.z; }
    v.x = nx; v.z = nz; v.y = v.isBoat ? 0.16 : gAt(nx, nz);
    if (v.mesh) { v.mesh.position.set(v.x, v.y, v.z); v.mesh.rotation.y = v.heading; }
    if (dist < 3.6 && ps.inVehicle && ps.inVehicle !== v) vm?.damageVehicle?.(ps.inVehicle, 6 * dt);
  }

  function update(dt) {
    clk += dt;
    if (st.lv <= 0 || !ps) return;
    audio?.setSirenActive?.(st.lv >= 2);
    spT -= dt; rbC = Math.max(0, rbC - dt); shT = Math.max(0, shT - dt);
    st.un = st.un.filter((u) => !u.removed && u.vehicle && !u.vehicle.destroyed && u.vehicle.driverType !== 'player');
    const onW = Boolean(ps.inVehicle?.isBoat || world?.isWater?.(ps.x, ps.z));
    if (spT <= 0) {
      spT = 1.6;
      const land = st.un.filter((u) => u.role !== 'boat').length;
      if (land < Math.min(5, st.lv) && !onW) spawnUnit(st.lv >= 5 && land % 2 === 1 ? 'toro' : 'patrulla');
      if (st.lv >= 3 && onW && st.un.filter((u) => u.role === 'boat').length < 2) spawnUnit('marlin');
      if (st.lv >= 3 && !onW && !st.rb.length && rbC <= 0) {
        const [ax, az] = [ps.x + Math.sin(ps.heading) * 62, ps.z + Math.cos(ps.heading) * 62];
        if (!world?.isWater?.(ax, az)) deployRoadblock(ax, az, ps.heading);
      }
    }
    let sg = false; const mul = ps.perks?.radarScrambler ? 0.74 : 1;
    for (const u of st.un) {
      steerUnit(u, dt);
      if (!u.vehicle || u.removed) continue;
      const d = Math.hypot(ps.x - u.vehicle.x, ps.z - u.vehicle.z);
      if (d < 78 * mul) sg = true;
      if (st.lv >= 3 && d < 32 && shT <= 0 && !ps.inVehicle) { shT = 1.15; ps.takeDamage?.(5 + st.lv * 1.5); }
    }
    if (st.lv >= 4) {
      showH(true); h.orbitAngle += dt * 0.55;
      h.x += (ps.x + Math.cos(h.orbitAngle) * 20 - h.x) * Math.min(1, dt * 2.2);
      h.z += (ps.z + Math.sin(h.orbitAngle) * 20 - h.z) * Math.min(1, dt * 2.2);
      h.y = 21.5 + Math.sin(clk * 1.8) * 0.8; h.heading = Math.atan2(ps.x - h.x, ps.z - h.z);
      h.mesh.position.set(h.x, h.y, h.z); h.mesh.rotation.y = h.heading;
      h.bodyGroup.rotation.x = 0.13; h.mainRotor.rotation.y += dt * 24; h.tailRotor.rotation.x += dt * 30;
      h.strobeRed.visible = Math.sin(clk * 14) > 0; h.strobeBlue.visible = !h.strobeRed.visible;
      aimSpot(ps.x + Math.sin(clk * 1.5) * 2.4, gAt(ps.x, ps.z), ps.z + Math.cos(clk * 1.5) * 2.4);
      if (Math.hypot(ps.x - h.x, ps.z - h.z) < 110 * mul) sg = true;
    }
    st.is = sg;
    if (sg) { st.cd = st.mc; st.sl = STAR_LABELS[st.lv]; } else {
      st.cd = Math.max(0, st.cd - dt * (ps.perks?.radarScrambler ? 1.4 : 1));
      st.sl = `EVADING (${Math.ceil(st.cd)}S)`;
      const sh = world?.safehouse;
      if ((sh && Math.hypot(ps.x - sh.x, ps.z - sh.z) < 12 && st.lv <= 3) || st.cd <= 0) clearWanted();
    }
  }

  const api = {
    helicopter: h, addHeat, setWantedLevel, clearWanted, deployRoadblock, spawnStagePursuit, getMinimapUnits, update,
    get level() { return st.lv; }, set level(v) { setWantedLevel(v); }, get evading() { return st.lv > 0 && !st.is; },
  };
  for (const p of 'heatScore:hs,inSight:is,cooldown:cd,maxCooldown:mc,statusLabel:sl,roadblocks:rb,units:un'.split(',')) {
    const [pub, sk] = p.split(':');
    Object.defineProperty(api, pub, { enumerable: true, get: () => st[sk] });
  }
  return api;
}
