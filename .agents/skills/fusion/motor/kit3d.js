// kit3d.js · Motor 3D Toon + Anclas de Voz + Subtítulos + Audio (Skill FUSION: video-explicativo-3d-josue + videos-explicativos-claude)
import * as THREE from 'three';

// ── 1. MATEMÁTICAS Y CURVAS DETERMINISTAS ──────────────────────────────────────────────────────────────────────
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (k) => { k = clamp(k); return k * k * k * (k * (k * 6 - 15) + 10); };
export const ramp = (t, a, b) => clamp((t - a) / (b - a || 1e-6));
export const easeOutBack = (k) => { k = clamp(k); const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
export const spring = (zeta = 0.72) => {
  const w = 4.8 / zeta, wd = w * Math.sqrt(1 - zeta * zeta);
  return (u) => (u <= 0 ? 0 : u >= 1.6 ? 1 : 1 - Math.exp(-zeta * w * u) * (Math.cos(wd * u) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * u)));
};
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ── 2. ANCLAS A LA VOZ PALABRA A PALABRA Y REGISTRO DE SONIDOS (DE VIDEOS-EXPLICATIVOS-CLAUDE) ────────────────
export function crearAnclas(timeline) {
  const tl = timeline || (typeof window !== 'undefined' && window.TIMELINE) || { palabras: [], dur: 14 };
  const avisos = [];
  const dudas = [];
  const eventos = [];
  const sonidosVistos = new Set();

  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ]/g, '');
  const P = (tl.palabras || []).map((p) => ({ ...p, k: norm(p.w) }));
  const hayVozInicio = P.some((p) => p.s < 2.2 && p.e > 0);
  const sonidosFuertes = [];
  let sonidosEnArranque = 0;

  function busca(frase, n = 1, desde = 0) {
    const ks = String(frase).split(/\s+/).map(norm).filter(Boolean);
    let c = 0;
    for (let i = 0; i < P.length; i++) {
      if (P[i].s < desde - 1e-3) continue;
      let ok = true;
      for (let j = 0; j < ks.length; j++) {
        const p = P[i + j];
        if (!p || !(p.k === ks[j] || (ks[j].length >= 4 && p.k.startsWith(ks[j])))) { ok = false; break; }
      }
      if (ok && ++c === n) return [i, i + ks.length - 1];
    }
    return null;
  }

  const en = (frase, n = 1, desde = 0) => {
    if (n === 1 && busca(frase, 2, desde)) {
      dudas.push(`«${frase}» sale más de una vez: usa en('${frase}', 2) si querías la segunda`);
    }
    const r = busca(frase, n, desde);
    if (!r) {
      avisos.push(`No encuentro «${frase}» en la voz`);
      return null;
    }
    return P[r[0]].s;
  };

  const fin = (frase, n = 1, desde = 0) => {
    const r = busca(frase, n, desde);
    if (!r) {
      avisos.push(`No encuentro «${frase}» en la voz`);
      return null;
    }
    return P[r[1]].e;
  };

  const debe = (v, que) => {
    if (v == null) {
      avisos.push(`Falta el ancla obligatoria de «${que}»`);
      return 0;
    }
    return v;
  };

  const sonido = (t, tipo = 'whoosh', ganancia = 1.0, extra = {}) => {
    if (t == null || Number.isNaN(t) || t < 0) return;
    const tNum = Number(Number(t).toFixed(3));
    const key = `${tNum.toFixed(2)}_${tipo}_${extra.archivo || ''}`;
    if (sonidosVistos.has(key)) return;
    sonidosVistos.add(key);

    let g = Number(ganancia ?? 1.0);
    const esCapaBaja = extra.capaBaja === true || g <= 0.35;
    const minGap = 0.35;

    // Protección anti-apilamiento (>= 0.35 s entre golpes fuertes, salvo capas explícitas bajas)
    if (!esCapaBaja && sonidosFuertes.some((ts) => Math.abs(ts - tNum) < minGap)) {
      if (tNum < 2.2) {
        dudas.push(`Sonidos apilados al inicio (t=${tNum}s < 2.2s, separación < 0.35s): '${tipo}' bloqueado para proteger la voz`);
      } else {
        dudas.push(`SFX '${tipo}' en t=${tNum}s separado < 0.35s de otro golpe fuerte: omitido por anti-apilamiento`);
      }
      return;
    }

    // Atenuación automática en arranque vocal (t < 2.2 s) cuando hay palabras activas en TIMELINE
    if (tNum < 2.2 && hayVozInicio) {
      sonidosEnArranque += 1;
      const palabraActiva = P.some((p) => tNum >= p.s - 0.12 && tNum <= p.e + 0.12);
      if (sonidosEnArranque > 1) {
        g = Math.min(g, 0.30);
        dudas.push(`Múltiples SFX en arranque vocal (t=${tNum}s < 2.2s): '${tipo}' atenuado a ${g.toFixed(2)} (máx. recomendado: 1 SFX sutil)`);
      } else {
        g = Math.min(g, palabraActiva ? 0.50 : 0.62);
      }
    }

    if (!esCapaBaja) sonidosFuertes.push(tNum);
    eventos.push({ t: tNum, tipo, ganancia: Number(g.toFixed(3)), ...extra });
  };

  if (typeof window !== 'undefined') {
    window.__avisos = avisos;
    window.__dudas = dudas;
    window.__eventos = eventos;
    window.__dur = tl.dur || 14;
  }

  return { tl, dur: tl.dur || 14, en, fin, debe, sonido, avisos, dudas, eventos };
}

// ── 3. PALETA Y MATERIALES TOON 3 BANDAS (DE VIDEO-EXPLICATIVO-3D-JOSUE) ──────────────────────────────────────
export const PALETTE = {
  skyTop: '#5f9be0', skyBottom: '#f4f1e6', sandA: '#e2c693', sandB: '#d2b782',
  wall: '#e6e6e1', mortar: '#c6c9c5', ink: '#2a2622', accent: '#2fb7f5', accentGlow: '#bff0ff', danger: '#df3b30',
  leaf: '#7cc4a0', trunk: '#b6763f', waterA: '#1d6fa5', waterB: '#134e78', metal: '#8d99ae', gold: '#f4b942',
};

