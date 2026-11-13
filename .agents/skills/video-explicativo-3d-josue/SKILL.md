---
name: "video-explicativo-3d-josue"
description: "Crear videos verticales explicativos en 3D toon hechos por código (Three.js + Chrome headless + ffmpeg), con locutor opcional de Magnific. Usar cuando pidan un video o reel animado de \"cómo funciona X\" o \"por qué X\"."
---

# Video explicativo 3D por código

Produce un MP4 vertical (1080×1920, 30 fps) de una sola toma continua: una escena 3D estilo toon construida con primitivas, cámara animada por poses, subtítulos palabra por palabra, locutor y música. Todo es determinista: cada cuadro depende solo del tiempo `t`.

Responde y escribe guiones en español salvo que el usuario pida otro idioma.

## Paso 0: comprobar herramientas (siempre, antes de empezar)

La skill usa **Three.js**, no Remotion: no instales Remotion.

```bash
for c in node npm ffmpeg python3; do command -v $c >/dev/null && echo "OK $c" || echo "FALTA $c"; done
CHROME_BIN=${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser)}
[ -n "$CHROME_BIN" ] && echo "OK chrome: $CHROME_BIN" || echo "FALTA chrome"
python3 -c "import numpy, scipy; print('OK numpy/scipy')" || echo "FALTA numpy/scipy"
```

Luego crea el proyecto e instala las librerías:

```bash
mkdir -p video/src && cd video && npm init -y
npm i three esbuild puppeteer-core @fontsource/unbounded
cp node_modules/@fontsource/unbounded/files/unbounded-latin-800-normal.woff2 font.woff2
node -e "for (const m of ['three','esbuild','puppeteer-core']) { require.resolve(m); console.log('OK', m) }"
```

- Instala lo que falte (`pip install numpy scipy`; si Chrome no está en la ruta habitual, exporta `CHROME=/ruta`).
- Si algo no se puede instalar (sin Chrome, sin ffmpeg, red bloqueada), detente y dile al usuario exactamente qué falta antes de escribir código.

**Comprobar Magnific.** Mira si en la sesión hay herramientas `mcp__Magnific__*` (cargadas o diferidas).
- Si están: Magnific se usa para la voz del locutor. Nada más se genera ahí sin permiso explícito.
- Si no están: pregúntale al usuario, antes de seguir, cuál prefiere: conectar el conector de Magnific, darte una clave de API de Magnific, pasar un audio de voz grabado por él, o hacer el video sin locutor. Si entrega una clave de API, no la escribas en archivos ni en la skill, consulta la documentación de la API antes de llamarla y avisa si la red del entorno la bloquea.

## Consultar siempre la música

Nunca elijas la música por tu cuenta. Antes de generar nada, pregunta al usuario (con opciones seleccionables si la sesión lo permite):

1. **Generada por código** (gratis, sintetizada en `audio.py`).
2. **Archivo propio** del usuario.
3. **Generada en Magnific** (solo si está conectado; cuesta créditos: muestra el precio de `simulate_cost` en la pregunta).
4. **Sin música.**

Lo mismo aplica a cualquier otro gasto de créditos que no sea la voz ya pedida.

**Efectos de sonido: pregunta también la fuente.** Los efectos sintetizados por código suenan pobres y solo sirven como último recurso. Ofrece: generados en Magnific con `audio_sfx_generate` (muestra el costo total antes), archivos del usuario, o sintetizados gratis avisando que la calidad es baja.

## Flujo (en este orden)

1. **Paso 0** y pregunta de música.
2. **Guion.** Sigue la sección "Guion: tema, pregunta y tipo": pide el tema, recomienda la pregunta del video, pregunta el tipo de guion y muestra el guion escrito antes de generar la voz.
3. **Voz primero.** Genera el locutor y lee sus tiempos con `audio_timing_get`. Los tiempos reales de cada frase definen `CUES`, las poses de cámara y `META.duration`. Así nunca hay que re-renderizar por desfase.
4. **Escena.** Escribe `src/scene.js` para el tema.
5. **Hook aprobado antes de todo.** Construye primero solo el hook, saca 3 cuadros (antes del impacto, el impacto y la consecuencia), envíalos junto con la lista de sonidos del hook y espera el visto bueno. Sin esa aprobación no se construye el resto.
5b. **Cuadros de prueba.** `node render.mjs --stills t1,t2,...` en los momentos con más cosas en pantalla. Míralos a tamaño completo y corrige encuadre antes de grabar.
6. **Render completo, una sola vez.** Cerca de 1,1 s por cuadro con render por software (14 s de video ≈ 8 min). En primer plano con timeout largo.
7. **Audio local.** Efectos (y música, si es por código o archivo propio) unidos al video con `-c:v copy`.
8. **Voz.** Mezcla según la sección de Magnific y entrega.

No vuelvas a renderizar ni cambies un video que el usuario ya aprobó, salvo que lo pida.

## Guion: tema, pregunta y tipo

Antes de escribir, haz estas tres consultas en orden (con opciones seleccionables si la sesión lo permite). No las saltes aunque el usuario llegue con prisa; si ya dio alguna respuesta en su mensaje, no la vuelvas a preguntar.

1. **Pide el tema.** Si el usuario no lo dio, pregúntale de qué quiere el video (un objeto, un servicio, un trámite, un fenómeno). No inventes el tema.
2. **Recomienda la pregunta del video.** Con el tema, propón 3 preguntas o títulos concretos, cada uno con su dato sorprendente, y marca cuál recomiendas y por qué. Ejemplo con el tema "tanque de agua": "¿Por qué el tanque va en el techo?", "¿Por qué sale poca agua en el segundo piso?", "¿Qué pasa dentro del tanque cuando se va el agua?". El usuario elige o corrige.
3. **Pregunta el tipo de guion.** Ofrece los tres de abajo, explica cada uno en una línea y recomienda el que mejor encaja con la pregunta elegida.

Luego escribe el guion completo, muéstralo y espera el visto bueno antes de gastar créditos en la voz. Todo guion empieza por el hook (ver sección "Hook obligatorio"): al mostrarlo, ofrece 2 o 3 versiones de la frase de hook y marca la que recomiendas.

### Tipo A — Cadena de "peros" (el del video de referencia de la cerca eléctrica)

Se construye la cosa desde cero y cada solución destapa el siguiente problema. Es el más adictivo: el espectador no se va porque siempre queda un "pero" abierto. Úsalo para objetos o sistemas con varias piezas ("cómo funciona X").

Estructura:

1. **Gancho:** el resultado final funcionando y una afirmación que sorprende ("la mitad de los hilos NO llevan corriente").
2. **Desarmar:** se quita todo y queda lo básico. "Construyámoslo desde cero."
3. **Primer intento ingenuo:** la solución obvia, y por qué falla o es peligrosa ("corriente continua: no lo deja soltarse").
4. **Eslabón** (repetir 4 a 6 veces):
   - **Pero…** un obstáculo concreto, mostrado en pantalla, con subtítulo rojo ("cada golpe se escapa").
   - **Solución:** aparece UNA pieza y se ve que lo resuelve.
   - **Nombre:** solo ahora se dice cómo se llama ("…eso son los aisladores"). El nombre va DESPUÉS de la necesidad, nunca antes.
   - **Detalle práctico** en pocas palabras ("uno cada palmo").
