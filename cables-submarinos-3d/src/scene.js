import * as THREE from 'three';
import {
  PALETTE as P, toon, mesh, buildWorld, cloud, tree, character,
  brickTexture, sandTexture, canvasTex, polyCurve, drawTube, flowBeads,
  cameraAt, shake, captions, subtitulosTimeline, setTimeOfDay, pulsePanel,
  explosion, inkRenderer, crearAnclas, clamp, lerp, smooth, ramp, easeOutBack, rng
} from '../../.agents/skills/fusion/motor/kit3d.js';

// ── 1. INICIALIZAR ANCLAS DE VOZ Y METADATOS ───────────────────────────────────────────────────────────────────
const { tl, dur, en, fin, debe, sonido } = crearAnclas();
export const META = { width: 1080, height: 1920, fps: 30, duration: dur };

// Anclas verificadas contra voz/timeline.json (0 anclas perdidas)
const A = {
  noventa: debe(en('noventa'), 'noventa'),
  internet: debe(en('internet'), 'internet'),
  billones: debe(en('billones'), 'billones'),
  satelite: debe(en('satélite'), 'satelite'),
  hilo: debe(en('hilo'), 'hilo'),
  construyamoslo: debe(en('Construyámoslo'), 'Construyamoslo'),
  primero: debe(en('Primero'), 'Primero'),
  fibra: debe(en('fibra'), 'fibra'),
  cabello: debe(en('cabello'), 'cabello'),
  laser: debe(en('láser'), 'laser'),
  pero1: debe(en('Pero'), 'Pero 1'),
  sesenta: debe(en('sesenta'), 'sesenta'),
  absorbe: debe(en('absorbe'), 'absorbe'),
  apaga: debe(en('apaga'), 'apaga'),
  insertas: debe(en('insertas'), 'insertas'),
  capsulas: debe(en('cápsulas'), 'capsulas'),
  erbio: debe(en('erbio'), 'erbio'),
  fotones: debe(en('fotones'), 'fotones'),
  repetidores: debe(en('repetidores'), 'repetidores'),
  problema: debe(en('problema'), 'problema'),
  voltios: debe(en('voltios'), 'voltios'),
  oceano: debe(en('océano'), 'oceano'),
  cortocircuito: debe(en('cortocircuito'), 'cortocircuito'),
  envuelves: debe(en('envuelves'), 'envuelves'),
  cobre: debe(en('cobre'), 'cobre'),
  polietileno: debe(en('polietileno'), 'polietileno'),
  soloQue: debe(en('Solo'), 'Solo que'),
  rojo: debe(en('Rojo'), 'Mar Rojo'),
  baltico: debe(en('Báltico'), 'Baltico'),
  barco: debe(en('barco'), 'barco'),
  ancla: debe(en('ancla'), 'ancla'),
  parte: debe(en('parte'), 'parte'),
  congela: debe(en('congela'), 'congela'),
  bolsa: debe(en('bolsa'), 'bolsa'),
  trenzas: debe(en('trenzas'), 'trenzas'),
  acero: debe(en('acero'), 'acero'),
  blindaje: debe(en('blindaje'), 'blindaje'),
  robot: debe(en('robot'), 'robot'),
  entierra: debe(en('entierra'), 'entierra'),
  guerra: debe(en('guerra'), 'guerra'),
  fondo: debe(en('fondo'), 'fondo'),
  viaja: debe(en('viaja', 2), 'viaja'),
};

// ── 2. MAPA DE SONIDO COMPLETO (MAGNIFIC AI SFX + BIBLIOTECA VIEGAS · < 2 s ENTRE EFECTOS) ─────────────────────
function registrarMapaSonido() {
  // Hook: 5 golpes en 4 segundos
  sonido(0.02, 'explosion', 1.15, { archivo: 'voz/sfx/ancla-corte.wav' });
  sonido(0.18, 'chispa', 0.95);
  sonido(0.55, 'whoosh', 0.90);
  sonido(1.10, 'alarma', 0.80);
  sonido(1.52, 'riser', 0.85);
  sonido(1.85, 'thud', 0.95);
  sonido(2.25, 'whoosh', 0.90);
  sonido(2.95, 'dinero', 0.85);
  sonido(3.65, 'swoosh', 0.80);
  // Satélite descartado y bajada al mar
  sonido(A.satelite - 0.1, 'feedback', 0.90);
  sonido(A.hilo - 0.1, 'agua', 0.85);
  sonido(A.construyamoslo - 0.15, 'whoosh', 0.95);
  sonido(A.construyamoslo + 0.35, 'thud', 0.85);
  // Eslabón 1: Fibra de vidrio y láser → Pero 1 (se apaga a 60 km) → Repetidores con erbio
  sonido(A.primero - 0.1, 'whoosh', 0.80);
  sonido(A.fibra, 'pop', 0.85);
  sonido(A.cabello, 'click', 0.80);
  sonido(A.laser - 0.2, 'swoosh', 1.0, { archivo: 'voz/sfx/laser-fibra.wav' });
  sonido(A.pero1 - 0.05, 'thud', 1.0);
  sonido(A.sesenta, 'click', 0.75);
  sonido(A.absorbe, 'whoosh', 0.75);
  sonido(A.apaga, 'feedback', 0.95);
  sonido(A.insertas, 'whoosh', 0.85);
  sonido(A.capsulas, 'pop', 0.90);
  sonido(A.erbio, 'chispa', 0.80);
  sonido(A.fotones - 0.1, 'swoosh', 0.95, { archivo: 'voz/sfx/laser-fibra.wav' });
  sonido(A.repetidores, 'notificacion', 0.95);
  // Eslabón 2: 10.000 V y cortocircuito → Cobre y polietileno
  sonido(A.problema - 0.05, 'thud', 0.95);
  sonido(A.voltios - 0.1, 'chispa', 0.95);
  sonido(A.oceano, 'agua', 0.80);
  sonido(A.cortocircuito - 0.1, 'explosion', 1.05);
  sonido(A.cortocircuito + 0.15, 'chispa', 1.0);
  sonido(A.envuelves, 'whoosh', 0.85);
  sonido(A.cobre, 'click', 0.90);
  sonido(A.polietileno, 'pop', 0.90);
  // Eslabón 3: Mar Rojo / Báltico, ancla y bolsa → Blindaje de acero y ROV
  sonido(A.soloQue - 0.05, 'alarma', 0.95);
  sonido(A.rojo, 'whoosh', 0.85);
  sonido(A.baltico, 'click', 0.80);
  sonido(A.barco - 0.1, 'motor', 0.85);
  sonido(A.ancla - 0.1, 'riser', 0.90);
  sonido(A.parte - 0.05, 'explosion', 1.15, { archivo: 'voz/sfx/ancla-corte.wav' });
  sonido(A.bolsa - 0.1, 'alarma', 0.95);
  sonido(A.trenzas - 0.1, 'whoosh', 0.90);
  sonido(A.acero, 'thud', 0.90);
  sonido(A.blindaje, 'notificacion', 0.90);
  sonido(A.robot - 0.1, 'motor', 1.0, { archivo: 'voz/sfx/rov-submarino.wav' });
  sonido(A.entierra, 'agua', 0.85);
  // Cierre y empalme de loop (sin efectos en el último medio segundo)
  sonido(A.guerra - 0.1, 'whoosh', 0.90);
  sonido(A.fondo, 'swoosh', 0.80);
}
registrarMapaSonido();

// ── 3. ESCENA, CÁMARA, RENDERIZADOR TOON INK Y MUNDO BASE ──────────────────────────────────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, META.width / META.height, 0.1, 300);
const ink = inkRenderer(document.getElementById('gl'), META.width, META.height);
const world = buildWorld(scene);
const rand = rng(42);

// Lecho marino: sedimento abisal frío (gris verdoso) en lugar de arena de desierto + bruma marina
world.ground.material.map = sandTexture('#5d7e86', '#4f6f78', [22, 22], 11);
world.ground.material.needsUpdate = true;
scene.fog.near = 30;
scene.fog.far = 100;
const OCEAN = { ...P, skyTop: '#3a86c8', skyBottom: '#a9dbe6' };

