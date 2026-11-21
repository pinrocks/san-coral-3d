import * as THREE from 'three';
import { createRng } from './rng.js';

/* Sculpted 3D Vehicles, Semi-Arcade Drift/Nitro Physics, Speedboats & VFX */

const { Group, Mesh, BoxGeometry, CylinderGeometry, ConeGeometry, PlaneGeometry, SphereGeometry, PointLight, Color, MeshStandardMaterial, MeshBasicMaterial } = THREE;
const { clamp } = THREE.MathUtils;
const { sin, cos, hypot, abs, max, min, PI, round, floor, sqrt } = Math;

const std = (color, roughness = 0.3, metalness = 0.25, extra = {}) =>
  new MeshStandardMaterial({ color, roughness, metalness, ...extra });
const bas = (color, extra = {}) => new MeshBasicMaterial({ color, ...extra });

const ARCH_ROWS = [
  ['veloz', 'Veloz GT', 46, 28, 36, 2.45, 7.5, 2.3, 120, 1.95, 4.5, 2.05, 0, ['#ff4d6d', '#18e0cf', '#ffbe3b', '#fb7185']],
  ['bravo', 'Bravo V8', 40, 24, 32, 2.25, 6.8, 2.1, 135, 2.0, 4.65, 2.05, 0, ['#ffbe3b', '#f97316', '#38bdf8', '#f43f5e']],
  ['toro', 'Toro 4x4', 34, 20, 30, 1.95, 7.2, 2.8, 210, 2.2, 4.9, 2.25, 0, ['#1e293b', '#334155', '#dc2626', '#d97706']],
  ['rayo', 'Rayo 900', 45, 31, 38, 2.95, 8.4, 2.9, 85, 1.15, 2.35, 0.85, 4, ['#18e0cf', '#ff4d6d', '#a855f7', '#facc15']],
  ['patrulla', 'Guardia Interceptor', 44, 27, 35, 2.4, 7.8, 2.5, 160, 2.0, 4.65, 2.05, 1, ['#0f172a']],
  ['marlin', 'Marlin Jet', 42, 24, 20, 2.1, 4.6, 2.0, 150, 2.3, 6.2, 2.45, 2, ['#f8fafc', '#18e0cf', '#ff4d6d']]
];

export const VEHICLE_ARCHETYPES = Object.fromEntries(
  ARCH_ROWS.map(([type, name, maxSpeed, accel, brake, turnRate, grip, driftGrip, maxHp, radius, length, width, fl, palette]) => [
    type,
    { type, name, maxSpeed, accel, brake, turnRate, grip, driftGrip, maxHp, radius, length, width, isPolice: Boolean(fl & 1), isBoat: Boolean(fl & 2), isBike: Boolean(fl & 4), palette }
  ])
);

