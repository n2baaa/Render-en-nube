---
name: fusion
description: "Fusión completa de video-explicativo-3d-josue (Three.js 3D Toon + contorno de tinta + hook explosivo de 5 golpes + loop perfecto + 3 entornos con capas de profundidad) y videos-explicativos-claude (investigación verificada con fuentes, voz de Magnific/ElevenLabs alineada palabra a palabra con Whisper, anclas de voz crearAnclas/en/fin, biblioteca musical de 30+ estilos con sidechain ducking, efectos SFX de Magnific AI + biblioteca Viegas, masterización en 2 pasadas a -14 LUFS, forma de onda onda.png y render paralelo con GPU/NVENC o en la nube). Úsala cuando pidan un video explicativo 3D, un reel con Three.js y recursos de audio/voz profesionales, o la skill fusion."
---

# FUSION · Videos Explicativos Verticales 3D Toon (Three.js) + Motor de Audio, Voz y Anclas (Magnific / ElevenLabs / Viegas)

Esta skill fusiona lo mejor de dos mundos en una sola herramienta:
1. **De `video-explicativo-3d-josue` (Dirección Visual y Narrativa 3D Toon):**
   - Escena **Three.js 3D estilo Toon de una sola toma continua** (1080×1920), con sombreado de 3 bandas (`toon()`) y **contorno de tinta en doble pase** (`inkRenderer`: siluetas por profundidad + aristas por normales).
   - **Hook obligatorio de 5 golpes en 4 s con frase de arranque ≤ 7 palabras (1,5–2,2 s):** acción literal ya ocurriendo en el fotograma 0 (`explosion()`, `shake()`), titular `.cap` de **3–4 palabras** y cero preámbulos largos.
   - **Literalidad 1:1 («Lo que se dice, se ve»):** cada metáfora de tamaño, objeto o distancia narrada se dibuja literalmente lado a lado con su referente físico real (`hairComparison()` para el grosor de un cabello, etc.).
   - **Escala Macro Real y Continuidad Física Cero-Desapariciones:** separación vertical abisal real con plano zoom-out alto (`abyssalDepthScale()`), extremos costeros/urbanos monumentales y estiba física real (`stowedAnchorRig()`, prohibido `.visible = false` al recoger anclas/piezas).
   - **Estructuras de guion adictivas:** **Tipo A** (Cadena de «peros» donde cada solución destapa el siguiente obstáculo), **Tipo B** (Mito contra realidad) y **Tipo C** (El viaje de un objeto por sus estaciones).
   - **Loop perfecto:** `update(0)` y `update(META.duration)` dibujan el mismo estado y encuadre (`cameraAt` anula la deriva en ambos extremos).
   - **Mínimo 3 entornos** con transición visible (`setTimeOfDay` / cambio de cielo, niebla y luz) y **3 capas de profundidad** (cerca, media y lejos con mínimo 8 elementos de fondo y movimiento constante).
   - **Personaje expresivo sin rig** (`character()` con `LatheGeometry` + dos ojos) que reacciona a cada fallo y solución.