// Nivel del mar: y = 5.0 · las costas (plataformas) están en y = 5.5, SIEMPRE por encima del agua
const SEA_Y = 5.0;
const LAND_Y = 5.5;
const seaSurfaceMat = new THREE.MeshBasicMaterial({
  color: '#1b76b8', transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false
});
const seaSurface = new THREE.Mesh(new THREE.PlaneGeometry(240, 180, 32, 24), seaSurfaceMat);
seaSurface.rotation.x = -Math.PI / 2;
seaSurface.position.y = SEA_Y;
scene.add(seaSurface);

// ── 4. TRES ENTORNOS CON 3 CAPAS DE PROFUNDIDAD (CERCA, MEDIA, LEJOS) ─────────────────────────────────────────
// CAPA LEJANA: nubes e islas montañosas que asoman sobre el mar
const cloudsGroup = new THREE.Group();
[[-22, 22, -55, 4.2], [18, 25, -65, 5.0], [-4, 27, -75, 4.6], [34, 21, -50, 3.8], [-35, 20, -48, 3.5]]
  .forEach(([x, y, z, s]) => cloudsGroup.add(cloud(x, y, z, s)));
scene.add(cloudsGroup);

const mountainMat = toon('#5f7f8f');
const snowMat = toon('#f4f1e6');
[[-32, -42, 14, 18], [28, -48, 16, 22], [-8, -58, 20, 26], [42, -38, 12, 15]].forEach(([x, z, r, h]) => {
  const m = mesh(new THREE.ConeGeometry(r, h, 7), mountainMat);
  m.position.set(x, h * 0.45, z);
  scene.add(m);
  const cap = mesh(new THREE.ConeGeometry(r * 0.36, h * 0.36, 7), snowMat);
  cap.position.set(x, h * 0.78, z);
  scene.add(cap);
});

// Entorno 1 (Izquierda): estación costera de aterrizaje + faro + árboles + contenedores SOBRE el acantilado
const coastLeft = new THREE.Group();
coastLeft.position.set(-13.5, 0, 0);
scene.add(coastLeft);

const cliffLeft = mesh(new THREE.BoxGeometry(9.5, LAND_Y, 9.5), toon('#b9a27a'));
cliffLeft.position.set(-1.7, LAND_Y / 2, -1.0); // cara del acantilado en x = -10.45 (el cable entra por ella)
coastLeft.add(cliffLeft);
const grassLeft = mesh(new THREE.BoxGeometry(9.5, 0.12, 9.5), toon('#7cc4a0'));
grassLeft.position.set(-1.7, LAND_Y + 0.06, -1.0);
coastLeft.add(grassLeft);

const stationHouse = mesh(
  new THREE.BoxGeometry(4.2, 2.8, 3.6),
  toon('#ffffff', { map: brickTexture(P.wall, P.mortar, [3, 2]) })
);
stationHouse.position.set(-1.6, LAND_Y + 1.4, -1.2);
coastLeft.add(stationHouse);
const stationRoof = mesh(new THREE.BoxGeometry(4.6, 0.45, 4.0), toon('#df3b30'));
stationRoof.position.set(-1.6, LAND_Y + 3.02, -1.2);
coastLeft.add(stationRoof);
const stationDoor = mesh(new THREE.BoxGeometry(0.9, 1.5, 0.08), toon('#2a2622'));
stationDoor.position.set(-1.6, LAND_Y + 0.75, 0.62);
coastLeft.add(stationDoor);

const lighthouse = new THREE.Group();
lighthouse.position.set(1.4, LAND_Y, -3.0);
const lhTower = mesh(new THREE.CylinderGeometry(0.45, 0.72, 4.2, 12), toon('#f4f1e6'));
lhTower.position.y = 2.1;
const lhBand = mesh(new THREE.CylinderGeometry(0.56, 0.62, 1.1, 12), toon('#df3b30'));
lhBand.position.y = 2.2;
const lhTop = mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.7, 12), toon('#2a2622'));
lhTop.position.y = 4.45;
const lhBeam = new THREE.Mesh(
  new THREE.ConeGeometry(1.4, 6.0, 16, 1, true),
  new THREE.MeshBasicMaterial({ color: '#fff3a1', transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false })
);
lhBeam.rotation.z = -Math.PI / 2;
lhBeam.position.set(3.0, 0, 0);
const lhBeacon = new THREE.Group();
lhBeacon.position.y = 4.45;
lhBeacon.add(lhBeam);
lighthouse.add(lhTower, lhBand, lhTop, lhBeacon);
coastLeft.add(lighthouse);

coastLeft.add(tree(P, 11).translateX(-4.4).translateY(LAND_Y).translateZ(1.8));
coastLeft.add(tree(P, 19).translateX(-4.6).translateY(LAND_Y).translateZ(-3.8));
['#2fb7f5', '#f4b942', '#df3b30'].forEach((col, i) => {
  const c = mesh(new THREE.BoxGeometry(1.6, 0.8, 0.8), toon(col));
  c.position.set(1.0, LAND_Y + 0.4 + (i === 2 ? 0.8 : 0), 1.4 + (i % 2) * 0.9);
  coastLeft.add(c);
});

// Entorno 3 (Derecha): ciudad financiera / Bolsa SOBRE su plataforma costera
const cityRight = new THREE.Group();
cityRight.position.set(13.5, 0, 0);
scene.add(cityRight);
const cliffRight = mesh(new THREE.BoxGeometry(10.0, LAND_Y, 10), toon('#9aa4ad'));
cliffRight.position.set(1.95, LAND_Y / 2, -1.2); // cara en x = +10.45
cityRight.add(cliffRight);
const plazaRight = mesh(new THREE.BoxGeometry(10.0, 0.12, 10), toon('#c6c9c5'));
plazaRight.position.set(1.95, LAND_Y + 0.06, -1.2);
cityRight.add(plazaRight);

const towers = [
  [0.6, -2.4, 2.0, 5.6, 2.0, '#2d3e50'],
  [2.9, -0.6, 1.9, 4.6, 1.9, '#3d566e'],
  [1.8, -4.6, 2.3, 7.2, 2.3, '#1f2d3d'],
  [4.3, -3.0, 1.7, 3.8, 1.7, '#4a6582'],
  [-0.9, 0.4, 1.4, 2.6, 1.4, '#55718f'],
  [4.6, 0.6, 1.5, 2.9, 1.5, '#2f4760'],
  [-0.4, -5.6, 1.6, 4.4, 1.6, '#3a5370'],
];
const windowTex = canvasTex(256, (g, S) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
    g.fillStyle = (x * 7 + y * 3) % 5 === 0 ? '#ffe9a0' : '#bfe3f2';
    g.fillRect(x * 64 + 14, y * 32 + 8, 36, 16);
  }
}, [1, 2]);
const tickerScreens = [];
towers.forEach(([x, z, w, h, d, col]) => {
  const tw = mesh(new THREE.BoxGeometry(w, h, d), toon(col, { map: windowTex }));
  tw.position.set(x, LAND_Y + h / 2, z);
  cityRight.add(tw);
  const scr = new THREE.Mesh(new THREE.BoxGeometry(w * 1.04, 0.6, d * 1.04), new THREE.MeshBasicMaterial({ color: '#2fb7f5' }));
  scr.position.set(x, LAND_Y + h * 0.72, z);
  cityRight.add(scr);
  tickerScreens.push(scr);
});

// CAPA MEDIA: satélite (tachado con X roja) y boyas en la superficie
const satGroup = new THREE.Group();
satGroup.position.set(0, 14.5, -6.0);
const satBody = mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.6, 12), toon('#d8dde6'));
satBody.rotation.z = Math.PI / 2;
const satPanelL = mesh(new THREE.BoxGeometry(2.8, 0.08, 1.1), toon('#1d6fa5'));
satPanelL.position.x = -2.0;
const satPanelR = mesh(new THREE.BoxGeometry(2.8, 0.08, 1.1), toon('#1d6fa5'));
satPanelR.position.x = 2.0;
const satDish = mesh(new THREE.ConeGeometry(0.65, 0.45, 12), toon('#f4b942'));
satDish.position.y = -0.7;
const satCross = new THREE.Group();
const barMat = new THREE.MeshBasicMaterial({ color: '#df3b30' });
const bar1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.38, 0.38), barMat);
bar1.rotation.z = Math.PI / 4;
const bar2 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.38, 0.38), barMat);
bar2.rotation.z = -Math.PI / 4;
satCross.add(bar1, bar2);
satCross.position.z = 0.9;
satGroup.add(satBody, satPanelL, satPanelR, satDish, satCross);
scene.add(satGroup);

