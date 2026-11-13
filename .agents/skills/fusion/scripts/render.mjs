// render.mjs · Renderizador Híbrido 3D (Three.js + Toon Ink) y 2D (SVG) · Skill FUSION
// Empaqueta automáticamente src/scene.js → bundle.js (si existe), fotografía fotograma a fotograma en Chrome con GPU WebGL,
// ejecuta mezcla.py (voz + música + efectos Magnific/Viegas a −14 LUFS + onda.png) y entrega el MP4 vertical 1080×1920.
//
// Comandos:
//   node render.mjs <proyecto> comprobar          → verifica 0 anclas perdidas, duración y escribe voz/eventos.json
//   node render.mjs <proyecto> gancho             → resultados/gancho.jpg con los 5 golpes del hook (0 · 0.3 · 0.6 · 1.5 · 2.5 · 3.7 s)
//   node render.mjs <proyecto> loop               → resultados/loop.jpg comparando fotograma 0 y fotograma final (dur - 0.03 s)
//   node render.mjs <proyecto> hoja [n=18]        → resultados/hoja.jpg con n fotogramas repartidos y su segundo
//   node render.mjs <proyecto> stills 0,1.2,5.4   → resultados/still_<t>.jpg a 1080×1920
//   node render.mjs <proyecto> video [--calidad previa|final] [--fps 30|60] [--hilos 4] [--mb 1]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const PROY = path.resolve(args[0] || '.');
const MODO = args[1] || 'video';
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const CAL = opt('calidad', 'final');
const HILOS = +opt('hilos', Math.max(2, Math.min(4, os.cpus().length >> 1)));

// 1. Si el proyecto es 3D (tiene src/scene.js), compilar a bundle.js automáticamente con esbuild
const sceneJs = path.join(PROY, 'src', 'scene.js');
const es3D = fs.existsSync(sceneJs);
if (es3D) {
  let esbuildBin = null;
  for (const b of [PROY, path.dirname(PROY), SKILL]) {
    try {
      const req = createRequire(path.join(b, 'package.json'));
      const esbuild = req('esbuild');
      esbuild.buildSync({
        entryPoints: [sceneJs],
        bundle: true,
        outfile: path.join(PROY, 'bundle.js'),
        logLevel: 'warning',
        nodePaths: [path.join(PROY, 'node_modules'), path.join(path.dirname(PROY), 'node_modules'), path.join(SKILL, 'node_modules')],
      });
      esbuildBin = 'api';
      break;
    } catch {}
  }
  if (!esbuildBin) {
    const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['esbuild', 'src/scene.js', '--bundle', '--outfile=bundle.js', '--log-level=warning'], { cwd: PROY, stdio: 'inherit' });
    if (r.status !== 0) process.exit(1);
  }
}

const ESC = CAL === 'final' ? 1 : 0.5;
const FPS_DEFAULT = es3D ? 30 : (CAL === 'final' ? 60 : 30);
const FPS = +opt('fps', FPS_DEFAULT);
const MB = Math.max(1, +opt('mb', es3D ? 1 : (CAL === 'final' ? 3 : 1)));

let chromium;
for (const b of [PROY, path.dirname(PROY), SKILL, path.join(os.homedir(), 'Documents', 'Videos explicativos'), path.join(os.homedir(), 'Documentos', 'Videos explicativos')]) {
  try { ({ chromium } = createRequire(path.join(b, 'package.json'))('playwright')); break; } catch {}
}
if (!chromium) { console.error('Falta Playwright. Ejecuta: python <skill>/scripts/preparar.py --instalar'); process.exit(1); }

const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
].filter(Boolean).find((p) => fs.existsSync(p));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.json': 'application/json', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
};

const servidor = () => new Promise((ok) => {
  const s = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    let p = path.join(PROY, u);
    if (!fs.existsSync(p) && u.startsWith('/motor/')) p = path.join(SKILL, u);
    if (!fs.existsSync(p) && u === '/font.woff2') p = path.join(SKILL, 'motor', 'fuentes', 'figtree-700.woff2');
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(r);
  });
  s.listen(0, () => ok(s));
});

