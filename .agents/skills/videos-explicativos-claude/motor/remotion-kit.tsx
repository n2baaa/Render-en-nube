import React from 'react';
import { useCurrentFrame, useVideoConfig, staticFile } from 'remotion';

export interface Palabra {
  w: string;
  s: number;
  e: number;
}

export interface TimelineData {
  dur: number;
  palabras: Palabra[];
}

export interface CamaraClave {
  t: number;
  x: number;
  y: number;
  z?: number;
  r?: number;
  rx?: number;
  ry?: number;
  dur?: number;
}

const norm = (s: string) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ]/g, '');

export const limita = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const seg = (t: number, a: number, b: number) => limita((t - a) / (b - a || 1e-6));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export const Curvas = {
  inOut: (u: number) => {
    const x = limita(u);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  },
  out: (u: number) => 1 - Math.pow(1 - limita(u), 3),
  in: (u: number) => Math.pow(limita(u), 3),
  resorte: (u: number, zeta = 0.72) => {
    if (u <= 0) return 0;
    if (u >= 1.6) return 1;
    const w = 4.8 / zeta;
    const wd = w * Math.sqrt(1 - zeta * zeta);
    return (
      1 -
      Math.exp(-zeta * w * u) *
        (Math.cos(wd * u) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * u))
    );
  },
};

const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};
export const ruido = (t: number, semilla = 0) => {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i + semilla * 57.3), hash(i + 1 + semilla * 57.3), u) * 2 - 1;
};

export function crearAnclas(tl: TimelineData) {
  const P = tl.palabras.map((p) => ({ ...p, k: norm(p.w) }));
  function busca(frase: string, n = 1, desde = 0): [number, number] | null {
    const ks = String(frase)
      .split(/\s+/)
      .map(norm)
      .filter(Boolean);
    let c = 0;
    for (let i = 0; i < P.length; i++) {
      if (P[i].s < desde - 1e-3) continue;
      let ok = true;
      for (let j = 0; j < ks.length; j++) {
        const p = P[i + j];
        if (!p || !(p.k === ks[j] || (ks[j].length >= 4 && p.k.startsWith(ks[j])))) {
          ok = false;
          break;
        }
      }
      if (ok && ++c === n) return [i, i + ks.length - 1];
    }
    return null;
  }
  const en = (frase: string, n = 1, desde = 0) => {
    const r = busca(frase, n, desde);
    if (!r) throw new Error(`Falta el ancla de «${frase}»`);
    return P[r[0]].s;
  };
  const fin = (frase: string, n = 1, desde = 0) => {
    const r = busca(frase, n, desde);
    if (!r) throw new Error(`Falta el ancla de «${frase}»`);
    return P[r[1]].e;
  };
  return { en, fin };
}

export const FuentesExplica: React.FC = () => {
  const b700 = staticFile('fuentes/bricolage-700.ttf');
  const f500 = staticFile('fuentes/figtree-500.woff2');
  const f700 = staticFile('fuentes/figtree-700.woff2');
  const m700 = staticFile('fuentes/jetbrainsmono-700.woff');
  return (
    <style>{`
      @font-face { font-family: 'Bricolage'; font-weight: 700; src: url('${b700}') format('truetype'); }
      @font-face { font-family: 'Figtree'; font-weight: 500; src: url('${f500}') format('woff2'); }
      @font-face { font-family: 'Figtree'; font-weight: 700; src: url('${f700}') format('woff2'); }
      @font-face { font-family: 'Mono'; font-weight: 700; src: url('${m700}') format('woff'); }
      :root {
        --fondo: #0E0D11;
        --linea: #F3EEE6;
        --tenue: #8A8694;
        --tenue2: #3A3744;
        --acento: #FF8A5B;
        --agua: #4FB3FF;
        --ok: #5BE49B;
        --peligro: #FF5A5F;
      }
    `}</style>
  );
};

