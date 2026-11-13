# Crítica de Director Audiovisual · Auditoría del Caso `cables-submarinos-3d` y Brechas de la Skill `fusion`

**Proyecto auditado:** `cables-submarinos-3d/` (`voz.txt`, `voz/timeline.json`, `voz/eventos.json`, `estilo.json`, `src/scene.js`, `resultados/gancho.jpg`, `resultados/hoja.jpg`, `resultados/loop.jpg`, `resultados/onda.png`)  
**Versión de skill auditada:** `.agents/skills/fusion/` (`SKILL.md`, `plantillas/index.html`, `motor/kit3d.js`, `scripts/mezcla.py`, `referencias/ganchos.md`, `referencias/calidad-visual.md`, `referencias/requisitos.md`)  
**Alcance:** Diagnóstico editorial, visual, físico y sonoro previo a la corrección sistémica de la skill `fusion` (sin modificar ni re-renderizar `cables-submarinos-3d/`).

---

## Resumen Ejecutivo

Aunque el render técnico de `cables-submarinos-3d` cumple con el pipeline de compilación, las 0 anclas perdidas y el loop visual (`loop.jpg` empalma en `0.00 s` y `62.62 s`), **como pieza audiovisual vertical falla en retención inicial, escala espacial, literalidad visual, continuidad física e inteligibilidad sonora**. La raíz no está solo en el proyecto ejemplo, sino en omisiones y valores por defecto permisivos dentro de la propia skill `.agents/skills/fusion/`.

Se identifican **7 defectos graves**:

| # | Defecto grave | Evidencia observada en `cables-submarinos-3d` | Causa raíz en `.agents/skills/fusion` |
|---|---|---|---|
| 1 | Hook verbal demasiado largo y sin golpe inmediato | `voz.txt` abre con una frase de **26 palabras / 8,38 s** (`0.00–8.38 s`; 19 palabras / `6.22 s` antes de «satélite:»); `.cap` muestra 6 palabras (`99 % DE INTERNET BAJO EL MAR`). | `SKILL.md` exige «hook de 5 golpes en 4 s», pero no limita la frase de apertura a ≤ 7 palabras (`1,5–2,2 s`) ni el titular `.cap` a 3–4 palabras. `ganchos.md` permitía hasta 8 palabras sin límite temporal estricto. |
| 2 | Falta de literalidad 1:1 («lo que se dice, se ve») | Entre `13.26 s` y `15.60 s` (`hoja.jpg` `15.7 s`, `scene.js:698`), el locutor dice *«del grosor de un cabello»*, pero solo aparece `charOp` tras un tubo grueso de vidrio sin ningún cabello ni referencia humana. | Las guías hablan genéricamente de «dibuja lo que dice el guion», pero no obligan a comparar lado a lado cada metáfora de grosor/escala con un objeto físico real ni proveen helper 3D en `kit3d.js`. |
| 3 | Escala vertical de profundidad irreal | `SEA_Y = 5.0` frente al fondo `y = 0` (`scene.js:133`). En `hoja.jpg` (`8.7 s`, `47.0 s`), el barco flota a ~5 unidades del cable (poco más de 2 alturas del personaje `charOp`), como en una piscina, sin plano de gran alejamiento abisal. | No existe regla de estratificación abisal (`0 m → -1000 m → -4000 m`), separación macro ni helper `abyssalDepthScale` en `kit3d.js`. |
| 4 | Extremos terrestres y urbanos miniaturizados | `coastLeft` (`x = -13.5`) y `cityRight` (`x = +13.5`) flotan como maquetas cuadradas (`9.5×5.5×9.5` y `10×5.5×10`) junto a un cable de solo `21.6` u (`x = -10.8..+10.8`). En `hoja.jpg` (`12.2 s`, `50.5 s`), los rascacielos y la estación parecen juguetes pegados al cable. | Faltaba norma de proporción arquitectónica monumental y distancia real entre origen, tramo profundo y destino en `SKILL.md` / `calidad-visual.md`. |
| 5 | Continuidad física rota en el ancla | `scene.js:906-907` oculta el ancla y su cadena con `anchorGroup.visible = anchorLift < 0.97` cuando `anchorLift >= 0.97`: el ancla desaparece mágicamente en el aire/agua en vez de quedar acoplada al casco del barco. | `kit3d.js` carecía de rig de estiba física (`stowedAnchorRig`) y las guías no prohibían explícitamente usar `.visible = false` al recoger objetos mecánicos. |
| 6 | Voz enmascarada al inicio por SFX apilados sin ducking | `estilo.json` usa `"sfx_db": -7`; `eventos.json` apila **6 SFX entre `0.02 s` y `1.85 s`** (`ancla-corte.wav` a `ganancia: 1.15`, `chispa`, `whoosh`, `alarma`, `riser`, `thud`). En `0–2 s`, `voz.wav` mide `-16.4 dB` mean, mientras `mezcla.wav` sube a `-14.4 dB` mean. | `mezcla.py:78` fijaba `sfx_db` por defecto en `-8` y `mezcla.py:120` aplicaba `sidechaincompress` **solo a la música (`[mus0]`)**, mezclando todos los SFX sin atenuación sobre `[vozm]`. `kit3d.js` `sonido()` permitía apilar golpes con `< 0.2 s` de separación en `t < 2.2 s`. |
| 7 | Abuso repetitivo de recuadros osciloscopio (`#panel`) | `#panel` (`900×290/300 px = 270 000 px²`, opacidad `0.92–0.93`, borde `5 px`) aparece **3 veces** (`18.0–24.2 s`, `31.6–41.8 s`, `48.1–52.4 s` = **20,7 s / 33 % del vídeo**), tapando cielo, rascacielos y la escena 3D (`hoja.jpg` `19.1 s`, `22.6 s`, `33.1 s`, `36.5 s`, `40.0 s`, `50.5 s`). | `plantillas/index.html:32-37` y `kit3d.js` (`distancePanel`, `pulsePanel`) imponían una caja enorme de `900×300 px` y `SKILL.md` fomentaba su uso repetido sin límite de apariciones ni de huella. |

