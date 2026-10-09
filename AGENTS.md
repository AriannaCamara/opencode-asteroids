# AGENTS.md

Clon de Asteroids en HTML5 Canvas puro. Sin dependencias, bundler, build ni tests.

## Estructura

- `game.js` — toda la lógica del juego (único archivo de código, ~420 líneas).
- `index.html` — carga `game.js` como script clásico (no módulo); canvas fijo 800×600.
- `favicon.svg`, `README.md`.

No hay `package.json`, linter ni framework de test. No inventes comandos de build/test.

## Verificación

Todo cambio es manual: abrir `index.html` en el navegador o `npx serve .` y jugar. Verifica que
la consola no tenga errores.

## Arquitectura de `game.js`

- Loop con delta time: `loop()` llama `update(dt)` y `draw()` separados; `dt` viene acotado a 0.05 s.
- Estado global mutable: `ship, bullets, asteroids, particles`, más `score, lives, level, state`.
- `state` es la máquina de estados: `'playing' | 'dead' | 'gameover'`.
- Espacio toroidal: usa siempre `wrap(v, max)` para posición X/Y (nada de clamped bounds).
- Entidades: clases `Bullet`, `Asteroid`, `Ship`, `Particle`, cada una con `update(dt)` y `draw()`.
- Tamaños de asteroide indexados 1..3 en `RADII`, `SPEEDS`, `POINTS` (índice 0 sin usar).
- Colisiones por distancia circular (`dist(a, b)`), no AABB.
- Reinicio total con `initGame()`; el juego arranca llamándola al final del archivo.

## Convenciones

- Código e identificadores en inglés; comentarios y texto de UI en español (`NIVEL`, `PUNTAJE`, `GAME OVER`).
- Separadores de sección con el patrón `// ── Nombre ──`.
- Sin comentarios superfluos.

## Inconsistencia conocida

El `README.md` menciona power-ups y la "estrella fugaz", pero **no existen** en `game.js`.
No los tomes como features implementadas.
