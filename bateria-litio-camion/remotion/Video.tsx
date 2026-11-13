import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  crearAnclas,
  CamaraEscena,
  SubtitulosExplica,
  FuentesExplica,
  Curvas,
  seg,
  limita,
  lerp,
  TimelineData,
  CamaraClave,
} from '../../.agents/skills/videos-explicativos-claude/motor/remotion-kit';
import timelineJson from '../voz/timeline.json';

const tl = timelineJson as TimelineData;
const { en } = crearAnclas(tl);

export const A = {
  bateria1: en('batería', 1),
  camion1: en('camión', 1),
  diez: en('diez'),
  vapeador: en('vapeador'),
  bolsa: en('bolsa'),
  pala: en('pala'),
  aplasta: en('aplasta'),
  dosMil: en('dos mil'),
  dentro: en('dentro', 2),
  rompe: en('rompe'),
  lamina: en('lámina'),
  polos: en('polos'),
  tocarse: en('tocarse'),
  chispa: en('chispa'),
  fuga: en('fuga'),
  seiscientos: en('seiscientos'),
  oxigeno: en('oxígeno'),
  gas: en('gas'),
  carton: en('cartón'),
  horno: en('horno'),
  agua: en('agua'),
  humo: en('humo'),
  abre: en('abre'),
  ardiendo: en('ardiendo'),
  calle: en('calle'),
  salvar: en('salvar'),
};

export const EVENTOS_SONIDO = [
  { t: 0.05, tipo: 'whoosh', vol: 0.85 },
  { t: A.bateria1, tipo: 'pop', vol: 0.6 },
  { t: A.diez, tipo: 'feedback', vol: 0.8 },
  { t: A.vapeador - 0.3, tipo: 'whoosh', vol: 0.6 },
  { t: A.vapeador, tipo: 'pop', vol: 0.65 },
  { t: A.pala - 0.3, tipo: 'whoosh', vol: 0.6 },
  { t: A.aplasta, tipo: 'feedback', vol: 0.85 },
  { t: A.dosMil, tipo: 'click', vol: 0.75 },
  { t: A.dentro - 0.35, tipo: 'whoosh', vol: 0.65 },
  { t: A.rompe, tipo: 'click', vol: 0.9 },
  { t: A.chispa, tipo: 'feedback', vol: 0.95 },
  { t: A.fuga - 0.3, tipo: 'whoosh', vol: 0.65 },
  { t: A.seiscientos, tipo: 'notificacion', vol: 0.75 },
  { t: A.oxigeno, tipo: 'swoosh', vol: 0.75 },
  { t: A.carton - 0.35, tipo: 'whoosh', vol: 0.65 },
  { t: A.horno, tipo: 'feedback', vol: 0.8 },
  { t: A.humo - 0.35, tipo: 'whoosh', vol: 0.65 },
  { t: A.abre, tipo: 'click', vol: 0.8 },
  { t: A.ardiendo, tipo: 'swoosh', vol: 0.85 },
  { t: A.salvar, tipo: 'dinero', vol: 0.75 },
];

