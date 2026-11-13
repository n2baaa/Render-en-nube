import React, { useLayoutEffect, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import {
  crearAnclas,
  SubtitulosExplica,
  FuentesExplica,
  Curvas,
  seg,
  limita,
  lerp,
  TimelineData,
} from '../../.agents/skills/videos-explicativos-claude/motor/remotion-kit';
import timelineJson from '../voz/timeline.json';

const tl = timelineJson as TimelineData;
const { en } = crearAnclas(tl);

export const A = {
  girando: en('girando'),
  mueve: en('mueve', 1),
  pendiente1: en('pendiente', 1),
  apagarse1: en('apagarse', 1),
  imagina: en('Imagina'),
  ruedas1: en('ruedas', 1),
  novecientas1: en('novecientas', 1),
  pasoUno: en('Paso uno'),
  cilindro: en('cilindro'),
  piston1: en('pistón', 1),
  biela: en('biela'),
  ciguenal1: en('cigüeñal', 1),
  detuviera: en('detuviera'),
  pasoDos: en('Paso dos'),
  volante1: en('volante', 1),
  embrague1: en('embrague', 1),
  caja1: en('caja', 1),
  transmision: en('transmisión'),
  diferencial: en('diferencial'),
  pasoTres: en('Paso tres'),
  pisas: en('pisas'),
  separas: en('separas'),
  detenidos: en('detenidos'),
  frenos: en('frenos'),
  pasoCuatro: en('Paso cuatro'),
  roza: en('roza'),
  patina: en('patina'),
  pierde: en('pierde'),
  aceleramos: en('aceleramos'),
  primera: en('primera'),
  catorce: en('catorce'),
  pasoCinco: en('Paso cinco'),
  confundas: en('confundas'),
  tuerce: en('tuerce'),
  llanta: en('llanta'),
  supera: en('supera'),
  pasoSeis: en('Paso seis'),
  motocicleta: en('motocicleta'),
  maneta: en('maneta'),
  cadena: en('cadena'),
  trasera: en('trasera'),
};

interface Rig3D {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  autoGroup: THREE.Group;
  carBodyMat: THREE.MeshPhysicalMaterial;
  hoodMesh: THREE.Mesh;
  pistons: THREE.Mesh[];
  rods: THREE.Mesh[];
  crankPins: THREE.Mesh[];
  combustionLights: THREE.PointLight[];
  combustionSpheres: THREE.Mesh[];
  crankGroup: THREE.Group;
  flywheel: THREE.Mesh;
  clutchDisc: THREE.Group;
  clutchMat: THREE.MeshStandardMaterial;
  sparkRing: THREE.Mesh;
  gearSmall: THREE.Group;
  gearLarge: THREE.Group;
  gearboxMat: THREE.MeshStandardMaterial;
  driveshaft: THREE.Mesh;
  diffRing: THREE.Mesh;
  wheels: THREE.Group[];
  brakePads: THREE.Mesh[];
  torquePulse: THREE.Mesh;
  motoGroup: THREE.Group;
  motoCrank: THREE.Group;
  motoClutchPlates: THREE.Mesh[];
  motoSprocketF: THREE.Group;
  motoSprocketR: THREE.Group;
  motoChainLinks: THREE.Mesh[];
  motoWheel: THREE.Group;
}

function makeGear(radius: number, teeth: number, thickness: number, mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, 28), mat);
  body.rotation.x = Math.PI / 2;
  g.add(body);
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.35, radius * 0.35, thickness * 1.25, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
  );
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  for (let i = 0; i < teeth; i++) {
    const ang = (i / teeth) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.22, radius * 0.24, thickness * 0.95), mat);
    tooth.position.set(Math.cos(ang) * (radius + radius * 0.08), Math.sin(ang) * (radius + radius * 0.08), 0);
    tooth.rotation.z = ang;
    g.add(tooth);
  }
  return g;
}

function makeWheel(radius: number, width: number): THREE.Group {
  const wg = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x161b24, roughness: 0.75, metalness: 0.15 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xdce6f7, roughness: 0.25, metalness: 0.85 });
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 32), tireMat);
  tire.rotation.x = Math.PI / 2;
  wg.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width * 1.03, 24), rimMat);
  rim.rotation.x = Math.PI / 2;
  wg.add(rim);
  // 6 radios visibles para apreciar claramente cuándo gira o está quieta
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0xff8a5b, roughness: 0.3, metalness: 0.7 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const sp = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.12, radius * 1.15, width * 1.08), i === 0 ? spokeMat : rimMat);
    sp.rotation.z = a;
    wg.add(sp);
  }
  return wg;
}