function box(p, w, h, d, m, x, y, z, rx = 0) {
  const mesh = new Mesh(new BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  if (rx) mesh.rotation.x = rx;
  p.add(mesh);
  return mesh;
}

function buildMesh(arch, colorHex) {
  const group = new Group(), bg = new Group();
  group.add(bg);
  const pm = std(new Color(colorHex), 0.26, 0.42), dk = std(0x161c28, 0.68, 0.25);
  const wh = std(0xf8fafc, 0.3, 0.1), gl = std(0x8be4ff, 0.12, 0.72, { transparent: true, opacity: 0.78 });
  const hd = bas(0xfff8d6), bm = bas(0x991b1b), fm = bas(0x22d3ee, { transparent: true, opacity: 0.9 });
  const wl = [], nf = [];
  let sr = null, sb = null, sl = null;
  const flm = (r, len, x, y, z) => {
    const f = new Mesh(new ConeGeometry(r, len, 7), fm);
    f.rotation.x = -PI * 0.5; f.position.set(x, y, z); f.visible = false; bg.add(f); nf.push(f);
  };

  if (arch.isBoat) {
    box(bg, 2.35, 0.95, 5.2, pm, 0, 0.55, -0.2).castShadow = true;
    const bow = new Mesh(new ConeGeometry(1.66, 2.2, 4), pm);
    bow.rotation.set(PI * 0.5, 0, PI * 0.25); bow.scale.set(1, 1, 0.58); bow.position.set(0, 0.62, 3.35); bg.add(bow);
    box(bg, 2.42, 0.22, 5.1, bas(0xff4d6d), 0, 0.82, -0.15);
    box(bg, 1.9, 0.55, 1.1, gl, 0, 1.22, 0.55, -0.28);
    for (const sx of [-0.55, 0.55]) { box(bg, 0.42, 0.85, 0.55, dk, sx, 0.65, -2.95); flm(0.24, 1.1, sx, 0.48, -3.55); }
  } else if (arch.isBike) {
    box(bg, 0.48, 0.55, 1.55, pm, 0, 0.72, 0.05).castShadow = true;
    box(bg, 0.52, 0.48, 0.65, pm, 0, 0.86, 0.72, 0.28);
    box(bg, 0.42, 0.28, 0.42, gl, 0, 1.12, 0.68, -0.45);
    box(bg, 0.28, 0.16, 0.08, hd, 0, 0.88, 1.06);
    box(bg, 0.26, 0.12, 0.08, bm, 0, 0.88, -0.82);
    const wg = new CylinderGeometry(0.36, 0.36, 0.22, 14); wg.rotateZ(PI * 0.5);
    for (const wz of [-0.82, 0.85]) { const wm = new Mesh(wg, dk); wm.position.set(0, 0.36, wz); bg.add(wm); wl.push(wm); }
    flm(0.16, 0.9, 0.16, 0.55, -1.15);
  } else {
    const { width: w, length: l, type } = arch, hB = type === 'toro' ? 0.86 : 0.64, yB = type === 'toro' ? 0.54 : 0.42;
    const ch = box(bg, w, hB, l, pm, 0, yB + hB * 0.5, 0); ch.castShadow = ch.receiveShadow = true;
    if (arch.isPolice) box(bg, w + 0.03, hB * 0.85, l * 0.46, wh, 0, yB + hB * 0.52, -0.05);
    if (type === 'bravo') {
      box(bg, w * 0.86, 0.48, 0.14, gl, 0, yB + hB + 0.2, 0.55, -0.42);
      box(bg, w * 0.78, 0.28, 1.55, dk, 0, yB + hB + 0.04, -0.15);
      box(bg, 0.42, 0.03, l * 0.96, wh, 0, yB + hB + 0.015, 0);
    } else {
      const cL = type === 'toro' ? l * 0.62 : l * 0.48, cH = type === 'toro' ? 0.68 : 0.52, cz = type === 'veloz' ? -0.18 : -0.1;
      box(bg, w * 0.84, cH, cL, gl, 0, yB + hB + cH * 0.48, cz);
      box(bg, w * 0.8, 0.09, cL * 0.86, arch.isPolice ? wh : pm, 0, yB + hB + cH - 0.02, cz);
    }
    if (type === 'veloz') {
      box(bg, w * 0.92, 0.22, l * 0.34, pm, 0, yB + hB + 0.04, l * 0.26, 0.12);
      box(bg, w + 0.04, 0.08, l * 0.88, bas(0x18e0cf), 0, yB + 0.16, 0);
      box(bg, w * 0.96, 0.08, 0.36, dk, 0, yB + hB + 0.32, -l * 0.45);
    } else if (type === 'toro') {
      box(bg, w * 0.82, 0.48, 0.22, dk, 0, yB + 0.36, l * 0.5 + 0.1);
      box(bg, w * 0.78, 0.1, l * 0.48, dk, 0, yB + hB + 0.72, -0.12);
    } else if (arch.isPolice) {
      box(bg, w * 0.68, 0.42, 0.2, dk, 0, yB + 0.32, l * 0.5 + 0.09);
      box(bg, 1.18, 0.12, 0.28, dk, 0, yB + hB + 0.58, -0.05);
      sr = box(bg, 0.52, 0.16, 0.26, bas(0xff2442), -0.3, yB + hB + 0.64, -0.05);
      sb = box(bg, 0.52, 0.16, 0.26, bas(0x2563eb), 0.3, yB + hB + 0.64, -0.05);
      sl = new PointLight(0xff2442, 2.2, 18); sl.position.set(0, yB + hB + 1.05, -0.05); bg.add(sl);
    }
    for (const sx of [-w * 0.34, w * 0.34]) {
      box(bg, 0.36, 0.16, 0.08, hd, sx, yB + hB * 0.58, l * 0.5 + 0.02);
      box(bg, 0.38, 0.16, 0.08, bm, sx, yB + hB * 0.58, -l * 0.5 - 0.02);
    }
    for (const sx of [-0.52, 0.52]) {
      const exh = new Mesh(new CylinderGeometry(0.08, 0.08, 0.28, 8), dk);
      exh.rotation.x = PI * 0.5; exh.position.set(sx, yB + 0.12, -l * 0.5 - 0.08); bg.add(exh);
      flm(0.18, 1.05, sx, yB + 0.14, -l * 0.5 - 0.65);
    }
    const wr = type === 'toro' ? 0.44 : 0.36;
    const wGeo = new CylinderGeometry(wr, wr, 0.28, 14); wGeo.rotateZ(PI * 0.5);
    const rGeo = new CylinderGeometry(wr * 0.56, wr * 0.56, 0.3, 10); rGeo.rotateZ(PI * 0.5);
    const rMat = std(0xcbd5e1, 0.3, 0.65);
    for (const wx of [-w * 0.48, w * 0.48]) for (const wz of [-l * 0.31, l * 0.32]) {
      box(bg, 0.14, 0.28, 0.84, dk, wx, yB + 0.1, wz);
      const wg = new Group(); wg.position.set(wx, wr, wz);
      wg.add(new Mesh(wGeo, dk), new Mesh(rGeo, rMat));
      group.add(wg); wl.push(wg);
    }
  }
  return { group, bg, pm, bm, wl, nf, sr, sb, sl };
}

export function createVehicleManager(scene, world, rngInput) {
  const rng = rngInput || createRng(19);
  const list = [], pts = [], skids = [];
  let nextId = 1, clock = 0;
  const puffGeo = new SphereGeometry(0.45, 8, 7), skidGeo = new PlaneGeometry(0.32, 1.35);
  skidGeo.rotateX(-PI * 0.5);

  function puff(x, y, z, vx, vy, vz, col, scale, life) {
    if (pts.length > 320) return;
    const mat = bas(col, { transparent: true, opacity: 0.85 }), mesh = new Mesh(puffGeo, mat);
    mesh.position.set(x, y, z); mesh.scale.setScalar(scale); scene.add(mesh);
    pts.push({ mesh, mat, vx, vy, vz, scale, age: 0, life });
  }

  function skid(x, y, z, hdg) {
    if (skids.length > 140) { const o = skids.shift(); o.mesh.parent?.remove(o.mesh); }
    const mat = bas(0x0f131a, { transparent: true, opacity: 0.58, depthWrite: false }), mesh = new Mesh(skidGeo, mat);
    mesh.position.set(x, y + 0.08, z); mesh.rotation.y = hdg; scene.add(mesh);
    skids.push({ mesh, mat, age: 0, life: 7 });
  }

  function spawnVehicle(type = 'veloz', x = 0, z = 0, heading = 0, opts = {}) {
    const arch = VEHICLE_ARCHETYPES[type] || VEHICLE_ARCHETYPES.veloz;
    const colorHex = opts.colorHex || rng.pick(arch.palette), parts = buildMesh(arch, colorHex);
    const y = arch.isBoat && world.isWater(x, z) ? -0.15 : world.getGroundHeight(x, z);
    parts.group.position.set(x, y, z); parts.group.rotation.y = heading; scene.add(parts.group);
    const spd = opts.speed || 0;
    const v = {
      id: nextId++, type: arch.type, name: arch.name, arch, mesh: parts.group, parts,
      x, y, z, vx: sin(heading) * spd, vz: cos(heading) * spd, heading, speed: spd,
      speedKmh: round(abs(spd) * 3.6), gear: spd > 1 ? min(6, 1 + floor((abs(spd) / arch.maxSpeed) * 5)) : 1,
      rpm: 950, drifting: Boolean(opts.drifting), boosting: Boolean(opts.boosting),
      nitro: 100, maxNitro: 100, hp: opts.hp ?? arch.maxHp, maxHp: arch.maxHp,
      isPolice: arch.isPolice, isBoat: arch.isBoat, isBike: arch.isBike, colorHex,
      driverType: opts.driverType || 'parked', persistent: Boolean(opts.persistent), destroyed: false,
      sirenOn: opts.sirenOn !== undefined ? Boolean(opts.sirenOn) : arch.isPolice && opts.driverType === 'police',
      sp: rng.range(0, 6.28), st: 0
    };
    list.push(v);
    return v;
  }

  function removeVehicle(v) {
    const i = list.indexOf(v);
    if (i !== -1) list.splice(i, 1);
    v?.mesh?.parent?.remove(v.mesh);
  }

  function clearDynamicVehicles() {
    for (let i = list.length - 1; i >= 0; i--) if (!list[i].persistent && list[i].driverType !== 'player') removeVehicle(list[i]);
  }

  function findNearestInteractable(x, z, maxDist = 5.5) {
    let best = null, bd2 = maxDist * maxDist;
    for (const v of list) {
      if (v.destroyed) continue;
      const d2 = (v.x - x) ** 2 + (v.z - z) ** 2;
      if (d2 <= bd2) { bd2 = d2; best = v; }
    }
    return best;
  }

  function damageVehicle(v, amount, onExplode) {
    if (!v || v.destroyed) return false;
    v.hp = max(0, v.hp - amount);
    if (v.hp > 0) return false;
    v.destroyed = true; v.sirenOn = v.boosting = false;
    v.parts.pm.color.setHex(0x262626); v.parts.pm.roughness = 0.92;
    const fc = new Mesh(new SphereGeometry(1.35, 12, 10), bas(0xff7b24, { transparent: true, opacity: 0.88 }));
    fc.position.set(0, 1.15, 0.25);
    const fg = new PointLight(0xff6a1a, 3.2, 22); fg.position.set(0, 2.2, 0);
    v.mesh.add(fc, fg); v.fc = fc;
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * PI * 2, s = 2.5 + rng.range(0, 6.5);
      puff(v.x + cos(a) * 0.8, v.y + 0.9 + rng.range(0, 0.8), v.z + sin(a) * 0.8, cos(a) * s, 3.2 + rng.range(0, 4.5), sin(a) * s, i % 3 === 0 ? 0xff4d2a : i % 3 === 1 ? 0xffbe3b : 0x334155, 1.15 + rng.range(0, 0.95), 1.8 + rng.range(0, 0.9));
    }
    onExplode?.(v);
    return true;
  }

  function readCtrl(inp) {
    if (!inp) return { th: 0, br: 0, st: 0, hb: false, bs: false };
    const k = inp.keys || {};
    const up = Boolean(inp.forward || inp.up || inp.w || k.KeyW || k.ArrowUp || inp.throttle > 0);
    const dn = Boolean(inp.backward || inp.down || inp.s || k.KeyS || k.ArrowDown || inp.brake > 0);
    const lf = Boolean(inp.left || inp.a || k.KeyA || k.ArrowLeft), rt = Boolean(inp.right || inp.d || k.KeyD || k.ArrowRight);
    return {
      th: typeof inp.throttle === 'number' ? inp.throttle : up ? 1 : 0,
      br: typeof inp.brake === 'number' ? inp.brake : dn ? 1 : 0,
      st: typeof inp.steer === 'number' && inp.steer !== 0 ? inp.steer : (lf ? 1 : 0) - (rt ? 1 : 0),
      hb: Boolean(inp.handbrake || inp.space || inp.drift || k.Space),
      bs: Boolean(inp.boost || inp.sprint || inp.shift || k.ShiftLeft || k.ShiftRight)
    };
  }

  function update(dt, pv, input, audio) {
    const s = clamp(dt, 0.001, 0.05); clock += s;
    const c = readCtrl(input);

    for (const v of list) {
      const a = v.arch, p = v.parts;
      if (v === pv && !v.destroyed) {
        let fs = v.vx * sin(v.heading) + v.vz * cos(v.heading);
        v.drifting = c.hb && abs(fs) > 6;
        v.boosting = c.bs && c.th > 0 && v.nitro > 4;
        v.nitro = v.boosting ? max(0, v.nitro - s * 28) : min(v.maxNitro, v.nitro + s * 11);
        const top = a.maxSpeed * (v.boosting ? 1.32 : 1);
        if (c.th > 0) fs += a.accel * (v.boosting ? 1.55 : 1) * c.th * s;
        if (c.br > 0) fs -= (fs > 1.5 ? a.brake : a.accel * 0.55) * c.br * s;
        if (!c.th && !c.br) fs *= max(0, 1 - s * 1.4);
        if (c.hb) fs *= max(0, 1 - s * 1.9);
        fs = clamp(fs, -a.maxSpeed * 0.4, top);

        const sf = clamp(abs(fs) / 8, 0, 1), tm = v.drifting ? 1.32 : 1 - min(0.38, abs(fs) / (top * 1.8));
        v.heading += c.st * a.turnRate * sf * tm * (fs >= -0.2 ? 1 : -1) * s;
        const bl = min(1, (v.drifting ? a.driftGrip : a.grip) * s);
        v.vx += (sin(v.heading) * fs - v.vx) * bl;
        v.vz += (cos(v.heading) * fs - v.vz) * bl;
        p.bm.color.setHex(c.br > 0 || c.hb ? 0xff2a2a : 0x7f1d1d);
        p.bg.rotation.z = a.isBike ? -c.st * sf * 0.36 : c.st * sf * (v.drifting ? 0.08 : 0.045);
        p.bg.rotation.x = c.th > 0 ? -0.022 : c.br > 0 ? 0.03 : 0;
        audio?.updateEngine?.(v.rpm, abs(fs), v.boosting, v.drifting);
      } else if (v.driverType === 'parked' || v.destroyed) {
        v.vx *= max(0, 1 - s * 5); v.vz *= max(0, 1 - s * 5);
      }

      v.x += v.vx * s; v.z += v.vz * s;
      if (v.isBoat) {
        if (!world.isWater(v.x, v.z)) { v.x -= v.vx * s * 1.2; v.z -= v.vz * s * 1.2; v.vx *= -0.25; v.vz *= -0.25; }
        v.y = -0.14 + sin(clock * 4 + v.id) * 0.06;
      } else {
        const col = world.resolveCircleCollision(v.x, v.z, a.radius);
        if (col.hit) {
          v.x = col.x; v.z = col.z;
          const vn = v.vx * col.nx + v.vz * col.nz;
          if (vn < 0) { v.vx -= col.nx * vn * 1.35; v.vz -= col.nz * vn * 1.35; }
        }
        if (world.isWater(v.x, v.z)) { v.vx *= 0.85; v.vz *= 0.85; v.y = -0.55; }
        else v.y = world.getGroundHeight(v.x, v.z);
      }

      if (v.fc) { const fl = 0.88 + sin(clock * 18 + v.id) * 0.15; v.fc.scale.set(fl, fl * 1.22, fl); }
      v.speed = hypot(v.vx, v.vz); v.speedKmh = round(v.speed * 3.6);
      const r = v.speed / a.maxSpeed;
      v.gear = clamp(1 + floor(r * 5.4), 1, 6);
      v.rpm = round(900 + ((r * 5.4) % 1) * 5200 + (v.boosting ? 1100 : 0));
      v.mesh.position.set(v.x, v.y, v.z); v.mesh.rotation.y = v.heading;

      for (const w of p.wl) w.rotation.x += v.speed * s * 2.6;
      for (const f of p.nf) { f.visible = v.boosting && !v.destroyed; if (v.boosting) f.scale.set(1, 0.85 + rng.range(0, 0.45), 1); }

      if (v.isPolice && p.sr) {
        if (v.sirenOn && !v.destroyed) {
          v.sp += s * 14;
          const rh = sin(v.sp) > 0;
          p.sr.material.color.setHex(rh ? 0xff1e42 : 0x450a14);
          p.sb.material.color.setHex(rh ? 0x102a6b : 0x38bdf8);
          if (p.sl) { p.sl.intensity = 2.8; p.sl.color.setHex(rh ? 0xff1e42 : 0x38bdf8); }
        } else if (p.sl) p.sl.intensity = 0;
      }

      v.st -= s;
      if (v.st <= 0) {
        const sh = sin(v.heading), ch = cos(v.heading);
        if (v.drifting && v.speed > 4 && !v.isBoat) {
          v.st = 0.04;
          const bx = v.x - sh * a.length * 0.36, bz = v.z - ch * a.length * 0.36, rx = ch * a.width * 0.42, rz = -sh * a.width * 0.42;
          puff(bx + rx, v.y + 0.26, bz + rz, 0, 1.15, 0, 0xf8fafc, 0.72, 0.72);
          puff(bx - rx, v.y + 0.26, bz - rz, 0, 1.15, 0, 0xf8fafc, 0.72, 0.72);
          skid(bx + rx, v.y, bz + rz, v.heading); skid(bx - rx, v.y, bz - rz, v.heading);
        } else if (v.isBoat && v.speed > 2.5 && world.isWater(v.x, v.z)) {
          v.st = 0.05;
          puff(v.x - sh * 3.1 + rng.range(-0.9, 0.9), v.y + 0.08, v.z - ch * 3.1 + rng.range(-0.9, 0.9), 0, 0.35, 0, 0xe0faff, 0.78, 0.75);
        } else if ((v.destroyed || v.hp < v.maxHp * 0.45) && !v.isBoat) {
          v.st = 0.09;
          puff(v.x + rng.range(-0.5, 0.5), v.y + 1.1, v.z + rng.range(-0.5, 0.5), 0, 2.2, 0, v.destroyed && rng.chance(0.45) ? 0xff6b2b : 0x334155, 0.85, 1.1);
        }
      }
    }

    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (a.isBoat !== b.isBoat) continue;
      const minR = a.arch.radius + b.arch.radius - 0.35, dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz;
      if (d2 > 1e-4 && d2 < minR * minR) {
        const d = sqrt(d2), ov = (minR - d) * 0.5;
        a.x -= (dx / d) * ov; a.z -= (dz / d) * ov; b.x += (dx / d) * ov; b.z += (dz / d) * ov;
        a.mesh.position.set(a.x, a.y, a.z); b.mesh.position.set(b.x, b.y, b.z);
      }
    }

    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i]; p.age += s;
      if (p.age >= p.life) { p.mesh.parent?.remove(p.mesh); pts.splice(i, 1); continue; }
      const t = p.age / p.life;
      p.mesh.position.x += p.vx * s; p.mesh.position.y += p.vy * s; p.mesh.position.z += p.vz * s;
      p.mesh.scale.setScalar(p.scale * (1 + t * 1.45)); p.mat.opacity = 0.82 * (1 - t);
    }
    for (let i = skids.length - 1; i >= 0; i--) {
      const sm = skids[i]; sm.age += s;
      if (sm.age >= sm.life) { sm.mesh.parent?.remove(sm.mesh); skids.splice(i, 1); }
      else sm.mat.opacity = 0.58 * (1 - sm.age / sm.life);
    }
  }

  return { vehicles: list, spawnVehicle, removeVehicle, clearDynamicVehicles, findNearestInteractable, damageVehicle, update };
}