const CAMARAS: CamaraClave[] = [
  { t: 0, x: 540, y: 540, z: 1.18, r: -1.5, rx: 6, ry: -8 },
  { t: A.camion1, x: 520, y: 560, z: 0.96, r: 0.6, rx: 4, ry: 5, dur: 0.85 },
  { t: A.vapeador - 0.1, x: 740, y: 600, z: 1.62, r: -1.8, rx: 7, ry: -10, dur: 0.9 },
  { t: A.pala - 0.1, x: 640, y: 555, z: 1.38, r: 1.2, rx: -5, ry: 8, dur: 0.85 },
  { t: A.dosMil - 0.1, x: 690, y: 575, z: 1.55, r: -2.0, rx: 8, ry: -8, dur: 0.8 },
  // Escena 2: Interior microscópico de la batería (y = 1920)
  { t: A.dentro - 0.1, x: 540, y: 1910, z: 1.05, r: 0, rx: 6, ry: -6, dur: 0.95 },
  { t: A.rompe - 0.1, x: 540, y: 1910, z: 1.24, r: -1.4, rx: -6, ry: 9, dur: 0.8 },
  { t: A.chispa - 0.1, x: 540, y: 1905, z: 1.32, r: 1.8, rx: 8, ry: -10, dur: 0.75 },
  // Escena 3: Fuga térmica a 600 °C (y = 3180)
  { t: A.fuga - 0.1, x: 540, y: 3180, z: 1.14, r: -0.8, rx: 5, ry: 6, dur: 0.95 },
  { t: A.seiscientos - 0.1, x: 460, y: 3150, z: 1.42, r: 1.2, rx: 7, ry: -8, dur: 0.85 },
  { t: A.oxigeno - 0.1, x: 580, y: 3200, z: 1.22, r: -1.0, rx: -5, ry: 7, dur: 0.85 },
  // Escena 4: La tolva convertida en horno (y = 4440)
  { t: A.carton - 0.1, x: 540, y: 4440, z: 1.12, r: 0.5, rx: 5, ry: -5, dur: 0.95 },
  { t: A.horno - 0.1, x: 490, y: 4430, z: 1.44, r: -1.5, rx: 7, ry: 8, dur: 0.85 },
  { t: A.agua - 0.1, x: 610, y: 4420, z: 1.18, r: 0.8, rx: -4, ry: -6, dur: 0.85 },
  // Escena 5: Descarga de emergencia en la calle (y = 5700)
  { t: A.humo - 0.1, x: 480, y: 5680, z: 1.16, r: -0.8, rx: 5, ry: 6, dur: 0.95 },
  { t: A.abre - 0.1, x: 640, y: 5660, z: 1.45, r: 1.5, rx: -6, ry: -9, dur: 0.85 },
  { t: A.calle - 0.1, x: 540, y: 5710, z: 1.02, r: -0.5, rx: 4, ry: 4, dur: 0.95 },
  { t: A.salvar, x: 500, y: 5680, z: 0.94, r: 0, rx: 3, ry: -3, dur: 1.0 },
];