let _grad;
function gradientMap() {
  if (_grad) return _grad;
  _grad = new THREE.DataTexture(new Uint8Array([110, 110, 110, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  _grad.minFilter = _grad.magFilter = THREE.NearestFilter;
  _grad.needsUpdate = true;
  return _grad;
}
export const toon = (color, opts = {}) => new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), ...opts });
export function mesh(geo, mat, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

// ── 4. TEXTURAS PROCEDURALES POR CANVAS ────────────────────────────────────────────────────────────────────────
export function canvasTex(size, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  return t;
}

export function sandTexture(a = PALETTE.sandA, b = PALETTE.sandB, repeat = [5, 5], seed = 7) {
  return canvasTex(512, (g, S) => {
    const r = rng(seed), G = 8, grid = [];
    for (let i = 0; i < G * G; i++) grid.push(r());
    const at = (x, y) => grid[((y % G + G) % G) * G + ((x % G + G) % G)];
    const noise = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = smooth(x - xi), fy = smooth(y - yi);
      return lerp(lerp(at(xi, yi), at(xi + 1, yi), fx), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), fx), fy);
    };
    const img = g.createImageData(S, S);
    const ha = new THREE.Color(a).getHex(THREE.SRGBColorSpace), hb = new THREE.Color(b).getHex(THREE.SRGBColorSpace);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S * G, v = y / S * G, n = noise(u, v) * 0.65 + noise(u * 2, v * 2) * 0.35;
      const hex = n > 0.52 ? hb : ha, i = (y * S + x) * 4;
      img.data[i] = hex >> 16; img.data[i + 1] = (hex >> 8) & 255; img.data[i + 2] = hex & 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, repeat);
}

export function brickTexture(base = PALETTE.wall, mortar = PALETTE.mortar, repeat = [2, 2], seed = 3) {
  return canvasTex(512, (g, S) => {
    const r = rng(seed), rows = 8, cols = 4, bh = S / rows, bw = S / cols;
    g.fillStyle = mortar; g.fillRect(0, 0, S, S);
    for (let j = 0; j < rows; j++) for (let i = -1; i <= cols; i++) {
      g.fillStyle = '#' + new THREE.Color(base).multiplyScalar(0.94 + r() * 0.06).getHexString(THREE.SRGBColorSpace);
      g.fillRect(i * bw + (j % 2 ? bw / 2 : 0) + 2, j * bh + 2, bw - 4, bh - 4);
    }
  }, repeat);
}

export function skyTexture(top = PALETTE.skyTop, bottom = PALETTE.skyBottom) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, top); gr.addColorStop(0.55, bottom); gr.addColorStop(1, bottom);
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ── 5. MUNDO, OBJETOS BASE Y PERSONAJE EXPRESIVO ───────────────────────────────────────────────────────────────
export function buildWorld(scene, P = PALETTE) {
  scene.background = skyTexture(P.skyTop, P.skyBottom);
  scene.fog = new THREE.Fog(new THREE.Color(P.skyBottom), 38, 115);
  const ground = mesh(new THREE.PlaneGeometry(400, 400), toon('#ffffff', { map: sandTexture(P.sandA, P.sandB, [22, 22]) }), { cast: false });
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const hemi = new THREE.HemisphereLight('#ffffff', '#8fa3c4', 1.25);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3da', 2.3);
  sun.position.set(-9, 16, 11);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 65 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  return { ground, sun, hemi };
}

export function cloud(x, y, z, s = 1) {
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false });
  [[0, 0, 1], [1.1, 0.1, 0.8], [-1.1, 0, 0.75], [0.4, 0.5, 0.7]].forEach(([dx, dy, r]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m);
    b.position.set(dx, dy, 0); b.scale.z = 0.3; g.add(b);
  });
  g.position.set(x, y, z); g.scale.setScalar(s);
  return g;
}

export function tree(P = PALETTE, seed = 5) {
  const g = new THREE.Group(), r = rng(seed);
  const trunk = mesh(new THREE.CylinderGeometry(0.13, 0.18, 2.6, 10), toon(P.trunk));
  trunk.position.y = 1.3; g.add(trunk);
  const geo = new THREE.IcosahedronGeometry(1.05, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 0.88 + r() * 0.24;
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.9, p.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const top = mesh(geo, toon(P.leaf));
  top.position.y = 3.1; g.add(top);
  return g;
}

// Personaje simple sin rig: perfil torneado (LatheGeometry) con dos ojos expresivos
export function character(color = '#f4b942', scale = 1) {
  const g = new THREE.Group();
  const pts = [
    new THREE.Vector2(0.01, 0.0),
    new THREE.Vector2(0.42, 0.02),
    new THREE.Vector2(0.48, 0.35),
    new THREE.Vector2(0.36, 0.85),
    new THREE.Vector2(0.44, 1.25),
    new THREE.Vector2(0.38, 1.58),
    new THREE.Vector2(0.18, 1.74),
    new THREE.Vector2(0.01, 1.78),
  ];
  const body = mesh(new THREE.LatheGeometry(pts, 20), toon(color));
  g.add(body);
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#1c1a17' });
  const whiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const eyeL = new THREE.Group(), eyeR = new THREE.Group();
  [-0.14, 0.14].forEach((x, idx) => {
    const eg = idx === 0 ? eyeL : eyeR;
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), whiteMat);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), eyeMat);
    p.position.z = 0.06;
    eg.add(w, p);
    eg.position.set(x, 1.38, 0.36);
    g.add(eg);
  });
  g.scale.setScalar(scale);
  g.userData = { body, eyeL, eyeR };
  return g;
}

// Placa 3D con texto nítido en canvas para comparativas y cotas de profundidad
function _canvasSign(text, { w = 512, h = 160, bg = '#0d1420', border = '#00f5d4', color = '#fff6e0', font = "800 66px Cap, 'Arial Black', sans-serif", size = [1.5, 0.48] } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const draw = () => {
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = bg;
    ctx.strokeStyle = border;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, Math.min(34, (h - 16) / 2));
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 2);
    tex.needsUpdate = true;
  };
  draw();
  if (typeof document !== 'undefined' && document.fonts && document.fonts.load) {
    document.fonts.load(font).then(draw).catch(() => {});
  }
  const side = new THREE.MeshBasicMaterial({ color: bg, fog: false });
  const face = new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false });
  return new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], 0.05), [side, side, side, side, face, face]);
}

