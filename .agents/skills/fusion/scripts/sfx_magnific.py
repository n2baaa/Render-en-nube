"""sfx_magnific.py · Generador de efectos de sonido (SFX) con Magnific / Freepik API para la skill fusion.

Uso:
  python sfx_magnific.py <archivo_salida.wav> "<prompt en inglés>" [duracion_segundos=2.0]
  python sfx_magnific.py --lote <proyecto>   # genera todos los eventos de voz/eventos.json que tengan "prompt"

Usa FREEPIK_API_KEY de ~/.viegas/elevenlabs.env contra POST https://api.freepik.com/v1/ai/sound-effects,
descarga el audio de cdn-magnific.freepik.com y lo convierte a WAV 48 kHz estéreo.
Nunca imprime la clave de API.
"""
import json, os, pathlib, re, subprocess, sys, time, urllib.request

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass


def clave_api():
    k = os.environ.get('FREEPIK_API_KEY') or os.environ.get('MAGNIFIC_API_KEY')
    if not k:
        f = pathlib.Path.home() / '.viegas' / 'elevenlabs.env'
        if f.exists():
            txt = f.read_text(encoding='utf-8')
            m = re.search(r'(?:FREEPIK_API_KEY|MAGNIFIC_API_KEY)\s*=\s*(\S+)', txt)
            k = m and m.group(1)
    if not k:
        sys.exit('Falta FREEPIK_API_KEY en ~/.viegas/elevenlabs.env')
    return k


def generar_sfx(prompt, destino_wav, dur=2.0):
    destino_wav = pathlib.Path(destino_wav).resolve()
    if destino_wav.exists() and destino_wav.stat().st_size > 1000:
        print(f'✓ SFX en caché: {destino_wav.name}')
        return destino_wav
    key = clave_api()
    url = 'https://api.freepik.com/v1/ai/sound-effects'
    dur_clamped = max(0.5, min(22.0, float(dur)))
    cuerpo = {'text': prompt, 'duration_seconds': dur_clamped}
    req = urllib.request.Request(
        url,
        data=json.dumps(cuerpo).encode('utf-8'),
        headers={'x-freepik-api-key': key, 'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=45) as r:
        d = json.loads(r.read().decode('utf-8'))
    tid = (d.get('data') or {}).get('task_id') or d.get('task_id')
    if not tid:
        raise RuntimeError(f'No se pudo crear tarea SFX en Magnific: {d}')
    print(f'→ Generando SFX en Magnific ({tid}): "{prompt}" ({dur_clamped:.1f}s)…')
    mp3_url = None
    for _ in range(45):
        time.sleep(2)
        req2 = urllib.request.Request(f'{url}/{tid}', headers={'x-freepik-api-key': key})
        with urllib.request.urlopen(req2, timeout=30) as r2:
            d2 = json.loads(r2.read().decode('utf-8')).get('data') or {}
        st = d2.get('status')
        if st == 'COMPLETED' and d2.get('generated'):
            mp3_url = d2['generated'][0]
            break
        if st in ('FAILED', 'ERROR'):
            raise RuntimeError(f'Falló SFX en Magnific: {d2}')
    if not mp3_url:
        raise RuntimeError('Tiempo agotado esperando SFX de Magnific.')
    destino_wav.parent.mkdir(parents=True, exist_ok=True)
    tmp_mp3 = destino_wav.with_suffix('.tmp.mp3')
    urllib.request.urlretrieve(mp3_url, str(tmp_mp3))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(tmp_mp3), '-ac', '2', '-ar', '48000', str(destino_wav)], check=True)
    tmp_mp3.unlink(missing_ok=True)
    print(f'✓ SFX Magnific guardado: {destino_wav.name}')
    return destino_wav


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)
    if sys.argv[1] == '--lote':
        proy = pathlib.Path(sys.argv[2]).resolve()
        ev_file = proy / 'voz' / 'eventos.json'
        ev = json.loads(ev_file.read_text(encoding='utf-8'))
        sfx_dir = proy / 'voz' / 'sfx'
        sfx_dir.mkdir(parents=True, exist_ok=True)
        for i, e in enumerate(ev.get('eventos', [])):
            if e.get('prompt'):
                slug = re.sub(r'[^a-z0-9]+', '-', e['prompt'].lower()).strip('-')[:36]
                fname = e.get('archivo') or f"{e.get('tipo', 'sfx')}-{slug}.wav"
                wav_path = sfx_dir / fname
                generar_sfx(e['prompt'], wav_path, e.get('dur', 2.0))
                e['archivo'] = str(wav_path)
        ev_file.write_text(json.dumps(ev, ensure_ascii=False, indent=1), encoding='utf-8')
    else:
        salida = sys.argv[1]
        prompt = sys.argv[2]
        dur = float(sys.argv[3]) if len(sys.argv) > 3 else 2.0
        generar_sfx(prompt, salida, dur)