function buildScene(canvas: HTMLCanvasElement): Rig3D {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(1080, 1920, false);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090d16);
  scene.fog = new THREE.FogExp2(0x090d16, 0.022);

  const camera = new THREE.PerspectiveCamera(42, 1080 / 1920, 0.1, 150);

  // Iluminación cinematográfica 3D de estudio mecánico
  const amb = new THREE.AmbientLight(0x8ab4f8, 0.85);
  scene.add(amb);
  const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.4);
  keyLight.position.set(8, 14, 12);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x4fb3ff, 1.6);
  rimLight.position.set(-10, 6, -10);
  scene.add(rimLight);
  const underLight = new THREE.PointLight(0xff8a5b, 1.4, 25);
  underLight.position.set(0, -3, 5);
  scene.add(underLight);

  // ══════════════════════════════════════════════════════════════════════════
  // GRUPO 1: AUTOMÓVIL EN PENDIENTE Y TREN MOTRIZ 3D COMPLETO
  // ══════════════════════════════════════════════════════════════════════════
  const autoGroup = new THREE.Group();
  scene.add(autoGroup);

  // Rampa / Pendiente de asfalto 3D (inclinada en el mundo para la vista general)
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x141926, roughness: 0.85, metalness: 0.1 });
  const road = new THREE.Mesh(new THREE.BoxGeometry(28, 0.6, 8), roadMat);
  road.position.set(0, -2.05, 0);
  autoGroup.add(road);

  // Líneas viales en la rampa
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
  for (let i = -10; i <= 10; i += 3.2) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.22), stripeMat);
    st.position.set(i, -1.73, 1.8);
    autoGroup.add(st);
  }

  // Carrocería translúcida estilo Rayos X de ingeniería
  const carBodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x2b4c7e,
    transparent: true,
    opacity: 0.28,
    roughness: 0.2,
    metalness: 0.3,
  });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.15, 3.8), carBodyMat);
  chassis.position.set(0, -0.35, 0);
  autoGroup.add(chassis);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.35, 3.4), carBodyMat);
  cabin.position.set(0.6, 0.85, 0);
  autoGroup.add(cabin);

  const hoodMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.18, 3.6),
    new THREE.MeshPhysicalMaterial({ color: 0x3b6cb7, transparent: true, opacity: 0.45, roughness: 0.2 })
  );
  hoodMesh.position.set(-2.9, 0.32, 0);
  autoGroup.add(hoodMesh);

  // Materiales mecánicos con código de color pedagógico:
  // Naranja/Oro (#FF8A5B) = Gira con el motor | Azul/Acero (#4FB3FF) = Transmisión / Detenido | Verde (#5BE49B) = Torque multiplicado
  const engineMetal = new THREE.MeshStandardMaterial({ color: 0xff9248, metalness: 0.78, roughness: 0.25 });
  const pistonMetal = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, metalness: 0.85, roughness: 0.2 });
  const rodMetal = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.75, roughness: 0.28 });
  const cylGlass = new THREE.MeshPhysicalMaterial({ color: 0x90caf9, transparent: true, opacity: 0.24, roughness: 0.1 });
  const clutchMat = new THREE.MeshStandardMaterial({ color: 0x4fb3ff, metalness: 0.72, roughness: 0.28 });
  const gearboxMat = new THREE.MeshStandardMaterial({ color: 0x4fb3ff, metalness: 0.75, roughness: 0.25 });

  // 1. MOTOR DE 4 CILINDROS EN LÍNEA (x = -3.8 a -1.8)
  const crankGroup = new THREE.Group();
  crankGroup.position.set(-2.8, -0.55, 0);
  autoGroup.add(crankGroup);

  const mainShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.4, 20), engineMetal);
  mainShaft.rotation.z = Math.PI / 2;
  crankGroup.add(mainShaft);

  const pistons: THREE.Mesh[] = [];
  const rods: THREE.Mesh[] = [];
  const crankPins: THREE.Mesh[] = [];
  const combustionLights: THREE.PointLight[] = [];
  const combustionSpheres: THREE.Mesh[] = [];
  const offsets = [-0.78, -0.26, 0.26, 0.78];
  const phases = [0, Math.PI, Math.PI, 0];

  for (let i = 0; i < 4; i++) {
    const cx = -2.8 + offsets[i];
    // Camisa de cilindro translúcida
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 1.15, 24, 1, true), cylGlass);
    cyl.position.set(cx, 0.35, 0);
    autoGroup.add(cyl);

    // Pistón 3D
    const pis = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.28, 24), pistonMetal);
    pis.position.set(cx, 0.35, 0);
    autoGroup.add(pis);
    pistons.push(pis);

    // Biela 3D
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.72, 0.09), rodMetal);
    rod.position.set(cx, -0.1, 0);
    autoGroup.add(rod);
    rods.push(rod);

    // Muñequilla y contrapeso del cigüeñal
    const rCrank = 0.24;
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 16), engineMetal);
    pin.rotation.z = Math.PI / 2;
    pin.position.set(offsets[i], Math.cos(phases[i]) * rCrank, Math.sin(phases[i]) * rCrank);
    crankGroup.add(pin);
    crankPins.push(pin);

    // Destello de combustión en la cámara superior
    const fMat = new THREE.MeshBasicMaterial({ color: 0xff7b00, transparent: true, opacity: 0 });
    const fSphere = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 16), fMat);
    fSphere.position.set(cx, 0.82, 0);
    autoGroup.add(fSphere);
    combustionSpheres.push(fSphere);

    const pLight = new THREE.PointLight(0xff8800, 0, 2.2);
    pLight.position.set(cx, 0.82, 0);
    autoGroup.add(pLight);
    combustionLights.push(pLight);
  }

  // 2. VOLANTE DE INERCIA (x = -1.45)
  const flywheel = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.16, 36), engineMetal);
  flywheel.rotation.z = Math.PI / 2;
  flywheel.position.set(-1.45, -0.55, 0);
  autoGroup.add(flywheel);
  // Marcas radiales en el volante de inercia para ver su giro
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const mk = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xfff3b0, metalness: 0.5, roughness: 0.3 })
    );
    mk.position.set(Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45);
    flywheel.add(mk);
  }

  // 3. DISCO DE EMBRAGUE Y PLATO DE PRESIÓN (x = -1.15 cuando acoplado, -0.82 cuando pisado)
  const clutchDisc = new THREE.Group();
  clutchDisc.position.set(-1.15, -0.55, 0);
  autoGroup.add(clutchDisc);
  const cPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.12, 32), clutchMat);
  cPlate.rotation.z = Math.PI / 2;
  clutchDisc.add(cPlate);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.16, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })
    );
    pad.position.set(0, Math.cos(a) * 0.36, Math.sin(a) * 0.36);
    clutchDisc.add(pad);
  }

  // Anillo de fricción incandescente cuando el embrague patina
  const sparkRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.05, 16, 36),
    new THREE.MeshBasicMaterial({ color: 0xff9e00, transparent: true, opacity: 0 })
  );
  sparkRing.rotation.y = Math.PI / 2;
  sparkRing.position.set(-1.32, -0.55, 0);
  autoGroup.add(sparkRing);

  // 4. CAJA DE CAMBIOS (PRIMERA MARCHA: engranaje pequeño -> engranaje grande, x = -0.15)
  const gearSmall = makeGear(0.28, 10, 0.24, clutchMat);
  gearSmall.rotation.y = Math.PI / 2;
  gearSmall.position.set(-0.15, -0.55, 0);
  autoGroup.add(gearSmall);

  const gearLarge = makeGear(0.58, 18, 0.24, gearboxMat);
  gearLarge.rotation.y = Math.PI / 2;
  gearLarge.position.set(-0.15, -1.42, 0);
  autoGroup.add(gearLarge);

  // Eje de entrada (conecta embrague con engranaje pequeño)
  const inShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 16), clutchMat);
  inShaft.rotation.z = Math.PI / 2;
  inShaft.position.set(-0.65, -0.55, 0);
  autoGroup.add(inShaft);

  // 5. EJE DE TRANSMISIÓN / CARDÁN (x = -0.15 a +2.65)
  const driveshaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.8, 20), gearboxMat);
  driveshaft.rotation.z = Math.PI / 2;
  driveshaft.position.set(1.25, -1.15, 0);
  autoGroup.add(driveshaft);

  // 6. DIFERENCIAL TRASERO (x = 2.65)
  const diffRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.1, 16, 28), gearboxMat);
  diffRing.position.set(2.65, -1.15, 0);
  autoGroup.add(diffRing);

  // 7. RUEDAS 3D Y MORDAZAS DE FRENO ROJAS
  const wheels: THREE.Group[] = [];
  const brakePads: THREE.Mesh[] = [];
  const wheelCoords: Array<[number, number, number]> = [
    [-2.75, -1.15, 1.95],
    [-2.75, -1.15, -1.95],
    [2.65, -1.15, 1.95],
    [2.65, -1.15, -1.95],
  ];
  const brakeMat = new THREE.MeshStandardMaterial({
    color: 0xff3b3b,
    emissive: 0xff1e1e,
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  for (const [wx, wy, wz] of wheelCoords) {
    const w = makeWheel(0.72, 0.42);
    w.position.set(wx, wy, wz);
    autoGroup.add(w);
    wheels.push(w);

    const bp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.52), brakeMat);
    bp.position.set(wx - 0.38, wy + 0.22, wz);
    autoGroup.add(bp);
    brakePads.push(bp);
  }

  // Anillo luminoso que viaja por la transmisión mostrando el recorrido del torque
  const torquePulse = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.06, 16, 32),
    new THREE.MeshBasicMaterial({ color: 0x5be49b, transparent: true, opacity: 0 })
  );
  torquePulse.rotation.y = Math.PI / 2;
  autoGroup.add(torquePulse);

  // ══════════════════════════════════════════════════════════════════════════
  // GRUPO 2: SISTEMA DE TRANSMISIÓN 3D DE MOTOCICLETA (Etapa 6)
  // ══════════════════════════════════════════════════════════════════════════
  const motoGroup = new THREE.Group();
  motoGroup.position.set(0, -18, 0);
  scene.add(motoGroup);

  const motoCrank = makeGear(0.48, 14, 0.28, engineMetal);
  motoCrank.position.set(-2.3, 0.4, 0);
  motoGroup.add(motoCrank);

  // Embrague multidisco en baño de aceite (5 discos intercalados)
  const motoClutchPlates: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const pMat = i % 2 === 0 ? engineMetal : new THREE.MeshStandardMaterial({ color: 0x5be49b, metalness: 0.7, roughness: 0.25 });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 28), pMat);
    plate.rotation.z = Math.PI / 2;
    plate.position.set(-0.95 + i * 0.11, 0.1, 0);
    motoGroup.add(plate);
    motoClutchPlates.push(plate);
  }

  // Piñón de ataque delantero y corona trasera unidos por cadena 3D
  const sprocketMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.8, roughness: 0.25 });
  const motoSprocketF = makeGear(0.34, 12, 0.16, sprocketMat);
  motoSprocketF.position.set(0.25, -0.35, 0.35);
  motoGroup.add(motoSprocketF);

  const motoSprocketR = makeGear(0.72, 22, 0.16, sprocketMat);
  motoSprocketR.position.set(2.55, -0.35, 0.35);
  motoGroup.add(motoSprocketR);

  // Eslabones de la cadena 3D
  const motoChainLinks: THREE.Mesh[] = [];
  const linkMat = new THREE.MeshStandardMaterial({ color: 0xdce6f7, metalness: 0.85, roughness: 0.2 });
  for (let i = 0; i < 28; i++) {
    const lk = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.22), linkMat);
    motoGroup.add(lk);
    motoChainLinks.push(lk);
  }

  // Rueda trasera de la moto
  const motoWheel = makeWheel(1.18, 0.52);
  motoWheel.position.set(2.55, -0.35, 0);
  motoGroup.add(motoWheel);

  return {
    renderer,
    scene,
    camera,
    autoGroup,
    carBodyMat,
    hoodMesh,
    pistons,
    rods,
    crankPins,
    combustionLights,
    combustionSpheres,
    crankGroup,
    flywheel,
    clutchDisc,
    clutchMat,
    sparkRing,
    gearSmall,
    gearLarge,
    gearboxMat,
    driveshaft,
    diffRing,
    wheels,
    brakePads,
    torquePulse,
    motoGroup,
    motoCrank,
    motoClutchPlates,
    motoSprocketF,
    motoSprocketR,
    motoChainLinks,
    motoWheel,
  };
}