2. **De `videos-explicativos-claude` (Investigación, Voz Palabra a Palabra, Música, SFX Magnific/Viegas y Render):**
   - **Investigación rigurosa (`fuentes.md`):** cada cifra, fecha o mecanismo lleva su URL verificada. En noticias o accidentes incluye el rótulo «Recreación» (`#badge`).
   - **Voz generada con Magnific / Freepik API o ElevenLabs (`scripts/voz.py`):** genera el locutor y lo alinea **palabra a palabra con Whisper** (`voz/voz.wav`, `voz/timeline.json` y `voz/timeline.js`).
   - **Anclas exactas a las palabras de la voz (`crearAnclas` en `motor/kit3d.js`):** `en('palabra')`, `fin('frase')`, `debe()` y `sonido(t, tipo, ganancia)`. Ninguna animación ni cambio de plano va a ciegas: todo se sincroniza al milisegundo con lo que dice el locutor.
   - **Efectos de sonido (SFX) con Magnific AI + Biblioteca Viegas (`musica/sfx/` + `scripts/sfx_magnific.py`):**
     - 15 categorías listas en `musica/sfx/` (`explosion`, `thud`, `chispa`, `riser`, `alarma`, `agua`, `motor`, `whoosh`, `pop`, `click`, `swoosh`, `notificacion`, `teclado`, `dinero`, `feedback`).
     - Generación bajo demanda de efectos personalizados con **Magnific API** (`POST https://api.freepik.com/v1/ai/sound-effects` vía `sfx_magnific.py`).
   - **Música propia libre de derechos (`musica/biblioteca.py`):** más de 30 estilos (`cinematic-2`, `darksynth-1`, `trailer-1`, `tech-1`, `lofi-1`, etc.) con **sidechain ducking automático** cuando habla el locutor.
   - **Masterización profesional (`scripts/mezcla.py`):** cadena de voz (`natural` con EQ, de-esser, compresión y tono de sala a −60 dBFS), normalización EBU R128 en **dos pasadas a −14,0 LUFS / −1,5 dBTP** y generación automática de la forma de onda en `resultados/onda.png`.
   - **Renderizador paralelo con GPU (`scripts/render.mjs`) y Guía Cloud (`guias/render-en-la-nube.md`):** compila `src/scene.js` con `esbuild`, verifica 0 anclas perdidas (`comprobar`), genera hojas de contacto del hook (`gancho`), del empalme (`loop`) y de todo el video (`hoja`), y renderiza el MP4 final con `h264_nvenc` (GPU) o `libx264`.

---

## Paso 0 · Comprobar el entorno
Ejecuta:
```bash
python .agents/skills/fusion/scripts/preparar.py
```
Verifica Node.js, FFmpeg, Google Chrome, Playwright, Python (`numpy`, `scipy`, `whisper`) y la clave `FREEPIK_API_KEY` / `ELEVENLABS_API_KEY` en `~/.viegas/elevenlabs.env` (nunca imprimas la clave).
> **¿Renderizar en la nube?** Consulta `.agents/skills/fusion/guias/render-en-la-nube.md` para renderizar en GitHub Actions (gratis), Modal.com con GPU NVIDIA T4 (< 30 s) o Remotion Lambda.

---

## Paso 1 · Tema, Investigación (`fuentes.md`) y Tipo de Guion
1. **Investigar con fuentes reales:** busca en la web datos concretos (cifras, fechas, causas físicas, cotizaciones o informes técnicos) y anota cada dato con su URL en `<proyecto>/fuentes.md`.
2. **Elegir el tipo de guion:**
   - **Tipo A — Cadena de «peros» (Recomendado para mecanismos, crisis o tecnología):**
     1. **Gancho (0–4 s):** desastre o resultado final en plena acción + afirmación o pregunta sorprendente.
     2. **Desarmar:** se desarma la escena en los primeros segundos («Construyámoslo / entendámoslo desde cero»).
     3. **Eslabones (3 a 5 eslabones):** cada uno sigue la plantilla: `Pero [obstáculo concreto con subtítulo rojo]. [Consecuencia visible en 3D]. Así que [pieza/acción que aparece]. Eso es [nombre técnico, SIEMPRE después de mostrar la necesidad]. [Dato real verificado].`
     4. **Cierre y Loop:** vuelve al estado del fotograma 0 ahora comprendido.
   - **Tipo B — Mito contra realidad:** desmonta una creencia popular mostrando cómo falla el mito y cómo funciona el mecanismo real.
   - **Tipo C — El viaje:** la cámara sigue sin cortes a un único objeto (un paquete de datos, un barril, un dron, una orden bursátil) a través de 4–6 estaciones hasta la estación oculta que nadie conoce.

---

