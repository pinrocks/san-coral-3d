/* Deterministic Mulberry32 PRNG and spatial hashing for San Coral: High Tide */

function seedInt(s) {
  if (typeof s === 'number' && Number.isFinite(s)) return (Math.floor(s) >>> 0) || 0x6d2b79f5;
  const str = String(s ?? 7);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  return h || 7;
}

export function createRng(seed = 7) {
  let st = seedInt(seed);
  const next = () => {
    st = (st + 0x6d2b79f5) >>> 0;
    let t = Math.imul(st ^ (st >>> 15), 1 | st);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (a = 0, b = 1) => a + (b - a) * next(),
    int: (a, b) => { const l = Math.ceil(Math.min(a, b)); return Math.floor(next() * (Math.floor(Math.max(a, b)) - l + 1)) + l; },
    pick: (a) => (a?.length ? a[Math.floor(next() * a.length)] : undefined),
    chance: (p = 0.5) => next() < p,
    signed: () => next() * 2 - 1,
    shuffle: (a = []) => { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; },
    fork: (s = 1) => createRng((st ^ Math.imul((s | 0) + 1, 0x9e3779b9)) >>> 0)
  };
}

export function hash2d(x, z, salt = 0) {
  let h = (Math.imul(Math.round(x * 100) | 0, 0x27d4eb2d) ^ Math.imul(Math.round(z * 100) | 0, 0x165667b1) ^ Math.imul(salt | 0, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function smoothNoise2d(x, z, scale = 80, salt = 11) {
  const sx = x / scale, sz = z / scale, ix = Math.floor(sx), iz = Math.floor(sz);
  const fx = sx - ix, fz = sz - iz, ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const ab = hash2d(ix, iz, salt) * (1 - ux) + hash2d(ix + 1, iz, salt) * ux;
  const cd = hash2d(ix, iz + 1, salt) * (1 - ux) + hash2d(ix + 1, iz + 1, salt) * ux;
  return ab + (cd - ab) * uz;
}