5. **Último pero, cotidiano:** un problema que el espectador vive en su casa ("¿suena sola en la madrugada? busca una rama").
6. **Cierre:** el resultado completo otra vez, ahora entendido, y una frase corta.

Reglas del tipo A:
- Cada solución debe CAUSAR o revelar el siguiente "pero"; si los problemas no se encadenan, es una lista, no una cadena.
- Varía el conector para no repetir "pero" seis veces: "el problema es que…", "solo que…", "hasta que llega la temporada seca", "falta algo".
- Un eslabón dura 10–20 s. Video de 60 s = 4 eslabones; de 140 s = 6.
- Plantilla de un eslabón: `Pero [obstáculo]. [Consecuencia visible]. Así que [pieza/acción]. Eso es [nombre]. [Detalle práctico].`

### Tipo B — Mito contra realidad

Parte de algo que casi todos creen y lo desmonta. Úsalo cuando el tema tiene una creencia popular equivocada o un mal hábito.

1. **Gancho:** "Todos creen que [mito]."
2. **El mito en acción:** se muestra haciéndolo "como todos" y se ve fallar.
3. **Giro:** "En realidad…" y el mecanismo verdadero, pieza por pieza.
4. **Prueba:** la misma situación hecha bien, ahora funciona.
5. **Qué hacer:** una acción concreta para el espectador.
6. **Cierre:** una frase que voltea el mito.

### Tipo C — El viaje (seguir una cosa de principio a fin)

Se sigue a un solo objeto por todas sus estaciones: una gota, una funda de basura, un dólar de una tasa, un paquete. Úsalo para servicios y procesos que nadie ve completos.

1. **Gancho:** "¿A dónde va [la cosa] cuando [la sueltas]?"
2. **Estaciones (4 a 6):** en cada una, qué le pasa, quién o qué lo hace y UN dato (cantidad, costo o tiempo).
3. **La estación que nadie conoce:** la más sorprendente va penúltima.
4. **Regreso al espectador:** cómo lo que él hace al inicio cambia el final del viaje.
5. **Cierre:** una frase corta.

El personaje del video es la cosa que viaja; la cámara la sigue sin cortes.

### Reglas comunes a los tres tipos

- **Tema:** objeto cotidiano + un dato que sorprende ("la mitad de los hilos NO llevan corriente").
- **Gancho (0–4 s):** obligatorio en todo video; sigue las secciones "Hook obligatorio" y "Anatomía de un buen hook": acción ya ocurriendo en el cuadro 0, frase que empieza de inmediato y 5 golpes en 4 segundos.
- **Bloques:** cada eslabón, paso o estación muestra UNA sola idea. Patrón de cámara por bloque: plano general → empuje al componente → regreso.
- **Cierre:** una frase corta y memorable, sobre la escena otra vez completa.
- **Loop:** se intenta siempre, pero está subordinado al hook (ver sección "Loop"). Si no hay un empalme bueno, se sacrifica el loop, nunca el gancho.
- **Ritmo de voz:** ~2,5 palabras por segundo. Frases de 4 a 10 palabras. 14 s ≈ 30–35 palabras; 60 s ≈ 140.
- **Subtítulos:** 2–4 palabras, la frase clave de lo que dice el locutor, no el guion completo. Rojo (`color: 'danger'`) solo para problemas o peligro.
- **Personaje:** un objeto simple sin rig (perfil torneado con dos ojos) que reacciona: triste cuando falla, salta cuando funciona. Inventa uno propio por tema; no copies personajes de otros creadores.

## Hook obligatorio (primeros 3 segundos)

Ningún video sale sin hook. El inicio hace dos trabajos a la vez: atrapa al que llega y recibe el empalme del loop. Tiene tres golpes:

1. **Segundo 0: el momento más violento de la historia.** Nada de pantalla vacía, título, logo ni objeto quieto. El video abre en plena acción con el evento más fuerte que el tema permita: un choque, una explosión, una descarga, una caída, una inundación. Suele ser "cómo fallaba antes" o "qué pasa si esta pieza no existe". El impacto ocurre antes del segundo 1, con `explosion()`, `shake()` y su efecto de sonido en el mismo cuadro. Un objeto parado mientras el locutor habla NO es un hook.
2. **0,2–2 s: la frase.** Subtítulo y locutor entran antes de 0,3 s. Máximo 8 palabras. Debe abrir una duda que solo se cierra viendo el video. Fórmulas que sirven:
   - Contradicción: "La mitad de los hilos NO llevan corriente."
   - Pregunta que el espectador nunca se hizo: "¿Por qué el tanque va en el techo?"
   - Peligro o pérdida: "Esto es lo que evita que tu baño huela a alcantarilla."
   - Número concreto (verificado, nunca inventado): "Cada metro de altura suma presión."
   Evita saludos, "hoy te explico", "¿sabías que…?" y cualquier presentación.
3. **1,5–4 s: consecuencia, destrucción y punto de partida.** Humo, escombros o piezas que se desarman; la cámara retrocede, barre y termina en el lugar donde empieza la explicación. La frase del hook nunca retrasa la acción: si el locutor tarda 4 s en decirla, la acción igual ocurre en el primer segundo y la frase suena encima.

Reglas:
- La cámara ya está en movimiento en el cuadro 0 (empuje lento hacia el personaje).
- Un efecto de sonido en el primer medio segundo (chispazo, golpe, chorro) y otro en el accidente.
- El dato sorprendente del hook se paga después: el guion debe explicarlo antes del cierre, nunca dejarlo sin respuesta.
- **Comprobar:** saca cuadros en `0`, `0.3`, `1` y `2.5`. Si en `0.3` no se entiende de qué trata el video sin sonido, reescribe el hook antes de grabar.

## Anatomía de un buen hook (5 golpes en 4 segundos)

Deconstrucción cuadro a cuadro del hook del video de referencia (cerca eléctrica). Úsalo como plantilla: cambia los objetos, conserva la estructura y los tiempos.

| Tiempo | Golpe | Qué pasa | Cámara |
|---|---|---|---|
| 0,0–0,5 s | 1. En plena acción | El personaje YA está recibiendo la descarga: brilla, saltan chispas, la energía corre por todos los cables | Cerca, algo desde arriba, con deriva |
| 0,5–1,1 s | 2. Consecuencia | Se apaga el brillo, sale despedido hacia atrás girando y cae fuera de cuadro | Lo sigue un poco y empuja hacia el objeto |
| 1,1–1,5 s | Respiro | Solo el objeto funcionando, un tercio de segundo | Se desliza de lado |
| 1,5–2,2 s | 3. Destrucción | Todo se desarma a la vez pero distinto: postes giran y salen volando, cables se sueltan, letreros caen por la pared | Retrocede y sube a plano general |
| 2,2–3,1 s | 4. Barrido | Queda la base pelada; se ve al personaje tirado en el suelo | Baja, rodea la esquina y cruza rápido al otro lado |
| 3,1–4,4 s | 5. Punto de partida | Primer plano de donde empieza todo (el enchufe) y aparece la primera pieza nueva | Frena y empuja lento |

