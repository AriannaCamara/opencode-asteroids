---
description: Crea un git worktree en .worktrees/ a partir de una descripción libre.
---

Recibes `$ARGUMENTS` como nombre o descripción del worktree (puede contener espacios).

1. Genera un slug kebab-case a partir de `$ARGUMENTS`:
   - Minúsculas.
   - Espacios y `_` → `-`.
   - Elimina todo carácter fuera de `a-z0-9-`.
   - Colapsa guiones repetidos y quita guiones al inicio/final.
   Ejemplos: `Fix login bug` → `fix-login-bug`, `add  PowerUp system!` → `add-powerup-system`.
2. Ejecuta exactamente un único comando:
   git worktree add .worktrees/<slug>

Reglas estrictas:
- NO ejecutes ningún otro comando (sin cd, sin git add/commit, sin tocar archivos).
- NO cambies de directorio.
- Si `$ARGUMENTS` está vacío, pide al usuario el nombre antes de ejecutar.
- Si el directorio ya existe, reporta el error y detente; no agregues sufijos ni reintentes.
