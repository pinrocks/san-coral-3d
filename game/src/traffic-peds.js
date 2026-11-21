import * as THREE from 'three';
import { createRng } from './rng.js';

/* Ambient Road-Graph AI Traffic & Articulated 3D Pedestrians */

const { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, MeshStandardMaterial, MeshBasicMaterial, Vector3 } = THREE;
const { clamp } = THREE.MathUtils;
const { sin, cos, atan2, hypot, abs, max, min, PI } = Math;

const SHIRTS = ['#ff4d6d', '#18e0cf', '#ffbe3b', '#38bdf8', '#fb923c', '#c084fc', '#4ade80', '#f472b6'];
const PANTS = ['#1e293b', '#334155', '#e2e8f0', '#3b4cca', '#475569'];
const SKINS = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
const CAR_TYPES = ['veloz', 'bravo', 'toro', 'rayo'];
const std = (color, roughness = 0.7) => new MeshStandardMaterial({ color, roughness });

function part(parent, geo, mat, x, y, z, shadow = false) {
  const m = new Mesh(geo, mat);
  m.position.set(x, y, z);
  if (shadow) m.castShadow = true;
  parent.add(m);
  return m;
}

function buildPed(opts, rng) {
  const host = Boolean(opts.isHostile);
  const shirtHex = opts.shirtColor || (host ? '#b91c1c' : rng.pick(SHIRTS));
  const pantsHex = opts.pantsColor || (host ? '#0f172a' : rng.pick(PANTS));
  const root = new Group();
  const skin = std(rng.pick(SKINS), 0.72), shirt = std(shirtHex, 0.62);
  const pants = std(pantsHex, 0.78), dark = std(0x111827, 0.5);

  part(root, new BoxGeometry(0.46, 0.58, 0.26), shirt, 0, 1.12, 0, true);
  part(root, new BoxGeometry(0.3, 0.32, 0.3), skin, 0, 1.59, 0, true);
  part(root, new BoxGeometry(0.32, 0.12, 0.32), std(host ? 0x090d16 : rng.pick([0x1e1b18, 0x5c3a21, 0xd4a359]), 0.8), 0, 1.74, -0.01);
  part(root, new BoxGeometry(0.26, 0.07, 0.06), dark, 0, 1.61, 0.14);

  const limb = (w, h, d, m, px, py) => {
    const p = new Group();
    p.position.set(px, py, 0);
    part(p, new BoxGeometry(w, h, d), m, 0, -h * 0.5, 0, true);
    root.add(p);
    return p;
  };
  const ll = limb(0.18, 0.76, 0.2, pants, -0.12, 0.8), rl = limb(0.18, 0.76, 0.2, pants, 0.12, 0.8);
  const la = limb(0.14, 0.56, 0.16, skin, -0.31, 1.36), ra = limb(0.14, 0.56, 0.16, skin, 0.31, 1.36);

  let md = null;
  if (host) {
    part(root, new BoxGeometry(0.49, 0.42, 0.29), std(0x1e293b, 0.65), 0, 1.16, 0);
    part(ra, new BoxGeometry(0.08, 0.14, 0.44), dark, 0, -0.5, 0.18);
    md = part(ra, new SphereGeometry(0.11, 6, 6), new MeshBasicMaterial({ color: 0xffd166 }), 0, -0.48, 0.44);
    md.visible = false;
  } else if (rng.chance(0.35)) {
    part(root, new CylinderGeometry(0.28, 0.28, 0.04, 10), std(0xfde68a, 0.75), 0, 1.76, 0);
  }
  return { root, ll, rl, la, ra, shirtHex, md };
}

