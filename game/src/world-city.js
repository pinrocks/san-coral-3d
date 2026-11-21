import * as THREE from 'three';
import { createRng, hash2d, smoothNoise2d } from './rng.js';

/* San Coral 960m x 960m 3D Coastal Metropolis, Road Graph & Time-of-Day Engine */

const { Group, Mesh, BoxGeometry, CylinderGeometry, ConeGeometry, PlaneGeometry, SphereGeometry, InstancedMesh, Object3D, HemisphereLight, DirectionalLight, FogExp2, Vector3, Color, CanvasTexture, DataTexture, MeshStandardMaterial, MeshBasicMaterial } = THREE;
const { clamp, lerp } = THREE.MathUtils;
const { sin, cos, abs, hypot, atan2, max, min, PI, round, floor, sqrt, ceil } = Math;

const std = (color, roughness = 0.75, metalness = 0, extra = {}) => new MeshStandardMaterial({ color, roughness, metalness, ...extra });
const bas = (color, extra = {}) => new MeshBasicMaterial({ color, ...extra });
const B = (w, h, d) => new BoxGeometry(w, h, d);
const Y = (rt, rb, h, s = 12) => new CylinderGeometry(rt, rb, h, s);
const C = (r, h, s = 8) => new ConeGeometry(r, h, s);
const P = (w, h, sx = 1, sy = 1) => new PlaneGeometry(w, h, sx, sy);

function makeTex(w, h, fn, rx = 1, ry = 1) {
  if (typeof document === 'undefined') {
    const t = new DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
    t.needsUpdate = true;
    return t;
  }
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}