Reglas que salen de ahí:

- **Densidad:** mínimo 5 eventos en los primeros 4 s. Ninguno dura más de 1 s y nunca pasan más de 0,4 s sin que algo cambie en pantalla.
- **Empieza a la mitad:** el cuadro 0 muestra la acción ya ocurriendo (el toque, el choque, la chispa), no su preparación.
- **Narración desde el primer instante:** la primera palabra suena antes de 0,2 s. Abre con una condición o en segunda persona ("Si tocas…", "Cuando abres…", "Esto que ves…"): es una frase incompleta que mete al espectador en la escena y lo obliga a esperar el desenlace. Nunca un saludo ni una presentación. Las pausas de la voz coinciden con los golpes de sonido.
- **Una toma, cuatro movimientos de cámara encadenados:** cerca con deriva → retroceso con subida → barrido que cruza al otro lado del objeto → freno en primer plano. Cada tramo dura 0,5–1 s y cambia posición, altura y `fov`. Plantilla:

```js
const HOOK = [
  { t: 0.0, pos: [3, 5, 7],      look: [0, 3.5, 0],   fov: 36 },  // 1 cerca del personaje
  { t: 0.6, pos: [3.5, 4, 8],    look: [0.5, 2.5, 0], fov: 38 },  // 2 lo sigue al caer
  { t: 1.5, pos: [6, 6, 13],     look: [1.5, 3, 0],   fov: 44 },  // respiro, se desliza
  { t: 2.2, pos: [9, 9, 18],     look: [0, 2.5, 0],   fov: 48 },  // 3 general: destrucción
  { t: 2.7, pos: [10, 3, 10],    look: [2, 1, 0],     fov: 44 },  // 4 baja y rodea la esquina
  { t: 3.1, pos: [2, 4, -8],     look: [0, 2, 0],     fov: 40 },  // cruza al otro lado
  { t: 3.7, pos: [0.5, 2.2, -4], look: [0, 1.6, 0],   fov: 32 },  // 5 frena en primer plano
];
```

- **Todo se mueve:** en ningún cuadro del hook hay solo un elemento en movimiento. A la vez: el personaje, la energía o el flujo, las piezas, la cámara y algo del fondo.
- **Destrucción escalonada y variada:** las piezas no desaparecen, se van. Cada tipo sale distinto (unas giran y vuelan, otras caen por gravedad, otras se sueltan), con 0,03–0,08 s de desfase entre sí y todo en menos de 0,7 s.
- **El personaje paga la consecuencia y se ve después:** tras el barrido aparece tirado; eso da humor y continuidad.
- **Sale del hook construyendo:** el último golpe ya muestra el punto de partida y la primera pieza nueva. No hay pausa ni título entre el hook y la explicación.
- **Sonido medido en la referencia:** chispazo agudo a los 0,3 s, golpes graves cuando caen las piezas (≈2,0 y 2,5 s), y la voz sin silencios de más de 0,3 s.

Esta estructura se combina con el hook de acción: el golpe 1 puede ser el choque o la explosión, y el resto sigue igual.

## Loop (el final empalma con el inicio)

**Prioridad:** primero el hook de acción, después el loop. No abras con el resultado final quieto solo para que empalme. Formas de empalmar sin matar el gancho:
- **Corte al desastre:** el video termina con el objeto bien hecho a punto de repetir la acción y el primer cuadro es el desastre del "antes".
- **Misma cámara, distinto destino:** el último plano y el primero comparten encuadre y movimiento, aunque cambie lo que pasa.
- **Frase que continúa:** la última frase queda abierta y la primera la completa.
Si ninguna funciona, entrega sin loop y dilo.

Las reglas de abajo aplican cuando el empalme es de estado idéntico:

El video de referencia abre con todo construido y funcionando, lo destruye en los primeros segundos, lo reconstruye pieza por pieza y termina con todo construido otra vez: al repetirse en redes, el último cuadro cae sobre el primero y no se nota el corte. El final del loop ES el cuadro 0 del hook.

Cómo lograrlo:

- **Mismo estado.** `update(0)` y `update(META.duration)` deben dibujar lo mismo: todas las piezas presentes, flujo activo, personaje en la misma posición y pose. Escribe cada animación de modo que su valor final sea el inicial.
- **Misma cámara.** La última pose de `POSES` es idéntica a la primera (`pos`, `look` y `fov`). La deriva de `cameraAt` ya vale cero en ambos extremos.
- **Destrucción al inicio (≈1,5–3 s).** Por pieza `i`: `const k = smooth(ramp(t, 2 + i * 0.08, 2.5 + i * 0.08))`, y con eso sube, gira y encoge (`position.y += k * 3; rotation.z = k * 2; scale.setScalar(1 - k)`). Acompáñalo con un `whoosh` y un `thud`.
- **Reconstrucción.** Cada pieza vuelve en su bloque del guion (con `easeOutBack` o `drawTube`). La última pieza entra antes del cierre, para que los últimos 2–3 s muestren todo completo.
- **Movimientos cíclicos.** Lo que se mueve siempre (cuentas de flujo, saltos del personaje) debe quedar en fase: usa velocidades que den vueltas enteras en `META.duration` (por ejemplo `speed = n / META.duration` en `flowBeads`).
- **Guion.** La última frase del locutor debe poder enlazar con la frase del hook, y el último subtítulo se desvanece antes del final para que no choque con el primero.
- **Audio.** La música termina con un desvanecido corto (0,3–0,6 s) y sin golpe final; ningún efecto suena en el último medio segundo.
- **Comprobar.** Antes del render completo: `node render.mjs --stills 0,<duración menos 0.03>` y compara los dos cuadros; deben verse iguales salvo los subtítulos.

## Mapa de sonido (obligatorio antes de grabar)

Un video sin efectos sincronizados se siente muerto. Antes del render escribe una tabla frase por frase:

| Tiempo | Qué se ve | Efecto | Volumen |
|---|---|---|---|
| 0,6 s | impacto | explosión grave + escombros | fuerte |

Reglas:
- **Hook:** impacto o explosión en el cuadro exacto del golpe, más un "riser" o silbido de caída antes.
- **Cada movimiento de cámara:** un whoosh.
- **Cada pieza que aparece:** un sonido propio (clic metálico, siseo de gas, rugido de motor), no el mismo "pop" para todo.
- **Cada "pero":** un golpe grave o freno de música.
- **Ambiente continuo** por entorno (viento en altura, mar, zumbido).
- Ningún tramo de más de 2 s sin efecto. Sincronía dentro de 2 cuadros.
- Los efectos van entre la voz y la música en volumen: se tienen que oír claramente.

**Verificación, porque no puedes escuchar:** genera la forma de onda (`ffmpeg -i final.mp4 -filter_complex "showwavespic=s=1400x240" -frames:v 1 onda.png`) y mide el volumen por segundo; revisa que cada efecto de la tabla aparezca como pico en su tiempo y que no haya huecos. Envía al usuario la tabla, la imagen de la onda y un borrador de los primeros 10 s con sonido para que lo escuche antes del render completo. Nunca digas que el audio está bien: di que está medido, no escuchado.