export const CamaraEscena: React.FC<{
  claves: CamaraClave[];
  sacudida?: Array<[number, number]>;
  children: React.ReactNode;
}> = ({ claves, sacudida = [], children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  let x = claves[0]?.x ?? 540;
  let y = claves[0]?.y ?? 960;
  let z = claves[0]?.z ?? 1;
  let r = claves[0]?.r ?? 0;
  let rx = claves[0]?.rx ?? 0;
  let ry = claves[0]?.ry ?? 0;

  for (let i = 1; i < claves.length; i++) {
    const c = claves[i];
    const d = c.dur ?? 0.9;
    if (t <= c.t - d) break;
    const u = Curvas.inOut(seg(t, c.t - d, c.t));
    x = lerp(x, c.x, u);
    y = lerp(y, c.y, u);
    z = lerp(z, c.z ?? 1, u);
    r = lerp(r, c.r ?? 0, u);
    rx = lerp(rx, c.rx ?? 0, u);
    ry = lerp(ry, c.ry ?? 0, u);
  }

  // Pulso orgánico de cámara en mano + sacudidas puntuales
  let dx = ruido(t * 0.85, 1) * 3.5;
  let dy = ruido(t * 0.85, 2) * 3.5;
  const dr = ruido(t * 0.65, 3) * 0.25;
  for (const [t0, amp] of sacudida) {
    if (t >= t0 && t < t0 + 1.2) {
      const e = Math.exp(-5.5 * (t - t0)) * amp;
      dx += e * Math.sin((t - t0) * 58);
      dy += e * Math.cos((t - t0) * 45);
    }
  }

  const tx = 540 - x * z + dx;
  const ty = 960 - y * z + dy;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        perspective: '1600px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 1080,
          height: 1920,
          transformOrigin: '540px 960px',
          transform: `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${(r + dr).toFixed(2)}deg)`,
        }}
      >
        <svg
          viewBox="0 0 1080 1920"
          width={1080}
          height={1920}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          <g transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${z.toFixed(4)})`}>
            {children}
          </g>
        </svg>
      </div>
    </div>
  );
};

export const SubtitulosExplica: React.FC<{
  tl: TimelineData;
  claves?: string[];
  y?: number;
}> = ({ tl, claves = [], y = 1470 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const setClaves = new Set(claves.map(norm));

  // Agrupar de 3 en 3 palabras
  const grupos: Palabra[][] = [];
  let g: Palabra[] = [];
  for (const p of tl.palabras) {
    g.push(p);
    if (g.length >= 3 || /[.!?…:;]$/.test(p.w)) {
      grupos.push(g);
      g = [];
    }
  }
  if (g.length) grupos.push(g);

  const activo = grupos.find(
    (gr, idx) =>
      t >= gr[0].s - 0.06 &&
      t <= (grupos[idx + 1] ? Math.min(gr[gr.length - 1].e + 0.35, grupos[idx + 1][0].s - 0.02) : gr[gr.length - 1].e + 0.45)
  );
  if (!activo) return null;

  const uEntra = Curvas.resorte(seg(t, activo[0].s - 0.05, activo[0].s + 0.22), 0.72);

  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: y,
        textAlign: 'center',
        zIndex: 50,
        transform: `translateY(${((1 - uEntra) * 24).toFixed(1)}px) scale(${(0.92 + 0.08 * uEntra).toFixed(3)})`,
        opacity: limita(uEntra * 1.2),
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '22px',
          padding: '18px 36px',
          borderRadius: 26,
          background: 'rgba(12, 14, 22, 0.85)',
          border: '2px solid rgba(255,255,255,0.14)',
          boxShadow: '0 22px 48px rgba(0,0,0,0.75)',
        }}
      >
        {activo.map((p, i) => {
          const hablada = t >= p.s - 0.02;
          const actual = t >= p.s - 0.02 && t <= p.e + 0.08;
          const esClave = setClaves.has(norm(p.w));
          return (
            <span
              key={i}
              style={{
                fontFamily: 'Bricolage',
                fontWeight: 700,
                fontSize: 64,
                letterSpacing: '-1.5px',
                color: esClave && hablada ? 'var(--acento)' : hablada ? '#FFFFFF' : 'rgba(243,238,230,0.42)',
                transform: `scale(${actual ? 1.08 : 1})`,
                transition: 'transform 0.08s',
                textShadow: esClave && hablada ? '0 0 28px rgba(255,138,91,0.55)' : '0 4px 16px rgba(0,0,0,0.8)',
              }}
            >
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