// Literalidad 1:1 · Personaje/cabeza humana con pinzas extrayendo un cabello comparado lado a lado con fibra (~100-125 um)
export function hairComparison({
  scale = 1,
  position = [0, 0, 0],
  skinColor = '#f2c29b',
  hairColor = '#2a1c14',
  shirtColor = '#2b5876',
  fiberColor = '#00f5d4',
  labelHair = 'CABELLO ~80 µm',
  labelFiber = 'FIBRA 125 µm',
  showCharacter = true,
  showLabels = true,
} = {}) {
  const g = new THREE.Group();
  g.position.set(...position);
  g.scale.setScalar(scale);

  // 1. Cabeza/busto humano estilizado a la izquierda
  const headGroup = new THREE.Group();
  headGroup.position.set(-1.42, 0.92, -0.12);
  headGroup.rotation.y = 0.28;
  if (showCharacter) {
    const torso = mesh(new THREE.CylinderGeometry(0.46, 0.72, 1.05, 16), toon(shirtColor));
    torso.position.y = -0.62;
    const neck = mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.36, 12), toon(skinColor));
    neck.position.y = -0.02;
    const skull = mesh(new THREE.SphereGeometry(0.58, 22, 18), toon(skinColor));
    skull.scale.set(0.92, 1.06, 0.95);
    skull.position.y = 0.56;
    const nose = mesh(new THREE.SphereGeometry(0.09, 10, 8), toon(skinColor));
    nose.scale.set(0.85, 1.1, 1.2);
    nose.position.set(0, 0.50, 0.55);
    const earL = mesh(new THREE.SphereGeometry(0.12, 10, 8), toon(skinColor));
    earL.scale.set(0.45, 0.9, 0.6);
    earL.position.set(-0.54, 0.54, 0.02);
    const earR = earL.clone();
    earR.position.x = 0.54;
    const eyeWMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const eyePMat = new THREE.MeshBasicMaterial({ color: '#1c1a17' });
    [-0.19, 0.19].forEach((ex) => {
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), eyeWMat);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), eyePMat);
      w.position.set(ex, 0.62, 0.48);
      p.position.set(ex + 0.02, 0.62, 0.55); // mirando hacia la lupa
      headGroup.add(w, p);
    });
    const hairMat = toon(hairColor);
    const hairCap = mesh(new THREE.SphereGeometry(0.62, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
    hairCap.position.set(0, 0.62, -0.03);
    hairCap.rotation.x = -0.18;
    const hairBack = mesh(new THREE.SphereGeometry(0.58, 16, 12), hairMat);
    hairBack.scale.set(0.95, 0.9, 0.8);
    hairBack.position.set(0, 0.55, -0.18);
    const tuft = mesh(new THREE.ConeGeometry(0.16, 0.42, 8), hairMat);
    tuft.position.set(0.14, 1.20, 0.12);
    tuft.rotation.z = -0.38;
    headGroup.add(torso, neck, skull, nose, earL, earR, hairCap, hairBack, tuft);
  }
  g.add(headGroup);

  // 2. Pinzas de precisión + mano estilizada extrayendo el cabello desde el cuero cabelludo
  const tweezersGroup = new THREE.Group();
  tweezersGroup.position.set(-0.78, 2.38, 0.22);
  const steelMat = toon('#d7e2ec');
  const tipA = mesh(new THREE.BoxGeometry(0.62, 0.045, 0.07), steelMat);
  tipA.rotation.z = -0.18;
  tipA.position.set(0.05, 0.06, 0);
  const tipB = mesh(new THREE.BoxGeometry(0.62, 0.045, 0.07), steelMat);
  tipB.rotation.z = -0.32;
  tipB.position.set(0.04, -0.02, 0);
  const handGrip = mesh(new THREE.SphereGeometry(0.18, 14, 12), toon(skinColor));
  handGrip.scale.set(1.2, 0.85, 0.85);
  handGrip.position.set(-0.28, 0.22, 0);
  const cuff = mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.42, 12), toon(shirtColor));
  cuff.rotation.z = Math.PI / 2 - 0.35;
  cuff.position.set(-0.56, 0.34, 0);
  tweezersGroup.add(tipA, tipB, handGrip, cuff);
  g.add(tweezersGroup);

  // 3. Cabello humano curvado extraído que entra lado a lado en el calibrador lupa
  const hairPts = [
    [-1.26, 2.02, 0.05],
    [-0.95, 2.34, 0.16],
    [-0.44, 2.34, 0.26],
    [0.14, 2.12, 0.36],
    [0.54, 1.72, 0.41],
    [0.62, 1.24, 0.41],
    [0.56, 0.72, 0.41],
    [0.66, 0.34, 0.41],
  ];
  const hairCurve = polyCurve(hairPts, 0.35);
  const hairStrandMat = toon(hairColor, { emissive: '#3d281c', emissiveIntensity: 0.28 });
  const hairStrand = drawTube(hairCurve, 0.028, hairStrandMat, 96);
  g.add(hairStrand);

  // 4. Anillo lupa / calibrador 3D en el centro-derecha
  const magnifier = new THREE.Group();
  magnifier.position.set(0.92, 1.12, 0.38);
  const outerBezel = mesh(new THREE.TorusGeometry(1.16, 0.095, 14, 48), toon('#2b3440'));
  const innerGauge = mesh(new THREE.TorusGeometry(1.04, 0.032, 10, 48), toon('#f4b942'));
  const lensDisc = new THREE.Mesh(
    new THREE.CircleGeometry(1.04, 48),
    new THREE.MeshBasicMaterial({ color: '#0d2238', transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false })
  );
  lensDisc.position.z = -0.08;
  const handle = mesh(new THREE.CylinderGeometry(0.085, 0.11, 1.25, 12), toon('#2a2622'));
  handle.rotation.z = 0.68;
  handle.position.set(1.12, -1.32, 0);
  const ferrule = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 12), toon('#f4b942'));
  ferrule.rotation.z = 0.68;
  ferrule.position.set(0.80, -0.94, 0);

  // Marcas calibradoras horizontales dentro de la lupa
  const tickMat = new THREE.MeshBasicMaterial({ color: '#9fb4d4', transparent: true, opacity: 0.75, fog: false });
  [-0.55, 0, 0.55].forEach((ty) => {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.016, 0.016), tickMat);
    tick.position.set(0, ty, -0.02);
    magnifier.add(tick);
  });
  magnifier.add(outerBezel, innerGauge, lensDisc, ferrule, handle);

  // 5. Núcleo de fibra óptica (~125 um) colocado lado a lado con el cabello dentro de la lupa
  const fiberPts = [
    [0.34, -0.88, 0.03],
    [0.34, -0.30, 0.03],
    [0.34, 0.30, 0.03],
    [0.34, 0.88, 0.03],
  ];
  const fiberCurve = polyCurve(fiberPts, 0.1);
  const fiberClad = drawTube(fiberCurve, 0.048, toon('#bff0ff', { transparent: true, opacity: 0.48 }), 40);
  const fiberCore = drawTube(fiberCurve, 0.025, new THREE.MeshBasicMaterial({ color: fiberColor, fog: false }), 40);
  const fiberPhotons = flowBeads(fiberCurve, { count: 6, radius: 0.042, color: '#ffffff', speed: 0.65 });
  magnifier.add(fiberClad, fiberCore, fiberPhotons);

  // Etiquetas de comparación 1:1 limpias debajo/encima sin tapar pinzas ni bordes
  if (showLabels) {
    const hairTag = _canvasSign(labelHair, { w: 580, h: 150, bg: '#261a14', border: '#f4b942', color: '#fff6e0', font: "800 50px Cap, 'Arial Black', sans-serif", size: [1.62, 0.42] });
    hairTag.position.set(-0.76, 1.56, 0.14);
    const fiberTag = _canvasSign(labelFiber, { w: 580, h: 150, bg: '#0b1e2e', border: fiberColor, color: '#00f5d4', font: "800 50px Cap, 'Arial Black', sans-serif", size: [1.62, 0.42] });
    fiberTag.position.set(0.94, 1.56, 0.14);
    magnifier.add(hairTag, fiberTag);
  }
  g.add(magnifier);

  g.userData = {
    headGroup, tweezersGroup, hairStrand, magnifier, fiberCore, fiberPhotons,
    update(t = 0, progress = 1) {
      const k = easeOutBack(clamp(progress));
      const bob = Math.sin(t * 3.1) * 0.03;
      tweezersGroup.position.y = 2.38 + bob + (1 - clamp(progress)) * 0.30;
      magnifier.scale.setScalar(Math.max(0.001, k));
      hairStrand.userData.setProgress(clamp(progress * 1.15));
      fiberPhotons.userData.update(t, clamp(progress), clamp(progress));
    },
  };
  g.userData.update(0, 1);
  return g;
}