const buoys = [];
[[-7.5, -4.5], [7.2, -4.0], [-3.0, -7.5], [4.5, -8.2]].forEach(([x, z], idx) => {
  const bg = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.7, 10), toon(idx % 2 ? '#df3b30' : '#f4b942'));
  const mast = mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8), toon('#f4f1e6'));
  mast.position.y = 0.7;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffea79' }));
  lamp.position.y = 1.3;
  bg.add(base, mast, lamp);
  bg.position.set(x, SEA_Y, z);
  scene.add(bg);
  buoys.push({ group: bg, phase: idx * 1.4 });
});

// Paisaje submarino reconocible (capa de fondo, z ≤ −5, nunca justo detrás del cable): algas, corales, rocas y peces
const kelps = [];
function kelp(seed, h) {
  const g = new THREE.Group(), r = rng(seed), segs = 7, segH = h / segs, parts = [];
  const stemMat = toon('#3d8a5a'), leafA = toon('#5cb87f'), leafB = toon('#4aa36c');
  let parent = g;
  for (let i = 0; i < segs; i++) {
    const seg = new THREE.Group();
    seg.position.y = i === 0 ? 0 : segH;
    parent.add(seg);
    const stem = mesh(new THREE.CylinderGeometry(0.05, 0.065, segH, 6), stemMat);
    stem.position.y = segH / 2;
    const leaf = mesh(new THREE.SphereGeometry(0.32, 8, 6), i % 2 ? leafA : leafB);
    const side = i % 2 ? 1 : -1;
    leaf.scale.set(0.95, 0.26, 0.4);
    leaf.position.set(side * 0.3, segH * 0.6, 0);
    leaf.rotation.z = side * (0.45 + r() * 0.2);
    seg.add(stem, leaf);
    parts.push(seg);
    parent = seg;
  }
  return { g, parts };
}
[[-9.6, -7.0, 4.2], [-8.7, -8.4, 3.4], [-5.4, -9.6, 4.4], [-3.9, -10.8, 3.6], [1.6, -9.8, 4.0], [3.1, -11.2, 4.5],
 [6.4, -8.6, 4.1], [7.7, -9.8, 3.5], [10.0, -7.4, 3.9], [-12.2, -6.2, 3.4], [12.4, -6.6, 3.2]].forEach(([x, z, h], i) => {
  const k = kelp(100 + i, h);
  k.g.position.set(x, 0, z);
  scene.add(k.g);
  kelps.push({ ...k, phase: i * 0.9 });
});

function branchCoral(color, seed) {
  const g = new THREE.Group(), r = rng(seed), mat = toon(color);
  const base = mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.5, 8), mat);
  base.position.y = 0.25;
  g.add(base);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + r() * 0.5, tilt = 0.35 + r() * 0.35, len = 0.55 + r() * 0.45;
    const b = mesh(new THREE.CylinderGeometry(0.06, 0.09, len, 7), mat);
    const dir = new THREE.Vector3(Math.cos(a) * Math.sin(tilt), Math.cos(tilt), Math.sin(a) * Math.sin(tilt));
    b.position.set(0, 0.45, 0).addScaledVector(dir, len / 2);
    b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const tip = mesh(new THREE.SphereGeometry(0.1, 8, 6), mat);
    tip.position.set(0, 0.45, 0).addScaledVector(dir, len);
    g.add(b, tip);
  }
  return g;
}
function brainCoral(color) {
  const m = mesh(new THREE.SphereGeometry(0.55, 14, 10), toon(color));
  m.scale.set(1, 0.62, 1);
  m.position.y = 0.18;
  const g = new THREE.Group();
  g.add(m);
  return g;
}
[[-7.0, -5.6, '#ff7a6b', 0], [-4.7, -6.4, '#f6c453', 1], [-1.6, -7.0, '#ff9fb2', 0], [0.9, -6.0, '#a77bd6', 1],
 [3.0, -6.6, '#ff7a6b', 0], [5.7, -5.8, '#f6c453', 0], [8.5, -6.2, '#ff9fb2', 1], [-9.8, -5.2, '#a77bd6', 0]].forEach(([x, z, col, kind], i) => {
  const c = kind ? brainCoral(col) : branchCoral(col, 300 + i);
  c.position.set(x, 0, z);
  c.rotation.y = i * 1.3;
  scene.add(c);
});
const rockMat = toon('#56656f');
[[-6.0, -7.8, 1.1], [-2.7, -8.6, 0.8], [4.3, -8.0, 1.2], [9.3, -5.6, 0.9], [-11.0, -4.8, 0.8], [11.6, -4.2, 1.0], [0.2, -9.2, 0.9]].forEach(([x, z, s], i) => {
  const m = mesh(new THREE.IcosahedronGeometry(1, 0), rockMat);
  m.scale.set(1.25 * s, 0.55 * s, 1.0 * s);
  m.rotation.y = i * 0.8;
  m.position.set(x, 0.2 * s, z);
  scene.add(m);
});

// Banco de peces toon (cuerpo + cola + ojo) que cruza el fondo en ciclo exacto (loop perfecto)
const fishes = [];
for (let i = 0; i < 8; i++) {
  const g = new THREE.Group();
  const col = i % 3 === 0 ? '#2fb7f5' : '#ff9f1c';
  const body = mesh(new THREE.SphereGeometry(0.4, 12, 8), toon(col));
  body.scale.set(1, 0.58, 0.36);
  const tail = mesh(new THREE.ConeGeometry(0.2, 0.34, 3), toon(col));
  tail.rotation.z = -Math.PI / 2;
  tail.position.x = -0.5;
  tail.scale.z = 0.4;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshBasicMaterial({ color: '#1c1a17' }));
  eye.position.set(0.24, 0.06, 0.13);
  g.add(body, tail, eye);
  scene.add(g);
  fishes.push({ g, tail, off: i * 0.113, lane: i % 3, zl: i % 4 });
}

// ── 5. SISTEMA PRINCIPAL: EL CABLE SUBMARINO MULTICAPA, REPETIDORES, BARCO, ANCLA Y ROBOT ROV ─────────────────
// Cable de costa a costa: sale por la cara del acantilado izquierdo (x = -10.45) y entra en el derecho (x = +10.45)
const cablePoints = [
  [-10.8, 4.2, 0],
  [-8.6, 2.2, 0],
  [-5.5, 0.95, 0],
  [-2.5, 0.90, 0],
  [0.0, 0.90, 0],
  [2.5, 0.90, 0],
  [5.5, 0.95, 0],
  [8.6, 2.2, 0],
  [10.8, 4.2, 0],
];
const cableCurve = polyCurve(cablePoints, 0.12);

// Capa 1: hilo central de fibra de vidrio + pulsos de fotones láser
const glassMat = toon('#bff0ff', { emissive: '#1b88b8', emissiveIntensity: 0.35 });
const glassFiberTube = drawTube(cableCurve, 0.08, glassMat, 180);
scene.add(glassFiberTube);

const laserSpeed = Math.round(META.duration * 0.32) / META.duration;
const laserBeads = flowBeads(cableCurve, { count: 22, radius: 0.14, color: '#00f5d4', speed: laserSpeed });
scene.add(laserBeads);