---

## Análisis Detallado de los 7 Defectos

### 1. Hook inicial demasiado largo (~20+ palabras, > 8 s) y sin golpe de curiosidad inmediato
- **Observado en `cables-submarinos-3d/voz.txt` y `voz/timeline.json`:**
  - Frase 1 completa: *«El noventa y nueve por ciento de internet y diez billones de dólares al día no viajan por satélite: van por este hilo bajo el mar.»* → **26 palabras** en **8,38 s** (`0.00 s` a `8.38 s`). Incluso la primera cláusula hasta *«satélite:»* consume **19 palabras** y **6,22 s**, seguida de *«Construyámoslo desde cero.»* hasta `10.70 s`.
  - En los críticos primeros **2,0 segundos**, el espectador solo oye *«El noventa y nueve por ciento de internet»* (`0.00–2.24 s`), sin verbo principal ni choque de curiosidad.
  - En `gancho.jpg`, el rótulo superior `.cap` (*«99 % DE INTERNET / BAJO EL MAR»*, 6 palabras) compite con una bola de fuego (`boomHook`) que ocupa la mitad inferior mientras el ancla y el cable aún no explican qué está en riesgo ni por qué importa hoy.
- **Corrección requerida en la skill:**
  - Regla dura de **hook verbal de ≤ 7 palabras (1,5–2,2 s)**, directo al conflicto o paradoja (p. ej. *«Un ancla puede apagar medio internet.»* o *«Internet viaja por un hilo submarino.»*).
  - Titular `.cap` de **3–4 palabras** máximo, legible sin audio desde `t = 0`.
  - Acción literal inmediata en `t = 0` sin humo ni explosiones sobredimensionadas que tapen el sujeto.

### 2. Falta de literalidad 1:1 («Lo que se dice, se ve»)
- **Observado en `hoja.jpg` (`15.7 s`) y `scene.js:698`:**
  - En `14.20–15.60 s`, la voz dice *«del grosor de un cabello»*, pero la imagen muestra únicamente el torso amarillo genérico (`charOp`) mirando un tubo luminoso grueso (`glassFiberTube` + `laserBeads`) entre algas y peces.
  - No hay referencia anatómica ni comparación física: el ojo del espectador interpreta un tubo de varios centímetros de diámetro, contradiciendo la narración.
- **Corrección requerida en la skill:**
  - Regla de **literalidad 1:1**: toda metáfora de tamaño, objeto o distancia (*«grosor de un cabello»*, *«tamaño de una moneda»*, *«60 kilómetros»*) debe dibujarse con su referente físico real lado a lado.
  - Crear helper reutilizable `hairComparison(opts)` en `kit3d.js` (cabeza/personaje estilizado + mano/pinzas extrayendo un cabello humano curvado visible junto al núcleo de fibra óptica dentro de un anillo lupa/calibrador 3D).