export function createLifeSimulation(scene, world, vm, rngInput) {
  const rng = rngInput || createRng(43);
  const peds = [], cars = [];
  const { nodes, segments, getNearestRoadPoint } = world.roadGraph;
  let nextId = 1;

  function spawnPedestrian(x, z, opts = {}) {
    const lb = buildPed(opts, rng), y = world.getGroundHeight(x, z);
    const heading = opts.heading !== undefined ? opts.heading : rng.range(0, PI * 2);
    lb.root.position.set(x, y, z); lb.root.rotation.y = heading; scene.add(lb.root);
    const maxHp = opts.hp || (opts.isHostile ? 80 : 45);
    const ped = {
      id: nextId++, mesh: lb.root, lb, x, y, z, vx: 0, vz: 0, heading,
      hp: maxHp, maxHp, dead: false, dt: 0, isHostile: Boolean(opts.isHostile),
      persistent: Boolean(opts.persistent), state: opts.state || (opts.isHostile ? 'combat' : 'walk'),
      shirtColor: lb.shirtHex, sp: rng.range(0, PI * 2),
      tt: rng.range(2.5, 7), ft: 0, fc: rng.range(0.6, 1.6),
      applyDamage(amt) { ped.hp = max(0, ped.hp - amt); if (ped.hp <= 0) ped.dead = true; return ped.dead; }
    };
    peds.push(ped);
    return ped;
  }

  function nextNode(fromIdx, prevIdx) {
    const n = nodes[fromIdx];
    if (!n?.edges.length) return fromIdx;
    const pool = n.edges.filter((e) => e.to !== prevIdx);
    return rng.pick(pool.length ? pool : n.edges).to;
  }

  function spawnTrafficCar(x, z, heading, type) {
    const chosen = type || rng.pick(CAR_TYPES), snap = getNearestRoadPoint(x, z);
    let a = 0, b = 1, hdg = heading;
    if (snap?.segment) {
      a = snap.segment.a; b = snap.segment.b;
      const sh = atan2(nodes[b].x - nodes[a].x, nodes[b].z - nodes[a].z);
      if (heading === undefined) hdg = sh;
      else if (cos(heading - sh) < 0) [a, b] = [b, a];
    }
    const v = vm.spawnVehicle(chosen, x, z, hdg ?? 0, { driverType: 'traffic', speed: 11.5 });
    v.fn = a; v.tn = b; v.ds = chosen === 'veloz' || chosen === 'rayo' ? 15.5 : 12.5; v.lo = 3.4;
    cars.push(v);
    return v;
  }

  function spawnAmbientAround(cx, cz, opts = {}) {
    const nCars = opts.carCount ?? 10, nPeds = opts.pedCount ?? 18;
    const minR = opts.minRadius ?? 18, maxR = opts.maxRadius ?? 135;
    for (let i = 0; i < nCars && segments.length; i++) {
      for (let tr = 0; tr < 12; tr++) {
        const s = rng.pick(segments), t = rng.range(0.18, 0.82);
        const sx = s.x1 + (s.x2 - s.x1) * t, sz = s.z1 + (s.z2 - s.z1) * t;
        const d = hypot(sx - cx, sz - cz);
        if (d < minR || d > maxR) continue;
        const ds = rng.chance(0.5) ? 1 : -1, h = atan2((s.x2 - s.x1) * ds, (s.z2 - s.z1) * ds);
        const px = sx + cos(h) * 3.4, pz = sz - sin(h) * 3.4;
        if (vm.findNearestInteractable(px, pz, 8.5)) continue;
        spawnTrafficCar(px, pz, h); break;
      }
    }
    for (let i = 0; i < nPeds && segments.length; i++) {
      for (let tr = 0; tr < 10; tr++) {
        const s = rng.pick(segments);
        if (s.isBridge) continue;
        const t = rng.range(0.12, 0.88);
        const sx = s.x1 + (s.x2 - s.x1) * t, sz = s.z1 + (s.z2 - s.z1) * t;
        const d = hypot(sx - cx, sz - cz);
        if (d < 8 || d > maxR * 0.85) continue;
        const h = atan2(s.x2 - s.x1, s.z2 - s.z1), side = rng.chance(0.5) ? 1 : -1;
        const off = s.width * 0.5 + rng.range(1.6, 3.4);
        const px = sx + cos(h) * off * side, pz = sz - sin(h) * off * side;
        if (world.isWater(px, pz) || world.resolveCircleCollision(px, pz, 0.65).hit) continue;
        spawnPedestrian(px, pz, { heading: side > 0 ? h : h + PI }); break;
      }
    }
  }

  function alertNearby(x, z, radius = 34) {
    const r2 = radius * radius;
    for (const p of peds) {
      if (p.dead) continue;
      const dx = p.x - x, dz = p.z - z;
      if (dx * dx + dz * dz <= r2) {
        if (p.isHostile) p.state = 'combat';
        else { p.state = 'flee'; p.fleeTimer = 6.5; p.heading = atan2(dx, dz); }
      }
    }
  }

  function hitTestRay(o, dir, maxDist = 95) {
    const len = hypot(dir.x, dir.y, dir.z) || 1;
    const dx = dir.x / len, dy = dir.y / len, dz = dir.z / len;
    let best = null, bestT = maxDist;
    for (const p of peds) {
      if (p.dead) continue;
      const t = (p.x - o.x) * dx + (p.y + 1 - o.y) * dy + (p.z - o.z) * dz;
      if (t < 0.4 || t > bestT) continue;
      const qx = o.x + dx * t - p.x, qy = o.y + dy * t - (p.y + 1), qz = o.z + dz * t - p.z;
      if (qx * qx + qz * qz <= 0.48 && abs(qy) <= 1.05) {
        bestT = t;
        best = { type: 'pedestrian', ped: p, entity: p, target: p, isHostile: p.isHostile, distance: t, point: new Vector3(o.x + dx * t, o.y + dy * t, o.z + dz * t) };
      }
    }
    return best;
  }

  function clearAll() {
    for (const p of peds) p.mesh?.parent?.remove(p.mesh);
    peds.length = 0;
    for (const c of cars) vm.removeVehicle(c);
    cars.length = 0;
  }

  function update(dt, ps, wanted = 0) {
    const s = clamp(dt, 0.001, 0.05);
    const px = ps ? ps.x : 210, pz = ps ? ps.z : -120;

    for (let i = cars.length - 1; i >= 0; i--) {
      const tv = cars[i];
      if (tv.destroyed || tv.driverType !== 'traffic') { cars.splice(i, 1); continue; }
      const na = nodes[tv.fn] || nodes[0], nb = nodes[tv.tn] || nodes[1];
      if (!na || !nb) continue;
      const sh = atan2(nb.x - na.x, nb.z - na.z);
      const dx = nb.x + cos(sh) * tv.lo - tv.x, dz = nb.z - sin(sh) * tv.lo - tv.z;
      if (hypot(dx, dz) < 9.5) { const nxt = nextNode(tv.tn, tv.fn); tv.fn = tv.tn; tv.tn = nxt; }
      let diff = atan2(dx, dz) - tv.heading;
      while (diff > PI) diff -= PI * 2;
      while (diff < -PI) diff += PI * 2;
      tv.heading += clamp(diff, -2.4 * s, 2.4 * s);

      let tgt = tv.ds * (wanted >= 3 ? 1.2 : 1);
      const fx = sin(tv.heading), fz = cos(tv.heading);
      for (const o of vm.vehicles) {
        if (o === tv) continue;
        const ah = (o.x - tv.x) * fx + (o.z - tv.z) * fz, lt = abs((o.x - tv.x) * fz - (o.z - tv.z) * fx);
        if (ah > 0 && ah < 13 && lt < 2.6) tgt = min(tgt, max(0, (ah - 5.5) * 1.6));
      }
      const cur = hypot(tv.vx, tv.vz), ns = cur + (tgt - cur) * min(1, 3.5 * s);
      tv.vx = fx * ns; tv.vz = fz * ns;
    }

    for (let i = peds.length - 1; i >= 0; i--) {
      const p = peds[i];
      if (p.hp <= 0 && !p.dead) p.dead = true;
      if (p.dead) {
        p.dt += s; p.mesh.rotation.x = -PI * 0.48; p.mesh.position.y = p.y + 0.16;
        if (p.dt > 12 && !p.persistent) { p.mesh.parent?.remove(p.mesh); peds.splice(i, 1); }
        continue;
      }

      const dp = hypot(px - p.x, pz - p.z), lb = p.lb;
      if (p.isHostile && dp < 52) p.state = 'combat';
      if (lb.md) lb.md.visible = false;
      if (p.isHostile && p.state === 'combat' && dp < 38) {
        p.fc -= s;
        if (p.fc <= 0) {
          p.fc = rng.range(1.1, 2.1);
          if (lb.md) lb.md.visible = true;
          if (ps && typeof ps.hp === 'number' && rng.chance(0.45)) {
            if (typeof ps.armor === 'number' && ps.armor > 0) ps.armor = max(0, ps.armor - 4);
            else ps.hp = max(0, ps.hp - 4);
          }
        }
      }

      for (const v of vm.vehicles) {
        if (v.isBoat || v.speed < 3) continue;
        const vx = p.x - v.x, vz = p.z - v.z, vd2 = vx * vx + vz * vz;
        if (vd2 < 3.6 && v.speed > 7) { p.hp = 0; p.dead = true; break; }
        if (!p.isHostile && vd2 < 36 && v.speed > 16) { p.state = 'flee'; p.ft = 4.5; p.heading = atan2(vx, vz); }
      }
      if (p.dead) continue;

      let spd = 1.45;
      if (p.state === 'flee') { spd = 4.4; p.ft -= s; if (p.ft <= 0) p.state = 'walk'; }
      else if (p.state === 'combat') { p.heading = atan2(px - p.x, pz - p.z); spd = dp > 16 ? 2.6 : 0; }
      else if (p.state === 'idle') spd = 0;
      else { p.tt -= s; if (p.tt <= 0) { p.tt = rng.range(3.5, 8); p.heading += rng.pick([-PI * 0.5, 0, PI * 0.5, PI]); } }

      p.vx = sin(p.heading) * spd; p.vz = cos(p.heading) * spd;
      const nx = p.x + p.vx * s, nz = p.z + p.vz * s;
      if (world.isWater(nx, nz)) p.heading += PI * 0.85;
      else {
        const col = world.resolveCircleCollision(nx, nz, 0.45);
        if (col.hit) { p.x = col.x; p.z = col.z; p.heading += PI * 0.65; }
        else { p.x = nx; p.z = nz; }
      }
      p.y = world.getGroundHeight(p.x, p.z);
      p.mesh.position.set(p.x, p.y, p.z); p.mesh.rotation.y = p.heading;

      if (spd > 0.1) {
        p.sp += s * spd * 4.25;
        const sw = sin(p.sp) * (p.state === 'flee' ? 0.72 : 0.48);
        lb.ll.rotation.x = sw; lb.rl.rotation.x = -sw;
        lb.la.rotation.x = p.state === 'flee' ? -2.3 + sw * 0.3 : -sw * 0.8;
        lb.ra.rotation.x = p.isHostile && p.state === 'combat' ? -1.45 : sw * 0.8;
      } else {
        lb.ll.rotation.x = lb.rl.rotation.x = lb.la.rotation.x = 0;
        lb.ra.rotation.x = p.isHostile && p.state === 'combat' ? -1.48 : 0;
      }
    }
  }

  return { pedestrians: peds, trafficVehicles: cars, spawnPedestrian, spawnTrafficCar, spawnAmbientAround, hitTestRay, alertNearby, clearAll, update };
}