const htmlEntry = fs.existsSync(path.join(PROY, 'index.html')) ? 'index.html' : 'escena.html';

async function abrir(br, port) {
  const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: ESC });
  const errores = [];
  pg.on('pageerror', (e) => errores.push(e.message));
  pg.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await pg.goto(`http://127.0.0.1:${port}/${htmlEntry}`);
  await pg.waitForFunction(() => window.READY === true || window.__listo === true || window.__error, null, { timeout: 60000 }).catch(() => {});
  await pg.evaluate(() => document.fonts ? document.fonts.ready : Promise.resolve());
  const info = await pg.evaluate(() => {
    const fn = window.renderFrame || window.seek;
    const dur = (window.META && window.META.duration) || window.__dur || (window.TIMELINE && window.TIMELINE.dur) || 14;
    // Ejecutar barrido rápido para registrar todos los eventos de sonido si son dinámicos
    if (fn && (!window.__eventos || window.__eventos.length === 0)) {
      fn(0);
    }
    return {
      dur,
      fps: (window.META && window.META.fps) || null,
      eventos: window.__eventos || [],
      avisos: window.__avisos || [],
      dudas: window.__dudas || [],
      listo: !!(window.READY || window.__listo),
    };
  });
  if (!info.listo) {
    console.error('La escena no arrancó:\n  ' + errores.join('\n  '));
    await br.close().catch(() => {});
    process.exit(2);
  }
  return { pg, info, errores };
}

const seekFrame = async (pg, t) => {
  await pg.evaluate((x) => {
    if (window.renderFrame) window.renderFrame(Math.max(0, x));
    else if (window.seek) window.seek(Math.max(0, x));
  }, t);
};

const codec = () => (
  spawnSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=black:s=256x256:d=0.1', '-c:v', 'h264_nvenc', '-f', 'null', '-']).status === 0
    ? ['-c:v', 'h264_nvenc', '-preset', 'p5', '-rc', 'vbr', '-cq', '18', '-b:v', '0']
    : ['-c:v', 'libx264', '-preset', 'fast', '-crf', '18']
);

async function trozo(br, port, f0, f1, salida, cv, fpsReal) {
  const { pg } = await abrir(br, port);
  const vf = MB > 1
    ? ['-vf', `tmix=frames=${MB},select='eq(mod(n,${MB}),${MB - 1})',setpts=N/(${fpsReal}*TB)`, '-fps_mode', 'passthrough']
    : ['-r', String(fpsReal)];
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fpsReal * MB), '-i', '-', ...vf, ...cv, '-pix_fmt', 'yuv420p', salida]);
  for (let i = f0; i < f1; i++) {
    for (let k = 0; k < MB; k++) {
      const t = i / fpsReal + (MB > 1 ? ((k - (MB - 1)) / MB) * (0.5 / fpsReal) : 0);
      await seekFrame(pg, t);
      const b = await pg.screenshot({ type: 'jpeg', quality: 93 });
      if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r));
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await pg.close();
}

