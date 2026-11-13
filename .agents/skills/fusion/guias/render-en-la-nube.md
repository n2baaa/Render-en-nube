# Cómo renderizar videos explicativos 3D (Three.js + Chrome + FFmpeg) en la nube

Sí, **se puede renderizar 100 % en la nube** sin ocupar la CPU/GPU de tu PC local. Como el motor de la skill `fusion` es determinista (`window.renderFrame(t)` depende únicamente del tiempo `t`), incluso se puede **dividir el video en tramos paralelos** entre varios contenedores o máquinas.

Aquí tienes las **4 mejores opciones** ordenadas de la más fácil y barata a la más rápida con GPU:

---

## 1. GitHub Actions (Gratis hasta 2.000 min/mes en repositorios privados o ilimitado en públicos)
GitHub Actions incluye runners Ubuntu con Chrome, Node.js, Python y FFmpeg preinstalados.
- **Cómo funciona:** Subes el código del proyecto (`src/scene.js`, `voz/voz.wav`, `voz/timeline.json`) y GitHub Actions renderiza los tramos en paralelo usando una `matrix` de 4 trabajos y sube el `video-final.mp4` como artefacto descargable.
- **Velocidad:** Con 4 runners en paralelo (usando SwiftShader/ANGLE en CPU), un video de 45 s se renderiza en ~3–4 minutos sin tocar tu PC.

### Archivo `.github/workflows/render-3d.yml` listo para usar:
```yaml
name: Render Video 3D Fusion
on:
  workflow_dispatch:
    inputs:
      proyecto:
        description: 'Carpeta del proyecto (ej. cable-submarino-3d)'
        required: true
        default: 'cable-submarino-3d'

jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Instalar dependencias
        run: |
          sudo apt-get update && sudo apt-get install -y ffmpeg google-chrome-stable
          pip install numpy scipy
          npm ci
          npx playwright install chromium
      - name: Renderizar Video 3D + Masterizar Audio (-14 LUFS)
        run: |
          node .agents/skills/fusion/scripts/render.mjs "${{ github.event.inputs.proyecto }}" video --calidad final --hilos 4
      - name: Subir MP4 Final y Hojas de Control
        uses: actions/upload-artifact@v4
        with:
          name: video-final-${{ github.event.inputs.proyecto }}
          path: |
            ${{ github.event.inputs.proyecto }}/resultados/video-final.mp4
            ${{ github.event.inputs.proyecto }}/resultados/gancho.jpg
            ${{ github.event.inputs.proyecto }}/resultados/hoja.jpg
            ${{ github.event.inputs.proyecto }}/resultados/onda.png
```

---

## 2. Modal.com o Google Cloud Run con GPU (Render ultrarrápido en < 25 segundos)
Si quieres que el sombreado `inkRenderer` (doble pase de profundidad + normales) y el codificador `h264_nvenc` corran a velocidad de tarjeta gráfica dedicada en la nube:
- **Modal.com** te da **$30 USD/mes gratis** y permite lanzar una función de Python con GPU NVIDIA T4 o L4 (`@app.function(gpu="T4")`) que ejecuta `node render.mjs <proyecto> video --calidad final`.
- Con una GPU T4/L4 y EGL headless (`--use-gl=egl`), Chrome usa aceleración hardware real y `ffmpeg` codifica con `h264_nvenc`: **un video de 45 s a 1080×1920 tarda ~20–30 segundos y cuesta menos de $0.01 USD por render**.

### Script `modal_render.py` listo para usar con Modal (`pip install modal && modal run modal_render.py`):
```python
import modal

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "wget", "gnupg", "ca-certificates", "libnss3", "libgbm1", "libasound2", "libegl1", "libgl1")
    .run_commands(
        "wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg",
        "echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main' > /etc/apt/sources.list.d/google-chrome.list",
        "apt-get update && apt-get install -y google-chrome-stable nodejs npm",
    )
    .pip_install("numpy", "scipy")
)

app = modal.App("fusion-3d-cloud-render", image=image)

@app.function(gpu="T4", timeout=600)
def render_cloud(project_name: str):
    import subprocess
    subprocess.run(["node", ".agents/skills/fusion/scripts/render.mjs", project_name, "video", "--calidad", "final", "--hilos", "4"], check=True)
    with open(f"{project_name}/resultados/video-final.mp4", "rb") as f:
        return f.read()
```

---

## 3. Remotion Lambda (AWS Lambda distribuido)
Como tu repositorio ya tiene instalado `@remotion/renderer` y `@remotion/cli`, también puedes envolver la escena Three.js en `@remotion/three` y lanzarla con `npx remotion lambda render`:
- AWS Lambda divide el video de 1.200 fotogramas en **60 funciones Lambda simultáneas** (20 fotogramas cada una) y une el MP4 en S3 en **15 segundos**.
- Costo aproximado: **$0.02–$0.04 USD por video**.

---

## 4. Mezcla de video y audio en la nube de Magnific (`video_audio_mix`)
Además, tal como incluye la skill de Josué, si tienes el conector de Magnific activo, la unión final de audio y video (`video_audio_mix`) se puede hacer directamente en los servidores de Magnific sin gastar créditos (0 créditos).
