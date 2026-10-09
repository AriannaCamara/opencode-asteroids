'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── PowerUp ───────────────────────────────────────────────────────────────────
const SPEED_DURATION  = 5;   // segundos de efecto "velocidad"
const TRIPLE_DURATION = 5;   // segundos de efecto "triple disparo"
const SHIELD_DURATION = 5;   // segundos de efecto "escudo"

const POWERUP_TYPES = {
  speed:  { color: '#4df3ff' },
  triple: { color: '#ffc23d' },
  shield: { color: '#7cff6b' },
};

function randomPowerUpType() {
  const types = Object.keys(POWERUP_TYPES);
  return types[randInt(0, types.length - 1)];
}

class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = POWERUP_TYPES[type].color;
    this.radius = 11;
    this.ttl = 10;          // desaparece si nadie lo recoge
    this.rot = 0;
    this.dead = false;
  }

  update(dt) {
    this.rot += 2 * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo al estar por expirar
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    if (this.type === 'shield') {
      // Glifo de escudo: arco superior con punta inferior
      ctx.beginPath();
      ctx.moveTo(-5, -5);
      ctx.lineTo( 5, -5);
      ctx.lineTo( 5,  1);
      ctx.quadraticCurveTo(5, 6, 0, 8);
      ctx.quadraticCurveTo(-5, 6, -5, 1);
      ctx.closePath();
      ctx.stroke();
    } else if (this.type === 'triple') {
      // Tres puntitos en línea recta
      ctx.fillStyle = this.color;
      for (const px of [-5, 0, 5]) {
        ctx.beginPath();
        ctx.arc(px, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Doble chevron (»)
      ctx.beginPath();
      ctx.moveTo(-4, -5);
      ctx.lineTo( 1,  0);
      ctx.lineTo(-4,  5);
      ctx.moveTo( 2, -5);
      ctx.lineTo( 7,  0);
      ctx.lineTo( 2,  5);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño
const STAR_POINTS = 300;          // bonificación por destruirla
const STAR_SPEED  = 260;          // ~3× un asteroide pequeño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.points = POINTS[size];
    this.explosion = size * 5;
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── ShootingStar ─────────────────────────────────────────────────────────────
class ShootingStar extends Asteroid {
  constructor(x, y) {
    super(x, y, 1);
    this.ttl  = rand(4, 6);
    this.points    = STAR_POINTS;
    this.explosion = 14;

    const angle = rand(0, Math.PI * 2);
    const speed = STAR_SPEED + rand(-30, 30);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  split() {
    return [];
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo al estar por expirar
    if (this.ttl < 1 && Math.floor(this.ttl * 8) % 2 === 0) return;

    // Dirección de vuelo y su perpendicular (para dar ancho a la cola)
    const speed = Math.hypot(this.vx, this.vy) || 1;
    const ux = this.vx / speed;
    const uy = this.vy / speed;
    const px = -uy;
    const py = ux;

    const TAIL   = 72;
    const halfW  = this.radius * 0.7;
    const tailX  = this.x - ux * TAIL;
    const tailY  = this.y - uy * TAIL;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';   // brillos que se suman

    // Cola exterior: triángulo ancho que se afila y desvanece
    const outer = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
    outer.addColorStop(0,    'rgba(255, 240, 180, 0.8)');
    outer.addColorStop(0.35, 'rgba(255, 200, 90, 0.4)');
    outer.addColorStop(1,    'rgba(255, 150, 40, 0)');
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.moveTo(this.x + px * halfW, this.y + py * halfW);
    ctx.lineTo(tailX, tailY);
    ctx.lineTo(this.x - px * halfW, this.y - py * halfW);
    ctx.closePath();
    ctx.fill();

    // Cola interior: núcleo blanco, más corto y brillante
    const inner = ctx.createLinearGradient(this.x, this.y, this.x - ux * TAIL * 0.5, this.y - uy * TAIL * 0.5);
    inner.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    inner.addColorStop(1, 'rgba(255, 210, 110, 0)');
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.moveTo(this.x + px * halfW * 0.4, this.y + py * halfW * 0.4);
    ctx.lineTo(this.x - ux * TAIL * 0.5, this.y - uy * TAIL * 0.5);
    ctx.lineTo(this.x - px * halfW * 0.4, this.y - py * halfW * 0.4);
    ctx.closePath();
    ctx.fill();

    // Halo del núcleo
    const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 1.7);
    glow.addColorStop(0,   'rgba(255, 248, 210, 0.9)');
    glow.addColorStop(0.4, 'rgba(255, 210, 110, 0.45)');
    glow.addColorStop(1,   'rgba(255, 170, 40, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.7, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo: punto blanco luminoso
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ── Skins ─────────────────────────────────────────────────────────────────────
const SKINS = [
  { name: 'CLASSIC', color: '#fff',    flame: 'rgba(255, 130, 0, 0.85)',
    points: [[20, 0], [-12, -9], [-7, 0], [-12, 9]] },
  { name: 'VIPER', color: '#4df3ff', flame: 'rgba(255, 0, 170, 0.85)',
    points: [[22, 0], [-10, -6], [-6, 0], [-10, 6]] },
  { name: 'HORNET', color: '#ffd24d', flame: 'rgba(255, 40, 40, 0.85)',
    points: [[18, 0], [-6, -13], [-13, -4], [-8, 0], [-13, 4], [-6, 13]] },
  { name: 'PHANTOM', color: '#c07dff', flame: 'rgba(60, 255, 130, 0.85)',
    points: [[21, 0], [-4, -7], [-14, -11], [-9, 0], [-14, 11], [-4, 7]] },
];
const SKIN_STORAGE_KEY = 'asteroids.skin';

function loadSkin() {
  try {
    const idx = parseInt(localStorage.getItem(SKIN_STORAGE_KEY), 10);
    return Number.isInteger(idx) && idx >= 0 && idx < SKINS.length ? idx : 0;
  } catch {
    return 0;
  }
}

function saveSkin(index) {
  try { localStorage.setItem(SKIN_STORAGE_KEY, String(index)); } catch {}
}

let skinIndex = loadSkin();
let skinNameTimer = 0;

function cycleSkin() {
  skinIndex = (skinIndex + 1) % SKINS.length;
  skinNameTimer = 1.5;
  saveSkin(skinIndex);
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;
    this.tripleTimer   = 0;
    this.shieldTimer   = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer     -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer    -= dt;
    if (this.shieldTimer   > 0) this.shieldTimer    -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;
    const speedFactor = this.speedTimer > 0 ? 2 : 1;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * speedFactor * dt;
      this.vy += Math.sin(this.angle) * THRUST * speedFactor * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleTimer <= 0) return [new Bullet(ox, oy, this.angle)];

    // Triple disparo: 3 balas paralelas en línea recta
    const px = -Math.sin(this.angle) * 8;
    const py =  Math.cos(this.angle) * 8;
    return [
      new Bullet(ox - px, oy - py, this.angle),
      new Bullet(ox,      oy,      this.angle),
      new Bullet(ox + px, oy + py, this.angle),
    ];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[skinIndex];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = skin.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Anillos de power-ups activos
    if (this.speedTimer > 0) {
      ctx.strokeStyle = POWERUP_TYPES.speed.color;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.tripleTimer > 0) {
      ctx.strokeStyle = POWERUP_TYPES.triple.color;
      ctx.beginPath();
      ctx.arc(0, 0, 21, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.shieldTimer > 0) {
      // Parpadea al expirar
      const blinking = this.shieldTimer < 1 && Math.floor(this.shieldTimer * 8) % 2 === 0;
      if (!blinking) {
        ctx.strokeStyle = POWERUP_TYPES.shield.color;
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth   = 1.5;
      }
    }
    ctx.strokeStyle = skin.color;

    // Silueta definida por la skin activa
    ctx.beginPath();
    ctx.moveTo(skin.points[0][0], skin.points[0][1]);
    for (let i = 1; i < skin.points.length; i++)
      ctx.lineTo(skin.points[i][0], skin.points[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let starTimer;  // cuenta atrás para el próximo intento de estrella fugaz

const SAFE_DIST = 130;

function randomSafePosition() {
  let x, y;
  do {
    x = rand(0, W);
    y = rand(0, H);
  } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
  return { x, y };
}

function spawnAsteroids(count) {
  for (let i = 0; i < count; i++) {
    const { x, y } = randomSafePosition();
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnShootingStar() {
  const { x, y } = randomSafePosition();
  asteroids.push(new ShootingStar(x, y));
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  starTimer = rand(6, 12);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  ship.reset();
  starTimer = rand(6, 12);
  spawnAsteroids(3 + level);
  spawnShootingStar();   // garantizada al subir de nivel
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function destroyAsteroid(a) {
  a.dead = true;
  score += a.points;
  explode(a.x, a.y, a.explosion);
  if (Math.random() < 0.15) powerUps.push(new PowerUp(a.x, a.y, randomPowerUpType()));
  return a.split();
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedTimer  = 0;
  ship.tripleTimer = 0;
  ship.shieldTimer = 0;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (skinNameTimer > 0) skinNameTimer -= dt;

  if (pressed('KeyK')) cycleSkin();

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    asteroids = asteroids.filter(a => !a.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));

  // Estrella fugaz: aparición aleatoria cada cierto tiempo
  starTimer -= dt;
  if (starTimer <= 0) {
    starTimer = rand(6, 14);
    if (Math.random() < 0.35) spawnShootingStar();
  }

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerUps  = powerUps.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        newAsteroids.push(...destroyAsteroid(a));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide (el escudo destruye en vez de morir)
  if (ship.invincible <= 0) {
    const shieldFragments = [];
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shieldTimer > 0) {
          shieldFragments.push(...destroyAsteroid(a));
        } else {
          killShip();
          break;
        }
      }
    }
    if (shieldFragments.length)
      asteroids = asteroids.filter(a => !a.dead).concat(shieldFragments);
  }

  // Nave vs power-up
  if (!ship.dead) {
    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        if (p.type === 'speed')       ship.speedTimer  = SPEED_DURATION;
        else if (p.type === 'triple') ship.tripleTimer = TRIPLE_DURATION;
        else                          ship.shieldTimer = SHIELD_DURATION;
        explode(p.x, p.y, 6);
      }
    }
    powerUps = powerUps.filter(p => !p.dead);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = SKINS[skinIndex].color;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  let hudY = 46;
  if (ship.speedTimer > 0) {
    ctx.fillStyle = POWERUP_TYPES.speed.color;
    ctx.fillText(`VEL ${ship.speedTimer.toFixed(1)}`, W / 2, hudY);
    hudY += 20;
  }
  if (ship.tripleTimer > 0) {
    ctx.fillStyle = POWERUP_TYPES.triple.color;
    ctx.fillText(`TRIPLE ${ship.tripleTimer.toFixed(1)}`, W / 2, hudY);
    hudY += 20;
  }
  if (ship.shieldTimer > 0) {
    ctx.fillStyle = POWERUP_TYPES.shield.color;
    ctx.fillText(`ESC ${ship.shieldTimer.toFixed(1)}`, W / 2, hudY);
  }
  ctx.fillStyle = '#fff';

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  if (skinNameTimer > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = SKINS[skinIndex].color;
    ctx.fillText(`SKIN  ${SKINS[skinIndex].name}`, W / 2, H - 16);
    ctx.fillStyle = '#fff';
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerUps.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