// Capa 2: 3 repetidores ópticos dopados con erbio (EDFA)
const repeaters = [];
[-4.2, 0.0, 4.2].forEach((rx, idx) => {
  const rg = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.45, 14), toon('#f4b942'));
  body.rotation.z = Math.PI / 2;
  const coneL = mesh(new THREE.ConeGeometry(0.36, 0.55, 14), toon('#2a2622'));
  coneL.rotation.z = Math.PI / 2;
  coneL.position.x = -0.95;
  const coneR = mesh(new THREE.ConeGeometry(0.36, 0.55, 14), toon('#2a2622'));
  coneR.rotation.z = -Math.PI / 2;
  coneR.position.x = 0.95;
  const glowRing = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.40, 0.32, 16), new THREE.MeshBasicMaterial({ color: '#00ffaa' }));
  glowRing.rotation.z = Math.PI / 2;
  rg.add(body, coneL, coneR, glowRing);
  rg.position.set(rx, 0.92, 0);
  scene.add(rg);
  repeaters.push({ group: rg, glowRing, baseY: 0.92 });
});

// Capas 3–5: cobre, polietileno y blindaje de acero
const copperTube = drawTube(cableCurve, 0.16, toon('#d97736'), 180);
scene.add(copperTube);
const polyTube = drawTube(cableCurve, 0.23, toon('#2fb7f5'), 180);
scene.add(polyTube);
const armorTube = drawTube(cableCurve, 0.31, toon('#7c8794'), 180);
scene.add(armorTube);
const armorRingsGroup = new THREE.Group();
const armorRings = [];
for (let i = 0; i < 24; i++) {
  const u = 0.12 + (i / 24) * 0.76;
  const pt = cableCurve.getPointAt(u);
  const ring = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.18, 10), toon('#2f353d'));
  ring.rotation.z = Math.PI / 2;
  ring.position.copy(pt);
  armorRingsGroup.add(ring);
  armorRings.push({ mesh: ring, basePos: pt.clone() });
}
scene.add(armorRingsGroup);

// ── 5b. LOS 60 KM: HITOS 3D (0 · 20 · 40 · 60 KM) + PULSO LÁSER QUE SE APAGA ─────────────────────────────────
const K60 = { pop: A.pero1 - 0.18, start: A.pero1 + 0.02, end: A.pero1 + 3.62, out: A.insertas + 0.04 }; // 18.0 · 18.2 · 21.8 · 24.2 s
const KM_X = [-4.5, -1.8, 0.9, 3.6];
const KM_TXT = ['0 KM', '20 KM', '40 KM', '60 KM'];
const KM_COL = ['#00f5d4', '#b6f04a', '#ff9f1c', '#df3b30'];
const uAtX = (x) => { // u de la curva del cable cuyo punto tiene esa x (x crece de forma monótona)
  let a = 0, b = 1;
  for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (cableCurve.getPointAt(m).x < x) a = m; else b = m; }
  return (a + b) / 2;
};
const subCurve = (x0, x1, n = 48) => {
  const u0 = uAtX(x0), u1 = uAtX(x1), pts = [];
  for (let i = 0; i <= n; i++) pts.push(cableCurve.getPointAt(lerp(u0, u1, i / n)));
  return new THREE.CatmullRomCurve3(pts);
};
const trailCurve = subCurve(KM_X[0], KM_X[3]);
const deadCurve = subCurve(KM_X[3], 10.8);
const gradCol = (u) => { // cian → lima → naranja → rojo a lo largo de los 60 km
  const s = clamp(u) * 3, i = Math.min(2, Math.floor(s));
  return new THREE.Color(KM_COL[i]).lerp(new THREE.Color(KM_COL[i + 1]), s - i);
};

// Estela de luz: tubo con color por vértice (brillante en 0 km, rojo y tenue cerca de 60 km)
const TRAIL_SEG = 160;
const trailMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, fog: false, depthWrite: false });
const trailTube = drawTube(trailCurve, 0.12, trailMat, TRAIL_SEG);
{
  const cnt = trailTube.geometry.attributes.position.count, per = cnt / (TRAIL_SEG + 1), cols = new Float32Array(cnt * 3);
  for (let v = 0; v < cnt; v++) {
    const u = Math.floor(v / per) / TRAIL_SEG, c = gradCol(u).multiplyScalar(1 - 0.5 * u);
    cols[v * 3] = c.r; cols[v * 3 + 1] = c.g; cols[v * 3 + 2] = c.b;
  }
  trailTube.geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
}
trailTube.renderOrder = 5;
scene.add(trailTube);

// Tramo muerto más allá de los 60 km: fibra apagada (oscura)
const deadMat = new THREE.MeshBasicMaterial({ color: '#141a24', transparent: true, opacity: 1 });
const deadTube = drawTube(deadCurve, 0.1, deadMat, 90);
scene.add(deadTube);

// Pulso láser: núcleo + halo + cola de cometa + luz puntual que ilumina el lecho
const pulseGroup = new THREE.Group();
const pulseCoreMat = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false });
const pulseCore = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), pulseCoreMat);
const pulseHaloMat = new THREE.MeshBasicMaterial({ color: '#00f5d4', transparent: true, opacity: 0.4, fog: false, depthWrite: false });
const pulseHalo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), pulseHaloMat);
const pulseLight = new THREE.PointLight('#00f5d4', 14, 6, 2);
pulseGroup.add(pulseCore, pulseHalo, pulseLight);
scene.add(pulseGroup);
const pulseTail = [...Array(7)].map((_, i) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.15 * (1 - i / 8), 10, 8),
    new THREE.MeshBasicMaterial({ color: '#00f5d4', transparent: true, opacity: 0.75 * (1 - i / 7), fog: false, depthWrite: false }));
  scene.add(m);
  return m;
});
// Destello rojo cuando la señal muere en el hito de 60 km
const deathRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 40),
  new THREE.MeshBasicMaterial({ color: '#df3b30', transparent: true, opacity: 1, fog: false, depthWrite: false }));
deathRing.rotation.y = Math.PI / 2;
deathRing.position.set(KM_X[3], 0.9, 0);
scene.add(deathRing);

// Letreros con textura de canvas (se redibujan cuando carga la tipografía Cap)
function kmBoard(text, col, isLimit) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const draw = () => {
    const g = c.getContext('2d');
    g.clearRect(0, 0, 512, 256);
    g.fillStyle = isLimit ? '#df3b30' : '#0d1420';
    g.strokeStyle = isLimit ? '#fff6e0' : col;
    g.lineWidth = 18;
    g.beginPath();
    g.roundRect(12, 12, 488, 232, 40);
    g.fill();
    g.stroke();
    g.fillStyle = '#ffffff';
    g.font = "800 132px Cap, 'Arial Black', sans-serif";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 256, 140);
    tex.needsUpdate = true;
  };
  draw();
  if (document.fonts && document.fonts.load) document.fonts.load("800 132px Cap").then(draw).catch(() => {});
  return tex;
}
const kmMarkers = KM_X.map((x, i) => {
  const g = new THREE.Group();
  g.position.set(x, 0, 0);
  const ringMat = new THREE.MeshBasicMaterial({ color: '#3d5a78', fog: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.07, 10, 36), ringMat);
  ring.rotation.y = Math.PI / 2;
  ring.position.y = 0.9;
  const base = mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.36, 8), toon('#2a2622'));
  base.position.y = 0.18;
  const pole = mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.0, 8), toon('#2a2622'));
  pole.position.y = 1.96;
  const tex = kmBoard(KM_TXT[i], KM_COL[i], i === 3);
  const side = new THREE.MeshBasicMaterial({ color: '#0d1420' });
  const face = new THREE.MeshBasicMaterial({ map: tex, fog: false });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.52, 0.06), [side, side, side, side, face, face]);
  const pivot = new THREE.Group();
  pivot.position.y = 2.75;
  pivot.add(board);
  g.add(ring, base, pole, pivot);
  scene.add(g);
  return { g, ring, ringMat, pivot, x, u: i / 3 };
});

// Buque cablero en la superficie (y = 5.0) + ancla real con cadena de eslabones
const shipGroup = new THREE.Group();
shipGroup.position.set(1.2, SEA_Y, -3.2); // apartado del cable para no tapar los planos cercanos
const hull = mesh(new THREE.BoxGeometry(5.8, 1.3, 2.2), toon('#2b3440'));
hull.position.y = 0.4;
const deck = mesh(new THREE.BoxGeometry(5.2, 0.4, 2.0), toon('#df3b30'));
deck.position.y = 1.1;
const bridge = mesh(new THREE.BoxGeometry(1.5, 1.8, 1.7), toon('#f4f1e6'));
bridge.position.set(-1.4, 2.0, 0);
const funnel = mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.2, 10), toon('#f4b942'));
funnel.position.set(-0.2, 2.1, 0);
shipGroup.add(hull, deck, bridge, funnel);
scene.add(shipGroup);