function put(parent, geo, mat, x, y, z, shadow = false) {
  const m = new Mesh(geo, mat);
  m.position.set(x, y, z);
  if (shadow) m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function createCityWorld(scene, renderer, rngInput) {
  const rng = rngInput || createRng(7);
  const root = new Group();
  root.name = 'SanCoralWorld';
  scene.add(root);

  const aniso = renderer?.capabilities ? min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
  const districts = [
    ['cayo-esmeralda', 'Cayo Esmeralda', 430, 550, -185, 125, '#2ae8c8', 'Resort island'],
    ['marina-del-faro', 'Marina del Faro', 180, 430, 160, 430, '#38bdf8', 'Harbor & yachts'],
    ['playa-coral', 'Playa Coral', 160, 405, -360, 360, '#ff5d7a', 'Oceanfront beach'],
    ['distrito-financiero', 'Distrito Financiero', -145, 155, -205, 145, '#60a5fa', 'Glass towers'],
    ['barrio-mirador', 'Barrio Mirador', -385, -145, -205, 145, '#fb923c', 'Market & cafes'],
    ['puerto-industrial', 'Puerto Industrial', -430, -145, 145, 430, '#facc15', 'Cargo docks'],
    ['colinas-doradas', 'Colinas Doradas', -385, 155, -435, -205, '#c084fc', 'Hillside villas'],
    ['autopista-costera', 'Autopista Costera', -480, 480, -480, 480, '#94a3b8', 'Coastal loop']
  ].map(([id, name, x1, x2, z1, z2, color, description]) => ({
    id, name, bounds: { x1, x2, z1, z2 }, color, description, toString: () => name, valueOf: () => name
  }));

  const onBr = (x, z) => x >= 320 && x <= 452 && abs(z + 40) <= 10.5;
  const onIsl = (x, z) => ((x - 492) / 58) ** 2 + ((z + 28) / 156) ** 2 <= 1;
  const onPr = (x, z) =>
    (x >= 346 && x <= 414 && (abs(z - 195) <= 4.2 || abs(z - 268) <= 4.2 || abs(z - 335) <= 4.2)) ||
    (x >= 346 && x <= 426 && z >= 346 && z <= 366);

  function isWater(x, z) {
    if (onBr(x, z) || onPr(x, z) || onIsl(x, z)) return false;
    return (z >= 160 && z <= 435 && x > 348) || x > 396 || ((abs(x) > 468 || abs(z) > 468) && x > 340);
  }

  function gh(x, z) {
    if (onBr(x, z)) return 0.65 + sin(clamp((x - 328) / 118, 0, 1) * PI) * 2.95;
    if (onPr(x, z)) return 0.85;
    if (onIsl(x, z)) return 0.25 + min(1.1, max(0, 1 - (((x - 492) / 56) ** 2 + ((z + 28) / 152) ** 2)) * 1.65);
    if (isWater(x, z)) return -2.4;
    if (z >= -395 && z < 160 && x > 342 && x <= 398) return 0.65 * (1 - clamp((x - 342) / 54, 0, 1));
    return z < -215 && x < 165 ? 0.65 + clamp((-215 - z) / 210, 0, 1) * (2.6 + smoothNoise2d(x, z, 110, 19) * 1.8) : 0.65;
  }

  function getDistrictAt(x, z) {
    if (abs(x) > 404 || abs(z) > 404) {
      if (onIsl(x, z) || onBr(x, z)) return districts[0];
      if (x <= 405) return districts[7];
    }
    if (onIsl(x, z) || (x > 410 && z < 150)) return districts[0];
    if (x >= 180 && z >= 160) return districts[1];
    if (x >= 160) return districts[2];
    if (z < -205 && x < 160) return districts[6];
    return z >= 145 && x < 160 ? districts[5] : x < -145 ? districts[4] : districts[3];
  }

  const rect = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const roadTex = makeTex(256, 256, (c, w, h) => {
    rect(c, '#242936', 0, 0, w, h);
    for (let i = 0; i < 600; i++) rect(c, i % 2 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.035)', (i * 73) % w, (i * 137) % h, 2, 2);
    rect(c, 'rgba(255,255,255,0.55)', 10, 0, 4, h); rect(c, 'rgba(255,255,255,0.55)', w - 14, 0, 4, h);
    for (let y = 8; y < h; y += 32) { rect(c, '#f6c445', w * 0.5 - 5, y, 3, 18); rect(c, '#f6c445', w * 0.5 + 2, y, 3, 18); }
    for (let y = 20; y < h; y += 40) { rect(c, 'rgba(255,255,255,0.38)', w * 0.26, y, 3, 16); rect(c, 'rgba(255,255,255,0.38)', w * 0.74, y, 3, 16); }
  }, 1, 2);
  roadTex.anisotropy = aniso;

  const interTex = makeTex(256, 256, (c, w, h) => {
    rect(c, '#222734', 0, 0, w, h);
    for (let i = 28; i < w - 28; i += 18) {
      rect(c, 'rgba(245,248,255,0.72)', i, 8, 10, 22); rect(c, 'rgba(245,248,255,0.72)', i, h - 30, 10, 22);
      rect(c, 'rgba(245,248,255,0.72)', 8, i, 22, 10); rect(c, 'rgba(245,248,255,0.72)', w - 30, i, 22, 10);
    }
  });
  interTex.anisotropy = aniso;

  function facade(pal, neon, glass = 0.55) {
    const tex = makeTex(256, 512, (c, w, h) => {
      rect(c, pal, 0, 0, w, h); rect(c, 'rgba(12,18,32,0.88)', 0, h - 54, w, 54); rect(c, neon, 8, h - 56, w - 16, 6);
      for (let sx = 18; sx < w - 20; sx += 56) rect(c, 'rgba(255,245,215,0.82)', sx, h - 42, 40, 32);
      const cw = w / 6, ch = (h - 68) / 14;
      for (let r = 0; r < 14; r++) for (let col = 0; col < 6; col++) {
        const hv = hash2d(col * 13 + glass * 100, r * 17, 5);
        rect(c, hv < 0.22 ? 'rgba(18,28,46,0.85)' : hv < 0.22 + glass * 0.55 ? 'rgba(145,220,255,0.78)' : 'rgba(255,224,150,0.88)', col * cw + 6, r * ch + 8, cw - 12, ch - 10);
      }
    });
    tex.anisotropy = aniso;
    return std(0xffffff, 0.45, glass > 0.7 ? 0.45 : 0.12, { map: tex });
  }

  const oceanTex = makeTex(256, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#0996b8'); g.addColorStop(0.5, '#12c2cf'); g.addColorStop(1, '#0b7fa8');
    rect(c, g, 0, 0, w, h);
    for (let i = 0; i < 120; i++) rect(c, i % 3 ? 'rgba(180,252,255,0.22)' : 'rgba(255,255,255,0.32)', (i * 53) % w, (i * 97) % h, 26, 3);
  }, 26, 26);

  const landGeo = P(880, 940, 44, 48);
  landGeo.rotateX(-PI * 0.5);
  const pa = landGeo.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const vx = pa.getX(i) - 42, vz = pa.getZ(i);
    pa.setX(i, vx); pa.setY(i, isWater(vx, vz) ? -2.2 : gh(vx, vz));
  }
  landGeo.computeVertexNormals();
  put(root, landGeo, std(0x3b4654, 0.92), 0, 0, 0).receiveShadow = true;

  const beach = put(root, B(62, 1.2, 555), std(0xf4ddb4, 0.88), 370, -0.15, -118);
  beach.rotation.z = -0.014; beach.receiveShadow = true;
  const islA = put(root, Y(54, 62, 1.8, 28), std(0xeed4a6, 0.86), 492, 0.1, -28);
  islA.scale.z = 2.65; islA.receiveShadow = true;
  const islB = put(root, Y(44, 48, 0.7, 24), std(0x3fa36c, 0.85), 492, 0.98, -28);
  islB.scale.z = 2.55; islB.receiveShadow = true;

  put(root, P(2200, 2200), std(0x16d2df, 0.16, 0.28, { map: oceanTex, transparent: true, opacity: 0.94 }), 240, -0.25, 0).rotation.x = -PI * 0.5;
  const foam = put(root, P(10, 560), bas(0xeaffff, { transparent: true, opacity: 0.62 }), 396, -0.18, -118);
  foam.rotation.x = -PI * 0.5;

  const xAv = [[-420, 18], [-300, 14], [-180, 14], [-60, 16], [60, 16], [200, 15], [320, 18]].map(([x, w]) => ({ x, w }));
  const zSt = [[-420, 18], [-300, 14], [-180, 15], [-40, 16], [80, 14], [200, 15], [320, 14], [420, 18]].map(([z, w]) => ({ z, w }));
  const nodes = [], nodeMap = new Map(), segments = [];
  const roadMat = std(0xffffff, 0.82, 0, { map: roadTex });

  function nodeAt(x, z) {
    const k = `${round(x)},${round(z)}`;
    if (!nodeMap.has(k)) { nodeMap.set(k, nodes.length); nodes.push({ id: nodes.length, x, z, edges: [] }); }
    return nodeMap.get(k);
  }

  function addRoad(x1, z1, x2, z2, width, isBridge = false) {
    const a = nodeAt(x1, z1), b = nodeAt(x2, z2), len = hypot(x2 - x1, z2 - z1);
    const seg = { x1, z1, x2, z2, width, isBridge, len, a, b };
    segments.push(seg);
    nodes[a].edges.push({ to: b, cost: len, seg });
    nodes[b].edges.push({ to: a, cost: len, seg });
    if (isBridge) return;
    const steps = max(1, ceil(len / 40)), hz = abs(x2 - x1) > abs(z2 - z1);
    for (let s = 0; s < steps; s++) {
      const t0 = s / steps, t1 = (s + 1) / steps;
      const sx = x1 + (x2 - x1) * (t0 + t1) * 0.5, sz = z1 + (z2 - z1) * (t0 + t1) * 0.5, sl = len / steps;
      const geo = P(width, sl + 0.6); geo.rotateX(-PI * 0.5); if (hz) geo.rotateY(PI * 0.5);
      const m = put(root, geo, roadMat, sx, gh(sx, sz) + 0.06, sz);
      if (sz < -215 && sx < 165) {
        const ang = atan2(gh(x1 + (x2 - x1) * t1, z1 + (z2 - z1) * t1) - gh(x1 + (x2 - x1) * t0, z1 + (z2 - z1) * t0), sl);
        if (hz) m.rotation.z = ang; else m.rotation.x = -ang;
      }
      m.receiveShadow = true;
    }
  }

  for (const xa of xAv) for (let i = 0; i < zSt.length - 1; i++) addRoad(xa.x, zSt[i].z, xa.x, zSt[i + 1].z, xa.w);
  for (const zs of zSt) for (let i = 0; i < xAv.length - 1; i++) addRoad(xAv[i].x, zs.z, xAv[i + 1].x, zs.z, zs.w);
  const interMat = std(0xffffff, 0.8, 0, { map: interTex });
  for (const xa of xAv) for (const zs of zSt) {
    const m = put(root, P(xa.w + 1, zs.w + 1), interMat, xa.x, gh(xa.x, zs.z) + 0.075, zs.z);
    m.rotation.x = -PI * 0.5; m.receiveShadow = true;
  }

  addRoad(320, -40, 452, -40, 16, true);
  addRoad(452, -40, 488, -40, 12);
  addRoad(488, -140, 488, -40, 12);
  addRoad(488, -40, 488, 85, 12);

  const deckMat = std(0x3b4252, 0.75), railMat = std(0xe2e8f0, 0.6), pColMat = std(0x94a3b8, 0.8);
  for (let i = 0; i < 14; i++) {
    const x0 = 324 + (i / 14) * 128, x1 = 324 + ((i + 1) / 14) * 128, xm = (x0 + x1) * 0.5;
    const y0 = gh(x0, -40), y1 = gh(x1, -40), sl = x1 - x0, ang = atan2(y1 - y0, sl);
    put(root, B(sl + 0.4, 0.7, 19), deckMat, xm, (y0 + y1) * 0.5 - 0.3, -40, true).rotation.z = ang;
    for (const s of [-8.9, 8.9]) put(root, B(sl + 0.3, 1.05, 0.65), railMat, xm, (y0 + y1) * 0.5 + 0.55, -40 + s).rotation.z = ang;
    if (i % 2) for (const s of [-6.5, 6.5]) put(root, Y(0.65, 0.8, 6.5, 8), pColMat, xm, (y0 + y1) * 0.5 - 3.3, -40 + s);
  }

  const bldgs = [], cols = [];
  const bldg = (x, z, w, d, h, m, color) => {
    put(root, B(w, h, d), m, x, gh(x, z) + h * 0.5, z, true);
    bldgs.push({ x, z, w, d, h, color }); cols.push({ x, z, hw: w * 0.5, hd: d * 0.5 });
  };
  const mp = [
    ['#ffd4dc', '#ff4d6d', 0.45], ['#ccf7ee', '#18e0cf', 0.45], ['#fff1d6', '#ffbe3b', 0.42],
    ['#223859', '#38bdf8', 0.85], ['#31445c', '#18e0cf', 0.82], ['#f3a683', '#ffbe3b', 0.35],
    ['#f7d794', '#ff4d6d', 0.35], ['#fbf6ee', '#ffbe3b', 0.32]
  ].map((a) => facade(...a));
  const indM = std(0x64748b, 0.78, 0.25);

  for (let xi = 0; xi < xAv.length - 1; xi++) for (let zi = 0; zi < zSt.length - 1; zi++) {
    const x0 = xAv[xi].x + xAv[xi].w * 0.5 + 10, x1 = xAv[xi + 1].x - xAv[xi + 1].w * 0.5 - 10;
    const z0 = zSt[zi].z + zSt[zi].w * 0.5 + 10, z1 = zSt[zi + 1].z - zSt[zi + 1].w * 0.5 - 10;
    const di = districts.indexOf(getDistrictAt((x0 + x1) * 0.5, (z0 + z1) * 0.5));
    if (xi === 5 && zi === 2) {
      bldg(246, -120, 26, 36, 12, mp[7], '#fff2df');
      put(root, C(22, 4.5, 4), std(0xd95f43, 0.75), 246, gh(246, -120) + 14.2, -120).rotation.y = PI * 0.25;
      continue;
    }
    for (let sc = 0; sc < 2; sc++) for (let sr = 0; sr < 2; sr++) {
      const bx = lerp(x0 + 18, x1 - 18, (sc + 0.5) / 2) + rng.range(-3, 3);
      const bz = lerp(z0 + 18, z1 - 18, (sr + 0.5) / 2) + rng.range(-3, 3);
      const bw = min(34, (x1 - x0) / 2 - 10) * rng.range(0.76, 0.96);
      const bd = min(34, (z1 - z0) / 2 - 10) * rng.range(0.76, 0.96);
      if (di === 3) bldg(bx, bz, bw, bd, rng.range(46, 108), rng.chance(0.5) ? mp[3] : mp[4], '#4a7ab5');
      else if (di === 2) {
        const bh = rng.range(18, 36), [m, c] = rng.pick([[mp[0], '#ff9eb2'], [mp[1], '#8cf0e0'], [mp[2], '#ffe2ad']]);
        bldg(bx, bz, bw, bd, bh, m, c);
      } else if (di === 4) bldg(bx, bz, bw, bd, rng.range(12, 24), rng.chance(0.5) ? mp[5] : mp[6], '#e7986c');
      else if (di === 5) bldg(bx, bz, bw * 1.05, bd * 0.95, rng.range(10, 18), indM, '#64748b');
      else if (di === 6) { if ((sc + sr) % 2 === 0) bldg(bx, bz, bw * 0.8, bd * 0.8, rng.range(8, 14), mp[7], '#f5e6d3'); }
      else bldg(bx, bz, bw * 0.85, bd * 0.85, rng.range(14, 24), mp[2], '#cbd5e1');
    }
  }
  cols.push({ x: 386, z: -49.4, hw: 62, hd: 0.9 }, { x: 386, z: -30.6, hw: 62, hd: 0.9 });

  const wood = std(0x8d6243, 0.84), quay = std(0x9aa5b4, 0.78);
  put(root, B(20, 1.5, 255), quay, 338, 0.08, 285).receiveShadow = true;
  for (const pz of [195, 268, 335]) {
    put(root, B(68, 0.45, 7.8), wood, 380, 0.65, pz, true);
    for (let px = 352; px <= 410; px += 14) for (const s of [-3.1, 3.1]) put(root, Y(0.28, 0.32, 3.4, 7), wood, px, -0.6, pz + s);
  }
  put(root, B(80, 1.8, 18), quay, 386, 0.15, 356).receiveShadow = true;

  const lh = new Group(); lh.position.set(418, 0.95, 356);
  for (let b = 0; b < 5; b++) put(lh, Y(3.9 - (b + 1) * 0.36, 3.9 - b * 0.36, 4.6, 16), std(b % 2 ? 0xe63956 : 0xf8fafc, 0.55), 0, 2.3 + b * 4.6, 0, true);
  put(lh, Y(1.9, 1.9, 2.8, 12), bas(0xfff3a8), 0, 24.5, 0);
  put(lh, C(2.4, 2.6, 12), std(0xd62839, 0.5), 0, 27.1, 0);
  root.add(lh); cols.push({ x: 418, z: 356, hw: 4.2, hd: 4.2 }); bldgs.push({ x: 418, z: 356, w: 8.4, d: 8.4, h: 28, color: '#e63956' });

  const yacht = (yx, yz, sc = 1) => {
    const yg = new Group();
    put(yg, B(15 * sc, 2.1 * sc, 4.6 * sc), std(0xf8fafc, 0.25, 0.18), 0, 0.55, 0);
    put(yg, C(2.35 * sc, 5.2 * sc, 4), std(0xf1f5f9, 0.28), 9.8 * sc, 0.65, 0).rotation.set(PI * 0.25, 0, -PI * 0.5);
    put(yg, B(8.5 * sc, 1.8 * sc, 3.5 * sc), std(0x1e293b, 0.2, 0.6), -0.6 * sc, 2.1 * sc, 0);
    put(yg, B(15.2 * sc, 0.28 * sc, 4.7 * sc), bas(0x18e0cf), 0, 1.15, 0);
    yg.position.set(yx, -0.2, yz); root.add(yg); return yg;
  };
  const yachts = [yacht(378, 207, 1.05), yacht(398, 281, 1.18), yacht(372, 321, 0.95)];

  put(root, B(11, 0.3, 16), std(0x18e0cf, 0.12, 0, { emissive: 0x085a68 }), 225, gh(225, -120) + 0.05, -120);
  bldg(506, -42, 24, 34, 15, mp[1], '#8cf0e0');
  bldg(504, 24, 20, 24, 11, mp[7], '#fff2df');

  const cCols = [0xff4d6d, 0x18e0cf, 0xffbe3b, 0x3b82f6, 0xf97316];
  for (let ci = 0; ci < 18; ci++) {
    const cx = -395 + (ci % 6) * 22, cz = 355 + floor(ci / 6) * 14;
    for (let st = 0; st < 1 + (ci % 3); st++) put(root, B(12, 3.1, 4.8), std(cCols[(ci + st) % 5], 0.62), cx, gh(cx, cz) + 1.55 + st * 3.12, cz, true);
    cols.push({ x: cx, z: cz, hw: 6, hd: 2.4 });
  }
  for (let si = 0; si < 3; si++) {
    const sx = -245 + si * 22;
    put(root, Y(7.5, 7.5, 19, 16), std(0xe2e8f0, 0.45, 0.35), sx, gh(sx, 372) + 9.5, 372, true);
    cols.push({ x: sx, z: 372, hw: 7.5, hd: 7.5 }); bldgs.push({ x: sx, z: 372, w: 15, d: 15, h: 19, color: '#cbd5e1' });
  }
  const craneMat = std(0xf59e0b, 0.5, 0.35);
  for (const gx of [-370, -295]) {
    const gy = gh(gx, 402);
    for (const lx of [-6, 6]) for (const lz of [-4, 4]) put(root, B(1.1, 26, 1.1), craneMat, gx + lx, gy + 13, 402 + lz);
    put(root, B(34, 1.8, 3.2), craneMat, gx + 5, gy + 25.5, 402);
  }

  const palms = [];
  for (let z = -390; z <= 390; z += 26) if (abs(z + 40) > 16) { palms.push([333.5, z], [306.5, z], [210.5, z]); if (z < 150) palms.push([350, z + 9]); }
  for (let x = -390; x <= 300; x += 34) palms.push([x, -191.5], [x, -28.5], [x, 91.5], [x, -289]);
  for (let z = -150; z <= 100; z += 28) palms.push([474, z], [502, z + 10]);

  const tGeo = Y(0.22, 0.42, 8.6, 7); tGeo.translate(0, 4.3, 0);
  const trunks = new InstancedMesh(tGeo, std(0x8b6343, 0.88), palms.length);
  const crowns = new InstancedMesh(C(3.6, 2.2, 7), std(0x22a858, 0.68), palms.length);
  trunks.castShadow = crowns.castShadow = true;
  const dm = new Object3D();
  for (let i = 0; i < palms.length; i++) {
    const [px, pz] = palms[i], py = gh(px, pz), sc = 0.85 + hash2d(px, pz, 31) * 0.42, ln = (hash2d(px, pz, 47) - 0.5) * 0.16;
    dm.position.set(px, py, pz); dm.rotation.set(ln, hash2d(px, pz, 59) * PI * 2, -ln * 0.8);
    dm.scale.setScalar(sc); dm.updateMatrix(); trunks.setMatrixAt(i, dm.matrix);
    dm.position.set(px + sin(dm.rotation.z) * -0.4, py + 8.3 * sc, pz);
    dm.scale.set(sc * 1.15, sc * 0.85, sc * 1.15); dm.updateMatrix(); crowns.setMatrixAt(i, dm.matrix);
  }
  root.add(trunks, crowns);

  const pole = std(0x334155, 0.45, 0.5), bulb = bas(0xffe4a0);
  for (const xa of xAv) {
    for (let z = -380; z <= 380; z += 60) { const lx = xa.x + xa.w * 0.5 + 1.8, ly = gh(lx, z); put(root, Y(0.11, 0.15, 6.8, 6), pole, lx, ly + 3.4, z); put(root, B(1.4, 0.24, 0.45), bulb, lx - 0.55, ly + 6.8, z); }
    for (const zs of zSt) { const tx = xa.x - xa.w * 0.5 - 1.6, tz = zs.z - zs.w * 0.5 - 1.6, ty = gh(tx, tz); put(root, Y(0.13, 0.16, 5.8, 6), pole, tx, ty + 2.9, tz); put(root, B(0.45, 1.15, 0.45), bas((xa.x + zs.z) % 40 === 0 ? 0x22c55e : 0xef4444), tx, ty + 5.2, tz); }
  }
  const umb = (ux, uz, c) => { const uy = gh(ux, uz); put(root, Y(0.06, 0.06, 2.3, 6), pole, ux, uy + 1.15, uz); put(root, C(1.85, 0.72, 8), std(c, 0.55), ux, uy + 2.35, uz); };
  for (let i = 0; i < 28; i++) { const bz = -340 + i * 17; if (abs(bz + 40) > 18) umb(362 + (i % 3) * 8, bz, cCols[i % 5]); }
  for (let i = 0; i < 18; i++) { umb(305.2, -165 + i * 16, cCols[(i + 1) % 5]); umb(-190.5, -160 + i * 16, cCols[(i + 2) % 5]); }
  put(root, Y(6.5, 7.2, 0.9, 18), std(0x18e0cf, 0.18, 0, { emissive: 0x0a5864 }), 0, gh(0, 20) + 0.45, 20);

  const skyMat = bas(0x5ec8f8, { side: THREE.BackSide, depthWrite: false });
  const skyDome = new Mesh(new SphereGeometry(1550, 24, 16), skyMat);
  const sunDiscMat = bas(0xfff1b8, { fog: false });
  const sunDisc = new Mesh(new SphereGeometry(46, 20, 16), sunDiscMat);
  const hemi = new HemisphereLight(0x9be7ff, 0x4b4237, 0.95);
  const sun = new DirectionalLight(0xfff0d4, 1.85);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { near: 10, far: 720, left: -210, right: 210, top: 210, bottom: -210 });
  sun.shadow.bias = -0.0005;
  root.add(skyDome, sunDisc, hemi, sun, sun.target);
  scene.fog = new FogExp2(0x8bd8f8, 0.00072);

  let timeOfDay = 0.38;
  function setTimeOfDay(t) {
    timeOfDay = ((t % 1) + 1) % 1;
    const p = timeOfDay >= 0.58 && timeOfDay <= 0.76
      ? [0xff8e64, 0xf99d73, 0.00068, 0xffb469, 2.15, 0xffc99e, 0x3a2e4c, 1.05, 0xffcf70, 920, 210, -280]
      : timeOfDay > 0.76 || timeOfDay < 0.22
        ? [0x1b2448, 0x232d58, 0.00085, 0x9fb8ff, 0.85, 0x5973b8, 0x1d1a30, 0.78, 0xff9466, 960, 75, -340]
        : [0x4fc3f7, 0x9ce2ff, 0.00058, 0xfff5df, 2.05, 0xa8ecff, 0x575248, 1.1, 0xfff7cc, 680, 620, -240];
    skyMat.color.setHex(p[0]);
    if (p[0] === 0xff8e64) skyMat.color.lerp(new Color(0x5288d8), 0.35 * (1 - max(0, 1 - abs(timeOfDay - 0.67) / 0.1)));
    scene.fog.color.setHex(p[1]); scene.fog.density = p[2];
    sun.color.setHex(p[3]); sun.intensity = p[4];
    hemi.color.setHex(p[5]); hemi.groundColor.setHex(p[6]); hemi.intensity = p[7];
    sunDiscMat.color.setHex(p[8]); sunDisc.position.set(p[9], p[10], p[11]);
    renderer?.setClearColor(skyMat.color);
  }
  setTimeOfDay(0.38);

  function resolveCircleCollision(x, z, r = 1.2) {
    let cx = clamp(x, -468, 548), cz = clamp(z, -468, 468), hit = cx !== x || cz !== z, nx = 0, nz = 0, hb = null;
    for (const b of cols) {
      if (abs(cx - b.x) > b.hw + r + 1 || abs(cz - b.z) > b.hd + r + 1) continue;
      const qx = clamp(cx, b.x - b.hw, b.x + b.hw), qz = clamp(cz, b.z - b.hd, b.z + b.hd);
      const dx = cx - qx, dz = cz - qz, d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        hit = true; hb = b;
        if (d2 > 1e-6) { const d = sqrt(d2); nx = dx / d; nz = dz / d; cx = qx + nx * r; cz = qz + nz * r; }
        else if (b.hw + r - abs(cx - b.x) < b.hd + r - abs(cz - b.z)) { nx = cx >= b.x ? 1 : -1; nz = 0; cx = b.x + nx * (b.hw + r); }
        else { nx = 0; nz = cz >= b.z ? 1 : -1; cz = b.z + nz * (b.hd + r); }
      }
    }
    return { x: cx, z: cz, hit, nx, nz, building: hb };
  }

  function getNearestRoadPoint(x, z) {
    let best = null, bd2 = Infinity;
    for (const s of segments) {
      const vx = s.x2 - s.x1, vz = s.z2 - s.z1, t = clamp(((x - s.x1) * vx + (z - s.z1) * vz) / (vx * vx + vz * vz || 1), 0, 1);
      const px = s.x1 + vx * t, pz = s.z1 + vz * t, d2 = (x - px) ** 2 + (z - pz) ** 2;
      if (d2 < bd2) { bd2 = d2; best = { x: px, z: pz, heading: atan2(vx, vz), segment: s, width: s.width, isBridge: s.isBridge, distSq: d2, dist: sqrt(d2) }; }
    }
    return best;
  }

  function computeRoute(fx, fz, tx, tz) {
    const s0 = getNearestRoadPoint(fx, fz), s1 = getNearestRoadPoint(tx, tz);
    if (!s0 || !s1) return [{ x: fx, z: fz }, { x: tx, z: tz }];
    const nr = (s) => hypot(s.x - nodes[s.segment.a].x, s.z - nodes[s.segment.a].z) <= hypot(s.x - nodes[s.segment.b].x, s.z - nodes[s.segment.b].z) ? s.segment.a : s.segment.b;
    const a = nr(s0), b = nr(s1), g = new Float64Array(nodes.length).fill(Infinity), p = new Int32Array(nodes.length).fill(-1), v = new Uint8Array(nodes.length);
    g[a] = 0;
    for (let it = 0; it < nodes.length; it++) {
      let u = -1, bf = Infinity;
      for (let i = 0; i < nodes.length; i++) if (!v[i] && g[i] < bf) { bf = g[i]; u = i; }
      if (u === -1 || u === b) break;
      v[u] = 1;
      for (const e of nodes[u].edges) if (g[u] + e.cost < g[e.to]) { g[e.to] = g[u] + e.cost; p[e.to] = u; }
    }
    const ch = [];
    for (let c = b; c !== -1; c = p[c]) { ch.push({ x: nodes[c].x, z: nodes[c].z }); if (c === a) break; }
    ch.reverse();
    return [{ x: s0.x, z: s0.z }, ...ch, { x: s1.x, z: s1.z }, { x: tx, z: tz }];
  }

  const sunVec = new Vector3();
  let wave = 0;
  function update(dt, focusPos) {
    wave += dt;
    oceanTex.offset.x = (wave * 0.025) % 1;
    oceanTex.offset.y = sin(wave * 0.5) * 0.02;
    foam.position.x = 396 + sin(wave * 1.9) * 1.4;
    for (let i = 0; i < yachts.length; i++) {
      yachts[i].position.y = -0.2 + sin(wave * 1.6 + i * 1.7) * 0.085;
      yachts[i].rotation.z = sin(wave * 1.2 + i) * 0.024;
    }
    if (focusPos) {
      skyDome.position.set(focusPos.x, 0, focusPos.z);
      sunVec.copy(sunDisc.position).normalize().multiplyScalar(260);
      sun.target.position.set(focusPos.x, 0, focusPos.z);
      sun.position.set(focusPos.x + sunVec.x, max(85, sunVec.y), focusPos.z + sunVec.z);
    }
  }

  return {
    districts, getDistrictAt, getGroundHeight: gh, isWater, resolveCircleCollision,
    roadGraph: { nodes, segments, buildings: bldgs, getNearestRoadPoint, computeRoute },
    safehouse: { x: 210, z: -120, heading: 0, name: 'Villa Solis Safehouse' },
    marinaSlip: { x: 385, z: 240, heading: PI * 0.5 },
    setTimeOfDay, getTimeOfDay: () => timeOfDay, update
  };
}