// Rig de ancla + cadena que se estiba físicamente en el escobén/proa del barco (NUNCA .visible = false)
export function stowedAnchorRig(shipGroup, {
  scene = null,
  hawseOffset = [2.25, 0.48, 1.12],
  dropPos = [0, 1.0, 0],
  scale = 0.85,
  chainCount = 52,
  color = '#2b3036',
} = {}) {
  const rigGroup = new THREE.Group();
  const hawseMarker = new THREE.Object3D();
  hawseMarker.position.set(...hawseOffset);
  shipGroup.add(hawseMarker);

  // Escobén físico visible en la proa del casco
  const hawseCollar = mesh(new THREE.TorusGeometry(0.24, 0.075, 10, 22), toon('#1f242b'));
  hawseCollar.position.set(...hawseOffset);
  hawseCollar.rotation.y = Math.PI * 0.08;
  const hawseCore = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.16, 14), toon('#0c1016'));
  hawseCore.rotation.x = Math.PI / 2;
  hawseCore.position.set(hawseOffset[0], hawseOffset[1], hawseOffset[2] - 0.04);
  shipGroup.add(hawseCollar, hawseCore);

  // Ancla de almirantazgo completa
  const anchorGroup = new THREE.Group();
  const ironMat = toon(color);
  const ARC = Math.PI * 0.62, ARM_R = 0.85, ARM_C = 0.95;
  const arms = mesh(new THREE.TorusGeometry(ARM_R, 0.10, 8, 28, ARC), ironMat);
  arms.rotation.z = -Math.PI / 2 - ARC / 2;
  arms.position.y = ARM_C;
  const crown = mesh(new THREE.SphereGeometry(0.17, 12, 10), ironMat);
  crown.position.y = ARM_C - ARM_R;
  const shank = mesh(new THREE.CylinderGeometry(0.10, 0.12, 2.5, 10), ironMat);
  shank.position.y = 1.3;
  const stock = mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.9, 8), ironMat);
  stock.rotation.x = Math.PI / 2;
  stock.position.y = 2.2;
  const stockEndA = mesh(new THREE.SphereGeometry(0.12, 10, 8), ironMat);
  stockEndA.position.set(0, 2.2, 0.95);
  const stockEndB = stockEndA.clone();
  stockEndB.position.z = -0.95;
  const shackle = mesh(new THREE.TorusGeometry(0.20, 0.055, 8, 22), ironMat);
  shackle.position.y = 2.75;
  anchorGroup.add(arms, crown, shank, stock, stockEndA, stockEndB, shackle);
  [-1, 1].forEach((s) => {
    const half = ARC / 2;
    const tip = new THREE.Vector2(s * ARM_R * Math.sin(half), ARM_C - ARM_R * Math.cos(half));
    const tan = new THREE.Vector2(s * Math.cos(half), Math.sin(half));
    const fluke = mesh(new THREE.ConeGeometry(0.27, 0.62, 4), toon('#3a4048'));
    fluke.scale.z = 0.35;
    fluke.position.set(tip.x + tan.x * 0.18, tip.y + tan.y * 0.18, 0);
    fluke.rotation.z = -s * Math.atan2(Math.abs(tan.x), tan.y);
    anchorGroup.add(fluke);
  });
  anchorGroup.scale.setScalar(scale);
  rigGroup.add(anchorGroup);

  const chainLinks = [];
  const linkGeo = new THREE.TorusGeometry(0.10, 0.032, 6, 12);
  const linkMat = toon('#3a3f47');
  for (let i = 0; i < chainCount; i++) {
    const l = mesh(linkGeo, linkMat, { cast: false });
    rigGroup.add(l);
    chainLinks.push(l);
  }

  const targetParent = scene || shipGroup.parent;
  if (targetParent) targetParent.add(rigGroup);

  const _hawseWorld = new THREE.Vector3();
  const _shackleOff = new THREE.Vector3();
  const _shackleWorld = new THREE.Vector3();
  const _stowPos = new THREE.Vector3();
  const _dropVec = new THREE.Vector3(...dropPos);
  const _Y = new THREE.Vector3(0, 1, 0), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();
  const _dir = new THREE.Vector3();

  rigGroup.userData = {
    anchorGroup, hawseMarker, hawseCollar, chainLinks,
    update(lift = 1, hitPosOrT = null, maybeT = 0) {
      let t = maybeT;
      if (Array.isArray(hitPosOrT)) _dropVec.set(hitPosOrT[0], hitPosOrT[1], hitPosOrT[2]);
      else if (hitPosOrT && hitPosOrT.isVector3) _dropVec.copy(hitPosOrT);
      else if (typeof hitPosOrT === 'number') t = hitPosOrT;

      const k = smooth(clamp(lift));
      shipGroup.updateMatrixWorld(true);
      hawseMarker.getWorldPosition(_hawseWorld);

      // En estiba (k -> 1), el ancla queda pegada al casco y el grillete encaja en el escobén
      const rotZ = lerp(0.08, -0.22, k) + Math.sin(t * 2.5) * 0.05 * (1 - k);
      const rotX = lerp(0.0, 0.14, k);
      anchorGroup.rotation.set(rotX, 0, rotZ);
      anchorGroup.visible = true; // Cero desapariciones: SIEMPRE visible

      _shackleOff.set(0, 2.75 * scale, 0).applyEuler(anchorGroup.rotation);
      _stowPos.copy(_hawseWorld).sub(_shackleOff).add(new THREE.Vector3(0.04, -0.06, 0.16 * scale));
      anchorGroup.position.copy(_dropVec).lerp(_stowPos, k);

      _shackleWorld.copy(anchorGroup.position).add(_shackleOff);
      _dir.copy(_hawseWorld).sub(_shackleWorld);
      const len = _dir.length();
      if (len > 1e-4) {
        _dir.normalize();
        _qa.setFromUnitVectors(_Y, _dir);
      }
      const spacing = len / chainLinks.length;
      const linkScaleY = clamp(spacing / 0.15, 1.0, 3.2);
      chainLinks.forEach((l, i) => {
        if (k > 0.96 && len < 0.25) {
          l.visible = i < 2;
          if (!l.visible) return;
          l.position.copy(_hawseWorld).lerp(_shackleWorld, i * 0.45);
          l.scale.set(1, 1, 1);
        } else {
          l.visible = len > 0.06;
          if (!l.visible) return;
          l.position.copy(_shackleWorld).addScaledVector(_dir, len * (i + 0.5) / chainLinks.length);
          l.scale.set(1, linkScaleY, 1);
        }
        _qb.setFromAxisAngle(_Y, i % 2 ? Math.PI / 2 : 0);
        l.quaternion.copy(_qa).multiply(_qb);
      });
    },
  };
  rigGroup.userData.update(1, 0);
  return rigGroup;
}