export const VideoExplicativo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rigRef = useRef<Rig3D | null>(null);

  // Estado mecánico determinista en cada instante t
  const enPendienteDetenido = t < A.roza;
  const soltandoEmbrague = t >= A.roza && t < A.primera;
  const subiendoConTorque = t >= A.primera && t < A.pasoSeis;
  const enMoto = t >= A.pasoSeis;

  // RPM del motor
  let rpmMotor = 900;
  if (t >= A.pierde - 0.2 && t < A.aceleramos) {
    rpmMotor = Math.round(lerp(900, 580, Curvas.inOut(seg(t, A.pierde - 0.2, A.aceleramos - 0.1))));
  } else if (t >= A.aceleramos) {
    rpmMotor = Math.round(lerp(580, 2200, Curvas.out(seg(t, A.aceleramos, A.primera + 0.5))));
  }

  // Acoplamiento del embrague (0 = pisado/separado, 1 = suelto/acoplado)
  let acoplamiento = 0;
  if (t >= A.pasoDos && t < A.pasoTres) {
    acoplamiento = 1; // En Etapa 2 mostramos cómo fluye todo el camino
  } else if (t >= A.roza) {
    acoplamiento = Curvas.inOut(seg(t, A.roza, A.primera + 0.3));
  }

  // RPM de las ruedas y torque en la rueda (Nm)
  const rpmRueda = Math.round(
    t >= A.pasoDos && t < A.pasoTres
      ? 65
      : t >= A.patina
      ? lerp(0, 155, Curvas.inOut(seg(t, A.patina, A.supera)))
      : 0
  );
  const torqueRuedaNm = Math.round(
    t < A.roza ? 0 : lerp(40, 1960, Curvas.out(seg(t, A.roza, A.catorce + 0.5)))
  );

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    if (!rigRef.current) {
      rigRef.current = buildScene(canvasRef.current);
    }
    const R = rigRef.current;

    // Inclinación de la pendiente (16 grados en las vistas de carro en subida, horizontal en primer plano técnico)
    const uVistaInterior =
      Curvas.inOut(seg(t, A.pasoUno - 0.2, A.pasoUno + 0.5)) *
      (1 - Curvas.inOut(seg(t, A.pasoCinco - 0.2, A.pasoCinco + 0.5)));
    R.autoGroup.rotation.z = lerp(0.27, 0.04, uVistaInterior);

    // Avance del carro subiendo la pendiente en Etapa 5
    const uAvanceSubida = t >= A.llanta ? Curvas.inOut(seg(t, A.llanta, A.pasoSeis - 0.3)) : 0;
    R.autoGroup.position.set(-uAvanceSubida * 1.8, -uAvanceSubida * 0.5, 0);

    // Transparencia del capó al atravesarlo la cámara
    const uAbreCapo = Curvas.inOut(seg(t, 1.0, 2.2));
    R.hoodMesh.position.y = 0.32 + uAbreCapo * 1.4;
    (R.hoodMesh.material as THREE.MeshPhysicalMaterial).opacity = Math.max(0.05, 0.45 * (1 - uAbreCapo));

    // 1. Cinemática exacta 3D de los 4 pistones, bielas y cigüeñal
    const crankAngle = t * (rpmMotor / 60) * Math.PI * 2 * 0.18;
    R.crankGroup.rotation.x = crankAngle;
    R.flywheel.rotation.x = crankAngle;

    const rCrank = 0.24;
    const rodLen = 0.68;
    const offsets = [-0.78, -0.26, 0.26, 0.78];
    const phases = [0, Math.PI, Math.PI, 0];

    for (let i = 0; i < 4; i++) {
      const theta = crankAngle + phases[i];
      const py = Math.cos(theta) * rCrank;
      const pz = Math.sin(theta) * rCrank;
      const pistonY = -0.55 + py + Math.sqrt(Math.max(0.05, rodLen * rodLen - pz * pz));
      R.pistons[i].position.set(-2.8 + offsets[i], pistonY, 0);

      // La biela une el pistón con la muñequilla del cigüeñal
      const rod = R.rods[i];
      rod.position.set(-2.8 + offsets[i], (pistonY + (-0.55 + py)) * 0.5, pz * 0.5);
      rod.rotation.x = Math.atan2(pz, pistonY - (-0.55 + py));

      // Explosión de combustión en el punto muerto superior (PMS)
      const flash = Math.pow(Math.max(0, Math.cos(theta - 0.15)), 8);
      (R.combustionSpheres[i].material as THREE.MeshBasicMaterial).opacity = flash * 0.92;
      R.combustionSpheres[i].scale.setScalar(0.7 + 0.5 * flash);
      R.combustionLights[i].intensity = flash * 3.5;
    }

    // 2. Posición y giro del embrague 3D (separado cuando está pisado vs rozando)
    const gapEmbrague = (1 - acoplamiento) * 0.34;
    R.clutchDisc.position.x = -1.22 + gapEmbrague;

    const transAngle = crankAngle * acoplamiento;
    R.clutchDisc.rotation.x = transAngle;
    R.gearSmall.rotation.z = transAngle;
    R.gearLarge.rotation.z = -transAngle * 0.35; // Multiplicación de primera marcha
    R.driveshaft.rotation.x = transAngle * 0.35;
    R.diffRing.rotation.x = transAngle * 0.28;

    // Color pedagógico: Azul (#4FB3FF) cuando está detenido, Naranja/Verde (#5BE49B) cuando transmite torque
    const colTrans = new THREE.Color(0x4fb3ff).lerp(new THREE.Color(0x5be49b), acoplamiento);
    R.clutchMat.color.copy(colTrans);
    R.gearboxMat.color.copy(colTrans);

    // Anillo incandescente de fricción cuando el embrague patina (Etapa 4)
    const uPatina = soltandoEmbrague ? Math.sin(seg(t, A.roza, A.primera) * Math.PI) : 0;
    (R.sparkRing.material as THREE.MeshBasicMaterial).opacity = uPatina * 0.9;
    R.sparkRing.scale.setScalar(1 + 0.12 * Math.sin(t * 25));

    // Giro de las 4 ruedas 3D y presión de los frenos rojos
    const wheelAngle = t >= A.pasoDos && t < A.pasoTres ? t * 2.5 : t >= A.patina ? (t - A.patina) * acoplamiento * 3.2 : 0;
    for (const w of R.wheels) {
      w.rotation.z = -wheelAngle;
    }
    const frenoActivo = t < A.roza ? 1 : Math.max(0, 1 - Curvas.out(seg(t, A.roza, A.patina)));
    for (const bp of R.brakePads) {
      (bp.material as THREE.MeshStandardMaterial).emissiveIntensity = frenoActivo * 1.1;
    }

    // Pulso luminoso que recorre todo el tren motriz en Etapa 2
    if (t >= A.pasoDos && t < A.pasoTres) {
      const uRecorrido = ((t - A.pasoDos) * 0.45) % 1;
      R.torquePulse.position.set(lerp(-3.2, 2.65, uRecorrido), lerp(-0.55, -1.15, uRecorrido), 0);
      (R.torquePulse.material as THREE.MeshBasicMaterial).opacity = 0.85;
    } else {
      (R.torquePulse.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    // 3. Animación 3D de la Motocicleta (Etapa 6)
    if (enMoto) {
      R.autoGroup.visible = false;
      R.motoGroup.visible = true;
      R.motoGroup.position.set(0, 0, 0);
      R.motoCrank.rotation.z = crankAngle;
      const uMotoClutch = Curvas.inOut(seg(t, A.maneta, A.cadena));
      R.motoClutchPlates.forEach((pl, idx) => {
        pl.position.x = -0.95 + idx * (0.11 + (1 - uMotoClutch) * 0.08);
        pl.rotation.x = idx % 2 === 0 ? crankAngle : crankAngle * uMotoClutch;
      });
      R.motoSprocketF.rotation.z = -crankAngle * 0.5;
      R.motoSprocketR.rotation.z = -crankAngle * 0.22;
      R.motoWheel.rotation.z = -crankAngle * 0.22;

      // Animar eslabones de la cadena alrededor del piñón y la corona
      const nLinks = R.motoChainLinks.length;
      for (let i = 0; i < nLinks; i++) {
        const u = ((i / nLinks) + t * 0.65) % 1;
        let lx = 0;
        let ly = 0;
        if (u < 0.4) {
          const s = u / 0.4;
          lx = lerp(0.25, 2.55, s);
          ly = lerp(-0.02, 0.35, s);
        } else if (u < 0.55) {
          const a = ((u - 0.4) / 0.15) * Math.PI;
          lx = 2.55 + Math.sin(a) * 0.72;
          ly = -0.35 + Math.cos(a) * 0.72;
        } else if (u < 0.9) {
          const s = (u - 0.55) / 0.35;
          lx = lerp(2.55, 0.25, s);
          ly = lerp(-1.07, -0.68, s);
        } else {
          const a = ((u - 0.9) / 0.1) * Math.PI;
          lx = 0.25 - Math.sin(a) * 0.34;
          ly = -0.35 - Math.cos(a) * 0.34;
        }
        R.motoChainLinks[i].position.set(lx, ly, 0.35);
      }
    } else {
      R.autoGroup.visible = true;
      R.motoGroup.visible = false;
    }

    // ══════════════════════════════════════════════════════════════════════
    // COREOGRAFÍA DE CÁMARA 3D CINEMATOGRÁFICA (14 PLANOS Y ÁNGULOS 3D)
    // ══════════════════════════════════════════════════════════════════════
    type CamKeyframe = { t: number; pos: [number, number, number]; look: [number, number, number]; dur?: number };
    const keyframes: CamKeyframe[] = [
      // Hook: Auto detenido en la pendiente -> atraviesa el capó al interior del motor -> vuelve a las ruedas quietas
      { t: 0, pos: [0.5, 0.8, 11.2], look: [0, -0.4, 0] },
      { t: 1.2, pos: [-2.8, 0.5, 3.3], look: [-2.8, -0.1, 0], dur: 1.1 },
      { t: A.mueve - 0.2, pos: [-2.6, -1.0, 4.4], look: [-2.75, -1.15, 1.5], dur: 0.95 },
      { t: A.imagina, pos: [0.6, 1.1, 10.8], look: [0, -0.4, 0], dur: 1.1 },
      { t: A.novecientas1 - 0.2, pos: [-2.7, 0.3, 3.5], look: [-2.8, -0.2, 0], dur: 1.0 },
      // Etapa 1: El motor por dentro (pistones, biela y cigüeñal en primer plano 3D)
      { t: A.pasoUno, pos: [-2.8, 0.25, 3.1], look: [-2.8, -0.15, 0], dur: 0.95 },
      { t: A.biela - 0.1, pos: [-1.9, -0.25, 2.7], look: [-2.8, -0.35, 0], dur: 0.95 },
      { t: A.detuviera - 0.1, pos: [-3.6, 0.1, 3.2], look: [-2.6, -0.4, 0], dur: 0.95 },
      // Etapa 2: El recorrido de la fuerza desde el cigüeñal hasta las ruedas
      { t: A.pasoDos, pos: [-1.8, 0.4, 4.6], look: [-1.4, -0.6, 0], dur: 0.95 },
      { t: A.caja1 - 0.1, pos: [0.2, 0.2, 4.8], look: [-0.2, -0.85, 0], dur: 0.95 },
      { t: A.diferencial - 0.1, pos: [2.4, 0.3, 5.2], look: [2.2, -1.1, 0], dur: 0.95 },
      // Etapa 3: El experimento en la pendiente (embrague separado vs volante girando + frenos rojos)
      { t: A.pasoTres, pos: [-1.1, 0.15, 3.3], look: [-1.25, -0.55, 0], dur: 0.95 },
      { t: A.detenidos - 0.1, pos: [0.3, 0.5, 6.4], look: [0.1, -0.8, 0], dur: 1.0 },
      { t: A.frenos - 0.2, pos: [-2.5, -0.8, 4.2], look: [-2.75, -1.1, 1.5], dur: 0.95 },
      // Etapa 4: Soltando el embrague (roce, patinado y multiplicación 14x en primera marcha)
      { t: A.pasoCuatro, pos: [-1.2, 0.1, 3.1], look: [-1.25, -0.55, 0], dur: 0.95 },
      { t: A.primera - 0.1, pos: [-0.15, -0.6, 3.4], look: [-0.15, -0.95, 0], dur: 0.95 },
      // Etapa 5: Física real (equilibrio de fuerzas en la subida)
      { t: A.pasoCinco, pos: [0.4, 0.8, 9.6], look: [0, -0.5, 0], dur: 1.05 },
      { t: A.llanta - 0.1, pos: [1.8, -0.6, 5.0], look: [2.2, -1.15, 1.2], dur: 0.95 },
      // Etapa 6: Comparación 3D con la Motocicleta
      { t: A.pasoSeis, pos: [0.2, 0.6, 6.8], look: [0.2, -0.2, 0], dur: 0.95 },
      { t: A.cadena - 0.1, pos: [1.5, -0.1, 4.6], look: [1.4, -0.35, 0], dur: 0.95 },
    ];

    let px = keyframes[0].pos[0];
    let py = keyframes[0].pos[1];
    let pz = keyframes[0].pos[2];
    let lx = keyframes[0].look[0];
    let ly = keyframes[0].look[1];
    let lz = keyframes[0].look[2];

    for (let i = 1; i < keyframes.length; i++) {
      const kf = keyframes[i];
      const d = kf.dur ?? 0.95;
      if (t <= kf.t - d) break;
      const u = Curvas.inOut(seg(t, kf.t - d, kf.t));
      px = lerp(px, kf.pos[0], u);
      py = lerp(py, kf.pos[1], u);
      pz = lerp(pz, kf.pos[2], u);
      lx = lerp(lx, kf.look[0], u);
      ly = lerp(ly, kf.look[1], u);
      lz = lerp(lz, kf.look[2], u);
    }

    R.camera.position.set(px, py, pz);
    R.camera.lookAt(lx, ly, lz);
    R.renderer.render(R.scene, R.camera);
  }, [frame, fps, t, rpmMotor, acoplamiento, soltandoEmbrague, enMoto]);

  // Determinar qué etapa pedagógica se muestra en el HUD superior
  let tituloEtapa = 'HOOK · EL MISTERIO EN LA PENDIENTE';
  let subtituloEtapa = 'MOTOR GIRANDO A 900 RPM · RUEDAS A 0 RPM';
  let colorEtapa = '#FF8A5B';

  if (t >= A.pasoUno && t < A.pasoDos) {
    tituloEtapa = 'ETAPA 1 · EL MOTOR POR DENTRO';
    subtituloEtapa = 'COMBUSTIÓN → PISTÓN (LINEAL) → BIELA → CIGÜEÑAL (GIRO)';
    colorEtapa = '#FF8A5B';
  } else if (t >= A.pasoDos && t < A.pasoTres) {
    tituloEtapa = 'ETAPA 2 · EL RECORRIDO DEL TORQUE';
    subtituloEtapa = 'CIGÜEÑAL → VOLANTE → EMBRAGUE → CAJA → CARDÁN → DIFERENCIAL';
    colorEtapa = '#4FB3FF';
  } else if (t >= A.pasoTres && t < A.pasoCuatro) {
    tituloEtapa = 'ETAPA 3 · DETENIDO EN LA PENDIENTE';
    subtituloEtapa = 'EMBRAGUE SEPARADO (DESCONECTADO) + FRENO ACTIVO';
    colorEtapa = '#FF5A5F';
  } else if (t >= A.pasoCuatro && t < A.pasoCinco) {
    tituloEtapa = 'ETAPA 4 · PUNTO DE CORTE Y 1.ª MARCHA';
    subtituloEtapa = 'FRICCIÓN PROGRESIVA + MULTIPLICACIÓN DE TORQUE ×14';
    colorEtapa = '#5BE49B';
  } else if (t >= A.pasoCinco && t < A.pasoSeis) {
    tituloEtapa = 'ETAPA 5 · FÍSICA: ¿QUÉ SOSTIENE EL PESO?';
    subtituloEtapa = 'FUERZA EN LLANTA (F = τ / r) > GRAVEDAD (m·g·sen θ)';
    colorEtapa = '#FFD166';
  } else if (t >= A.pasoSeis) {
    tituloEtapa = 'ETAPA 6 · COMPARACIÓN CON MOTOCICLETA';
    subtituloEtapa = 'EMBRAGUE MULTIDISCO + CAJA + CADENA → RUEDA TRASERA';
    colorEtapa = '#5BE49B';
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#090D16', fontFamily: 'Bricolage', color: '#F3EEE6' }}>
      <FuentesExplica />

      {/* Lienzo 3D WebGL (Three.js) a resolución completa 1080×1920 */}
      <canvas ref={canvasRef} width={1080} height={1920} style={{ width: 1080, height: 1920, display: 'block' }} />

      {/* ════════════════════════════════════════════════════════════════════
          HUD SUPERIOR: BANNER DE LA CLASE MAGISTRAL Y TELEMETRÍA EN VIVO
          ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          left: 55,
          right: 55,
          top: 65,
          padding: '20px 30px',
          borderRadius: 24,
          background: 'rgba(10, 14, 24, 0.86)',
          border: `2px solid ${colorEtapa}`,
          boxShadow: '0 20px 50px rgba(0,0,0,0.75)',
        }}
      >
        <div style={{ fontFamily: 'Mono', fontSize: 25, fontWeight: 700, letterSpacing: 3, color: colorEtapa }}>
          {tituloEtapa}
        </div>
        <div style={{ fontSize: 38, fontWeight: 700, marginTop: 4, letterSpacing: -0.5 }}>{subtituloEtapa}</div>
      </div>

      {/* PANEL DE TELEMETRÍA MECÁNICA EN TIEMPO REAL (RPM MOTOR vs RPM RUEDA vs TORQUE) */}
      <div
        style={{
          position: 'absolute',
          left: 55,
          right: 55,
          top: 235,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 18,
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '16px 22px',
            borderRadius: 20,
            background: 'rgba(12, 17, 29, 0.86)',
            border: '2px solid rgba(255, 138, 91, 0.55)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'Mono', fontSize: 22, color: '#FFB088', letterSpacing: 2 }}>GIRO MOTOR</div>
          <div style={{ fontSize: 56, fontWeight: 700, color: '#FF8A5B', letterSpacing: -2 }}>{rpmMotor} RPM</div>
          <div style={{ fontFamily: 'Mono', fontSize: 20, color: '#5BE49B' }}>● GIRANDO</div>
        </div>

        <div
          style={{
            flex: 1,
            padding: '16px 22px',
            borderRadius: 20,
            background: 'rgba(12, 17, 29, 0.86)',
            border: `2px solid ${acoplamiento > 0.1 ? 'rgba(91,228,155,0.6)' : 'rgba(79,179,255,0.5)'}`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'Mono', fontSize: 22, color: '#8FD3FF', letterSpacing: 2 }}>EMBRAGUE</div>
          <div style={{ fontSize: 44, fontWeight: 700, color: '#FFF', marginTop: 6 }}>
            {acoplamiento < 0.05 ? 'SEPARADO' : acoplamiento < 0.85 ? 'ROZANDO' : 'ACOPLADO'}
          </div>
          <div style={{ fontFamily: 'Mono', fontSize: 20, color: acoplamiento > 0.1 ? '#5BE49B' : '#FF5A5F' }}>
            {Math.round(acoplamiento * 100)} % TORQUE
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: '16px 22px',
            borderRadius: 20,
            background: 'rgba(12, 17, 29, 0.86)',
            border: `2px solid ${rpmRueda > 0 ? 'rgba(91,228,155,0.6)' : 'rgba(255,90,95,0.5)'}`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'Mono', fontSize: 22, color: '#8FD3FF', letterSpacing: 2 }}>RUEDAS</div>
          <div style={{ fontSize: 56, fontWeight: 700, color: rpmRueda > 0 ? '#5BE49B' : '#4FB3FF', letterSpacing: -2 }}>
            {rpmRueda} RPM
          </div>
          <div style={{ fontFamily: 'Mono', fontSize: 20, color: rpmRueda > 0 ? '#5BE49B' : '#FF8A8D' }}>
            {rpmRueda > 0 ? `${torqueRuedaNm} Nm` : enPendienteDetenido ? 'FRENO ACTIVO' : 'QUIETAS'}
          </div>
        </div>
      </div>

      {/* ETIQUETAS VISUALES FLOTANTES SEGÚN LA ETAPA */}
      {/* Etapa 3: Qué gira vs Qué está detenido */}
      {t >= A.pasoTres && t < A.pasoCuatro && (
        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: 1210,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 22,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '20px 24px',
              borderRadius: 22,
              background: 'rgba(22, 16, 14, 0.9)',
              border: '2px solid #FF8A5B',
            }}
          >
            <div style={{ fontFamily: 'Mono', fontSize: 24, color: '#FF8A5B', fontWeight: 700 }}>
              PIEZA EN NARANJA (GIRA)
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, marginTop: 4 }}>Pistones + Cigüeñal + Volante</div>
          </div>
          <div
            style={{
              flex: 1,
              padding: '20px 24px',
              borderRadius: 22,
              background: 'rgba(12, 20, 32, 0.9)',
              border: '2px solid #4FB3FF',
            }}
          >
            <div style={{ fontFamily: 'Mono', fontSize: 24, color: '#4FB3FF', fontWeight: 700 }}>
              PIEZA EN AZUL (QUIETA)
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, marginTop: 4 }}>Embrague + Caja + Ruedas</div>
          </div>
        </div>
      )}

      {/* Etapa 5: Tabla comparativa Torque vs Fuerza vs RPM vs Velocidad */}
      {t >= A.pasoCinco && t < A.pasoSeis && (
        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: 1150,
            padding: '22px 30px',
            borderRadius: 24,
            background: 'rgba(10, 15, 26, 0.92)',
            border: '2px solid #FFD166',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <div>
            <span style={{ color: '#FF8A5B', fontWeight: 700, fontSize: 34 }}>RPM:</span>{' '}
            <span style={{ fontSize: 32 }}>Velocidad de giro del motor</span>
          </div>
          <div>
            <span style={{ color: '#5BE49B', fontWeight: 700, fontSize: 34 }}>TORQUE (Nm):</span>{' '}
            <span style={{ fontSize: 32 }}>Fuerza de torsión en el eje</span>
          </div>
          <div>
            <span style={{ color: '#4FB3FF', fontWeight: 700, fontSize: 34 }}>FUERZA (N):</span>{' '}
            <span style={{ fontSize: 32 }}>Empuje de la llanta al suelo</span>
          </div>
          <div>
            <span style={{ color: '#FFD166', fontWeight: 700, fontSize: 34 }}>GRAVEDAD:</span>{' '}
            <span style={{ fontSize: 32 }}>Peso que tira cuesta abajo</span>
          </div>
        </div>
      )}

      {/* Subtítulos palabra a palabra sincronizados */}
      <SubtitulosExplica
        tl={tl}
        claves={[
          'girando',
          'mueve',
          'pendiente',
          'apagarse',
          'novecientas',
          'pistón',
          'biela',
          'cigüeñal',
          'volante',
          'embrague',
          'caja',
          'diferencial',
          'separas',
          'detenidos',
          'frenos',
          'roza',
          'patina',
          'torque',
          'primera',
          'catorce',
          'revoluciones',
          'tuerce',
          'fricción',
          'gravedad',
          'motocicleta',
          'discos',
          'cadena',
        ]}
      />
    </AbsoluteFill>
  );
};