// Ancla de almirantazgo: argolla superior, cepo horizontal, caña, cruz y brazos curvos con uñas (origen en la cruz)
const anchorGroup = new THREE.Group();
const ironMat = toon('#2b3036');
const ARC = Math.PI * 0.62, ARM_R = 0.85, ARM_C = 0.95;
const arms = mesh(new THREE.TorusGeometry(ARM_R, 0.1, 8, 28, ARC), ironMat);
arms.rotation.z = -Math.PI / 2 - ARC / 2;
arms.position.y = ARM_C;
const crown = mesh(new THREE.SphereGeometry(0.17, 12, 10), ironMat);
crown.position.y = ARM_C - ARM_R;
const shank = mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.5, 10), ironMat);
shank.position.y = 1.3;
const stock = mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.9, 8), ironMat);
stock.rotation.x = Math.PI / 2;
stock.position.y = 2.2;
const stockEndA = mesh(new THREE.SphereGeometry(0.12, 10, 8), ironMat);
stockEndA.position.set(0, 2.2, 0.95);
const stockEndB = stockEndA.clone();
stockEndB.position.z = -0.95;
const shackle = mesh(new THREE.TorusGeometry(0.2, 0.055, 8, 22), ironMat);
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
scene.add(anchorGroup);
const ANCHOR_X = -1.2, ANCHOR_HIT_Y = 1.12, ANCHOR_TOP = 3.0;

const chainLinks = [];
const linkGeo = new THREE.TorusGeometry(0.1, 0.032, 6, 12), linkMat = toon('#3a3f47');
for (let i = 0; i < 34; i++) {
  const l = mesh(linkGeo, linkMat, { cast: false });
  scene.add(l);
  chainLinks.push(l);
}
const _Y = new THREE.Vector3(0, 1, 0), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();
function layChain(a, b, show) {
  const d = b.clone().sub(a), len = d.length();
  d.normalize();
  _qa.setFromUnitVectors(_Y, d);
  chainLinks.forEach((l, i) => {
    l.visible = show && len > 0.05;
    if (!l.visible) return;
    l.position.copy(a).addScaledVector(d, len * (i + 0.5) / chainLinks.length);
    _qb.setFromAxisAngle(_Y, i % 2 ? Math.PI / 2 : 0);
    l.quaternion.copy(_qa).multiply(_qb);
  });
}

// Robot submarino ROV
const rovGroup = new THREE.Group();
const rovBody = mesh(new THREE.BoxGeometry(1.7, 1.05, 1.3), toon('#f4b942'));
const rovFloat = mesh(new THREE.BoxGeometry(1.85, 0.38, 1.4), toon('#ffea79'));
rovFloat.position.y = 0.65;
const rovEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: '#00f5d4' }));
rovEyeL.position.set(-0.42, 0.1, 0.66);
const rovEyeR = rovEyeL.clone();
rovEyeR.position.x = 0.42;
const rovArm = mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), toon('#2a2622'));
rovArm.rotation.x = Math.PI / 3;
rovArm.position.set(0, -0.55, 0.45);
const rovBeam = new THREE.Mesh(
  new THREE.ConeGeometry(1.1, 3.2, 14, 1, true),
  new THREE.MeshBasicMaterial({ color: '#00f5d4', transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })
);
rovBeam.position.set(0, -1.8, 0.2);
rovGroup.add(rovBody, rovFloat, rovEyeL, rovEyeR, rovArm, rovBeam);
scene.add(rovGroup);

// Personaje expresivo (operador / guardián del cable)
const charOp = character('#f4b942', 1.18);
scene.add(charOp);
const CHAR_HOME = -2.45;
// Recorrido del personaje [t, x, z]: siempre dentro del encuadre de cada plano
const CHAR_KEYS = [
  [0, CHAR_HOME, -1.05],
  [17.4, CHAR_HOME, -1.05],
  [K60.start, -1.2, -1.9],
  [K60.end, 2.6, -1.9],          // persigue al pulso y se queda triste en los 60 km
  [A.insertas - 0.3, 2.6, -1.9],
  [A.capsulas, -1.75, -1.05],    // vuelve corriendo al repetidor central
  [A.soloQue - 0.9, -1.75, -1.05],
  [A.soloQue + 0.6, 0.7, -1.05], // centrado bajo el barco (plano de superficie)
  [A.parte + 1.0, 0.7, -1.05],
  [A.acero, -1.9, -1.05],        // a la izquierda para el trenzado y el ROV
  [A.guerra + 1.5, -1.9, -1.05],
  [META.duration - 0.8, CHAR_HOME, -1.05],
  [META.duration, CHAR_HOME, -1.05],
];
function charAt(t) {
  let i = 0;
  while (i < CHAR_KEYS.length - 2 && t > CHAR_KEYS[i + 1][0]) i++;
  const a = CHAR_KEYS[i], b = CHAR_KEYS[i + 1];
  const k = (t >= K60.start && t <= K60.end) ? smooth(ramp(t, K60.start, K60.end)) : smooth(ramp(t, a[0], b[0]));
  const moving = a[1] !== b[1] && t > a[0] && t < b[0];
  return { x: lerp(a[1], b[1], k), z: lerp(a[2], b[2], k), moving };
}

// Explosiones toon (más pequeñas y achatadas para no tapar nunca los rótulos)
const boomHook = explosion(scene, [ANCHOR_X, 0.75, 0], 0.68, 21, { alto: 0.7, humo: 0.4 });
const boomShort = explosion(scene, [0, 0.75, 0], 0.55, 37, { alto: 0.7, humo: 0.5 });
const boomAnchor = explosion(scene, [ANCHOR_X, 0.75, 0], 0.55, 53, { alto: 0.7, humo: 0.5 });