// Columna abisal con estratos luminosos (0 m, -1000 m, -2000 m, -4000 m), regla vertical y gradiente marino
export function abyssalDepthScale({
  surfaceY = 22,
  floorY = 0,
  maxDepth = 4000,
  depths = [0, 1000, 2000, 4000],
  x = -7.8,
  z = -1.5,
  width = 44,
  curtainZ = -18,
  curtainWidth = 140,
} = {}) {
  const g = new THREE.Group();
  const hTotal = Math.max(2, surfaceY - floorY);

  // 1. Gradiente vertical marino de superficie iluminada a abismo oscuro
  const curtainGeo = new THREE.PlaneGeometry(curtainWidth, hTotal, 1, 24);
  const posAttr = curtainGeo.attributes.position;
  const cols = new Float32Array(posAttr.count * 3);
  const c0 = new THREE.Color('#2895d4'), c1 = new THREE.Color('#145a96'), c2 = new THREE.Color('#092c56'), c3 = new THREE.Color('#030f22');
  for (let i = 0; i < posAttr.count; i++) {
    const u = clamp((posAttr.getY(i) + hTotal / 2) / hTotal); // 0 = fondo, 1 = superficie
    const col = u > 0.72 ? c1.clone().lerp(c0, (u - 0.72) / 0.28)
      : u > 0.35 ? c2.clone().lerp(c1, (u - 0.35) / 0.37)
      : c3.clone().lerp(c2, u / 0.35);
    cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b;
  }
  curtainGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const curtainMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false, fog: false });
  const curtain = new THREE.Mesh(curtainGeo, curtainMat);
  curtain.position.set(0, floorY + hTotal / 2, curtainZ);
  g.add(curtain);

  // 2. Regla vertical kilométrica + marcas menores
  const spineMat = new THREE.MeshBasicMaterial({ color: '#78e8ff', transparent: true, opacity: 0.85, fog: false });
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, hTotal, 10), spineMat);
  spine.position.set(x, floorY + hTotal / 2, z);
  g.add(spine);

  for (let d = 0; d <= maxDepth; d += 500) {
    const y = lerp(surfaceY, floorY, d / maxDepth);
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.06), spineMat);
    tick.position.set(x + 0.22, y, z);
    g.add(tick);
  }

  // 3. Estratos luminosos y letreros legibles de cota (0 m, -1000 m, -2000 m, -4000 m)
  const badges = [];
  const bands = [];
  const palette = ['#64f5ff', '#38b6ff', '#2b7fff', '#00f5d4'];
  depths.forEach((d, idx) => {
    const y = lerp(surfaceY, floorY, clamp(d / maxDepth));
    const colHex = palette[Math.min(idx, palette.length - 1)];
    const bandMat = new THREE.MeshBasicMaterial({ color: colHex, transparent: true, opacity: 0.52, side: THREE.DoubleSide, depthWrite: false, fog: false });
    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.08), bandMat);
    ribbon.position.set(0, y, z - 0.8);
    const majorTick = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.11, 0.11), bandMat);
    majorTick.position.set(x + 0.55, y, z);
    const lbl = d === 0 ? '0 m' : `-${d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} m`;
    const badge = _canvasSign(lbl, { w: 420, h: 140, bg: '#071324', border: colHex, color: '#ffffff', font: "800 70px Mono, 'Arial Black', sans-serif", size: [2.6, 0.86] });
    badge.position.set(x - 1.55, Math.max(floorY + 2.05, y), z + 0.35);
    g.add(ribbon, majorTick, badge);
    badges.push({ badge, baseY: y });
    bands.push({ bandMat });
  });

  g.userData = {
    curtain, spine, badges, bands,
    update(t = 0, opacity = 1, camera = null) {
      const op = clamp(opacity);
      g.visible = op > 0.01;
      if (!g.visible) return;
      curtainMat.opacity = 0.72 * op;
      spineMat.opacity = 0.85 * op;
      bands.forEach((b, i) => {
        const pulse = 0.85 + 0.15 * Math.sin(t * 2.4 + i);
        b.bandMat.opacity = 0.52 * op * pulse;
      });
      if (camera) {
        badges.forEach((b) => {
          b.badge.rotation.y = Math.atan2(camera.position.x - b.badge.position.x, camera.position.z - b.badge.position.z) * 0.45;
        });
      }
    },
  };
  return g;
}

