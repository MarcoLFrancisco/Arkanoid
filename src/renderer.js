import { FIELD } from './levels.js';

// main.js calls draw(game.state, game.drainEvents(), dtSeconds) each frame.
// Rendering never mutates engine state. No images or external assets required.
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) throw new Error('This browser does not support Canvas 2D.');
    this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.particles = [];
    this.trail = [];
    this.time = 0;
    this.stars = Array.from({ length: 80 }, (_, i) => ({
      x: (i * 137.51) % FIELD.width,
      y: (i * i * 17.31) % FIELD.height,
      radius: i % 5 === 0 ? 1.5 : 0.7,
    }));
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.ctx.setTransform(width / FIELD.width, 0, 0, height / FIELD.height, 0, 0);
  }

  disc(x, y, radius, color) {
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.fill();
  }

  panel(x, y, width, height, radius, fill) {
    const c = this.ctx;
    c.fillStyle = fill;
    c.beginPath();
    c.roundRect(x, y, width, height, radius);
    c.fill();
  }

  effects(state, events, dt) {
    if (events.some(event => event.type === 'level')) {
      this.particles.length = 0;
      this.trail.length = 0;
    }
    if (this.motion.matches) {
      this.particles.length = 0;
      this.trail.length = 0;
      return;
    }
    for (const event of events) {
      if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) continue;
      const count = event.type === 'break' ? 20 : event.type === 'lifeLost' ? 32 : 7;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 45 + Math.random() * 190;
        const life = 0.25 + Math.random() * 0.45;
        this.particles.push({
          x: event.x, y: event.y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life, duration: life, size: 1 + Math.random() * 3,
          color: event.color || '#61f4ff',
        });
      }
    }
    if (this.particles.length > 450) this.particles.splice(0, this.particles.length - 450);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 110 * dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const point of this.trail) point.life -= dt;
    this.trail = this.trail.filter(point => point.life > 0);
    if (state.status === 'playing' && dt > 0) {
      this.trail.push({ x: state.ball.x, y: state.ball.y, life: 0.16 });
      if (this.trail.length > 32) this.trail.shift();
    } else if (state.status !== 'paused') {
      this.trail.length = 0;
    }
  }

  background(state) {
    const c = this.ctx;
    const gradient = c.createRadialGradient(480, 100, 20, 480, 240, 670);
    gradient.addColorStop(0, '#192c50');
    gradient.addColorStop(0.55, '#0c162c');
    gradient.addColorStop(1, '#050a17');
    c.fillStyle = gradient;
    c.fillRect(0, 0, FIELD.width, FIELD.height);
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      c.globalAlpha = 0.25 + (Math.sin(this.time * 0.7 + i) + 1) * 0.2;
      this.disc(star.x, star.y, star.radius, '#b6d9ff');
    }
    c.globalAlpha = 1;
    c.lineWidth = 1;
    c.strokeStyle = '#61bfff0c';
    c.beginPath();
    for (let x = 0; x <= FIELD.width; x += 48) {
      c.moveTo(x, 0);
      c.lineTo(x, FIELD.height);
    }
    for (let y = 16; y < FIELD.height; y += 48) {
      c.moveTo(0, y);
      c.lineTo(FIELD.width, y);
    }
    c.stroke();
    c.shadowColor = '#61f4ff';
    c.shadowBlur = 14;
    c.fillStyle = '#61f4ff70';
    c.fillRect(0, 0, 2, FIELD.height);
    c.fillRect(FIELD.width - 2, 0, 2, FIELD.height);
    c.shadowBlur = 0;
    c.fillStyle = '#ff70ca55';
    c.fillRect(0, FIELD.height - 2, FIELD.width, 2);
    c.font = '600 12px system-ui, sans-serif';
    c.fillStyle = '#9ab3d0';
    c.textAlign = 'left';
    c.fillText(`SECTOR ${String(state.levelIndex + 1).padStart(2, '0')} / ${state.levelName.toUpperCase()}`, 48,  forty());
    c.textAlign = 'right';
    c.fillText(`${state.remaining} BRICKS REMAINING`, FIELD.width - 48, 40);
    c.textAlign = 'left';
  }

  bricks(bricks) {
    const c = this.ctx;
    for (const b of bricks) {
      if (b.hp <= 0) continue;
      c.globalAlpha = 0.65 + 0.35 * b.hp / b.maxHp;
      c.shadowColor = b.color;
      c.shadowBlur = 12;
      this.panel(b.x, b.y, b.width, b.height, 5, b.color);
      c.shadowBlur = 0;
      const gloss = c.createLinearGradient(0, b.y, 0, b.y + b.height);
      gloss.addColorStop(0, '#ffffff65');
      gloss.addColorStop(0.45, '#ffffff08');
      gloss.addColorStop(1, '#00000065');
      this.panel(b.x, b.y, b.width, b.height, 5, gloss);
      c.fillStyle = '#ffffff90';
      c.fillRect(b.x + 6, b.y + 3, b.width - 12, 1);
      if (b.maxHp > 1) {
        for (let i = 0; i < b.maxHp; i++) {
          this.disc(b.x + b.width / 2 + (i - (b.maxHp - 1) / 2) * 9,
            b.y + b.height / 2 + 2, 2, i < b.hp ? '#ffffff' : '#10172d90');
        }
      }
    }
    c.globalAlpha = 1;
  }

  draw(state, events = [], dt = 0) {
    dt = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.05)) : 0;
    if (state.status === 'paused') dt = 0;
    if (!this.motion.matches) this.time += dt;
    this.resize();
    this.effects(state, events, dt);
    const c = this.ctx;
    c.save();
    this.background(state);
    this.bricks(state.bricks);
    c.globalCompositeOperation = 'lighter';
    for (const point of this.trail) {
      c.globalAlpha = point.life / 0.16 * 0.3;
      this.disc(point.x, point.y, state.ball.radius * point.life / 0.16, '#61f4ff');
    }
    for (const p of this.particles) {
      c.globalAlpha = p.life / p.duration;
      this.disc(p.x, p.y, p.size * p.life / p.duration, p.color);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    const p = state.paddle;
    c.shadowColor = '#61f4ff';
    c.shadowBlur = 22;
    this.panel(p.x, p.y, p.width, p.height, 8, '#61f4ff');
    c.shadowBlur = 0;
    this.panel(p.x + 12, p.y + 4, p.width - 24, p.height - 8, 4, '#e2ffff');
    this.panel(p.x + 4, p.y + 4, 6, p.height - 8, 3, '#ff70ca');
    this.panel(p.x + p.width - 10, p.y + 4, 6, p.height - 8, 3, '#ff70ca');
    const b = state.ball;
    c.shadowColor = '#61f4ff';
    c.shadowBlur = 24;
    this.disc(b.x, b.y, b.radius, '#eaffff');
    c.shadowBlur = 0;
    this.disc(b.x - 2, b.y - 2, b.radius * 0.35, '#ffffff');
    c.restore();
  }
}

function forty() { return 40; }
