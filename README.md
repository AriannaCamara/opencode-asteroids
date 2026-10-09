# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |
| `K`       | Cambiar skin |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |
| Estrella fugaz | 300 |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-ups con duración limitada: velocidad (VEL, chevrons cyan), triple
  disparo (TRIPLE, tres puntos ámbar) y escudo (ESC, anillo verde). El escudo
  destruye los asteroides al impactar en vez de hacer perder una vida
- Skins de nave (CLASSIC, VIPER, HORNET, PHANTOM, NOVA) que se cambian con `K`
  y se guardan en `localStorage`. La skin NOVA es el doble de grande, con
  colores llamativos, y multiplica x2 los puntos obtenidos a cambio de ser un
  blanco más fácil
- Estrella fugaz: muy rápida, con estela dorada, desaparece con el tiempo
  (parpadea al expirar) y da 300 puntos sin dividirse. Aparece de forma
  aleatoria durante el nivel y siempre al subir de nivel.