## Paso 2 · Guion (`voz.txt`) y Generación de Voz con Magnific / ElevenLabs (`voz.py`)
1. Escribe `<proyecto>/voz.txt` «para el oído» (90–130 palabras, 35–50 s, ritmo de 2,4–3,0 palabras/s, frases cortas de 5–10 palabras, números escritos en letra para que la pronunciación sea perfecta).
   - **Regla estricta de apertura (Hook verbal ≤ 7 palabras / 1,5–2,2 s):** la primera frase debe tener **máximo 7 palabras** (~1,5–2,2 s), golpear la curiosidad desde la primera sílaba y evitar preámbulos de 15–25 palabras. El contexto se desarrolla recién a partir de la frase 2.
   - **Regla de literalidad 1:1:** no incluyas ninguna metáfora visual (ej. *«del grosor de un cabello»*, *«cuatro mil metros bajo el mar»*) si no vas a mostrar literalmente ese objeto/escala en el 3D en su palabra exacta.
2. Genera la voz con Magnific / Freepik API (o ElevenLabs) y alinéala palabra a palabra con Whisper:
   ```bash
   python .agents/skills/fusion/scripts/voz.py <proyecto> --api --voz Nh2zY9kknu6z4pZy6FhD
   ```
   *(O si ya descargaste un audio de Magnific en Descargas: `python .agents/skills/fusion/scripts/voz.py <proyecto> --magnific`, o con un archivo local: `--alinear ruta.mp3`).*
3. Esto genera:
   - `<proyecto>/voz/voz.wav` (48 kHz mono)
   - `<proyecto>/voz/timeline.json` y `<proyecto>/voz/timeline.js` con el inicio `s` y fin `e` exacto de cada palabra del guion.

---

## Paso 3 · Anatomía del Hook Obligatorio (5 Golpes en 4 Segundos) y Loop
Ningún video sale sin hook de acción literal en el cuadro 0:
- **Frase de apertura ≤ 7 palabras (1,5–2,2 s)** + **titular `.cap` de 3–4 palabras** legible sin audio desde `t = 0`.
- **Acción literal desde el fotograma 0:** si hay impacto o explosión (`explosion()`), dimensiona la bola de fuego (`size ≤ 0.7`, `{ alto: 0.7 }`) para que jamás tape el titular `.cap` ni el objeto protagonista.

| Tiempo | Golpe | Qué pasa en 3D | Cámara |
|---|---|---|---|
| **0,0–0,5 s** | **1. En plena acción** | El desastre, choque, explosión o descarga **YA está ocurriendo** en el cuadro 0 (`explosion()`, `shake()`, chispas, flujo activo) | Cerca, con deriva y empuje |
| **0,5–1,1 s** | **2. Consecuencia** | El personaje (`character()`) o pieza sale despedido / reacciona al impacto | Lo sigue y abre ángulo |
| **1,1–1,5 s** | **Respiro** | El sistema principal en tensión durante medio segundo | Se desliza de lado (`fov` 42) |
| **1,5–2,2 s** | **3. Destrucción** | Todo se desarma escalonadamente (desfase de 0,05 s por pieza: giran, suben y encogen) | Retrocede y sube a plano general (`fov` 48) |
| **2,2–3,1 s** | **4. Barrido** | Queda la base pelada y el personaje tirado / asombrado | Baja, rodea la esquina y cruza al otro lado |
| **3,1–4,4 s** | **5. Punto de partida** | Primer plano del origen del mecanismo y entra la primera pieza con `easeOutBack` o `drawTube` | Frena en primer plano (`fov` 34) |

**Regla de Loop:**
- `update(0)` y `update(META.duration)` dibujan el mismo estado (todas las piezas reconstruidas, flujo activo en fase `speed = n / META.duration` y la última pose de `POSES` idéntica a la primera).

---

## Paso 4 · Construir la Escena 3D (`index.html` y `src/scene.js`)
1. Copia `.agents/skills/fusion/plantillas/index.html` a `<proyecto>/index.html`.
2. Crea `<proyecto>/estilo.json`:
   ```json
   {
     "musica": "cinematic-2",
     "musica_db": -21,
     "sfx_db": -14,
     "voz_fx": "natural"
   }
   ```