(async () => {
  const srv = await servidor(), port = srv.address().port;
  const isLinuxNoGpu = process.platform === 'linux' && spawnSync('nvidia-smi').status !== 0;
  const br = await chromium.launch({
    executablePath: chrome,
    args: [
      '--no-sandbox',
      '--disable-gpu-vsync',
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization',
      '--force-color-profile=srgb',
      ...(isLinuxNoGpu ? ['--enable-webgl', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader-webgl'] : []),
    ],
  });
  const out = path.join(PROY, 'resultados');
  fs.mkdirSync(out, { recursive: true });
  fs.mkdirSync(path.join(PROY, 'voz'), { recursive: true });

  const { pg, info } = await abrir(br, port);
  const fpsReal = +opt('fps', info.fps || FPS);

  if (MODO === 'comprobar') {
    const panelDudas = await pg.evaluate((dur) => {
      const fn = window.renderFrame || window.seek;
      const panelEl = document.getElementById('panel');
      if (!fn || !panelEl || !dur) return [];
      const evSnap = window.__eventos ? window.__eventos.slice() : null;
      const N = Math.max(20, Math.min(80, Math.ceil(dur * 2)));
      let active = 0, segs = 0, prevOn = false, maxArea = 0;
      for (let i = 0; i <= N; i++) {
        const t = (dur * i) / N;
        fn(t);
        const st = getComputedStyle(panelEl);
        const on = parseFloat(st.opacity) > 0.05 && panelEl.innerHTML.trim().length > 0;
        if (on) {
          active++;
          const r = panelEl.getBoundingClientRect();
          maxArea = Math.max(maxArea, r.width * r.height);
        }
        if (on && !prevOn) segs++;
        prevOn = on;
      }
      fn(0);
      if (evSnap && window.__eventos) { window.__eventos.length = 0; window.__eventos.push(...evSnap); }
      const out = [];
      const pct = (active / (N + 1)) * 100;
      if (segs > 1) out.push(`#panel se activa ${segs} veces en el vídeo (máx. recomendado: 1 breve ≤ 15 %)`);
      if (pct > 15) out.push(`#panel visible ~${pct.toFixed(0)} % del vídeo (> 15 %)`);
      if (maxArea > 40500) out.push(`#panel ocupa ${Math.round(maxArea)} px² (> 15 % del antiguo 900×300 = 40 500 px²)`);
      return out;
    }, info.dur);
    for (const d of panelDudas) {
      if (!info.dudas.some((x) => x.includes(d.slice(0, 20)))) info.dudas.push(d);
    }
  }

  if (info.avisos.length) {
    console.error('✗ ' + info.avisos.join('\n✗ '));
    if (MODO !== 'frame' && MODO !== 'stills') { await br.close(); srv.close(); process.exit(3); }
  }
  if (info.dudas.length) console.log('⚠ ' + [...new Set(info.dudas)].join(' | '));

  // Guardar eventos.json siempre que haya sonidos registrados en la escena
  if (info.eventos && info.eventos.length > 0) {
    fs.writeFileSync(path.join(PROY, 'voz', 'eventos.json'), JSON.stringify({ dur: info.dur, eventos: info.eventos }, null, 1));
  }

  const ffFont = path.join(SKILL, 'motor/fuentes/bricolage-700.ttf').replace(/\\/g, '/').replace(':', '\\:');

  if (MODO === 'comprobar') {
    console.log(`✓ ${info.dur.toFixed(2)} s · ${fpsReal} fps · ${info.eventos.length} sonidos · 0 anclas perdidas`);
  } else if (MODO === 'frame') {
    await seekFrame(pg, +args[2]);
    await pg.screenshot({ path: args[3] });
    console.log('✓ ' + args[3]);
  } else if (MODO === 'stills') {
    const ts = (args[2] || '0,1,3').split(',').map(Number);
    for (const t of ts) {
      await seekFrame(pg, t);
      const p = path.join(out, `still_${t}.jpg`);
      await pg.screenshot({ path: p, type: 'jpeg', quality: 93 });
      console.log('✓ ' + path.relative(PROY, p));
    }
  } else if (MODO === 'loop') {
    const ts = [0, Math.max(0, info.dur - 0.03)];
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loop-'));
    for (let i = 0; i < ts.length; i++) {
      await seekFrame(pg, ts[i]);
      const f = path.join(dir, `${i}.png`);
      await pg.screenshot({ path: f });
      const lbl = i === 0 ? `INICIO (0.00 s)` : `FINAL (${ts[i].toFixed(2)} s)`;
      spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', f, '-vf', `scale=540:960,drawtext=fontfile='${ffFont}':text='${lbl}':x=16:y=16:fontsize=32:fontcolor=white:box=1:boxcolor=black@0.7`, path.join(dir, `m${i}.png`)]);
    }
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(dir, 'm%d.png'), '-vf', 'tile=2x1', '-frames:v', '1', path.join(out, 'loop.jpg')]);
    console.log('✓ resultados/loop.jpg (comparación de empalme 0 s vs final)');
  } else if (MODO === 'gancho') {
    const ts = [0, 0.3, 0.6, 1.5, 2.5, 3.7].filter((t) => t < info.dur);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gancho-'));
    for (let i = 0; i < ts.length; i++) {
      await seekFrame(pg, ts[i]);
      const f = path.join(dir, `${i}.png`);
      await pg.screenshot({ path: f });
      spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', f, '-vf', `scale=360:640,drawtext=fontfile='${ffFont}':text='${ts[i].toFixed(1)} s':x=12:y=12:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.65`, path.join(dir, `m${i}.png`)]);
    }
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(dir, 'm%d.png'), '-vf', `tile=${ts.length}x1`, '-frames:v', '1', path.join(out, 'gancho.jpg')]);
    console.log('✓ resultados/gancho.jpg · 6 golpes del hook (0 · 0.3 · 0.6 · 1.5 · 2.5 · 3.7 s)');
  } else if (MODO === 'hoja') {
    const n = +(args[2] || 18), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hoja-'));
    for (let i = 0; i < n; i++) {
      const t = (info.dur * (i + 0.5)) / n;
      await seekFrame(pg, t);
      await pg.screenshot({ path: path.join(dir, `${String(i).padStart(2, '0')}.png`) });
      spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(dir, `${String(i).padStart(2, '0')}.png`), '-vf', `scale=270:480,drawtext=fontfile='${ffFont}':text='${t.toFixed(1)} s':x=10:y=10:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.65`, path.join(dir, `m${String(i).padStart(2, '0')}.png`)]);
    }
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(dir, 'm%02d.png'), '-vf', `tile=${Math.min(6, n)}x${Math.ceil(n / 6)}`, '-frames:v', '1', path.join(out, 'hoja.jpg')]);
    console.log('✓ resultados/hoja.jpg');
  } else if (MODO === 'tramo') {
    // node render.mjs <proyecto> tramo <idx> <total_tramos> [salida.mp4]
    await pg.close();
    const idx = +args[2], numTramos = +args[3];
    const salidaTramo = path.resolve(args[4] || path.join(out, `tramo_${idx}.mp4`));
    const total = Math.round(info.dur * fpsReal), cv = codec(), t0 = Date.now();
    const tamTramo = Math.ceil(total / numTramos);
    const fIni = idx * tamTramo, fFin = Math.min(total, (idx + 1) * tamTramo);
    const n = Math.max(1, Math.min(HILOS, Math.ceil((fFin - fIni) / 45)));
    const tamHilo = Math.ceil((fFin - fIni) / n);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `tramo-${idx}-`));
    console.log(`→ Tramo ${idx + 1}/${numTramos} (fotogramas ${fIni}..${fFin} de ${total}) · ${n} hilos`);
    const partes = Array.from({ length: n }, (_, k) => path.join(dir, `p${k}.mp4`));
    await Promise.all(partes.map((p, k) => trozo(br, port, fIni + k * tamHilo, Math.min(fFin, fIni + (k + 1) * tamHilo), p, cv, fpsReal)));
    fs.writeFileSync(path.join(dir, 'lista.txt'), partes.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'lista.txt'), '-c', 'copy', salidaTramo]);
    console.log(`✓ Tramo ${idx + 1}/${numTramos} listo en ${((Date.now() - t0) / 1000).toFixed(0)} s → ${salidaTramo}`);
  } else if (MODO === 'unir') {
    // node render.mjs <proyecto> unir <carpeta_tramos> <num_tramos>
    await pg.close();
    const dirTramos = path.resolve(args[2] || out);
    const numTramos = +(args[3] || 4);
    const total = Math.round(info.dur * fpsReal), cv = codec(), t0 = Date.now();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unir-'));
    const archivos = Array.from({ length: numTramos }, (_, k) => path.join(dirTramos, `tramo_${k}.mp4`));
    fs.writeFileSync(path.join(dir, 'lista.txt'), archivos.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
    const muda = path.join(dir, 'muda.mp4');
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'lista.txt'), '-c', 'copy', muda]);

    const py = process.platform === 'win32' ? 'python' : 'python3';
    const mz = spawnSync(py, [path.join(SKILL, 'scripts', 'mezcla.py'), PROY], { stdio: 'inherit' });
    if (mz.status !== 0) { console.error('✗ falló la mezcla'); process.exit(4); }

    const final = path.join(out, CAL === 'final' ? 'video-final.mp4' : 'video-previa.mp4');
    spawnSync('ffmpeg', [
      '-v', 'error', '-y', '-i', muda, '-i', path.join(PROY, 'voz', 'mezcla.wav'),
      '-map', '0:v', '-map', '1:a', '-vf', `setpts=N/(${fpsReal}*TB)`,
      '-fps_mode', 'cfr', '-r', String(fpsReal), ...cv, '-pix_fmt', 'yuv420p',
      '-af', 'apad', '-t', info.dur.toFixed(3), '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', final
    ]);
    const nf = parseInt(spawnSync('ffprobe', ['-v', 'error', '-count_packets', '-select_streams', 'v', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', final], { encoding: 'utf8' }).stdout, 10);
    console.log(`✓ ${path.relative(PROY, final)} · ${info.dur.toFixed(1)} s · ${nf}/${total} fotogramas · Unido en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  } else {
    await pg.close();
    const total = Math.round(info.dur * fpsReal), cv = codec(), t0 = Date.now();
    const n = Math.max(1, Math.min(HILOS, Math.ceil(total / 90))), tam = Math.ceil(total / n), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fus-'));
    console.log(`→ ${total} fotogramas · ${fpsReal} fps · ${ESC === 1 ? '1080×1920' : '540×960'} · ${n} hilos · motor ${es3D ? '3D Toon Ink' : '2D SVG'}`);
    const partes = Array.from({ length: n }, (_, k) => path.join(dir, `p${k}.mp4`));
    await Promise.all(partes.map((p, k) => trozo(br, port, k * tam, Math.min(total, (k + 1) * tam), p, cv, fpsReal)));
    fs.writeFileSync(path.join(dir, 'lista.txt'), partes.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
    const muda = path.join(dir, 'muda.mp4');
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'lista.txt'), '-c', 'copy', muda]);

    const py = process.platform === 'win32' ? 'python' : 'python3';
    const mz = spawnSync(py, [path.join(SKILL, 'scripts', 'mezcla.py'), PROY], { stdio: 'inherit' });
    if (mz.status !== 0) { console.error('✗ falló la mezcla'); process.exit(4); }

    const final = path.join(out, CAL === 'final' ? 'video-final.mp4' : 'video-previa.mp4');
    spawnSync('ffmpeg', [
      '-v', 'error', '-y', '-i', muda, '-i', path.join(PROY, 'voz', 'mezcla.wav'),
      '-map', '0:v', '-map', '1:a', '-vf', `setpts=N/(${fpsReal}*TB)`,
      '-fps_mode', 'cfr', '-r', String(fpsReal), ...cv, '-pix_fmt', 'yuv420p',
      '-af', 'apad', '-t', info.dur.toFixed(3), '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', final
    ]);
    const nf = parseInt(spawnSync('ffprobe', ['-v', 'error', '-count_packets', '-select_streams', 'v', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', final], { encoding: 'utf8' }).stdout, 10);
    if (Math.abs(nf - total) > 2) {
      console.error(`✗ el vídeo tiene ${nf} fotogramas y debían ser ${total}`);
      fs.renameSync(final, final.replace('.mp4', '.INCOMPLETO.mp4'));
      process.exit(5);
    }
    console.log(`✓ ${path.relative(PROY, final)} · ${info.dur.toFixed(1)} s · ${nf} fotogramas · ${((Date.now() - t0) / 1000).toFixed(0)} s de render`);
  }
  await br.close();
  srv.close();
  process.exit(0);
})();