### 3. Escala vertical de profundidad irreal
- **Observado en `scene.js:133, 559, 603` y `hoja.jpg` (`8.7 s`, `47.0 s`):**
  - El lecho marino está en `y = 0`, el cable en `y = 0.90`, y la superficie del mar (`seaSurface`) en `SEA_Y = 5.0`. Un barco de `5.8` unidades de eslora flota en `y = 5.0` justo a `4.1` unidades sobre el cable.
  - A esa proporción, un cable submarino transoceánico a `4 000 m` de profundidad parece estar sumergido en un estanque de `4 metros`, rompiendo la credibilidad documental en `t = 8.7 s` y `t = 47.0 s`.
- **Corrección requerida en la skill:**
  - Exigir **escala macro y plano zoom-out alto** cuando haya grandes profundidades o distancias: separar dramáticamente la superficie del fondo abisal e incluir estratos visuales con cota (`0 m`, `-1000 m`, `-2000 m`, `-4000 m`).
  - Crear helper `abyssalDepthScale(opts)` en `kit3d.js` para proyectar regla vertical kilométrica, bandas de profundidad y gradiente marino abisal.

### 4. Extremos del cable miniaturizados (`coastLeft` / `cityRight` en `x = ±13.5`)
- **Observado en `scene.js:162-250, 380-390` y `hoja.jpg` (`12.2 s`, `50.5 s`):**
  - Toda la ruta intercontinental mide `21.6` unidades (`x = -10.8` a `+10.8`). En `12.2 s`, la estación costera es un bloque aislado rodeado de agua; en `50.5 s`, la «bolsa» financiera consiste en 7 prismas pequeños sobre una peana cuadrada de `10×10` pegada al extremo del cable y parcialmente tapada por el osciloscopio `#panel`.
  - El espectador percibe una maqueta de escritorio en lugar de un tendido oceánico que conecta costas reales y distritos financieros monumentales.
- **Corrección requerida en la skill:**
  - Prohibir islas/plataformas miniatura pegadas a tramos cortos de cable. Exigir tendidos largos con perspectiva de fuga o gran extensión espacial, acantilados/plataformas costeras amplias y arquitectura urbana escalonada con horizonte real.

### 5. Continuidad física rota en el ancla (`scene.js:906`)
- **Observado en `scene.js:900-909` y `hoja.jpg` (`8.7 s`, `47.0 s`, `53.9 s`):**
  - El código calcula `const anchorShown = anchorLift < 0.97; anchorGroup.visible = anchorShown;`. Al alcanzar el `97 %` de izado (`SEA_Y + 0.6`, con el barco en `x = 1.2, z = -3.2` y el ancla aún en `x = -1.2, z = 0`), tanto el ancla como los 34 eslabones de cadena se esfuman instantáneamente en medio de la escena.
  - En los planos siguientes del barco (`8.7 s`, `47.0 s`), el casco aparece sin ancla estibada, y al izarse tras el blindaje (`54–61 s`), el objeto simplemente desaparece.
- **Corrección requerida en la skill:**
  - Regla de **Continuidad Física Cero-Desapariciones**: ningún elemento mecánico (ancla, gancho, grúa, vehículo) puede ocultarse con `.visible = false` al retraerse; debe acoplarse físicamente a su soporte o escobén.
  - Crear helper `stowedAnchorRig(shipGroup, opts)` en `kit3d.js` con ancla + cadena que al ir de `lift = 0` a `lift = 1` se recoge hasta encajar en el escobén/proa del barco y permanece visible.

### 6. Voz ininteligible al principio por SFX apilados y ausencia de sidechain en SFX
- **Observado en `cables-submarinos-3d/voz/eventos.json`, `estilo.json` y `mezcla.py`:**
  - `estilo.json` fija `"sfx_db": -7`.
  - Entre `t = 0.02 s` y `1.85 s` se disparan **6 eventos simultáneos/solapados**:
    - `0.02 s`: `explosion` (`ancla-corte.wav`, `ganancia: 1.15` → nivel base `-5.8 dB`)
    - `0.18 s`: `chispa` (`0.95`, a solo `0.16 s` del anterior)
    - `0.55 s`: `whoosh` (`0.90`, `0.37 s` después)
    - `1.10 s`: `alarma` (`0.80`)
    - `1.52 s`: `riser` (`0.85`)
    - `1.85 s`: `thud` (`0.95`, a `0.33 s` del anterior)
  - Medición `ffmpeg volumedetect` sobre los primeros segundos de `cables-submarinos-3d`:
    - `voz.wav` (`0–2 s`): `mean_volume: -16.4 dB`, `max_volume: -1.5 dB` (`0–3 s`: `mean -17.1 dB`).
    - `mezcla.wav` (`0–2 s`): `mean_volume: -14.4 dB`, `max_volume: -1.8 dB` (`0–3 s`: `mean -14.7 dB`).
    - Aunque el máster se normalice a `-14 LUFS`, el tramo `0–2 s` de `mezcla.wav` gana `+2.0 dB` de densidad media residual respecto a la voz seca por la suma de música + 6 SFX sin atenuar (`mezcla.py:120` solo comprime `[mus0]` con `sidechaincompress`, dejando `[s0]..[sN]` sin sidechain en `amix`).