// ── 6. TUBOS QUE SE DIBUJAN Y CUENTAS DE FLUJO ─────────────────────────────────────────────────────────────────
export const polyCurve = (points, tension = 0.06) => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', tension);
export function drawTube(curve, radius, material, segments = 160) {
  const radial = 10, m = mesh(new THREE.TubeGeometry(curve, segments, radius, radial, false), material);
  m.userData.setProgress = (k) => {
    m.geometry.setDrawRange(0, Math.floor(clamp(k) * segments) * radial * 6);
    m.visible = k > 0.001;
  };
  return m;
}
export function flowBeads(curve, { count = 12, radius = 0.07, color = PALETTE.accentGlow, speed = 0.25 } = {}) {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, fog: false });
  for (let i = 0; i < count; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), mat);
    b.renderOrder = 10; g.add(b);
  }
  g.userData.update = (t, upTo = 1, opacity = 1) => {
    mat.opacity = opacity; g.visible = opacity > 0.01;
    g.children.forEach((b, i) => {
      const u = ((i / count + t * speed) % 1 + 1) % 1;
      b.visible = u <= upTo;
      if (b.visible) b.position.copy(curve.getPointAt(u));
    });
  };
  return g;
}

// ── 7. CÁMARA CONTINUA POR POSES Y TEMBLOR ─────────────────────────────────────────────────────────────────────
export function cameraAt(camera, poses, t) {
  let i = 0;
  while (i < poses.length - 2 && t > poses[i + 1].t) i++;
  const a = poses[i], b = poses[Math.min(i + 1, poses.length - 1)], k = smooth(ramp(t, a.t, b.t));
  const pos = new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos), k);
  const look = new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look), k);
  const edge = Math.sin(Math.PI * ramp(t, poses[0].t, poses[poses.length - 1].t)); // deriva = 0 en ambos extremos para loop perfecto
  pos.x += Math.sin(t * 0.7) * 0.12 * edge;
  pos.y += Math.sin(t * 0.53 + 1) * 0.07 * edge;
  camera.fov = lerp(a.fov ?? 34, b.fov ?? 34, k);
  camera.updateProjectionMatrix();
  camera.position.copy(pos);
  camera.lookAt(look);
  camera.rotation.z = lerp(a.roll ?? 0, b.roll ?? 0, k);
}

export function shake(camera, k, amp = 0.5, dur = 0.9) {
  if (k < 0 || k > dur) return;
  // arranca en 0 (sin salto en k = 0 → el fotograma 0 empalma con el final del loop)
  const a = amp * (1 - k / dur) ** 2 * Math.min(1, k / 0.04);
  camera.position.x += Math.sin(k * 71) * a;
  camera.position.y += Math.sin(k * 93 + 1) * a * 0.7;
  camera.rotation.z += Math.sin(k * 57) * a * 0.04;
}

// ── 8. SUBTÍTULOS (FRASES CLAVE ARRIBA + PALABRA A PALABRA SINCRONIZADO) ──────────────────────────────────────
export function captions(el, cues, t) {
  if (!el) return;
  const cue = cues.find((c) => t >= c.from && t < c.to);
  if (!cue) { el.innerHTML = ''; el.dataset.k = ''; return; }
  const key = cue.from + cue.text;
  if (el.dataset.k !== key) {
    el.dataset.k = key;
    el.className = 'cap ' + (cue.color || '');
    el.innerHTML = cue.text.split('\n').map((line) => '<div>' + line.split(' ').map((w) => `<span>${w}</span>`).join(' ') + '</div>').join('');
  }
  const out = ramp(t, cue.to - 0.22, cue.to);
  el.querySelectorAll('span').forEach((s, i) => {
    const k = smooth(ramp(t, cue.from + i * 0.10, cue.from + i * 0.10 + 0.15));
    s.style.opacity = k * (1 - out);
    s.style.transform = `translateY(${(1 - k) * 18}px)`;
    s.style.filter = out > 0 ? `blur(${out * 6}px)` : 'none';
  });
}

// Subtítulos automáticos palabra a palabra desde timeline.json (estilo Reels / TikTok)
export function subtitulosTimeline(el, tl, t, { palabrasPorBloque = 3, peligros = [], acentos = [] } = {}) {
  if (!el || !tl || !tl.palabras || !tl.palabras.length) return;
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ]/g, '');
  const setPeligro = new Set(peligros.map(norm));
  const setAcento = new Set(acentos.map(norm));
  const bloques = [];
  for (let i = 0; i < tl.palabras.length; i += palabrasPorBloque) {
    const trozo = tl.palabras.slice(i, i + palabrasPorBloque);
    bloques.push({
      from: trozo[0].s,
      to: trozo[trozo.length - 1].e + 0.08,
      words: trozo,
    });
  }
  const b = bloques.find((bl) => t >= bl.from - 0.04 && t <= bl.to);
  if (!b) { el.innerHTML = ''; return; }
  el.innerHTML = '<div>' + b.words.map((w) => {
    const activa = t >= w.s - 0.02 && t <= w.e + 0.12;
    const kw = norm(w.w); // peligros / acentos se comparan normalizados (sin tildes ni puntuación)
    // Palabra mostrada sin puntuación final (nada de «galvanizado,» «apaga.» «fotones:» dentro de la píldora)
    const cleanW = String(w.w).replace(/[.,;:…!?]+$/g, '').replace(/^[¿¡]+/g, '');
    const cls = setPeligro.has(kw) ? 'kw-danger' : setAcento.has(kw) ? 'kw-accent' : '';
    const sc = activa ? 1.08 : 0.96;
    const op = t >= w.s - 0.05 ? 1 : 0.38;
    return `<span class="${cls}" style="opacity:${op};transform:scale(${sc})">${cleanW}</span>`;
  }).join(' ') + '</div>';
}