## Planos de cámara

La toma sigue siendo continua, pero el encuadre cambia constantemente. Escribe una lista de planos junto al guion: cada frase tiene su plano.

- Mínimo 6 tipos distintos por minuto: contrapicado (cámara a ras de suelo mirando arriba), cenital, primerísimo plano de una pieza, seguimiento del objeto, barrido rápido entre dos puntos y plano general.
- Ningún encuadre dura más de 4 s sin cambiar de ángulo, distancia o `fov`.
- Los impactos llevan `shake()`. Las revelaciones llevan acercamiento rápido.
- Alterna lados y cruza por encima o alrededor del objeto: no grabes todo desde la misma esquina.

## Entornos y fondo

- Mínimo 3 entornos por video, con transición visible entre ellos (para un cohete: plataforma de lanzamiento, gran altura con la curva de la Tierra, mar con barcaza). Cambia cielo, luz y paleta en cada uno; `setTimeOfDay` sirve para variar.
- Cada entorno lleva al menos 8 elementos de fondo en tres capas: cerca (contenedores, torres, boyas), media (barcos, edificios, árboles) y lejos (islas, montañas, sol, nubes grandes). La niebla del kit ya separa las capas.
- Algo se mueve siempre en el fondo: aves, luces que parpadean, humo, olas.
- Un fondo vacío (solo suelo y cielo) no se entrega.

## Reglas visuales

- Una sola toma, cero cortes. La cámara nunca queda quieta (deriva lenta incluida en `cameraAt`).
- Formato vertical: el campo horizontal es estrecho. Con `fov` 34 solo caben ~4 m de ancho a 11 m de distancia. Para planos con varios objetos usa `fov` 38–44 o aléjate. Verifica siempre con cuadros de prueba.
- Geometría de primitivas (cajas, cilindros, `LatheGeometry`, icosaedros). Texturas procedurales por canvas, sin imágenes externas.
- Sombreado toon de 3 bandas + contorno de tinta. El contorno necesita DOS pases: profundidad (siluetas) y normales (aristas y contactos).
- Cosas que "fluyen" (agua, corriente, datos, dinero): `flowBeads` sobre una curva. Cosas que "se instalan": `drawTube` dibujándose de 0 a 1.
- Paleta base: arena `#e2c693`/`#d2b782`, cielo `#5f9be0`→`#f4f1e6`, muro `#e6e6e1`, tinta `#2a2622`, acento `#2fb7f5`, peligro `#df3b30`. Cambia el acento según el tema.
- Subtítulos arriba (top 150 px), fuente Unbounded 800 de 68 px, oscuros con halo crema.

## Recursos opcionales (usar solo si el guion lo pide)

Ya están en `kit.js`; no se activan solos.

- **Transición día ↔ noche** — `setTimeOfDay(scene, world, k)` con `k` de 0 (día) a 1 (noche). Sirve para "de madrugada", "horas después", "cuando nadie mira". Requiere guardar `const world = buildWorld(scene)`. En `update(t)`: `setTimeOfDay(scene, world, smooth(ramp(t, 20, 22)))`. De noche usa subtítulos con `color: 'light'`.
- **Panel 2D de pulsos** — `pulsePanel(el, t, { from, to, period, label })`: recuadro oscuro tipo osciloscopio sobre la escena que marca un pulso cada `period` segundos. Sirve para ritmos y frecuencias ("uno cada segundo"). Usa el `<div id="panel">` de `index.html`. En `update(t)`: `pulsePanel(document.getElementById('panel'), t, { from: 14, to: 22, period: 1, label: 'un pulso por segundo' })`. Para otros datos (barras, porcentajes, contador) escribe una función hermana con la misma entrada/salida y otro SVG. Mientras el panel esté visible, encuadra la acción 3D en la mitad inferior.

## Archivos del proyecto

### index.html

```html
<!doctype html><html><head><meta charset="utf-8">
<style>
@font-face{font-family:Cap;src:url(font.woff2)}
html,body{margin:0;background:#000;overflow:hidden}
#stage{position:relative;width:1080px;height:1920px}
#gl{position:absolute;inset:0;width:1080px;height:1920px}
.cap{position:absolute;top:150px;left:0;width:100%;text-align:center;font:800 68px/1.18 Cap,sans-serif;color:#1c1a17;letter-spacing:-1px;
 text-shadow:0 0 14px #fff6e0,0 0 5px #fff6e0,0 3px 0 #fff6e0}
.cap.danger{color:#df3b30}.cap.light{color:#fff;text-shadow:0 0 14px #0008}
.cap span{display:inline-block;margin:0 .13em}
#panel{position:absolute;top:340px;left:90px;width:900px;height:300px;background:#0d0f14;border:5px solid #fff6e0;border-radius:26px;overflow:hidden;opacity:0}
</style></head><body><div id="stage"><canvas id="gl" width="1080" height="1920"></canvas><div id="cap" class="cap"></div><div id="panel"></div></div>
<script src="bundle.js"></script></body></html>
```

### render.mjs

```js
// uso: node render.mjs salida.mp4 [desde hasta]   |   node render.mjs --stills 1,4.5,10
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--hide-scrollbars'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto('file://' + path.resolve('index.html'));
await page.waitForFunction('window.READY === true', { timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
const META = await page.evaluate(() => window.META);
const shot = async (t) => { await page.evaluate((t) => window.renderFrame(t), t); return page.screenshot({ type: 'jpeg', quality: 92 }); };
if (args[0] === '--stills') {
  for (const t of args[1].split(',').map(Number)) writeFileSync(`still_${t}.jpg`, await shot(t));
} else {
  const out = args[0], from = Number(args[1] ?? 0), to = Number(args[2] ?? META.duration), tmp = out.replace(/\.mp4$/, '.part.mp4');
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(META.fps), '-i', '-', '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n0 = Math.round(from * META.fps), n1 = Math.round(to * META.fps);
  for (let f = n0; f < n1; f++) {
    if (!ff.stdin.write(await shot(f / META.fps))) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - n0) % 60 === 0) console.log(`cuadro ${f}/${n1}`);
  }
  ff.stdin.end();
  const code = await new Promise((r) => ff.on('close', r));
  if (code === 0) renameSync(tmp, out); else process.exitCode = 1;
}
await browser.close();
```

En una PC con tarjeta gráfica quita `--use-angle=swiftshader` para grabar mucho más rápido. Para videos largos, graba por tramos (`desde hasta`) con los mismos ajustes y únelos con el concat demuxer y `-c copy`.

### src/kit.js (reutilizable, no cambia entre videos)