export const VideoExplicativo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Cálculos de animación por escena
  // Escena 1
  const uPrensa = Curvas.inOut(seg(t, A.pala - 0.1, A.aplasta + 0.35));
  const psiVal = Math.round(lerp(0, 2000, Curvas.out(seg(t, A.aplasta - 0.1, A.dosMil + 0.4))));
  const visRayosX = Curvas.out(seg(t, A.vapeador - 0.2, A.vapeador + 0.3));

  // Escena 2
  const uAplastaCelda = Curvas.inOut(seg(t, A.dentro, A.rompe + 0.2));
  const uRompeSep = Curvas.out(seg(t, A.rompe - 0.05, A.tocarse + 0.2));
  const uChispa = Curvas.out(seg(t, A.chispa - 0.1, A.chispa + 0.25));

  // Escena 3
  const tempVal = Math.round(lerp(28, 600, Curvas.out(seg(t, A.fuga, A.seiscientos + 0.35))));
  const uGases = Curvas.out(seg(t, A.oxigeno - 0.1, A.gas + 0.5));

  // Escena 4
  const uHorno = Curvas.inOut(seg(t, A.carton - 0.1, A.horno + 0.3));
  const uAgua = Curvas.out(seg(t, A.agua - 0.2, A.agua + 0.4));

  // Escena 5
  const uCompuerta = Curvas.inOut(seg(t, A.abre - 0.1, A.abre + 0.45));
  const uDescarga = Curvas.out(seg(t, A.ardiendo - 0.1, A.calle + 0.4));
  const uAvanzaCamion = Curvas.inOut(seg(t, A.calle, A.salvar + 0.5));

  return (
    <AbsoluteFill style={{ backgroundColor: '#0B0E17', fontFamily: 'Bricolage', color: '#F3EEE6' }}>
      <FuentesExplica />

      <CamaraEscena
        claves={CAMARAS}
        sacudida={[
          [A.aplasta, 18],
          [A.rompe, 16],
          [A.chispa, 22],
          [A.horno, 16],
          [A.ardiendo, 14],
        ]}
      >
        <defs>
          <linearGradient id="g-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0B101D" />
            <stop offset="0.5" stopColor="#121A2D" />
            <stop offset="1" stopColor="#090D16" />
          </linearGradient>
          <linearGradient id="g-camion" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2E7D32" />
            <stop offset="1" stopColor="#1B4D20" />
          </linearGradient>
          <linearGradient id="g-fuego" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#FFF3B0" />
            <stop offset="0.45" stopColor="#FF7B29" />
            <stop offset="1" stopColor="#E62E2D" stopOpacity="0.15" />
          </linearGradient>
          <pattern id="p-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0 L0 0 L0 60" fill="none" stroke="rgba(143,211,255,0.07)" strokeWidth="2" />
          </pattern>
        </defs>

        {/* Fondo global con cuadrícula técnica */}
        <rect x={-1600} y={-800} width={4400} height={8200} fill="url(#g-bg)" />
        <rect x={-1600} y={-800} width={4400} height={8200} fill="url(#p-grid)" />

        {/* ════════════════════════════════════════════════════════════════════
            ESCENA 1 · EL CAMIÓN, EL VAPE OCULTO Y LA PRENSA DE 2.000 PSI (y = 540)
            ════════════════════════════════════════════════════════════════════ */}
        <g transform="translate(0, 0)">
          {/* Asfalto */}
          <rect x={-600} y={720} width={2400} height={240} fill="#151924" />
          <line x1={-600} y1={720} x2={1800} y2={720} stroke="#3B465E" strokeWidth={6} />
          <line x1={-400} y1={820} x2={1600} y2={820} stroke="#FFD166" strokeWidth={8} strokeDasharray="48 36" opacity={0.65} />

          {/* Camión recolector en corte lateral */}
          <g transform="translate(150, 350)">
            {/* Cabina */}
            <path d="M0 110 L155 110 L195 190 L195 315 L0 315 Z" fill="#E8EEF5" stroke="#8FA3C4" strokeWidth={6} />
            <path d="M110 128 L150 128 L178 184 L110 184 Z" fill="#1A2942" />
            {/* Caja compactadora abierta en sección */}
            <rect x={210} y={40} width={560} height={275} rx={18} fill="#162234" stroke="#5BE49B" strokeWidth={7} />
            {/* Tolva trasera */}
            <path d="M770 40 L900 80 L900 315 L770 315 Z" fill="#1C2B42" stroke="#8FA3C4" strokeWidth={6} />

            {/* Ruedas */}
            <circle cx={95} cy={335} r={48} fill="#10141D" stroke="#8FA3C4" strokeWidth={10} />
            <circle cx={340} cy={335} r={48} fill="#10141D" stroke="#8FA3C4" strokeWidth={10} />
            <circle cx={680} cy={335} r={48} fill="#10141D" stroke="#8FA3C4" strokeWidth={10} />

            {/* Bolsa de basura en la tolva con visión de Rayos X */}
            <g transform={`translate(${610 - uPrensa * 55}, 195) scale(${1 - uPrensa * 0.22}, ${1 + uPrensa * 0.12})`}>
              <path d="M-95 95 C-110 10 -70 -55 0 -65 C70 -55 110 10 95 95 Z" fill="#232B3A" stroke="#6C7D99" strokeWidth={5} />
              {/* Círculo de Rayos X mostrando el vapeador y celular con batería de litio */}
              <g opacity={Math.max(0.35, visRayosX)}>
                <circle cx={0} cy={22} r={68} fill="#0D1524" stroke="#FF8A5B" strokeWidth={5} strokeDasharray="12 8" />
                {/* Vapeador desechable */}
                <rect x={-42} y={-18} width={34} height={78} rx={8} fill="#2A3952" stroke="#4FB3FF" strokeWidth={4} />
                <rect x={-34} y={0} width={18} height={44} rx={4} fill="#FF5A5F" />
                {/* Celular viejo */}
                <rect x={6} y={-22} width={44} height={82} rx={8} fill="#1E293B" stroke="#8FA3C4" strokeWidth={4} />
                <rect x={14} y={-4} width={28} height={48} rx={4} fill="#FF8A5B" />
              </g>
            </g>

            {/* Pala hidráulica compactadora que baja con 2.000 PSI */}
            <g transform={`translate(${760 - uPrensa * 135}, ${85 + uPrensa * 85}) rotate(${-18 + uPrensa * 26})`}>
              <line x1={80} y1={-95} x2={0} y2={0} stroke="#9BA8BE" strokeWidth={22} strokeLinecap="round" />
              <rect x={-35} y={-15} width={70} height={115} rx={10} fill="#FF8A5B" stroke="#FFF" strokeWidth={5} />
            </g>

            {/* Fuego inicial en el gancho (0 a 3 s) */}
            {t < A.vapeador - 0.2 && (
              <g opacity={0.9}>
                <circle cx={580} cy={180} r={95 + Math.sin(t * 14) * 12} fill="url(#g-fuego)" />
                <circle cx={520} cy={150} r={75 + Math.cos(t * 11) * 10} fill="url(#g-fuego)" />
              </g>
            )}
          </g>
        </g>

        {/* ════════════════════════════════════════════════════════════════════
            ESCENA 2 · CORTE INTERNO DE LA BATERÍA: LÁMINA ROTA Y CHISPA (y = 1920)
            ════════════════════════════════════════════════════════════════════ */}
        <g transform="translate(540, 1920)">
          <text
            x={0}
            y={-305}
            textAnchor="middle"
            fill="#8FD3FF"
            style={{ fontFamily: 'Mono', fontSize: 30, fontWeight: 700, letterSpacing: 4 }}
          >
            INTERIOR DE LA BATERÍA DE LITIO
          </text>

          {/* Carcasa cilíndrica aplastada por las flechas de presión */}
          <g transform={`scale(${1 - uAplastaCelda * 0.16}, ${1 + uAplastaCelda * 0.06})`}>
            <rect
              x={-340}
              y={-260}
              width={680}
              height={520}
              rx={42}
              fill="#131B2E"
              stroke={uChispa > 0.1 ? '#FF5A5F' : '#8FA3C4'}
              strokeWidth={10}
            />

            {/* Polo negativo: ÁNODO (-) */}
            <rect x={-295} y={-215} width={225} height={430} rx={22} fill="#1D3557" stroke="#4FB3FF" strokeWidth={6} />
            <text x={-182} y={-145} textAnchor="middle" fill="#8FD3FF" style={{ fontSize: 42, fontWeight: 700 }}>
              ÁNODO (−)
            </text>

            {/* Polo positivo: CÁTODO (+) */}
            <rect x={70} y={-215} width={225} height={430} rx={22} fill="#3B1D2E" stroke="#FF8A5B" strokeWidth={6} />
            <text x={182} y={-145} textAnchor="middle" fill="#FFB088" style={{ fontSize: 42, fontWeight: 700 }}>
              CÁTODO (+)
            </text>

            {/* Lámina separadora central que se rompe */}
            {uRompeSep < 0.35 ? (
              <rect x={-20} y={-225} width={40} height={450} rx={8} fill="#5BE49B" />
            ) : (
              <g>
                <path d="M-20 -225 L20 -225 L16 -45 L-22 -15 Z" fill="#5BE49B" />
                <path d="M-18 45 L22 20 L20 225 L-20 225 Z" fill="#5BE49B" />
                {/* Trozos rotos de la lámina */}
                <polygon
                  points="-10,-25 28,-5 8,28 -25,10"
                  fill="#5BE49B"
                  transform={`translate(${uRompeSep * 45}, ${-uRompeSep * 20}) rotate(${uRompeSep * 38})`}
                />
              </g>
            )}

            {/* Etiqueta de la lámina separadora */}
            <text x={0} y={285} textAnchor="middle" fill="#5BE49B" style={{ fontFamily: 'Mono', fontSize: 28, fontWeight: 700, letterSpacing: 3 }}>
              LÁMINA SEPARADORA
            </text>

            {/* Chispa y cortocircuito al tocarse los polos */}
            {uChispa > 0.01 && (
              <g opacity={uChispa}>
                <circle cx={0} cy={0} r={115 * uChispa} fill="rgba(255,90,95,0.32)" />
                <circle cx={0} cy={0} r={62} fill="#FFF7AE" stroke="#FF8A5B" strokeWidth={10} />
                <path
                  d="M-95 -65 L-20 -12 L-55 35 L35 -8 L12 65 L95 25"
                  fill="none"
                  stroke="#FFF"
                  strokeWidth={12}
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>

          {/* Flechas laterales de aplastamiento mecánico */}
          <path d="M-470 0 L-370 0" stroke="#FF5A5F" strokeWidth={16} strokeLinecap="round" />
          <polygon points="-355,0 -395,-26 -395,26" fill="#FF5A5F" />
          <path d="M470 0 L370 0" stroke="#FF5A5F" strokeWidth={16} strokeLinecap="round" />
          <polygon points="355,0 395,-26 395,26" fill="#FF5A5F" />
        </g>

        {/* ════════════════════════════════════════════════════════════════════
            ESCENA 3 · FUGA TÉRMICA A 600 °C Y OXÍGENO PROPIO (y = 3180)
            ════════════════════════════════════════════════════════════════════ */}
        <g transform="translate(540, 3180)">
          {/* Halo de calor radiante */}
          <circle cx={0} cy={20} r={260 + Math.sin(t * 10) * 18} fill="url(#g-fuego)" opacity={0.75} />

          {/* Batería en plena fuga térmica */}
          <rect x={-150} y={-190} width={300} height={380} rx={34} fill="#2A1215" stroke="#FF5A5F" strokeWidth={10} />
          <rect x={-65} y={-225} width={130} height={35} rx={10} fill="#FF8A5B" />

          {/* Chorros de oxígeno propio (O2) y gas inflamable */}
          {uGases > 0.01 && (
            <g opacity={uGases}>
              {/* Burbujas de O2 y gas saliendo de la celda */}
              {[
                [-250, -120, 'O₂', '#4FB3FF'],
                [260, -110, 'GAS', '#FF8A5B'],
                [-280, 70, 'GAS', '#FF8A5B'],
                [275, 85, 'O₂', '#4FB3FF'],
              ].map(([gx, gy, label, col], idx) => (
                <g
                  key={idx}
                  transform={`translate(${Number(gx) * (0.5 + 0.5 * uGases)}, ${Number(gy) * (0.5 + 0.5 * uGases)})`}
                >
                  <circle r={56} fill="#101829" stroke={String(col)} strokeWidth={7} />
                  <text x={0} y={14} textAnchor="middle" fill={String(col)} style={{ fontSize: 38, fontWeight: 700 }}>
                    {label}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Termómetro gigante a la izquierda */}
          <g transform="translate(-360, 0)">
            <rect x={-32} y={-220} width={64} height={380} rx={32} fill="#141C2E" stroke="#8FA3C4" strokeWidth={6} />
            <rect
              x={-18}
              y={140 - 330 * seg(tempVal, 28, 600)}
              width={36}
              height={330 * seg(tempVal, 28, 600)}
              rx={18}
              fill="#FF5A5F"
            />
            <circle cx={0} cy={155} r={52} fill="#FF5A5F" stroke="#FFF" strokeWidth={6} />
          </g>

          {/* Lectura digital de temperatura */}
          <text
            x={40}
            y={25}
            textAnchor="middle"
            fill="#FFF"
            style={{ fontSize: 118, fontWeight: 700, letterSpacing: -4 }}
          >
            {tempVal} °C
          </text>
          <text
            x={40}
            y={85}
            textAnchor="middle"
            fill="#FFB088"
            style={{ fontFamily: 'Mono', fontSize: 28, fontWeight: 700, letterSpacing: 3 }}
          >
            FUGA TÉRMICA
          </text>
        </g>

        {/* ════════════════════════════════════════════════════════════════════
            ESCENA 4 · PRENSA RODEADA DE CARTÓN Y PLÁSTICO = HORNO (y = 4440)
            ════════════════════════════════════════════════════════════════════ */}
        <g transform="translate(540, 4440)">
          {/* Caja metálica del camión convertida en un horno cerrado */}
          <rect x={-390} y={-230} width={780} height={440} rx={26} fill="#181520" stroke="#FF8A5B" strokeWidth={9} />

          {/* Llamas internas envolviendo cajas de cartón y botellas de plástico */}
          <g opacity={0.35 + 0.65 * uHorno}>
            <ellipse cx={-120} cy={30} rx={210} ry={175} fill="url(#g-fuego)" />
            <ellipse cx={140} cy={10} rx={220} ry={185} fill="url(#g-fuego)" />
          </g>

          {/* Cajas de cartón y envases plásticos dentro de la tolva */}
          <g transform="translate(-170, 55) rotate(-12)">
            <rect x={-90} y={-70} width={180} height={140} rx={10} fill="#A47148" stroke="#F3EEE6" strokeWidth={4} />
            <text x={0} y={10} textAnchor="middle" fill="#FFF" style={{ fontFamily: 'Mono', fontSize: 28, fontWeight: 700 }}>
              CARTÓN
            </text>
          </g>
          <g transform="translate(145, 65) rotate(14)">
            <rect x={-85} y={-65} width={170} height={130} rx={18} fill="#2B5B84" stroke="#8FD3FF" strokeWidth={4} />
            <text x={0} y={10} textAnchor="middle" fill="#FFF" style={{ fontFamily: 'Mono', fontSize: 28, fontWeight: 700 }}>
              PLÁSTICO
            </text>
          </g>

          {/* Chorro de agua exterior que rebota contra el techo de acero del camión */}
          {uAgua > 0.01 && (
            <g opacity={uAgua}>
              <path
                d="M460 -310 Q260 -260 120 -235"
                fill="none"
                stroke="#4FB3FF"
                strokeWidth={20}
                strokeLinecap="round"
                strokeDasharray="28 14"
              />
              <circle cx={120} cy={-235} r={42} fill="#FF5A5F" />
              <path d="M102 -253 L138 -217 M138 -253 L102 -217" stroke="#FFF" strokeWidth={9} strokeLinecap="round" />
              <text x={120} y={-300} textAnchor="middle" fill="#8FD3FF" style={{ fontFamily: 'Mono', fontSize: 28, fontWeight: 700 }}>
                EL AGUA NO ENTRA
              </text>
            </g>
          )}
        </g>

        {/* ════════════════════════════════════════════════════════════════════
            ESCENA 5 · PROTOCOLO EXTREMO: DESCARGA EN MITAD DE LA CALLE (y = 5700)
            ════════════════════════════════════════════════════════════════════ */}
        <g transform="translate(0, 5700)">
          {/* Calle de asfalto despejada */}
          <rect x={-600} y={170} width={2400} height={260} fill="#141822" />
          <line x1={-600} y1={170} x2={1800} y2={170} stroke="#3B465E" strokeWidth={6} />

          {/* Montaña de basura ardiendo descargada en el asfalto */}
          {uDescarga > 0.01 && (
            <g transform={`translate(${690 + uDescarga * 95}, 155) scale(${0.3 + 0.7 * uDescarga})`} opacity={uDescarga}>
              <ellipse cx={0} cy={-55} rx={165} ry={130} fill="url(#g-fuego)" />
              <path d="M-155 15 Q-80 -115 10 -95 Q95 -110 155 15 Z" fill="#2A2F3D" stroke="#FF8A5B" strokeWidth={6} />
              <text x={0} y={65} textAnchor="middle" fill="#FFB088" style={{ fontFamily: 'Mono', fontSize: 28, fontWeight: 700 }}>
                CARGA VACIADA EN LA CALLE
              </text>
            </g>
          )}

          {/* Camión abriendo la compuerta trasera y alejándose a salvo */}
          <g transform={`translate(${120 - uAvanzaCamion * 190}, -155)`}>
            {/* Cabina */}
            <path d="M0 95 L135 95 L170 165 L170 275 L0 275 Z" fill="#E8EEF5" stroke="#8FA3C4" strokeWidth={6} />
            <path d="M95 112 L130 112 L155 160 L95 160 Z" fill="#1A2942" />
            {/* Caja del camión */}
            <rect x={185} y={35} width={450} height={240} rx={16} fill="url(#g-camion)" stroke="#5BE49B" strokeWidth={6} />
            {/* Pistón eyector interno empujando la basura hacia afuera */}
            <rect x={210} y={85} width={120 + uDescarga * 260} height={140} rx={10} fill="#FF8A5B" opacity={0.85} />

            {/* Compuerta trasera que se levanta a 55 grados */}
            <g transform={`translate(635, 35) rotate(${-58 * uCompuerta})`}>
              <path d="M0 0 L95 35 L95 240 L0 240 Z" fill="#235E29" stroke="#A8F5CB" strokeWidth={6} />
            </g>

            {/* Ruedas */}
            <circle cx={85} cy={295} r={42} fill="#10141D" stroke="#8FA3C4" strokeWidth={9} />
            <circle cx={295} cy={295} r={42} fill="#10141D" stroke="#8FA3C4" strokeWidth={9} />
            <circle cx={555} cy={295} r={42} fill="#10141D" stroke="#8FA3C4" strokeWidth={9} />
          </g>
        </g>
      </CamaraEscena>

      {/* ════════════════════════════════════════════════════════════════════
          CAPA HUD DE PANTALLA (TÍTULOS, CONTADORES Y TARJETAS EN REMOTION)
          ════════════════════════════════════════════════════════════════════ */}
      {/* Rótulo de recreación técnica */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 68,
          padding: '10px 22px',
          borderRadius: 12,
          fontFamily: 'Mono',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 3,
          color: 'rgba(243,238,230,0.8)',
          background: 'rgba(14,18,28,0.78)',
          border: '1.5px solid rgba(255,255,255,0.18)',
        }}
      >
        INFORME EPA · SEGURIDAD EN RUTA
      </div>

      {/* Titular de gancho (0 s a A.vapeador) */}
      {t < A.vapeador - 0.15 && (
        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: 170,
            textAlign: 'center',
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 0.98,
            letterSpacing: -3,
            textShadow: '0 12px 40px rgba(0,0,0,0.85)',
          }}
        >
          1 batería incendia
          <br />
          <span style={{ color: 'var(--acento)' }}>todo el camión</span>
        </div>
      )}

      {/* Contador de presión hidráulica (2.000 PSI) */}
      {t >= A.pala - 0.1 && t < A.dentro - 0.15 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 155,
              fontWeight: 700,
              letterSpacing: -5,
              color: '#FFE082',
              textShadow: '0 0 35px rgba(255,138,91,0.55)',
            }}
          >
            {psiVal} PSI
          </div>
          <div style={{ fontFamily: 'Mono', fontSize: 30, fontWeight: 700, letterSpacing: 4, color: 'var(--acento)' }}>
            PRESIÓN DE LA PALA COMPACTADORA
          </div>
        </div>
      )}

      {/* Callout Escena 2: Cortocircuito interno */}
      {t >= A.dentro - 0.1 && t < A.fuga - 0.15 && (
        <div
          style={{
            position: 'absolute',
            left: 75,
            top: 195,
            padding: '18px 30px',
            borderRadius: 22,
            background: 'rgba(14,18,28,0.88)',
            border: '2px solid rgba(255,90,95,0.45)',
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          <div style={{ fontFamily: 'Mono', fontSize: 24, letterSpacing: 3, color: '#FF8A8D' }}>
            SEPARADOR PERFORADO
          </div>
          CORTOCIRCUITO INTERNO
        </div>
      )}

      {/* Callout Escena 3: 600 grados y oxígeno propio */}
      {t >= A.fuga - 0.1 && t < A.carton - 0.15 && (
        <div
          style={{
            position: 'absolute',
            left: 75,
            top: 195,
            padding: '18px 30px',
            borderRadius: 22,
            background: 'rgba(14,18,28,0.88)',
            border: '2px solid rgba(255,138,91,0.5)',
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          <div style={{ fontFamily: 'Mono', fontSize: 24, letterSpacing: 3, color: 'var(--acento)' }}>
            REACCIÓN QUÍMICA EN CADENA
          </div>
          GENERA SU PROPIO OXÍGENO
        </div>
      )}

      {/* Callout Escena 4: Horno imposible de apagar con agua */}
      {t >= A.carton - 0.1 && t < A.humo - 0.15 && (
        <div
          style={{
            position: 'absolute',
            left: 75,
            top: 195,
            padding: '18px 30px',
            borderRadius: 22,
            background: 'rgba(14,18,28,0.88)',
            border: '2px solid rgba(255,90,95,0.5)',
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          <div style={{ fontFamily: 'Mono', fontSize: 24, letterSpacing: 3, color: '#FF8A8D' }}>
            CARTÓN + PLÁSTICO SECO
          </div>
          HORNO BLINDADO A +600 °C
        </div>
      )}

      {/* Tarjeta final Escena 5: Protocolo de vaciado de emergencia */}
      {t >= A.humo - 0.1 && (
        <div
          style={{
            position: 'absolute',
            left: 70,
            right: 70,
            top: 175,
            padding: '26px 34px',
            borderRadius: 28,
            background: 'rgba(14,18,28,0.9)',
            border: '2px solid rgba(91,228,155,0.45)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'Mono', fontSize: 26, fontWeight: 700, letterSpacing: 4, color: 'var(--ok)' }}>
            PROTOCOLO DE EMERGENCIA EN RUTA
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, letterSpacing: -2, marginTop: 6 }}>
            VACIAR LA CARGA <span style={{ color: 'var(--ok)' }}>PARA SALVAR EL CAMIÓN</span>
          </div>
        </div>
      )}

      {/* Subtítulos sincronizados palabra por palabra */}
      <SubtitulosExplica
        tl={tl}
        claves={[
          'batería',
          'incendiar',
          'diez',
          'vapeador',
          'celular',
          'aplasta',
          'dos',
          'rompe',
          'lámina',
          'chispa',
          'fuga',
          'seiscientos',
          'oxígeno',
          'horno',
          'humo',
          'ardiendo',
          'calle',
          'salvar',
        ]}
      />
    </AbsoluteFill>
  );
};