function _registrarPanelUso(from, to) {
  if (typeof window === 'undefined') return;
  const dudas = (window.__dudas = window.__dudas || []);
  const intervals = (window.__panelIntervals = window.__panelIntervals || []);
  const key = `${Number(from).toFixed(2)}-${Number(to).toFixed(2)}`;
  if (!intervals.some((x) => x.key === key)) {
    intervals.push({ key, from: Number(from), to: Number(to) });
    if (intervals.length > 1 && !dudas.some((d) => d.includes('#panel se activa más de 1 vez'))) {
      dudas.push(`#panel se activa más de 1 vez (${intervals.length} apariciones; máx. recomendado: 1 breve ≤ 15 %)`);
    }
    const dur = Number(window.__dur || (window.META && window.META.duration) || 45);
    const total = intervals.reduce((acc, it) => acc + Math.max(0, it.to - it.from), 0);
    const pct = (total / Math.max(1, dur)) * 100;
    if (pct > 15 && !dudas.some((d) => d.includes('#panel supera el 15 %'))) {
      dudas.push(`#panel supera el 15 % del vídeo (${pct.toFixed(1)} % > 15 %): reduce su duración o usa indicadores 3D`);
    }
  }
}

export function distancePanel(el, t, { from, to, travelStart, travelEnd, maxKm = 60, label = 'FIBRA ÓPTICA' }) {
  _registrarPanelUso(from, to);
  if (!el) return;
  const kVis = smooth(ramp(t, from, from + 0.25)) * (1 - ramp(t, to - 0.25, to));
  el.style.opacity = kVis;
  el.style.transform = `scale(${0.94 + 0.06 * kVis})`;
  if (kVis <= 0.01) { el.innerHTML = ''; return; }
  const prog = smooth(ramp(t, travelStart, travelEnd));
  const km = Math.round(lerp(0, maxKm, prog));
  const sig = Math.round(Math.pow(1 - prog, 1.45) * 100);
  const isDead = km >= maxKm - 1;
  const col = isDead ? '#df3b30' : (sig < 40 ? '#ff9f1c' : '#00f5d4');
  const W = 420, H = 92;
  const barX = 24, barW = 372, barFill = Math.max(10, barW * prog);
  const statusTxt = isDead ? '0 % · APAGADA' : `${sig} % LÁSER`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
    + `<text x="24" y="34" fill="#9fb4d4" font-family="Mono" font-size="14">${label}</text>`
    + `<text x="24" y="60" fill="#fff6e0" font-family="Cap" font-size="25">${km}/${maxKm} KM</text>`
    + `<text x="396" y="59" text-anchor="end" fill="${col}" font-family="Cap" font-size="20">${statusTxt}</text>`
    + `<rect x="${barX}" y="70" width="${barW}" height="10" rx="5" fill="#1b2234"/>`
    + `<rect x="${barX}" y="70" width="${barFill}" height="10" rx="5" fill="${col}"/>`
    + `<circle cx="${barX + barFill}" cy="75" r="6" fill="#ffffff" stroke="${col}" stroke-width="2.5"/>`
    + `</svg>`;
}

// ── 9. TRANSICIÓN DÍA / NOCHE / ENTORNO Y PANEL 2D HUD COMPACTO ────────────────────────────────────────────────
export function setTimeOfDay(scene, world, k, P = PALETTE) {
  const mix = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(k));
  const top = mix(P.skyTop, '#141c35'), bottom = mix(P.skyBottom, '#3b4262');
  const g = scene.background.image.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#' + top.getHexString()); gr.addColorStop(0.55, '#' + bottom.getHexString()); gr.addColorStop(1, '#' + bottom.getHexString());
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512); scene.background.needsUpdate = true;
  scene.fog.color.copy(bottom);
  world.sun.intensity = lerp(2.3, 0.45, clamp(k)); world.sun.color.copy(mix('#fff3da', '#8fa8ff'));
  world.hemi.intensity = lerp(1.25, 0.65, clamp(k)); world.hemi.color.copy(mix('#ffffff', '#6d7fb8'));
}

export function pulsePanel(el, t, { from, to, period = 1, label = '', value = null, color = '#e6ff5a' }) {
  _registrarPanelUso(from, to);
  if (!el) return;
  const k = smooth(ramp(t, from, from + 0.25)) * (1 - ramp(t, to - 0.25, to));
  el.style.opacity = k; el.style.transform = `scale(${0.94 + 0.06 * k})`;
  if (k <= 0.01) { el.innerHTML = ''; return; }
  const W = 420, H = 92;
  const phase = ((t - from) / Math.max(0.1, period)) % 1;
  const pulse = 0.55 + 0.45 * Math.pow(Math.max(0, Math.sin(phase * Math.PI)), 2);
  let bars = '';
  for (let i = 0; i < 5; i++) {
    const hBar = 12 + Math.round(28 * (0.35 + 0.65 * Math.abs(Math.sin(phase * Math.PI * 2 + i * 0.7))));
    bars += `<rect x="${320 + i * 14}" y="${66 - hBar}" width="9" height="${hBar}" rx="4" fill="${color}" opacity="${(0.45 + 0.55 * pulse).toFixed(2)}"/>`;
  }
  const valTxt = value != null ? `<text x="58" y="69" fill="${color}" font-family="Cap" font-size="25">${value}</text>` : '';
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
    + `<circle cx="32" cy="46" r="${(7 + 3 * pulse).toFixed(1)}" fill="${color}" opacity="0.28"/>`
    + `<circle cx="32" cy="46" r="6" fill="${color}"/>`
    + `<text x="58" y="34" fill="#9fb4d4" font-family="Mono" font-size="14">${label}</text>${valTxt}${bars}</svg>`;
}