3. Escribe `<proyecto>/src/scene.js` importando desde `../.agents/skills/fusion/motor/kit3d.js`:
   ```js
   import * as THREE from 'three';
   import {
     PALETTE as P, toon, mesh, buildWorld, cloud, tree, character,
     hairComparison, stowedAnchorRig, abyssalDepthScale,
     sandTexture, brickTexture, skyTexture, polyCurve, drawTube, flowBeads,
     cameraAt, shake, captions, subtitulosTimeline, setTimeOfDay,
     distancePanel, pulsePanel, explosion, inkRenderer, crearAnclas,
     clamp, lerp, smooth, ramp, easeOutBack
   } from '../.agents/skills/fusion/motor/kit3d.js';
   ```
4. **Reglas visuales obligatorias:**
   - **Anclas de voz:** usa `const { tl, dur, en, fin, debe, sonido } = crearAnclas();` y ancla cada eslabón, pose de cámara y subtítulo a las palabras reales del locutor (`const tPero1 = debe(en('pero'), 'pero 1');`).
   - **Literalidad 1:1 («Lo que se dice, se ve»):** cada metáfora de tamaño, objeto o distancia debe dibujarse literalmente con su referencia física real (p. ej., `hairComparison()` para comparar lado a lado un cabello humano extraído contra una fibra óptica o objeto fino).
   - **Escala Macro Real + Zoom-Out de Profundidad / Extensión:** en escenas oceánicas o de gran escala, exige separación dramática entre superficie y fondo (`abyssalDepthScale()` con cotas `0 m → -1000 m → -2000 m → -4000 m` y plano zoom-out bien alto) y extremos costeros/urbanos lejanos con proporción arquitectónica monumental (prohibido pegar edificios miniatura junto a 2 metros de cable).
   - **Continuidad Física Cero-Desapariciones:** prohibido usar `.visible = false` sobre anclas, ganchos, grúas o vehículos al recogerse; deben quedar visiblemente estibados/acoplados junto a su nave o soporte (`stowedAnchorRig()`).
   - **3 entornos y 3 capas de fondo:** cambia cielo, luz y niebla entre entornos (`setTimeOfDay` o cambio de paleta) y coloca mínimo 8 elementos en capas cercana, media y lejana con movimiento perpetuo (olas, nubes, luces, barcos, drones, aves).
   - **6+ tipos de planos de cámara por minuto:** contrapicado, cenital, primerísimo plano, seguimiento, barrido orbital y plano general (incluyendo zoom-out alto de escala). Ningún plano dura más de 3,5 s sin moverse.
   - **Doble capa de texto sincronizado:**
     - Arriba (`#cap` con `captions(capEl, CUES, t)`): rótulos cortos de impacto (**3–4 palabras** en el hook, `color: 'danger'` para cada «pero» u obstáculo).
     - Abajo (`#sub` con `subtitulosTimeline(subEl, tl, t, { peligros, acentos })`): subtítulos palabra a palabra sincronizados en zona segura (y = 1435 px).
   - **Anti-Osciloscopios (Regla del 15 % para `#panel`):** prohibido repetir cajas oscuras grandes tipo osciloscopio. `#panel` es ahora una píldora discreta de telemetría de `420×92 px` (**14,3 %** del antiguo `900×300`) y está limitado a **máximo 1 aparición breve (≤ 15 % de la duración del video)** — o **0** si un indicador 3D diegético ya lo explica.

---

## Paso 5 · Mapa de Sonido (Magnific AI SFX + Biblioteca Viegas)
Registra los efectos en `src/scene.js` con `sonido(t, tipo, ganancia, extra)` (o genera SFX a medida con `python .agents/skills/fusion/scripts/sfx_magnific.py`):
- **Categorías integradas en `fusion/musica/sfx/` (48 kHz WAV):**
  - Acción 3D (generados con Magnific AI): `'explosion'`, `'thud'`, `'chispa'`, `'riser'`, `'alarma'`, `'agua'`, `'motor'`.
  - Transiciones y UI (biblioteca Viegas): `'whoosh'`, `'pop'`, `'click'`, `'swoosh'`, `'notificacion'`, `'teclado'`, `'dinero'`, `'feedback'`.