```js
import * as THREE from 'three';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (k) => { k = clamp(k); return k * k * k * (k * (k * 6 - 15) + 10); };
export const ramp = (t, a, b) => clamp((t - a) / (b - a));
export const easeOutBack = (k) => { k = clamp(k); const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const PALETTE = {
  skyTop: '#5f9be0', skyBottom: '#f4f1e6', sandA: '#e2c693', sandB: '#d2b782',
  wall: '#e6e6e1', mortar: '#c6c9c5', ink: '#2a2622', accent: '#2fb7f5', accentGlow: '#bff0ff', danger: '#df3b30',
  leaf: '#7cc4a0', trunk: '#b6763f',
};

let _grad;
function gradientMap() {
  if (_grad) return _grad;
  _grad = new THREE.DataTexture(new Uint8Array([110, 110, 110, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  _grad.minFilter = _grad.magFilter = THREE.NearestFilter; _grad.needsUpdate = true; return _grad;
}
export const toon = (color, opts = {}) => new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), ...opts });
export function mesh(geo, mat, { cast = true, receive = true } = {}) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = receive; return m; }

function canvasTex(size, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8; return t;
}
// Suelo en dos tonos con manchas (ruido de valor umbralizado)
export function sandTexture(a = PALETTE.sandA, b = PALETTE.sandB, repeat = [5, 5], seed = 7) {
  return canvasTex(512, (g, S) => {
    const r = rng(seed), G = 8, grid = []; for (let i = 0; i < G * G; i++) grid.push(r());
    const at = (x, y) => grid[((y % G + G) % G) * G + ((x % G + G) % G)];
    const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = smooth(x - xi), fy = smooth(y - yi);
      return lerp(lerp(at(xi, yi), at(xi + 1, yi), fx), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), fx), fy); };
    const img = g.createImageData(S, S), ha = new THREE.Color(a).getHex(THREE.SRGBColorSpace), hb = new THREE.Color(b).getHex(THREE.SRGBColorSpace);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S * G, v = y / S * G, n = noise(u, v) * 0.65 + noise(u * 2, v * 2) * 0.35, hex = n > 0.52 ? hb : ha, i = (y * S + x) * 4;
      img.data[i] = hex >> 16; img.data[i + 1] = (hex >> 8) & 255; img.data[i + 2] = hex & 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, repeat);
}
// Bloques en aparejo corrido
export function brickTexture(base = PALETTE.wall, mortar = PALETTE.mortar, repeat = [2, 2], seed = 3) {
  return canvasTex(512, (g, S) => {
    const r = rng(seed), rows = 8, cols = 4, bh = S / rows, bw = S / cols;
    g.fillStyle = mortar; g.fillRect(0, 0, S, S);
    for (let j = 0; j < rows; j++) for (let i = -1; i <= cols; i++) {
      g.fillStyle = '#' + new THREE.Color(base).multiplyScalar(0.94 + r() * 0.06).getHexString(THREE.SRGBColorSpace);
      g.fillRect(i * bw + (j % 2 ? bw / 2 : 0) + 2, j * bh + 2, bw - 4, bh - 4);
    }
  }, repeat);
}
export function skyTexture(top = PALETTE.skyTop, bottom = PALETTE.skyBottom) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, top); gr.addColorStop(0.55, bottom); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function buildWorld(scene, P = PALETTE) {
  scene.background = skyTexture(P.skyTop, P.skyBottom);
  scene.fog = new THREE.Fog(new THREE.Color(P.skyBottom), 38, 110);
  const ground = mesh(new THREE.PlaneGeometry(400, 400), toon('#ffffff', { map: sandTexture(P.sandA, P.sandB, [22, 22]) }), { cast: false });
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const hemi = new THREE.HemisphereLight('#ffffff', '#8fa3c4', 1.25); scene.add(hemi);   // relleno azulado = sombras frías
  const sun = new THREE.DirectionalLight('#fff3da', 2.3);
  sun.position.set(-9, 16, 11); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; scene.add(sun);
  return { ground, sun, hemi };
}
export function cloud(x, y, z, s = 1) {
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false });
  [[0, 0, 1], [1.1, 0.1, 0.8], [-1.1, 0, 0.75], [0.4, 0.5, 0.7]].forEach(([dx, dy, r]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); b.position.set(dx, dy, 0); b.scale.z = 0.3; g.add(b); });
  g.position.set(x, y, z); g.scale.setScalar(s); return g;
}
export function tree(P = PALETTE, seed = 5) {
  const g = new THREE.Group(), r = rng(seed);
  const trunk = mesh(new THREE.CylinderGeometry(0.13, 0.18, 2.6, 10), toon(P.trunk)); trunk.position.y = 1.3; g.add(trunk);
  const geo = new THREE.IcosahedronGeometry(1.05, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 0.88 + r() * 0.24; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.9, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const top = mesh(geo, toon(P.leaf)); top.position.y = 3.1; g.add(top); return g;
}

// Tubos que se dibujan y cuentas que viajan por una curva
export const polyCurve = (points, tension = 0.06) => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', tension);
export function drawTube(curve, radius, material, segments = 160) {
  const radial = 10, m = mesh(new THREE.TubeGeometry(curve, segments, radius, radial, false), material);
  m.userData.setProgress = (k) => { m.geometry.setDrawRange(0, Math.floor(clamp(k) * segments) * radial * 6); m.visible = k > 0.001; };
  return m;
}
export function flowBeads(curve, { count = 12, radius = 0.07, color = PALETTE.accentGlow, speed = 0.25 } = {}) {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, fog: false });
  for (let i = 0; i < count; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), mat); b.renderOrder = 10; g.add(b); }
  g.userData.update = (t, upTo = 1, opacity = 1) => {
    mat.opacity = opacity; g.visible = opacity > 0.01;
    g.children.forEach((b, i) => { const u = ((i / count + t * speed) % 1 + 1) % 1; b.visible = u <= upTo; if (b.visible) b.position.copy(curve.getPointAt(u)); });
  };
  return g;
}

// Cámara por poses: [{ t, pos:[x,y,z], look:[x,y,z], fov? }]
export function cameraAt(camera, poses, t) {
  let i = 0; while (i < poses.length - 2 && t > poses[i + 1].t) i++;
  const a = poses[i], b = poses[Math.min(i + 1, poses.length - 1)], k = smooth(ramp(t, a.t, b.t));
  const pos = new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos), k), look = new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look), k);
  const edge = Math.sin(Math.PI * ramp(t, poses[0].t, poses[poses.length - 1].t));   // deriva = 0 en los extremos, para que el loop empalme
  pos.x += Math.sin(t * 0.7) * 0.12 * edge; pos.y += Math.sin(t * 0.53 + 1) * 0.07 * edge;
  camera.fov = lerp(a.fov ?? 34, b.fov ?? 34, k); camera.updateProjectionMatrix(); camera.position.copy(pos); camera.lookAt(look);
}

// Subtítulos: [{ from, to, text, color?: 'danger'|'light' }] — "\n" para dos líneas
export function captions(el, cues, t) {
  const cue = cues.find((c) => t >= c.from && t < c.to);
  if (!cue) { el.innerHTML = ''; el.dataset.k = ''; return; }
  const key = cue.from + cue.text;
  if (el.dataset.k !== key) {
    el.dataset.k = key; el.className = 'cap ' + (cue.color || '');
    el.innerHTML = cue.text.split('\n').map((line) => '<div>' + line.split(' ').map((w) => `<span>${w}</span>`).join(' ') + '</div>').join('');
  }
  const out = ramp(t, cue.to - 0.22, cue.to);
  el.querySelectorAll('span').forEach((s, i) => {
    const k = smooth(ramp(t, cue.from + i * 0.11, cue.from + i * 0.11 + 0.16));
    s.style.opacity = k * (1 - out); s.style.transform = `translateY(${(1 - k) * 18}px)`; s.style.filter = out > 0 ? `blur(${out * 6}px)` : 'none';
  });
}

// OPCIONAL — transición día ↔ noche. k: 0 = día, 1 = noche
export function setTimeOfDay(scene, world, k, P = PALETTE) {
  const mix = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), k);
  const top = mix(P.skyTop, '#1f2a4d'), bottom = mix(P.skyBottom, '#56597a');
  const g = scene.background.image.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#' + top.getHexString()); gr.addColorStop(0.55, '#' + bottom.getHexString()); gr.addColorStop(1, '#' + bottom.getHexString());
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512); scene.background.needsUpdate = true;
  scene.fog.color.copy(bottom);
  world.sun.intensity = lerp(2.3, 0.35, k); world.sun.color.copy(mix('#fff3da', '#9fb4ff'));
  world.hemi.intensity = lerp(1.25, 0.6, k); world.hemi.color.copy(mix('#ffffff', '#7f8fc8'));
}

// OPCIONAL — panel 2D de pulsos (tipo osciloscopio). Requiere <div id="panel">
export function pulsePanel(el, t, { from, to, period = 1, label = '' }) {
  const k = smooth(ramp(t, from, from + 0.3)) * (1 - ramp(t, to - 0.3, to));
  el.style.opacity = k; el.style.transform = `scale(${0.9 + 0.1 * k})`;
  if (k <= 0) { el.innerHTML = ''; return; }
  const W = 900, H = 300, base = 215, lt = t - from, speed = 190, head = 760;
  let d = `M0 ${base}`;
  for (let n = 0; n * period <= lt; n++) { const x = head - (lt - n * period) * speed; if (x > 0) d += ` L${x} ${base} L${x} 70 L${x} ${base}`; }
  d += ` L${head} ${base}`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><path d="${d}" fill="none" stroke="#e6ff5a" stroke-width="6" stroke-linejoin="round"/>`
    + `<circle cx="${head}" cy="${base}" r="9" fill="#e6ff5a"/><text x="30" y="54" fill="#fff6e0" font-family="Cap" font-size="34">${label}</text></svg>`;
}