// ── 6. POSES DE CÁMARA (VERTICAL 1080×1920 · FOV 38–46 · TODO DENTRO DE CUADRO · LOOP IDÉNTICO) ───────────────
const H0 = { pos: [-0.3, 3.7, 8.6], look: [-1.55, 1.75, 0.0], fov: 42 };
const COAST = { pos: [-7.6, 10.6, 20.0], look: [-14.0, 6.2, -1.4], fov: 42 };
const CITY = { pos: [8.0, 11.5, 26.5], look: [15.4, 9.9, -2.4], fov: 42 };
const IMPACT = { pos: [1.6, 4.4, 10.6], look: [-0.6, 2.3, 0.0], fov: 44 };
const POSES = [
  { t: 0.0, ...H0 },                                                                           // 1. Impacto del ancla en el cable
  { t: 0.65, pos: [-1.8, 4.2, 11.6], look: [-3.0, 2.3, 0.0], fov: 44 },                        // 2. Sigue al personaje despedido
  { t: 1.45, pos: [1.8, 5.6, 14.8], look: [-1.2, 2.6, 0.0], fov: 44 },                         // Respiro lateral
  { t: 2.20, pos: [6.5, 7.8, 19.5], look: [0.0, 3.0, 0.0], fov: 46 },                          // 3. Plano general intercontinental
  { t: 2.85, pos: [7.2, 3.2, 11.0], look: [-1.0, 1.7, 0.0], fov: 42 },                         // 4. Baja y rodea
  { t: 3.60, pos: [-3.6, 4.0, 11.4], look: [-1.4, 1.9, 0.0], fov: 42 },                        // Cruza al otro lado
  { t: 4.40, pos: [0.0, 6.8, 19.5], look: [0.0, 7.8, -2.0], fov: 44 },                         // 5. Contrapicado al cielo
  { t: A.satelite + 0.4, pos: [0.0, 9.5, 16.5], look: [0.0, 12.8, -5.0], fov: 44 },            // Satélite tachado
  { t: A.hilo, pos: [-4.0, 3.4, 9.4], look: [-1.5, 1.7, 0.0], fov: 42 },                       // Bajada al hilo
  { t: A.construyamoslo + 0.6, pos: [0.0, 6.5, 16.0], look: [0.0, 2.0, 0.0], fov: 45 },        // Desarme escalonado
  { t: A.primero, ...COAST },                                                                  // Estación costera + faro
  { t: A.fibra - 0.1, pos: [-7.9, 10.4, 19.2], look: [-13.9, 6.2, -1.4], fov: 42 },             // (sostiene la costa)
  { t: A.cabello, pos: [-0.9, 2.4, 7.0], look: [-1.9, 1.6, 0.0], fov: 44 },                    // Hilo de vidrio + personaje
  { t: A.laser, pos: [0.1, 2.7, 8.0], look: [-1.4, 1.6, 0.0], fov: 42 },                       // Pulsos de láser
  { t: K60.start + 0.1, pos: [-13.8, 4.0, 7.6], look: [-1.4, 2.0, -0.4], fov: 42 },            // 60 KM: a lo largo del cable
  { t: K60.end + 0.1, pos: [-4.5, 3.8, 10.4], look: [2.0, 2.0, -0.5], fov: 42 },                // Sigue al pulso hasta los 60 km
  { t: A.insertas - 0.4, pos: [-3.9, 3.7, 9.9], look: [2.1, 2.0, -0.5], fov: 42 },             // Sostiene el tramo apagado
  { t: A.capsulas, pos: [-1.7, 3.0, 9.0], look: [-0.6, 1.6, 0.0], fov: 44 },                  // Cápsulas con erbio
  { t: A.repetidores + 0.4, pos: [0.0, 5.0, 15.5], look: [0.0, 1.8, 0.0], fov: 46 },           // Repetidores ópticos
  { t: A.problema, pos: [-1.6, 3.7, 10.2], look: [-0.5, 2.3, 0.0], fov: 44 },                  // Deja sitio al panel HUD
  { t: A.cortocircuito, pos: [0.8, 3.8, 11.2], look: [-0.5, 2.3, 0.0], fov: 44 },               // Cortocircuito
  { t: A.cobre, pos: [-2.0, 2.7, 7.9], look: [-0.9, 1.6, 0.0], fov: 44 },                      // Tubo de cobre
  { t: A.polietileno + 0.3, pos: [1.0, 2.8, 8.0], look: [-0.7, 1.6, 0.0], fov: 44 },           // Polietileno
  { t: A.soloQue, pos: [0.9, 7.0, 14.5], look: [0.9, 4.0, -2.0], fov: 42 },                    // Superficie: el barco
  { t: A.barco, pos: [0.8, 6.6, 13.8], look: [0.3, 3.6, -1.6], fov: 42 },
  { t: A.ancla, ...IMPACT },                                                                   // El ancla baja hacia el cable
  { t: A.parte + 0.7, pos: [1.4, 4.4, 10.8], look: [-0.6, 2.3, 0.0], fov: 44 },                // Golpe y corte
  { t: A.bolsa, ...CITY },                                                                     // Rascacielos de la Bolsa
  { t: A.bolsa + 0.9, pos: [8.4, 11.3, 25.6], look: [15.4, 9.9, -2.4], fov: 42 },
  { t: A.acero, pos: [-1.3, 2.9, 8.2], look: [-1.2, 1.7, 0.0], fov: 44 },                      // Trenzado de acero
  { t: A.robot, pos: [0.4, 3.9, 9.8], look: [-0.9, 2.2, 0.0], fov: 44 },                       // Robot ROV
  { t: A.guerra, pos: [0.0, 6.4, 15.5], look: [0.0, 2.4, 0.0], fov: 44 },                      // Plano general final
  { t: META.duration - 0.8, ...H0 },
  { t: META.duration, ...H0 },                                                                 // Idéntica a t = 0
];

// ── 7. RÓTULOS SUPERIORES (#cap) ──────────────────────────────────────────────────────────────────────────────
const CUES = [
  { from: 0.05, to: 2.65, text: '99 % DE INTERNET\nBAJO EL MAR' },
  { from: 2.70, to: 5.00, text: '$10 BILLONES\nAL DÍA', color: 'light' },
  { from: A.satelite - 0.2, to: A.hilo - 0.1, text: 'NO VIAJAN\nPOR SATÉLITE', color: 'danger' },
  { from: A.construyamoslo - 0.1, to: A.primero - 0.2, text: 'DESDE CERO' },
  { from: A.fibra - 0.1, to: A.laser + 0.4, text: 'HILO DE VIDRIO\nY LÁSER' },
  { from: A.pero1, to: A.apaga + 0.5, text: 'PERO A 60 KM\nSE APAGA', color: 'danger' },
  { from: A.repetidores - 0.4, to: A.problema - 0.2, text: 'REPETIDORES\nÓPTICOS', color: 'light' },
  { from: A.problema, to: A.cortocircuito + 0.6, text: '10.000 VOLTIOS:\nCORTOCIRCUITO', color: 'danger' },
  { from: A.cobre - 0.2, to: A.soloQue - 0.2, text: 'TUBO DE COBRE\nY POLIETILENO' },
  { from: A.soloQue, to: A.bolsa + 0.5, text: 'ANCLAS CONGELAN\nLA BOLSA', color: 'danger' },
  { from: A.acero - 0.2, to: A.entierra + 0.4, text: 'BLINDAJE DE ACERO\nY ROBOT ROV' },
  { from: A.guerra, to: META.duration - 0.35, text: 'LA GUERRA VIGILA\nEL FONDO DEL MAR' },
];

const capEl = document.getElementById('cap');
const subEl = document.getElementById('sub');
const panelEl = document.getElementById('panel');

const PALABRAS_PELIGRO = ['no', 'satélite', 'Pero', 'apaga', 'problema', 'cortocircuito', 'ancla', 'parte', 'congela', 'guerra'];
const PALABRAS_ACENTO = ['noventa', 'nueve', 'diez', 'billones', 'fibra', 'vidrio', 'láser', 'sesenta', 'kilómetros', 'erbio', 'repetidores', 'ópticos', 'cobre', 'polietileno', 'acero', 'blindaje', 'robot'];

// Panel HUD de telemetría de los 60 km (contador de distancia + barra de señal óptica)
function panel60(t, p) {
  const kVis = smooth(ramp(t, K60.pop + 0.1, K60.pop + 0.4)) * (1 - ramp(t, K60.out - 0.5, K60.out - 0.2));
  panelEl.style.opacity = kVis;
  panelEl.style.transform = `scale(${0.92 + 0.08 * kVis})`;
  if (kVis <= 0.01) { panelEl.innerHTML = ''; panelEl.style.borderColor = ''; return; }
  const km = Math.round(lerp(0, 60, p));
  const sig = Math.round(100 * Math.pow(1 - p, 1.3));
  const dead = p >= 0.999;
  const col = dead ? '#df3b30' : '#' + gradCol(p).getHexString();
  const sigCol = dead ? '#df3b30' : sig > 55 ? '#00f5d4' : sig > 25 ? '#ff9f1c' : '#df3b30';
  const blink = dead && Math.floor((t - K60.end) * 4) % 2 === 0;
  panelEl.style.borderColor = blink ? '#df3b30' : '';
  const X0 = 470, XW = 390, dotX = X0 + XW * p;
  let ticks = '';
  KM_X.forEach((_, i) => {
    const cx = X0 + (XW / 3) * i, on = p >= i / 3 - 1e-3;
    ticks += `<circle cx="${cx}" cy="96" r="11" fill="${on ? KM_COL[i] : '#1b2234'}" stroke="#9fb4d4" stroke-width="3"/>`
      + `<text x="${cx}" y="140" text-anchor="middle" fill="${i === 3 ? '#df3b30' : '#9fb4d4'}" font-family="Mono" font-size="22">${KM_TXT[i]}</text>`;
  });
  panelEl.innerHTML = `<svg viewBox="0 0 900 290" width="900" height="290">`
    + `<text x="40" y="56" fill="#9fb4d4" font-family="Mono" font-size="24">DISTANCIA RECORRIDA</text>`
    + `<text x="40" y="152" fill="${dead ? '#df3b30' : '#fff6e0'}" font-family="Cap" font-size="96">${km} KM</text>`
    + `<line x1="${X0}" y1="96" x2="${X0 + XW}" y2="96" stroke="#394867" stroke-width="10" stroke-linecap="round"/>`
    + `<line x1="${X0}" y1="96" x2="${dotX}" y2="96" stroke="${col}" stroke-width="10" stroke-linecap="round"/>`
    + ticks
    + (dead ? '' : `<circle cx="${dotX}" cy="96" r="15" fill="#ffffff" stroke="${col}" stroke-width="6"/>`)
    + `<text x="40" y="206" fill="#9fb4d4" font-family="Mono" font-size="24">SEÑAL ÓPTICA</text>`
    + `<text x="860" y="208" text-anchor="end" fill="${sigCol}" font-family="Cap" font-size="34">${dead ? '0 % · SEÑAL APAGADA' : sig + ' %'}</text>`
    + `<rect x="40" y="224" width="820" height="40" rx="20" fill="#1b2234" stroke="${dead ? '#df3b30' : '#394867'}" stroke-width="3"/>`
    + (sig > 0 ? `<rect x="40" y="224" width="${Math.max(40, 820 * sig / 100)}" height="40" rx="20" fill="${sigCol}"/>` : '')
    + `</svg>`;
}