- **Corrección requerida en la skill:**
  - En `mezcla.py`: bajar `sfx_db` por defecto de `-8` a **`-14`** (con techo protector si hay voz activa) y aplicar **`sidechaincompress` también al bus de SFX (`[sfx0]`)** controlado por `[voz]` (`attack=6`, `release=200`, `ratio=8`, `threshold=0.018`), soportando `0`, `1` o `N` efectos.
  - En `kit3d.js` (`crearAnclas().sonido()`): imponer anti-apilamiento (`minGap = 0.35 s`) y atenuación automática en arranque vocal (`t < 2.2 s`) cuando existen palabras activas en `TIMELINE`, registrando aviso en `__dudas` si se amontonan golpes.
  - En `SKILL.md` / `requisitos.md`: definir `sfx_db: -14` y máximo **1 SFX sutil** en el arranque si la voz entra de inmediato.

### 7. Abuso repetitivo de recuadros tipo osciloscopio (`#panel` `900×300` px, 3 apariciones)
- **Observado en `plantillas/index.html:32-37`, `kit3d.js:357, 394`, `scene.js:947-966` y `hoja.jpg`:**
  - Dimensiones actuales: `900×290` / `900×300 px = 270 000 px²`, centradas en `top: 325px; left: 90px`, con fondo casi opaco (`0.92–0.93`) y borde grueso (`5 px`) que bloquean el tercio superior del entorno 3D.
  - En `cables-submarinos-3d`, `#panel` se activa **3 veces**:
    1. `18.0–24.2 s` (`6,2 s`): barra de `60 KM` sobre los arcos 3D que ya dicen `0 KM..60 KM` (redundante).
    2. `31.6–41.8 s` (`10,2 s`): osciloscopio `pulsePanel` `10.000 V DC` (`33.1 s`, `36.5 s`, `40.0 s` en `hoja.jpg`), tapando la escena durante más de 10 segundos seguidos.
    3. `48.1–52.4 s` (`4,3 s`): osciloscopio `pulsePanel` `TRÁFICO FINANCIERO SWIFT` (`50.5 s` en `hoja.jpg`), tapando las azoteas de la ciudad financiera.
  - Ocupa **20,7 s de 62,65 s (33 % del metraje)** con una estética plana de widget incrustado.
- **Corrección requerida en la skill:**
  - Reducir la huella de `#panel` en **~85 %** (de `270 000 px²` a una píldora/chip discreta de ~`420×92 px ≈ 38 640 px²`, es decir **14,3 %** del tamaño original), semitransparente y sin osciloscopios gigantes.
  - Limitar su uso a **máximo 1 aparición breve** por video (o `0` si el indicador 3D diegético basta), advirtiendo en `__dudas` si se supera 1 aparición o el `15 %` de la duración total.
  - Incluir un **Paso 6b obligatorio (Puerta de Crítica de Director Audiovisual)** en `SKILL.md` antes de cualquier render final.

---

## Checklist de Correcciones Sistémicas Derivadas (Fase 2)

1. **`SKILL.md` + `referencias/ganchos.md` + `referencias/calidad-visual.md` + `referencias/requisitos.md`:** normas de Hook ≤ 7 palabras (`1,5–2,2 s`), literalidad 1:1, escala macro/zoom-out abisal + extremos monumentales, continuidad física cero-desapariciones, `sfx_db: -14` + anti-apilamiento + sidechain en SFX, regla anti-osciloscopios ≤ 15 % y Paso 6b obligatorio.
2. **`plantillas/index.html`:** reemplazo de `#panel` `900×290/300` por chip compacto de `420×92 px` (`38 640 px²`, `14.3 %`), discreto y translúcido.
3. **`motor/kit3d.js`:** nuevos helpers `hairComparison`, `stowedAnchorRig`, `abyssalDepthScale`; rediseño de `distancePanel` y `pulsePanel` para el chip de `420×92`; monitoreo de `#panel` en `__dudas`; protección anti-apilamiento y ducking vocal de arranque en `crearAnclas().sonido()`.
4. **`scripts/mezcla.py`:** `sfx_db` por defecto `-14`, techo protector con voz y bus `[sfx0]` con `sidechaincompress` controlado por `[voz]` (`attack=6:release=200:ratio=8:threshold=0.018`), validado con prueba aislada de audio en `0–3 s`.