// Explosión toon: destello, onda expansiva, bolas de fuego, humo y escombros.
// const boom = explosion(scene, [x,y,z]);  en update: boom.userData.update(t - tImpacto)
export function explosion(scene, at = [0, 0, 0], size = 1, seed = 21) {
  const g = new THREE.Group(), r = rng(seed); g.position.set(...at); scene.add(g);
  const bm = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, fog: false });
  const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), bm('#ffffff')); g.add(flash);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), bm('#ffffff')); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  const fire = ['#fff1a8', '#ffc93c', '#ff8a1f', '#e8452c', '#ffc93c', '#ff8a1f', '#e8452c', '#ff8a1f'].map((c, i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), bm(c)); m.userData = { p: [(r() - 0.5) * 3.2, r() * 2.6 + i * 0.25, (r() - 0.5) * 2], s: 1.1 + r() * 1.5, d: i * 0.035 }; g.add(m); return m; });
  const smoke = [...Array(9)].map((_, i) => { const m = mesh(new THREE.IcosahedronGeometry(1, 1), toon('#6d6d76'), { cast: false, receive: false }); m.userData = { p: [(r() - 0.5) * 5, 2.2 + r() * 2.5, -1 - r() * 2], s: 0.8 + r() * 0.9, d: 0.55 + i * 0.09 }; g.add(m); return m; });
  const debris = [...Array(16)].map(() => { const m = mesh(new THREE.BoxGeometry(0.2 + r() * 0.5, 0.12 + r() * 0.3, 0.2 + r() * 0.4), toon(r() > 0.5 ? '#f4f4f1' : '#2f3238')); const a = r() * Math.PI * 2, sp = 5 + r() * 9; m.userData = { v: [Math.cos(a) * sp, 7 + r() * 12, Math.sin(a) * sp * 0.6], w: [r() * 9, r() * 9, r() * 9] }; g.add(m); return m; });
  g.userData.update = (k) => {
    g.visible = k >= 0 && k < 6; if (!g.visible) return;
    flash.scale.setScalar(size * 3.6 * ramp(k, 0, 0.08)); flash.material.opacity = 1 - ramp(k, 0.05, 0.28); flash.visible = k < 0.3;
    ring.scale.setScalar(size * (1 + 15 * (1 - (1 - ramp(k, 0, 0.7)) ** 2))); ring.material.opacity = 0.9 * (1 - ramp(k, 0.15, 0.7)); ring.visible = k < 0.7;
    fire.forEach((m) => { const u = k - m.userData.d, grow = 1 - (1 - ramp(u, 0, 0.35)) ** 3, die = 1 - smooth(ramp(u, 0.9, 2.1)); m.visible = u > 0 && die > 0.01;
      m.scale.setScalar(size * m.userData.s * grow * die); m.position.set(m.userData.p[0] * size * grow, (m.userData.p[1] + u * 1.4) * size * grow, m.userData.p[2] * size); m.rotation.y = u; });
    smoke.forEach((m) => { const u = k - m.userData.d, grow = 1 - (1 - ramp(u, 0, 0.8)) ** 2, die = 1 - smooth(ramp(u, 2.6, 5.5)); m.visible = u > 0 && die > 0.01;
      m.scale.setScalar(size * m.userData.s * grow * die); m.position.set(m.userData.p[0] * size * grow, (m.userData.p[1] + u * 2.2) * size, m.userData.p[2] * size); });
    debris.forEach((m) => { const v = m.userData.v, y = v[1] * k - 11 * k * k; m.visible = k > 0.02 && y > -1.5;
      m.position.set(v[0] * k * size, y * size, v[2] * k * size); m.rotation.set(m.userData.w[0] * k, m.userData.w[1] * k, m.userData.w[2] * k); });
  };
  g.userData.update(-1); return g;
}
// Temblor de cámara: llamar DESPUÉS de cameraAt, con k = segundos desde el impacto
export function shake(camera, k, amp = 0.5, dur = 0.9) {
  if (k < 0 || k > dur) return; const a = amp * (1 - k / dur) ** 2;
  camera.position.x += Math.sin(k * 71) * a; camera.position.y += Math.sin(k * 93 + 1) * a * 0.7; camera.rotation.z += Math.sin(k * 57) * a * 0.04;
}

