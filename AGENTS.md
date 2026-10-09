# AGENTS.md

Clon de Asteroids en HTML5 Canvas puro. Sin dependencias, bundler, build ni tests.

## Estructura

- `game.js` — toda la lógica del juego (único archivo de código, ~600 líneas).
- `index.html` — carga `game.js` como script clásico (no módulo); canvas fijo 800×600.
- `favicon.svg`, `README.md`.
- `.github/workflows/opencode.yml` — responde a `/oc` y `/opencode` en comentarios.
- `.github/workflows/issue-format.yml` — al abrir un issue: formatea el body (conserva el texto
  original verbatim entre `<!-- original:start -->` y `<!-- original:end -->`), aplica labels y
  publica un comentario de triage con opencode (`agent: plan`, solo lectura).
- `.github/scripts/format-issue.cjs` — lógica determinista del formateo y las labels. Idempotente:
  si el body ya contiene `<!-- issue-format:start -->`, no toca el issue.

No hay `package.json`, linter ni framework de test. No inventes comandos de build/test.

## Verificación

Todo cambio es manual: abrir `index.html` en el navegador o `npx serve .` y jugar. Verifica que
la consola no tenga errores.

## Arquitectura de `game.js`

- Loop con delta time: `loop()` llama `update(dt)` y `draw()` separados; `dt` viene acotado a 0.05 s.
- Estado global mutable: `ship, bullets, asteroids, particles`, más `score, lives, level, state`.
- `state` es la máquina de estados: `'playing' | 'dead' | 'gameover'`.
- Espacio toroidal: usa siempre `wrap(v, max)` para posición X/Y (nada de clamped bounds).
- Entidades: clases `Bullet`, `PowerUp`, `Asteroid`, `ShootingStar`, `Ship`, `Particle`, cada una con `update(dt)` y `draw()`.
- `ShootingStar extends Asteroid`: más rápida, con `ttl` (desaparece), no se divide (`split()` → `[]`).
- Tamaños de asteroide indexados 1..3 en `RADII`, `SPEEDS`, `POINTS` (índice 0 sin usar).
- Colisiones por distancia circular (`dist(a, b)`), no AABB.
- Puntuación/explosión por entidad: `a.points` y `a.explosion` (no índices hardcodeados en las colisiones).
- Reinicio total con `initGame()`; el juego arranca llamándola al final del archivo.

## Convenciones

- Código e identificadores en inglés; comentarios y texto de UI en español (`NIVEL`, `PUNTAJE`, `GAME OVER`).
- Separadores de sección con el patrón `// ── Nombre ──`.
- Sin comentarios superfluos.