// ── 10. EXPLOSIÓN TOON (DESTELLO, ONDA, FUEGO, HUMO Y ESCOMBROS) ──────────────────────────────────────────────
// alto (< 1) achata la columna de fuego/humo para que nunca tape los rótulos superiores
// humo (< 1) acorta la vida del humo para que no suba detrás de los rótulos siguientes
export function explosion(scene, at = [0, 0, 0], size = 1, seed = 21, { alto = 1, humo = 1 } = {}) {
  const g = new THREE.Group(), r = rng(seed); g.position.set(...at); scene.add(g);
  const bm = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, fog: false });
  const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), bm('#ffffff')); g.add(flash);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), bm('#ffffff')); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  const fire = ['#fff1a8', '#ffc93c', '#ff8a1f', '#e8452c', '#ffc93c', '#ff8a1f', '#e8452c', '#ff8a1f'].map((c, i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), bm(c));
    m.userData = { p: [(r() - 0.5) * 3.2, r() * 2.6 + i * 0.25, (r() - 0.5) * 2], s: 1.1 + r() * 1.5, d: i * 0.035 };
    g.add(m); return m;
  });
  const smoke = [...Array(9)].map((_, i) => {
    const m = mesh(new THREE.IcosahedronGeometry(1, 1), toon('#6d6d76'), { cast: false, receive: false });
    m.userData = { p: [(r() - 0.5) * 5, 2.2 + r() * 2.5, -1 - r() * 2], s: 0.8 + r() * 0.9, d: 0.55 + i * 0.09 };
    g.add(m); return m;
  });
  const debris = [...Array(16)].map(() => {
    const m = mesh(new THREE.BoxGeometry(0.2 + r() * 0.5, 0.12 + r() * 0.3, 0.2 + r() * 0.4), toon(r() > 0.5 ? '#f4f4f1' : '#2f3238'));
    const a = r() * Math.PI * 2, sp = 5 + r() * 9;
    m.userData = { v: [Math.cos(a) * sp, 7 + r() * 12, Math.sin(a) * sp * 0.6], w: [r() * 9, r() * 9, r() * 9] };
    g.add(m); return m;
  });
  g.userData.update = (k) => {
    g.visible = k >= 0 && k < 6; if (!g.visible) return;
    flash.scale.setScalar(size * 3.6 * ramp(k, 0, 0.08)); flash.material.opacity = 1 - ramp(k, 0.05, 0.28); flash.visible = k < 0.3;
    ring.scale.setScalar(size * (1 + 15 * (1 - (1 - ramp(k, 0, 0.7)) ** 2))); ring.material.opacity = 0.9 * (1 - ramp(k, 0.15, 0.7)); ring.visible = k < 0.7;
    fire.forEach((m) => {
      const u = k - m.userData.d, grow = 1 - (1 - ramp(u, 0, 0.35)) ** 3, die = 1 - smooth(ramp(u, 0.9, 2.1));
      m.visible = u > 0 && die > 0.01;
      m.scale.setScalar(size * m.userData.s * grow * die);
      m.position.set(m.userData.p[0] * size * grow, (m.userData.p[1] + u * 1.4) * size * grow * alto, m.userData.p[2] * size);
      m.rotation.y = u;
    });
    smoke.forEach((m) => {
      const u = k - m.userData.d, grow = 1 - (1 - ramp(u, 0, 0.8)) ** 2, die = 1 - smooth(ramp(u, 2.6 * humo, 5.5 * humo));
      m.visible = u > 0 && die > 0.01;
      m.scale.setScalar(size * m.userData.s * grow * die);
      m.position.set(m.userData.p[0] * size * grow, (m.userData.p[1] + u * 2.2) * size * alto, m.userData.p[2] * size);
    });
    debris.forEach((m) => {
      const v = m.userData.v, y = v[1] * k - 11 * k * k;
      m.visible = k > 0.02 && y > -1.5;
      m.position.set(v[0] * k * size, y * size * alto, v[2] * k * size);
      m.rotation.set(m.userData.w[0] * k, m.userData.w[1] * k, m.userData.w[2] * k);
    });
  };
  g.userData.update(-1);
  return g;
}

// ── 11. RENDERIZADOR TOON DE DOBLE PASE (PROFUNDIDAD + NORMALES PARA CONTORNO DE TINTA) ───────────────────────
export function inkRenderer(canvas, w, h, ink = PALETTE.ink) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const rt = new THREE.WebGLRenderTarget(w, h, { samples: 4, type: THREE.HalfFloatType });
  rt.depthTexture = new THREE.DepthTexture(w, h);
  const rtN = new THREE.WebGLRenderTarget(w, h, { samples: 4 }), normalMat = new THREE.MeshNormalMaterial();
  const quadScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, tNormal: { value: rtN.texture },
      px: { value: new THREE.Vector2(1 / w, 1 / h) }, near: { value: 0.1 }, far: { value: 300 },
      ink: { value: new THREE.Color(ink) }, width: { value: 1.4 }
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      varying vec2 vUv; uniform sampler2D tColor, tDepth, tNormal; uniform vec2 px; uniform float near, far, width; uniform vec3 ink;
      float lin(vec2 uv){ float z = texture2D(tDepth, uv).x * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }
      void main(){
        vec3 col = texture2D(tColor, vUv).rgb; float d = lin(vUv); vec2 o = px * width;
        float lap = lin(vUv + vec2(o.x, 0.0)) + lin(vUv - vec2(o.x, 0.0)) + lin(vUv + vec2(0.0, o.y)) + lin(vUv - vec2(0.0, o.y)) - 4.0 * d;
        float edge = smoothstep(0.012, 0.035, abs(lap) / d);
        vec3 n = texture2D(tNormal, vUv).rgb;
        float nd = distance(n, texture2D(tNormal, vUv + vec2(o.x, 0.0)).rgb) + distance(n, texture2D(tNormal, vUv - vec2(o.x, 0.0)).rgb)
                 + distance(n, texture2D(tNormal, vUv + vec2(0.0, o.y)).rgb) + distance(n, texture2D(tNormal, vUv - vec2(0.0, o.y)).rgb);
        edge = max(edge, smoothstep(0.25, 0.7, nd));
        edge *= 1.0 - smoothstep(30.0, 75.0, d);
        gl_FragColor = vec4(mix(col, ink, edge * 0.85), 1.0);
        #include <colorspace_fragment>
      }`,
    depthTest: false, depthWrite: false,
  });
  quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  return {
    renderer,
    render(scene, camera) {
      mat.uniforms.near.value = camera.near; mat.uniforms.far.value = camera.far;
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      const bg = scene.background, fog = scene.fog; scene.background = null; scene.fog = null; scene.overrideMaterial = normalMat;
      renderer.setRenderTarget(rtN); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
      scene.overrideMaterial = null; scene.background = bg; scene.fog = fog;
      renderer.setRenderTarget(null); renderer.render(quadScene, quadCam);
    }
  };
}