// Render con contorno de tinta: pase de color+profundidad y pase de normales
export function inkRenderer(canvas, w, h, ink = PALETTE.ink) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(w, h, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const rt = new THREE.WebGLRenderTarget(w, h, { samples: 4, type: THREE.HalfFloatType }); rt.depthTexture = new THREE.DepthTexture(w, h);
  const rtN = new THREE.WebGLRenderTarget(w, h, { samples: 4 }), normalMat = new THREE.MeshNormalMaterial();
  const quadScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, tNormal: { value: rtN.texture }, px: { value: new THREE.Vector2(1 / w, 1 / h) },
      near: { value: 0.1 }, far: { value: 300 }, ink: { value: new THREE.Color(ink) }, width: { value: 1.4 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      varying vec2 vUv; uniform sampler2D tColor, tDepth, tNormal; uniform vec2 px; uniform float near, far, width; uniform vec3 ink;
      float lin(vec2 uv){ float z = texture2D(tDepth, uv).x * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }
      void main(){
        vec3 col = texture2D(tColor, vUv).rgb; float d = lin(vUv); vec2 o = px * width;
        float lap = lin(vUv + vec2(o.x, 0.0)) + lin(vUv - vec2(o.x, 0.0)) + lin(vUv + vec2(0.0, o.y)) + lin(vUv - vec2(0.0, o.y)) - 4.0 * d;
        float edge = smoothstep(0.012, 0.035, abs(lap) / d);
        vec3 n = texture2D(tNormal, vUv).rgb;
        float nd = distance(n, texture2D(tNormal, vUv + vec2(o.x, 0.0)).rgb) + distance(n, texture2D(tNormal, vUv - vec2(o.x, 0.0)).rgb)
                 + distance(n, texture2D(tNormal, vUv + vec2(0.0, o.y)).rgb) + distance(n, texture2D(tNormal, vUv - vec2(0.0, o.y)).rgb);
        edge = max(edge, smoothstep(0.25, 0.7, nd));
        edge *= 1.0 - smoothstep(30.0, 70.0, d);
        gl_FragColor = vec4(mix(col, ink, edge * 0.85), 1.0);
        #include <colorspace_fragment>
      }`,
    depthTest: false, depthWrite: false,
  });
  quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  return { renderer, render(scene, camera) {
    mat.uniforms.near.value = camera.near; mat.uniforms.far.value = camera.far;
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    const bg = scene.background, fog = scene.fog; scene.background = null; scene.fog = null; scene.overrideMaterial = normalMat;
    renderer.setRenderTarget(rtN); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
    scene.overrideMaterial = null; scene.background = bg; scene.fog = fog;
    renderer.setRenderTarget(null); renderer.render(quadScene, quadCam);
  } };
}
```

### src/scene.js (se reescribe por cada video)

Estructura fija: objetos, línea de tiempo y `update(t)`. Ejemplo mínimo:

```js
import * as THREE from 'three';
import { PALETTE as P, toon, mesh, buildWorld, cloud, tree, brickTexture, polyCurve, drawTube, flowBeads,
  cameraAt, captions, inkRenderer, ramp, smooth, easeOutBack } from './kit.js';

export const META = { width: 1080, height: 1920, fps: 30, duration: 14 };
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, META.width / META.height, 0.1, 300);
const ink = inkRenderer(document.getElementById('gl'), META.width, META.height);
const world = buildWorld(scene);
scene.add(cloud(-14, 17, -60, 4), cloud(16, 21, -70, 5), tree().translateX(-5.2));

// 1) OBJETOS — primitivas con toon(); personaje = LatheGeometry + dos esferas negras como ojos
const house = mesh(new THREE.BoxGeometry(6, 3.2, 5), toon('#ffffff', { map: brickTexture(P.wall, P.mortar, [3, 2]) }));
house.position.y = 1.6; scene.add(house);
const curve = polyCurve([[1.8, 4.2, 1.5], [1.8, 4.2, 2.2], [1.8, 3.3, 2.62], [1.8, 0.95, 2.62]]);
const pipe = drawTube(curve, 0.06, toon('#f1ede2')); scene.add(pipe);
const beads = flowBeads(curve, { count: 11, speed: 0.33 }); scene.add(beads);

// 2) LÍNEA DE TIEMPO — tiempos tomados de audio_timing_get del locutor
const POSES = [
  { t: 0.0, pos: [7.5, 6.2, 14.5], look: [0.9, 2.4, 0.6] },
  { t: 3.3, pos: [4.6, 2.9, 14.6], look: [2.8, 1.1, 2.6], fov: 44 },
  { t: 14.0, pos: [3.9, 2.2, 10.2], look: [1.35, 0.8, 3.2], fov: 36 },
];
const CUES = [
  { from: 0.15, to: 2.0, text: '¿por qué el tanque\nva en el techo?' },
  { from: 3.9, to: 5.4, text: 'sale un hilito', color: 'danger' },
];
const capEl = document.getElementById('cap');

// 3) ESTADO EN t — todo con ramp/smooth sobre t; nada de Date.now() ni Math.random()
function update(t) {
  pipe.userData.setProgress(smooth(ramp(t, 7.2, 8.8)));
  beads.userData.update(t, ramp(t, 8.8, 9.9), ramp(t, 8.9, 9.6));
  cameraAt(camera, POSES, t);
  captions(capEl, CUES, t);
}
window.META = META;
window.renderFrame = (t) => { update(t); ink.render(scene, camera); };
window.renderFrame(0);
window.READY = true;
```

Técnicas de animación útiles: salto con arco (`pos.y += Math.sin(Math.PI * k) * alto`), aplastar y estirar al aterrizar (`scale.set(1+s, 1-s, 1+s)`), aparición con rebote (`easeOutBack`), personaje que salta (`Math.abs(Math.sin(t * 5.2)) * 0.22`).

Compilar y grabar:

```bash
npx esbuild src/scene.js --bundle --outfile=bundle.js --log-level=warning
node render.mjs --stills 1,4.5,8.2,13     # revisar
node render.mjs video.mp4                  # una sola vez
```

### audio.py (efectos y música sintetizados, sin samples)

Sincroniza cada efecto con los tiempos de `scene.js`. Con `SFX_ONLY=1` omite la música.

```python
import os, sys, numpy as np
from scipy.io import wavfile
from scipy import signal
SR, DUR, BPM = 44100, 14.0, 100
beat = 60 / BPM; N = int(SR * DUR); out = np.zeros(N); rnd = np.random.default_rng(4)
def add(x, t, g=1.0):
    i = int(t * SR); x = x[:max(0, N - i)]; out[i:i + len(x)] += x * g
def env(n, a=0.005, d=0.3): t = np.arange(n) / SR; return np.minimum(t / a, 1) * np.exp(-t / d)
def tone(f, dur, d=0.3, tri=False):
    n = int(dur * SR); t = np.arange(n) / SR
    return (signal.sawtooth(2 * np.pi * f * t, 0.5) if tri else np.sin(2 * np.pi * f * t)) * env(n, d=d)
def noise(dur, lo, hi):
    b, a = signal.butter(2, [lo, hi], btype='band', fs=SR); return signal.lfilter(b, a, rnd.standard_normal(int(dur * SR)))

# MÚSICA por código: bajo por compás + arpegio en corcheas + bombo suave (cambia acordes y BPM según el ánimo)
bars = [(55.0, [220, 261.6, 329.6]), (43.65, [174.6, 220, 261.6]), (65.4, [196, 261.6, 329.6]), (49.0, [196, 246.9, 293.7])]  # Am F C G
t, b = 0.0, 0
while t < DUR and not os.environ.get('SFX_ONLY'):
    root, chord = bars[b % 4]
    if b >= 1: add(tone(root, beat * 4, d=1.6) + 0.4 * tone(root * 2, beat * 4, d=0.8), t, 0.30)
    for k in range(8): add(tone(chord[[0, 1, 2, 1, 2, 1, 0, 2][k]] * 2, 0.4, d=0.12, tri=True), t + k * beat / 2, 0.10)
    for k in range(4):
        n = int(0.18 * SR); tt = np.arange(n) / SR
        if b >= 1: add(np.sin(2 * np.pi * (110 * np.exp(-tt * 28) + 45) * tt) * env(n, d=0.07), t + k * beat, 0.32)
    t += beat * 4; b += 1

# EFECTOS
def whoosh(dur=0.55): x = noise(dur, 300, 5000); n = len(x); return x * np.sin(np.pi * np.arange(n) / n) ** 2      # movimiento de cámara
def pop(f=420): n = int(0.16 * SR); tt = np.arange(n) / SR; return np.sin(2 * np.pi * (f + 500 * np.exp(-tt * 40)) * tt) * env(n, d=0.04)   # aparición
def drip(): n = int(0.09 * SR); tt = np.arange(n) / SR; return np.sin(2 * np.pi * (900 + 1400 * tt / 0.09) * tt) * env(n, d=0.02)
def thud(): n = int(0.3 * SR); tt = np.arange(n) / SR; return np.sin(2 * np.pi * (60 + 90 * np.exp(-tt * 30)) * tt) * env(n, d=0.08)      # caída/aterrizaje
# ejemplo: add(whoosh(), 2.0, 0.12); add(thud(), 2.6, 0.5); add(pop(), 6.42, 0.2)

out *= np.minimum(1, (N - np.arange(N)) / (0.6 * SR))
out = np.tanh(out * 1.6) * 0.8
wavfile.write(sys.argv[1], SR, (out * 32767).astype(np.int16))
```

```bash
python3 audio.py pista.wav                 # música por código + efectos   (SFX_ONLY=1 → solo efectos)
ffmpeg -y -i video.mp4 -i pista.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -shortest video_audio.mp4
```

Con música de archivo propio: mezcla efectos y música con `amix`, la música a volumen bajo (`volume=0.25`) para dejar espacio a la voz.

## Voz con Magnific

Gasta créditos del usuario: revisa el precio con `simulate_cost` antes de generar y avisa el total al final (el cobro real puede superar la simulación).

1. **Voz.** `audio_voices_list` con `search: "mexic"` (o el acento pedido). Por defecto: Ignacio Valverde (id 1393), enérgico y para redes. Llama `audio_tts_direction` con el modelo antes de escribir el texto. Con `eleven_v4` usa etiquetas entre corchetes y separa frases con `[pause 1s]`:
   `[energetic, curious radio announcer] ¿Por qué el tanque va en el TECHO? [pause 1s] [disappointed] En el suelo, de la llave apenas sale un hilito.`
2. **Tiempos.** `creations_wait` y luego `audio_timing_get`: inicio y fin de cada frase para `CUES` y `POSES`.
3. **Unir la voz al video.** Intenta descargar el audio una vez. Si el entorno lo bloquea (403 del proxy), no reintentes: sube el video ya con efectos y música (`creations_request_upload` con `video/mp4`, `curl -X PUT -H "Content-Type: video/mp4" --data-binary @video_audio.mp4 "<proxyUploadUrl>"`, `creations_finalize_upload`) y usa `video_audio_mix`, que es gratis: voz con `audioVolume` 100 y `videoVolume` 45.
4. **Entregar.** `creations_get` y dar el `webUrl`, más el comando ffmpeg equivalente por si el usuario prefiere mezclar en su PC.

**Música en Magnific (solo si el usuario la eligió):** `audio_music_generate` con `google-lyria-3` (30 s fijos, lo más barato) o `google-lyria-3-pro` para videos largos; prompt con género, ánimo, instrumentos, tempo, "sin voces, limpia para que hable un narrador, empieza de inmediato". Mezcla con un segundo `video_audio_mix` (`audioVolume` 22, `videoVolume` 100).

## Transcribir y analizar un video de referencia

Cuando el usuario pase un video para imitar (o para revisar uno propio), no adivines lo que dice: transcríbelo. Requiere que el entorno pueda llegar a `huggingface.co` (el usuario ya lo permitió en sus ajustes de red).

```bash
pip install faster-whisper --break-system-packages
python3 - <<'E'
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
segs, info = m.transcribe("referencia.mp4", language="es", word_timestamps=True)
for s in segs:
    for w in s.words: print(f"{w.start:.2f}\t{w.end:.2f}\t{w.word}")
E
```

- Si la descarga del modelo falla, di qué dominio quedó bloqueado y pide al usuario la transcripción; no inventes el texto.
- Con las palabras y sus tiempos, analiza: primera palabra y en qué décima de segundo entra, estructura del guion (dónde cae cada "pero"), palabras por segundo y pausas.
- Para lo visual, saca 12 cuadros por segundo de los primeros 5 s con la hora impresa (`ffmpeg -t 4.5 -i ref.mp4 -vf "fps=12,scale=200:-1,drawtext=text='%{pts\:hms}':fontcolor=yellow:fontsize=16:box=1:boxcolor=black@0.6,tile=9x3" h_%d.jpg`) y describe golpe por golpe qué se mueve y qué hace la cámara.
- Para el sonido, mide volumen cada 0,1 s y los golpes por banda (graves, medios, agudos) para ubicar efectos.
- La transcripción también sirve para revisar la voz propia: confirma que el locutor dijo lo que el guion pedía antes de mezclar.
- Límite que sigue existiendo: se puede leer lo que se dice y medir cuándo suena algo, pero no juzgar si una música o un efecto suenan bien. Eso lo decide el usuario escuchando.

## Errores ya resueltos

- Sin contorno visible: falta el pase de normales (ya incluido en `inkRenderer`).
- Objetos cortados: campo horizontal estrecho en vertical; sube `fov` o aleja la cámara y revisa con cuadros de prueba.
- `flatShading` no existe en `MeshToonMaterial`; `PCFSoftShadowMap` fue retirado: usa `PCFShadowMap`.
- Módulos ES no cargan desde `file://`: por eso se empaqueta con esbuild a un `bundle.js` clásico.
- No se puede escuchar el audio desde el entorno: transcribe la voz con Whisper para verificar lo dicho, mide los efectos, y aun así dile al usuario que la mezcla está hecha por niveles y pídele que confirme cómo suena.
- Al unir audio y video no uses `-shortest` con una pista más corta: corta el video. Usa `apad` y `-t <duración>`, y comprueba la duración final con ffprobe antes de entregar.
- Si los conectores (Magnific u otros) fallan varias veces seguidas en una conversación, no insistas: entrega lo que hay, da el comando de ffmpeg para mezclar en la PC del usuario y sugiere una conversación nueva.

## Al terminar

Di qué se entrega, dónde está, cuántos créditos se gastaron y qué no se pudo verificar (audio). No describas los pasos.