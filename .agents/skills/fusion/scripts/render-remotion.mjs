// render-remotion.mjs · Motor de renderizado con Remotion (@remotion/bundler + @remotion/renderer)
// Empaqueta UNA sola vez con Webpack y reutiliza el bundle para comprobar, gancho, hoja y video.
// Uso:
//   node render-remotion.mjs <proyecto> comprobar
//   node render-remotion.mjs <proyecto> gancho
//   node render-remotion.mjs <proyecto> hoja [18]
//   node render-remotion.mjs <proyecto> video [--calidad previa|final] [--hilos 6]
//   node render-remotion.mjs <proyecto> studio
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const PROY = path.resolve(args[0] || '.');
const MODO = args[1] || 'video';
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const CAL = opt('calidad', 'previa');
const HILOS = Math.max(1, Math.min(os.cpus().length, +opt('hilos', os.cpus().length)));

const rootDir = fs.existsSync(path.join(PROY, 'node_modules', '@remotion')) ? PROY : path.dirname(PROY);
const req = createRequire(path.join(rootDir, 'package.json'));
const { bundle } = req('@remotion/bundler');
const { selectComposition, renderStill, renderMedia, ensureBrowser } = req('@remotion/renderer');
const remotionCli = path.join(rootDir, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');

// Copiar fuentes de la marca a <proyecto>/public/fuentes para staticFile() de Remotion
const pubDir = path.join(PROY, 'public');
const pubFuentes = path.join(pubDir, 'fuentes');
fs.mkdirSync(pubFuentes, { recursive: true });
for (const f of ['bricolage-700.ttf', 'figtree-500.woff2', 'figtree-700.woff2', 'jetbrainsmono-700.woff']) {
  const src = path.join(SKILL, 'motor', 'fuentes', f);
  const dst = path.join(pubFuentes, f);
  if (fs.existsSync(src) && !fs.existsSync(dst)) fs.copyFileSync(src, dst);
}

const entry = fs.existsSync(path.join(PROY, 'remotion', 'index.tsx'))
  ? path.join(PROY, 'remotion', 'index.tsx')
  : path.join(PROY, 'remotion', 'index.ts');
const out = path.join(PROY, 'resultados');
fs.mkdirSync(out, { recursive: true });
const tl = JSON.parse(fs.readFileSync(path.join(PROY, 'voz', 'timeline.json'), 'utf8'));
const dur = (tl.dur || 10) + 0.8;
const ffFont = path.join(SKILL, 'motor/fuentes/bricolage-700.ttf').replace(/\\/g, '/').replace(':', '\\:');

if (MODO === 'studio') {
  spawnSync(process.execPath, [remotionCli, 'studio', entry, '--public-dir', pubDir], { stdio: 'inherit' });
  process.exit(0);
}

(async () => {
  if (!fs.existsSync(path.join(rootDir, 'node_modules', '.remotion'))) {
    await ensureBrowser();
  }
  const chromiumOptions = { gl: 'angle' };
  console.log('→ Empaquetando proyecto Remotion…');
  const serveUrl = await bundle({ entryPoint: entry, publicDir: pubDir });
  console.log('→ Seleccionando composición…');
  const comp = await selectComposition({ serveUrl, id: 'VideoExplicativo', chromiumOptions, timeoutInMilliseconds: 90000 });

  if (MODO === 'comprobar') {
    console.log(`✓ Remotion verificado · ${comp.id} · ${comp.width}×${comp.height} · ${comp.fps} fps · ${comp.durationInFrames} fotogramas (${dur.toFixed(2)} s)`);
    process.exit(0);
  }

  if (MODO === 'gancho') {
    const ts = [0, 0.5, 1, 2, 3].filter((t) => t < dur);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rem-gancho-'));
    for (let i = 0; i < ts.length; i++) {
      const frame = Math.min(comp.durationInFrames - 1, Math.round(ts[i] * comp.fps));
      const png = path.join(dir, `${i}.png`);
      await renderStill({ composition: comp, serveUrl, output: png, frame, chromiumOptions });
      spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', `scale=432:768,drawtext=fontfile='${ffFont}':text='${ts[i].toFixed(1)} s':x=12:y=12:fontsize=30:fontcolor=white:box=1:boxcolor=black@0.6`, path.join(dir, `m${i}.png`)]);
    }
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(dir, 'm%d.png'), '-vf', `tile=${ts.length}x1`, '-frames:v', '1', path.join(out, 'gancho.jpg')]);
    console.log('✓ resultados/gancho.jpg (Remotion)');
    process.exit(0);
  }

  if (MODO === 'hoja') {
    const n = +(args[2] || 18);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rem-hoja-'));
    for (let i = 0; i < n; i++) {
      const t = (dur * (i + 0.5)) / n;
      const frame = Math.min(comp.durationInFrames - 1, Math.round(t * comp.fps));
      const png = path.join(dir, `${String(i).padStart(2, '0')}.png`);
      await renderStill({ composition: comp, serveUrl, output: png, frame, chromiumOptions });
      spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', `scale=270:480,drawtext=fontfile='${ffFont}':text='${t.toFixed(1)} s':x=10:y=10:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6`, path.join(dir, `m${String(i).padStart(2, '0')}.png`)]);
    }
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(dir, 'm%02d.png'), '-vf', `tile=${Math.min(6, n)}x${Math.ceil(n / 6)}`, '-frames:v', '1', path.join(out, 'hoja.jpg')]);
    console.log('✓ resultados/hoja.jpg (Remotion)');
    process.exit(0);
  }

  // MODO === 'video'
  const t0 = Date.now();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rem-vid-'));
  const muda = path.join(dir, 'muda.mp4');
  const scale = CAL === 'final' ? 1 : 0.5;
  console.log(`→ Renderizando con Remotion (${Math.round(comp.width * scale)}×${Math.round(comp.height * scale)} · ${comp.fps} fps · ${comp.durationInFrames} fotogramas · ${HILOS} hilos)…`);
  await renderMedia({
    composition: comp,
    serveUrl,
    codec: 'h264',
    crf: 17,
    scale,
    concurrency: HILOS,
    muted: true,
    chromiumOptions,
    timeoutInMilliseconds: 90000,
    outputLocation: muda,
  });

  const py = process.platform === 'win32' ? 'python' : 'python3';
  const mz = spawnSync(py, [path.join(SKILL, 'scripts', 'mezcla.py'), PROY], { stdio: 'inherit' });
  if (mz.status !== 0) { console.error('✗ Falló la mezcla de audio'); process.exit(4); }

  const final = path.join(out, CAL === 'final' ? 'video-final.mp4' : 'video-previa.mp4');
  spawnSync('ffmpeg', [
    '-v', 'error', '-y',
    '-i', muda,
    '-i', path.join(PROY, 'voz', 'mezcla.wav'),
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy',
    '-af', 'apad', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart',
    final,
  ]);
  console.log(`✓ ${path.relative(PROY, final)} (Remotion) · ${dur.toFixed(1)} s · ${comp.durationInFrames} fotogramas · ${((Date.now() - t0) / 1000).toFixed(0)} s de render`);
  process.exit(0);
})();
