# Ganchos, primer fotograma y nivel de detalle

Lo que decide si alguien se queda pasa en los primeros 2 segundos. Esta guía es obligatoria en los pasos 3, 5 y 6.

## 1 · El gancho hablado (guion)
La frase de arranque debe medir **≤ 7 palabras (1,5–2,2 s)**, directa, magnética y sin preámbulos largos (prohibidos los arranques de 15–25 palabras que tardan > 5 s en revelar el tema). Escribe **3 ganchos distintos** (máx. 7 palabras cada uno) con fórmulas diferentes y enséñalos para que la persona elija:
- **Dato imposible:** «146 metros… y lo atrapa al vuelo».
- **Peligro inmediato:** «Un ancla puede apagar medio internet».
- **Lo haces mal:** «Estás desempañando el coche al revés».
- **Cifra de la noticia:** «7 aviones. Un día. Cero bombas».
- **Pregunta con contradicción:** «¿Por qué un cabello mueve internet?».
- **Resultado primero:** «Esta pantalla se dobla 200 000 veces».
Reglas: nada de «hoy te cuento», nada de saludo, la primera palabra ya es el tema y la frase 1 termina en ≤ 2,2 s. Cifras solo si están en `fuentes.md`.

## 2 · El primer fotograma (imagen imposible)
- **Fotograma 0 = el momento más fuerte del vídeo**, con acción literal ya ocurriendo (el impacto en el cable, el cohete colgado de la torre, la descarga sin humo excesivo que tape el sujeto).
- **Titular grande** (`.cap`, Bricolage, **3–4 palabras** máximo) visible desde 0 s hasta ~2 s, en la mitad superior, sin que fuego, humo ni paneles tapen nunca el texto ni el objeto principal. Ese fotograma sirve de miniatura.
- **Movimiento desde 0 s:** la cámara ya entra con movimiento y algo que cambia antes de 0,5 s. **Segundo cambio antes de 2 s.**
- **Audio limpio en el arranque:** si hay voz inmediata (`t < 2,2 s`), máximo **1 SFX sutil** al arranque (nunca apilar golpes con `< 0,35 s` de margen sobre las primeras palabras).
- **Cero osciloscopios en el hook:** no mostrar `#panel` en los primeros segundos.

## 3 · Literalidad 1:1 y nivel de detalle («Lo que se dice, se ve»)
- **Literalidad 1:1 obligatoria:** cada metáfora de tamaño, objeto o distancia narrada se dibuja literalmente con su referencia física real lado a lado (si dice *«grosor de un cabello»*, personaje/mano sacando un cabello visible junto al núcleo con `hairComparison()`).
- **Escala Macro y Continuidad Física:** respetar distancias reales (zoom-out abisal `0 m → -4000 m` cuando corresponda, extremos lejanos monumentales) y prohibir `.visible = false` al recoger anclas, ganchos o vehículos (`stowedAnchorRig()`).
- Cada plano lleva **al menos 3 elementos** que respondan a **qué, dónde y quién**: no solo el objeto principal.
  Ej. cárcel → celda con barrotes **+ figura dentro + sello «provisional» + mazo del juzgado**.
- **Figuras humanas representativas, permitidas siempre que sean genéricas:** silueta o figura de dibujo plana o toon estilizada, sin rasgos reales ni parecido a personas reales. En noticias, con el rótulo «Recreación». Siguen prohibidos: retratos de personas reales, heridos, sangre y violencia.
- Detalle secundario con vida: pequeños objetos que se mueven (papeles que caen, luces que parpadean, peces/nubes en profundidad), sombras de contacto y materiales.

## 4 · Tipografías
- **Subtítulos:** Figtree 700, blanco (lo que se dice).
- **Palabras clave y titulares:** Bricolage 700, más grande y en el color de acento (lo que importa).
Ya viene así en `motor/explica.css`; no uses una tercera fuente salvo la de marca de la persona.

## 5 · Comprobación del gancho y puerta de director (antes del render final)
`node <skill>/scripts/render.mjs <proyecto> gancho` → mira `resultados/gancho.jpg` (0 · 0,3 · 0,6 · 1,5 · 2,5 · 3,7 s) y responde:
- [ ] ¿La frase de arranque en `voz.txt` tiene **≤ 7 palabras (1,5–2,2 s)**?
- [ ] ¿Se entiende el tema sin sonido en el fotograma 0 con titular `.cap` de **3–4 palabras**?
- [ ] ¿Cambia algo visible antes de 0,5 s y otra vez antes de 2 s sin humo/fuego tapando el texto?
- [ ] ¿El fotograma 0 funcionaría como miniatura?
- [ ] ¿Hay literalidad 1:1 en las metáforas y continuidad física sin objetos que desaparecen?
Si falla alguna, corrige y repite (Paso 6b). **No se renderiza el final sin pasarla.**

## 6 · Gancho de noticia: lo más fuerte del suceso, dibujado
En noticias, el fotograma 0 enseña **lo más llamativo e importante del hecho**, no un símbolo abstracto:
- Busca en `fuentes.md` la imagen que mejor resume la noticia (quién actúa y cómo) y dibújala en grande:
  ej. Blocus → varios «usuarios» con pasamontañas y el móvil iluminándoles + la bandera del país detrás.
- **Varias figuras genéricas** (grupo, multitud) dan más fuerza que una sola: 4–6 bustos a distintas alturas y tamaños,
  que entran uno a uno en los primeros 0,5 s, con luz de acento (pantallas, fuego, sirenas).
- **Contexto del lugar** con un símbolo reconocible: bandera, mapa, edificio o monumento (sin escudos oficiales).
- **Acciones del suceso** dibujadas en la escena que lo cuenta (barricadas ardiendo, contenedores empujados, bengalas,
  saqueos, policía con escudos), **solo si están en las fuentes**. Lo que no esté confirmado (p. ej. molotov, armas)
  no se dibuja: dilo a la persona y apúntalo en `fuentes.md` como «no confirmado».
- Sigue valiendo «Temas sensibles»: figuras sin cara ni parecido real, sin heridos ni sangre, rótulo «Recreación»,
  presunción de inocencia en el texto.
- El titular va sobre una placa oscura y el fondo se atenúa mientras se ve (que se lea en el móvil).