- **SFX personalizados con Magnific AI en cualquier evento:**
  Si pasas `{ prompt: ' Underwater fiber optic cable snapping with electric arc', dur: 2.0 }` en `sonido(t, 'explosion', 1.0, { prompt: '...' })`, `mezcla.py` llamará automáticamente a `sfx_magnific.py` para generarlo en Magnific (`api.freepik.com/v1/ai/sound-effects`) y guardarlo en caché en `<proyecto>/voz/sfx/`.
- **Jerarquía Audio/Voz (Inteligibilidad Absoluta):**
  - `sfx_db` base en **`-14`** (con techo protector en `mezcla.py` y **sidechain ducking obligatorio también sobre el bus de SFX `[sfx0]`** controlado por `[voz]`).
  - **Arranque vocal limpio:** máximo **1 SFX sutil** en `t < 2,2 s` si hay voz inmediata; `crearAnclas().sonido()` atenúa automáticamente golpes iniciales sobre palabras activas y aplica **anti-apilamiento (`minGap = 0,35 s`)** entre golpes fuertes.
  - **Densidad equilibrada:** ningún tramo largo (> 2–3 s) sin textura sonora, pero jamás apilar varios golpes encima de una frase clave.

---

## Paso 6 · Verificación Visual (`comprobar`, `gancho`, `loop`, `hoja`) y Paso 6b (Crítica de Director)
Antes del render final, ejecuta las pruebas ligeras en orden:

```bash
# 1. Comprobar que hay 0 anclas perdidas, alertas __dudas (SFX/panel) y exportar voz/eventos.json
node .agents/skills/fusion/scripts/render.mjs <proyecto> comprobar

# 2. Verificar los 6 golpes del Hook (0, 0.3, 0.6, 1.5, 2.5, 3.7 s)
node .agents/skills/fusion/scripts/render.mjs <proyecto> gancho

# 3. Verificar el empalme del Loop (0.00 s vs dur - 0.03 s)
node .agents/skills/fusion/scripts/render.mjs <proyecto> loop

# 4. Hoja de contacto completa (18 fotogramas repartidos en todo el video)
node .agents/skills/fusion/scripts/render.mjs <proyecto> hoja 18
```

### Paso 6b · Puerta de Crítica de Director Audiovisual (OBLIGATORIA antes de renderizar MP4)
Inspecciona con `read_file` `resultados/gancho.jpg`, `resultados/loop.jpg` y `resultados/hoja.jpg` (y `resultados/onda.png` tras `mezcla.py`) y verifica los **7 criterios no negociables** (detalle completo en `referencias/critica-director.md`):
1. **Hook ≤ 7 palabras (1,5–2,2 s):** titular `.cap` de 3–4 palabras, acción literal en `t = 0` sin bola de fuego tapando el rótulo.
2. **Literalidad 1:1:** toda metáfora narrada («cabello», «moneda», «kilómetros») se ve comparada físicamente en el 3D.
3. **Escala Macro Real:** profundidad abisal creíble con zoom-out alto (`0 m → -4000 m`) y costas/ciudades monumentales lejanas (cero maquetas pegadas).
4. **Continuidad Física Cero-Desapariciones:** anclas, ganchos y piezas recogidas quedan estibados en su nave/soporte (prohibido `.visible = false`).
5. **Jerarquía Audio/Voz:** `sfx_db` en `-14`, ≤ 1 SFX sutil al inicio si hay voz, `minGap >= 0.35 s` y sidechain activo sobre música y SFX.
6. **Anti-Osciloscopios (Regla del 15 %):** máx. 1 aparición breve del chip `#panel` (`420×92 px`, ≤ 15 % de duración/huella) o 0 si el 3D ya lo explica.
7. **Loop y encuadre:** ningún personaje o rótulo cortado, 0 avisos críticos en `__dudas` y empalme perfecto en `loop.jpg`.

**No ejecutes el render MP4 sin pasar el Paso 6b.** Una vez aprobado:
```bash
# 5. Render final MP4 (1080×1920, mezcla a -14.0 LUFS y forma de onda resultados/onda.png)
node .agents/skills/fusion/scripts/render.mjs <proyecto> video --calidad final
```

Revisa también el `resultados/onda.png` final con `read_file` antes de entregar el proyecto.
