"""mezcla.py · Voz + Música + Efectos (Biblioteca Viegas + Magnific AI SFX) → voz/mezcla.wav a −14 LUFS + resultados/onda.png (Skill FUSION)

  python mezcla.py <proyecto>
Lee voz/voz.wav, voz/eventos.json y estilo.json del proyecto:
  { "musica": "cinematic-2" | "darksynth-1" | "sin" | "ruta/a/tu-musica.mp3", "musica_db": -21, "sfx_db": -14, "voz_fx": "natural" }
Si algún evento en voz/eventos.json incluye "prompt", lo genera automáticamente con Magnific API (sfx_magnific.py) y lo guarda en caché.
Aplica sidechaincompress tanto a la música como al bus de SFX ([sfx0]) controlado por [voz], normaliza en 2 pasadas a −14,0 LUFS / −1,5 dBTP y genera resultados/onda.png.
"""
import hashlib, json, math, pathlib, re, subprocess, sys

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

SKILL = pathlib.Path(__file__).resolve().parent.parent
proy = pathlib.Path(sys.argv[1]).resolve()
vz = proy / 'voz'
out_dir = proy / 'resultados'
out_dir.mkdir(exist_ok=True)

OBJ_I, OBJ_TP = -14.0, -1.5


def medir(wav):
    r = subprocess.run(
        ['ffmpeg', '-nostats', '-i', str(wav), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
        capture_output=True, text=True, encoding='utf-8', errors='replace'
    ).stderr
    idx = r.rfind('Summary:')
    if idx >= 0:
        r = r[idx:]
    m_i = re.search(r'I:\s+(-?[\d.]+) LUFS', r)
    m_tp = re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', r)
    i = float(m_i.group(1)) if m_i else -16.0
    tp = float(m_tp.group(1)) if (m_tp and m_tp.group(1) != '-inf') else -10.0
    return i, tp


def normalizar(entrada, salida, obj=OBJ_I, techo=OBJ_TP):
    i0, _ = medir(entrada)
    g = obj - i0
    for _ in range(4):
        lim = 10 ** ((techo - 0.3) / 20)
        af = (
            f'volume={g:.3f}dB,aresample=192000,alimiter=limit={lim:.5f}:level=0:attack=1:release=60:asc=1,'
            f'aresample=48000'
        )
        subprocess.run(
            ['ffmpeg', '-v', 'error', '-y', '-i', str(entrada), '-af', af, '-ar', '48000', '-ac', '2',
             '-c:a', 'pcm_s24le', str(salida)],
            check=True
        )
        i, tp = medir(salida)
        if abs(i - obj) <= 0.1 and tp <= techo:
            break
        g += obj - i
    return i, tp


if len(sys.argv) > 2 and sys.argv[2] == '--renormalizar':
    m = vz / 'mezcla.wav'
    viejo = vz / 'mezcla-previa.wav'
    if not viejo.exists():
        m.replace(viejo)
    i, tp = normalizar(viejo, m)
    print(f'✓ voz/mezcla.wav renormalizada · {i:.1f} LUFS · {tp:.1f} dBTP')
    sys.exit(0)

est = {}
try:
    est = json.loads((proy / 'estilo.json').read_text(encoding='utf-8'))
except Exception:
    pass

ev = json.loads((vz / 'eventos.json').read_text(encoding='utf-8'))
dur = float(ev['dur'])
mus = est.get('musica', 'cinematic-2')
mdb = est.get('musica_db', -21)
sdb = float(est.get('sfx_db', -14))

# Detectar si hay voz activa para aplicar techo protector de SFX (nunca tapar al locutor)
hay_voz = True
try:
    tl_path = vz / 'timeline.json'
    if tl_path.exists():
        tl_data = json.loads(tl_path.read_text(encoding='utf-8'))
        hay_voz = len(tl_data.get('palabras', [])) > 0
    else:
        vi, _ = medir(vz / 'voz.wav')
        hay_voz = vi > -48.0
except Exception:
    pass
if hay_voz:
    sdb = min(sdb, -12.0)

# Si hay eventos con "prompt" sin archivo generado, invocar sfx_magnific.py --lote
if any(e.get('prompt') and not e.get('archivo') for e in ev.get('eventos', [])):
    subprocess.run([sys.executable, str(SKILL / 'scripts' / 'sfx_magnific.py'), '--lote', str(proy)], check=True)
    ev = json.loads((vz / 'eventos.json').read_text(encoding='utf-8'))

ins, filt = ['-i', str(vz / 'voz.wav')], []
VFX = {
    'natural': (
        'highpass=f=70,deesser=i=0.35:m=0.5:f=0.5,equalizer=f=180:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1.2:g=1.5,'
        'acompressor=threshold=-20dB:ratio=3:attack=6:release=110:makeup=2,aecho=0.9:0.92:18|31:0.12|0.07'
    ),
    'grabada': 'highpass=f=40,equalizer=f=140:t=q:w=1:g=5,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120',
    'limpia': 'highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120',
}
vfx = VFX.get(est.get('voz_fx', 'natural'), VFX['natural'])
filt.append(f'[0:a]aresample=48000,{vfx},apad[voz0]')
filt.append(f'anoisesrc=color=pink:amplitude=0.0015:sample_rate=48000:duration={dur:.3f},lowpass=f=6000[sala]')
filt.append('[voz0][sala]amix=inputs=2:normalize=0:duration=first,aformat=sample_rates=48000:channel_layouts=stereo[voz]')
n = 1

has_mus = mus != 'sin'
if has_mus:
    mp = pathlib.Path(mus)
    if not mp.is_absolute():
        cand = proy / mus
        if cand.exists():
            mp = cand
    if not mp.exists():
        mp = vz / f'musica-{mus}.wav'
        if not mp.exists():
            subprocess.run(
                [sys.executable, str(SKILL / 'musica' / 'biblioteca.py'), 'pista', mus, f'{dur:.3f}', str(mp)],
                check=True, capture_output=True
            )
    ins += ['-stream_loop', '-1', '-i', str(mp)]
    fade_d = min(0.6, max(0.3, dur * 0.04))
    filt.append(
        f'[{n}:a]aresample=48000,aformat=sample_rates=48000:channel_layouts=stereo,volume={mdb}dB,atrim=0:{dur:.3f},'
        f'afade=t=out:st={max(0, dur - fade_d):.3f}:d={fade_d:.3f}[mus0]'
    )
    n += 1

sfx = []
for i, e in enumerate(ev.get('eventos', [])):
    f = None
    if e.get('archivo'):
        cand = pathlib.Path(e['archivo'])
        if not cand.is_absolute():
            cand = (proy / cand) if (proy / cand).exists() else (SKILL / 'musica' / 'sfx' / cand)
        if cand.exists():
            f = cand
    if f is None:
        tipo = e.get('tipo', 'whoosh')
        d = SKILL / 'musica' / 'sfx' / tipo
        fs = sorted(p for p in d.glob('*.wav')) if d.exists() else []
        if not fs:
            continue
        f = fs[int(hashlib.md5(f"{e['t']}{i}".encode()).hexdigest(), 16) % len(fs)]
    ins += ['-i', str(f)]
    vol = float(e.get('ganancia', e.get('vol', 1.0)))
    if hay_voz:
        vol = min(vol, 1.0)
    g = sdb + 20 * math.log10(max(0.05, vol))
    delay_ms = max(0, int(round(float(e['t']) * 1000)))
    filt.append(f'[{n}:a]aresample=48000,aformat=sample_rates=48000:channel_layouts=stereo,volume={g:.1f}dB,adelay={delay_ms}:all=1[s{i}]')
    sfx.append(f'[s{i}]')
    n += 1

has_sfx = len(sfx) > 0
if has_mus and has_sfx:
    filt.append('[voz]asplit=3[vozm][vozsc_m][vozsc_s]')
elif has_mus:
    filt.append('[voz]asplit=2[vozm][vozsc_m]')
elif has_sfx:
    filt.append('[voz]asplit=2[vozm][vozsc_s]')

if has_mus:
    filt.append('[mus0][vozsc_m]sidechaincompress=threshold=0.03:ratio=5:attack=40:release=450[mus]')

if len(sfx) == 1:
    filt.append(f'{sfx[0]}apad,atrim=0:{dur:.3f}[sfx0]')
elif len(sfx) > 1:
    filt.append(f'{"".join(sfx)}amix=inputs={len(sfx)}:normalize=0:duration=longest,apad,atrim=0:{dur:.3f}[sfx0]')

if has_sfx:
    filt.append('[sfx0][vozsc_s]sidechaincompress=threshold=0.018:ratio=8:attack=6:release=200[sfx]')

mix_inputs = ['[vozm]' if (has_mus or has_sfx) else '[voz]']
if has_mus:
    mix_inputs.append('[mus]')
if has_sfx:
    mix_inputs.append('[sfx]')

if len(mix_inputs) == 1:
    filt.append(f'{mix_inputs[0]}atrim=0:{dur:.3f}[out]')
else:
    filt.append(f'{"".join(mix_inputs)}amix=inputs={len(mix_inputs)}:normalize=0:duration=first,atrim=0:{dur:.3f}[out]')

cruda = vz / 'mezcla-cruda.wav'
salida = vz / 'mezcla.wav'
subprocess.run(
    ['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(filt),
     '-map', '[out]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_f32le', str(cruda)],
    check=True
)
li, tp = normalizar(cruda, salida)

# Generar forma de onda para verificación visual de picos de audio (requisito de Josué 3D + Viegas)
onda_png = out_dir / 'onda.png'
subprocess.run(
    ['ffmpeg', '-v', 'error', '-y', '-i', str(salida),
     '-filter_complex', 'showwavespic=s=1400x260:colors=#2fb7f5|#df3b30', '-frames:v', '1', str(onda_png)],
    check=True
)
print(f'✓ voz/mezcla.wav · {dur:.1f} s · música {mus} · {len(sfx)} efectos · {li:.1f} LUFS · {tp:.1f} dBTP · onda en resultados/onda.png')