// ── 8. FUNCIÓN DETERMINISTA DE ESTADO EN CADA INSTANTE t (update(0) === update(META.duration)) ─────────────────
function update(t) {
  const cyc = (n) => (t / META.duration) * Math.PI * 2 * n;

  // 1. Día costero → noche abisal en los eslabones 1 y 2 → vuelta al día
  const kAbyss = smooth(ramp(t, A.pero1 - 0.8, A.pero1 + 1.5)) * (1 - smooth(ramp(t, A.soloQue - 0.5, A.soloQue + 1.2)));
  setTimeOfDay(scene, world, kAbyss * 0.88, OCEAN);

  // 2. Fondo vivo y cíclico
  cloudsGroup.position.x = Math.sin(cyc(2)) * 3.5;
  lhBeacon.rotation.y = cyc(12);
  seaSurface.position.y = SEA_Y + Math.sin(cyc(8)) * 0.12;
  buoys.forEach((b) => {
    b.group.position.y = SEA_Y + Math.sin(cyc(10) + b.phase) * 0.18;
    b.group.rotation.z = Math.cos(cyc(10) + b.phase) * 0.12;
  });
  kelps.forEach((k) => k.parts.forEach((s, i) => { s.rotation.z = Math.sin(cyc(7) + k.phase + i * 0.55) * 0.07; }));
  fishes.forEach((f, i) => {
    const fr = (((t / META.duration) * 3 + f.off) % 1 + 1) % 1;
    const vis = smooth(ramp(fr, 0, 0.06)) * (1 - smooth(ramp(fr, 0.94, 1)));
    f.g.position.set(-10 + 20 * fr, 3.1 + f.lane * 0.38 + Math.sin(cyc(9) + i) * 0.2, -4.8 - f.zl * 0.55);
    f.g.scale.setScalar(Math.max(0.001, vis));
    f.g.visible = vis > 0.01;
    f.tail.rotation.y = Math.sin(cyc(160) + i) * 0.5;
  });

  satGroup.position.x = Math.sin(cyc(3)) * 0.8;
  const kSatCross = smooth(ramp(t, A.satelite - 0.4, A.satelite + 0.15)) * (1 - smooth(ramp(t, A.construyamoslo, A.construyamoslo + 0.6)));
  satCross.scale.setScalar(Math.max(0.001, easeOutBack(kSatCross)));
  satCross.visible = kSatCross > 0.01;

  // 3. Desarme y reconstrucción por capas
  const kDismantle = smooth(ramp(t, A.construyamoslo - 0.3, A.construyamoslo + 0.9));
  const kGlassBuild = smooth(ramp(t, A.fibra - 0.2, A.cabello + 0.4));
  const progGlass = clamp(1 - kDismantle + kGlassBuild);
  glassFiberTube.userData.setProgress(progGlass);

  // 60 km: los fotones normales se ocultan y manda el pulso que se apaga; vuelven con los repetidores de erbio
  const k60Zone = smooth(ramp(t, K60.pop - 0.1, K60.start + 0.1)) * (1 - smooth(ramp(t, A.erbio, A.fotones + 0.3)));
  const laserOpacity = clamp(1 - kDismantle * (1 - smooth(ramp(t, A.laser - 0.5, A.laser + 0.2)))) * (1 - k60Zone);
  laserBeads.userData.update(t, progGlass, laserOpacity);
  glassMat.emissiveIntensity = lerp(0.35, 0.04, k60Zone);

  const p60 = smooth(ramp(t, K60.start, K60.end));               // 0 → 1: del hito 0 KM al de 60 KM
  const inPulse = t >= K60.start && t < K60.end;
  const pulsePt = trailCurve.getPointAt(p60);
  const pCol = gradCol(p60);
  const pSize = (1 - 0.7 * p60) * (1 - smooth(ramp(p60, 0.88, 1.0)));
  pulseGroup.visible = inPulse && pSize > 0.01;
  pulseGroup.position.copy(pulsePt);
  pulseGroup.scale.setScalar(Math.max(0.001, pSize * 1.3));
  pulseCoreMat.color.copy(new THREE.Color('#ffffff').lerp(pCol, 0.35 + 0.65 * p60));
  pulseHaloMat.color.copy(pCol);
  pulseHaloMat.opacity = 0.45 * (1 - 0.6 * p60);
  pulseLight.color.copy(pCol);
  pulseLight.intensity = 16 * pSize;
  pulseTail.forEach((m, i) => {
    const u = p60 - (i + 1) * 0.022;
    m.visible = pulseGroup.visible && u > 0;
    if (!m.visible) return;
    m.position.copy(trailCurve.getPointAt(u));
    m.material.color.copy(gradCol(u));
    m.scale.setScalar(Math.max(0.001, pSize * 1.3));
  });
  const kTrail = smooth(ramp(t, K60.start, K60.start + 0.15)) * (1 - smooth(ramp(t, K60.end, K60.end + 0.8)));
  trailTube.userData.setProgress(t >= K60.start && kTrail > 0.01 ? p60 : 0);
  trailMat.opacity = 0.9 * kTrail;
  const kDead = smooth(ramp(t, K60.end - 0.1, K60.end + 0.25)) * (1 - smooth(ramp(t, K60.out - 0.3, K60.out + 0.2)));
  deadTube.userData.setProgress(kDead > 0.01 ? 1 : 0);
  deadMat.opacity = kDead;
  const kDeath = ramp(t, K60.end, K60.end + 0.75);
  deathRing.visible = kDeath > 0 && kDeath < 1;
  deathRing.scale.setScalar(1 + kDeath * 2.2);
  deathRing.material.opacity = 1 - kDeath;

  kmMarkers.forEach((m, i) => {
    const kPop = easeOutBack(ramp(t, K60.pop + i * 0.16, K60.pop + 0.45 + i * 0.16)) * (1 - smooth(ramp(t, K60.out - 0.35, K60.out)));
    m.g.visible = kPop > 0.01;
    m.g.scale.setScalar(Math.max(0.001, kPop));
    const passed = t >= K60.start && p60 >= m.u - 1e-3;
    const flash = passed ? Math.max(0, 1 - (p60 - m.u) * 7) * (t < K60.end + 0.05 ? 1 : 0) : 0;
    m.ringMat.color.set(passed ? KM_COL[i] : '#3d5a78');
    if (i === 3 && t >= K60.end) m.ringMat.color.set(Math.floor((t - K60.end) * 4) % 2 ? '#7a1a14' : '#df3b30');
    m.ring.scale.setScalar(1 + 0.45 * flash);
  });

  // Repetidores
  repeaters.forEach((rep, i) => {
    const kDis = smooth(ramp(t, 1.55 + i * 0.08, 2.15 + i * 0.08)) * (1 - smooth(ramp(t, 3.2, 3.8)))
      + smooth(ramp(t, A.construyamoslo + i * 0.08, A.construyamoslo + 0.55 + i * 0.08));
    const kBuild = easeOutBack(ramp(t, A.capsulas + i * 0.18, A.erbio + 0.25 + i * 0.18));
    const kVis = clamp(1 - clamp(kDis) + (t >= A.capsulas ? kBuild : 0));
    rep.group.visible = kVis > 0.01;
    rep.group.scale.setScalar(Math.max(0.001, kVis));
    rep.group.position.y = rep.baseY + (1 - clamp(kVis)) * 2.8;
    rep.group.rotation.x = (1 - clamp(kVis)) * 2.2;
    const pulseGlow = 0.8 + 0.2 * Math.sin(cyc(20) + i);
    rep.glowRing.scale.set(pulseGlow, 1, pulseGlow);
  });

  const kCopperBuild = smooth(ramp(t, A.envuelves, A.cobre + 0.5));
  copperTube.userData.setProgress(clamp(1 - kDismantle + kCopperBuild));
  const kPolyBuild = smooth(ramp(t, A.cobre + 0.3, A.polietileno + 0.6));
  polyTube.userData.setProgress(clamp(1 - kDismantle + kPolyBuild));
  const kArmorHookDis = smooth(ramp(t, 1.50, 2.15));
  const kArmorRebuild = smooth(ramp(t, A.trenzas, A.blindaje + 0.6));
  armorTube.userData.setProgress(clamp(1 - kArmorHookDis + kArmorRebuild));
  armorRings.forEach((ar, i) => {
    const d0 = smooth(ramp(t, 1.50 + i * 0.025, 2.05 + i * 0.025));
    const r0 = easeOutBack(ramp(t, A.trenzas + i * 0.04, A.acero + 0.4 + i * 0.04));
    const k = clamp(1 - d0 + (t >= A.trenzas ? r0 : 0));
    ar.mesh.visible = k > 0.02;
    ar.mesh.scale.setScalar(Math.max(0.001, k));
    ar.mesh.position.y = ar.basePos.y + (1 - clamp(k)) * 3.2;
    ar.mesh.rotation.y = (1 - clamp(k)) * 3.0;
  });

  // 4. Barco, ancla (golpea el cable en x = -1.2) con su cadena, y ROV
  const shipX = 1.2 + Math.sin(cyc(4)) * 0.5;
  shipGroup.position.x = shipX;
  shipGroup.rotation.z = Math.sin(cyc(8)) * 0.03;
  const kAnchorUp = smooth(ramp(t, 1.2, 2.4)) * (1 - smooth(ramp(t, A.barco, A.ancla + 0.25)));
  const kAnchorRepel = smooth(ramp(t, A.acero, A.blindaje + 0.5)) * (1 - smooth(ramp(t, META.duration - 1.4, META.duration)));
  const anchorLift = clamp(kAnchorUp + kAnchorRepel);
  const anchorY = lerp(ANCHOR_HIT_Y, SEA_Y + 0.6, anchorLift);
  anchorGroup.position.set(ANCHOR_X, anchorY, 0);
  anchorGroup.rotation.z = 0.1 * (1 - anchorLift) + Math.sin(cyc(12)) * 0.06 * anchorLift;
  const anchorShown = anchorLift < 0.97;
  anchorGroup.visible = anchorShown;
  const shackleTop = new THREE.Vector3(ANCHOR_X - Math.sin(anchorGroup.rotation.z) * 2.8, anchorY + Math.cos(anchorGroup.rotation.z) * 2.8, 0);
  layChain(shackleTop, new THREE.Vector3(shipX - 2.0, SEA_Y + 0.5, -2.05), anchorShown);

  const kRov = smooth(ramp(t, A.robot - 0.4, A.robot + 0.6)) * (1 - smooth(ramp(t, META.duration - 1.2, META.duration)));
  rovGroup.position.set(Math.sin(cyc(6)) * 0.35, lerp(11.5, 2.35, kRov), 0.8);
  rovGroup.visible = kRov > 0.01;

  const isCrash = (t < 1.5) || (t >= A.parte - 0.1 && t <= A.acero + 0.2);
  tickerScreens.forEach((scr) => scr.material.color.set(isCrash ? '#df3b30' : '#00f5d4'));

  // 5. Personaje (despedido en el hook, persigue el pulso, triste en los «peros», salta cuando funciona)
  const kBlast = ramp(t, 0.05, 1.15);
  const kRecover = smooth(ramp(t, 3.4, 4.3));
  const cp = charAt(t);
  if (t > 0.02 && t < 3.4) {
    const fly = Math.min(1, kBlast);
    charOp.position.set(lerp(CHAR_HOME, -4.5, fly), Math.sin(fly * Math.PI) * 2.4, -1.05);
    charOp.rotation.z = fly * Math.PI * 1.5;
    charOp.scale.setScalar(1.18);
  } else if (t >= 3.4 && t < 4.4) {
    charOp.position.set(lerp(-4.5, CHAR_HOME, kRecover), 0.0, -1.05);
    charOp.rotation.z = lerp(Math.PI * 1.5, 0, kRecover);
    charOp.scale.setScalar(1.18);
  } else {
    const isSad = (t >= A.pero1 && t < A.capsulas) || (t >= A.problema && t < A.envuelves) || (t >= A.soloQue && t < A.trenzas);
    const isLoopEdge = t < 0.05 || t > META.duration - 0.8;
    const run = cp.moving ? Math.abs(Math.sin(t * 15)) * 0.16 : 0;
    const jump = (isSad || isLoopEdge || cp.moving) ? 0 : Math.abs(Math.sin(cyc(28))) * 0.24;
    charOp.position.set(cp.x, jump + run, cp.z);
    charOp.rotation.z = cp.moving ? 0 : (isSad ? 0.18 : 0);
    charOp.scale.set(1.18, isSad && !cp.moving ? 1.02 : 1.18, 1.18);
  }

  // 6. Explosiones
  boomHook.userData.update(t > META.duration - 0.5 ? 0.0 : t);
  boomShort.userData.update(t - A.cortocircuito);
  boomAnchor.userData.update(t - A.parte);

  // 7. Panel HUD: 60 km (Eslabón 1), 10.000 V (Eslabón 2), colapso SWIFT (Eslabón 3)
  if (t >= K60.pop && t <= K60.out) {
    panel60(t, t >= K60.start ? p60 : 0);
  } else if (t >= A.problema - 0.2 && t <= A.cobre + 0.2) {
    panelEl.style.borderColor = '';
    pulsePanel(panelEl, t, {
      from: A.problema - 0.1, to: A.cobre + 0.1, period: 0.55,
      label: 'ALIMENTACIÓN ABISAL', value: '10.000 V DC',
      color: t >= A.cortocircuito - 0.1 ? '#df3b30' : '#e6ff5a',
    });
  } else if (t >= A.parte - 0.2 && t <= A.trenzas + 0.3) {
    panelEl.style.borderColor = '';
    pulsePanel(panelEl, t, {
      from: A.parte - 0.1, to: A.trenzas + 0.2, period: 0.35,
      label: 'TRÁFICO FINANCIERO SWIFT', value: 'CORTE CRÍTICO', color: '#df3b30',
    });
  } else {
    panelEl.style.opacity = 0;
    panelEl.style.borderColor = '';
    panelEl.innerHTML = '';
  }

  // 8. Cámara continua + temblores
  cameraAt(camera, POSES, t);
  shake(camera, t, 0.45, 0.85);
  shake(camera, t - A.cortocircuito, 0.38, 0.75);
  shake(camera, t - A.parte, 0.45, 0.90);

  // Letreros de km siempre de cara a la cámara (solo giro en Y)
  kmMarkers.forEach((m) => { m.pivot.rotation.y = Math.atan2(camera.position.x - m.x, camera.position.z); });

  // 9. Rótulos y subtítulos palabra a palabra
  captions(capEl, CUES, t);
  if (t > META.duration - 0.25) {
    subEl.innerHTML = '';
  } else {
    subtitulosTimeline(subEl, tl, t, { palabrasPorBloque: 3, peligros: PALABRAS_PELIGRO, acentos: PALABRAS_ACENTO });
  }
}

window.META = META;
window.renderFrame = (t) => { update(t); ink.render(scene, camera); };
window.renderFrame(0);
window.READY = true;
window.__listo = true;
