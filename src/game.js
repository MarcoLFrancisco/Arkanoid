import { FIELD, RULES, LEVELS, createBricks } from './levels.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const STEP = 1 / 240;

// State is read-only to consumers. Coordinates use the logical FIELD dimensions.
// Status: menu, ready, playing, paused, won, or gameover.
export class Game {
  constructor() {
    this.events = [];
    this.accumulator = 0;
    this.state = { status: 'menu', score: 0, best: 0, lives: RULES.startingLives, levelIndex: 0 };
    this.loadLevel(0);
    this.state.status = 'menu';
    this.events.length = 0;
  }

  emit(type, details = {}) {
    this.events.push({ type, ...details });
    if (this.events.length > 256) this.events.shift();
  }

  // Drain once per rendered frame. Impact events carry x, y, and color.
  drainEvents() {
    return this.events.splice(0);
  }

  start() {
    Object.assign(this.state, { score: 0, lives: RULES.startingLives });
    this.events.length = 0;
    this.accumulator = 0;
    this.loadLevel(0);
  }

  loadLevel(index) {
    const level = LEVELS[index];
    Object.assign(this.state, {
      levelIndex: index,
      levelName: level.name,
      bricks: createBricks(index),
      paddle: {
        x: (FIELD.width - level.paddleWidth) / 2,
        y: FIELD.height - RULES.paddleBottom - RULES.paddleHeight,
        width: level.paddleWidth,
        height: RULES.paddleHeight,
      },
      ball: { x: 0, y: 0, vx: 0, vy: 0, radius: RULES.ballRadius, speed: level.ballSpeed },
    });
    this.state.remaining = this.state.bricks.length;
    this.ready();
    this.emit('level', { levelIndex: index });
  }

  ready() {
    this.state.status = 'ready';
    const ball = this.state.ball;
    ball.speed = LEVELS[this.state.levelIndex].ballSpeed;
    ball.vx = ball.vy = 0;
    this.attachBall();
  }

  attachBall() {
    const { ball, paddle } = this.state;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius - 1;
  }

  launch() {
    if (this.state.status !== 'ready') return;
    const ball = this.state.ball;
    ball.vx = ball.speed * 0.32;
    ball.vy = -Math.sqrt(ball.speed ** 2 - ball.vx ** 2);
    this.state.status = 'playing';
    this.emit('launch', { x: ball.x, y: ball.y, color: '#61f4ff' });
  }

  togglePause() {
    if (this.state.status === 'paused') {
      this.state.status = this.resumeStatus;
    } else if (['ready', 'playing'].includes(this.state.status)) {
      this.resumeStatus = this.state.status;
      this.state.status = 'paused';
    }
    this.accumulator = 0;
  }

  addScore(points) {
    this.state.score += points;
    this.state.best = Math.max(this.state.best, this.state.score);
  }

  // dt is seconds. Input: axis (-1..1), or pointerX in logical pixels.
  // Keyboard axis takes priority; omit pointerX when keyboard control is active.
  update(dt, input = {}) {
    if (!Number.isFinite(dt) || !['ready', 'playing'].includes(this.state.status)) return;
    this.accumulator += clamp(dt, 0, 0.05);
    while (this.accumulator >= STEP) {
      this.accumulator -= STEP;
      this.step(STEP, input);
      if (!['ready', 'playing'].includes(this.state.status)) {
        this.accumulator = 0;
        break;
      }
    }
  }

  step(dt, input) {
    const { paddle, ball } = this.state;
    const axis = Number.isFinite(input.axis) ? clamp(input.axis, -1, 1) : 0;
    if (axis) {
      paddle.x += axis * RULES.paddleSpeed * dt;
    } else if (Number.isFinite(input.pointerX)) {
      const delta = input.pointerX - paddle.width / 2 - paddle.x;
      paddle.x += clamp(delta, -RULES.paddleSpeed * dt, RULES.paddleSpeed * dt);
    }
    paddle.x = clamp(paddle.x, 0, FIELD.width - paddle.width);
    if (this.state.status === 'ready') {
      this.attachBall();
      return;
    }

    const previousY = ball.y;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    const r = ball.radius;
    if (ball.x < r || ball.x > FIELD.width - r) {
      ball.x = clamp(ball.x, r, FIELD.width - r);
      ball.vx = ball.x === r ? Math.abs(ball.vx) : -Math.abs(ball.vx);
      this.emit('wall', { x: ball.x, y: ball.y, color: '#69a7ff' });
    }
    if (ball.y < r) {
      ball.y = r;
      ball.vy = Math.abs(ball.vy);
      this.emit('wall', { x: ball.x, y: ball.y, color: '#69a7ff' });
    }

    if (ball.vy > 0 && previousY + r <= paddle.y && ball.y + r >= paddle.y) {
      const fraction = clamp((paddle.y - r - previousY) / (ball.vy * dt), 0, 1);
      const impactX = ball.x - ball.vx * dt * (1 - fraction);
      if (impactX >= paddle.x - r && impactX <= paddle.x + paddle.width + r) {
        const offset = clamp((impactX - paddle.x - paddle.width / 2) / (paddle.width / 2), -1, 1);
        const angle = offset * Math.PI / 3;
        ball.x = clamp(impactX, r, FIELD.width - r);
        ball.y = paddle.y - r - 0.01;
        ball.vx = ball.speed * Math.sin(angle);
        // Avoid a perfectly vertical orbit after a central paddle hit.
        if (Math.abs(ball.vx) < ball.speed * 0.12) ball.vx = ball.speed * 0.12 * (offset < 0 ? -1 : 1);
        ball.vy = -Math.sqrt(ball.speed ** 2 - ball.vx ** 2);
        this.emit('paddle', { x: ball.x, y: ball.y, color: '#61f4ff' });
      }
    }

    for (const brick of this.state.bricks) {
      if (brick.hp <= 0 || !this.collideBrick(brick)) continue;
      brick.hp -= 1;
      this.addScore(RULES.pointsPerHit + (brick.hp === 0 ? RULES.pointsPerBrick : 0));
      this.emit(brick.hp === 0 ? 'break' : 'hit', {
        x: ball.x, y: ball.y, color: brick.color,
      });
      if (brick.hp === 0) this.state.remaining -= 1;
      ball.speed = Math.min(RULES.maxBallSpeed, ball.speed + RULES.hitAcceleration);
      const length = Math.hypot(ball.vx, ball.vy);
      ball.vx *= ball.speed / length;
      ball.vy *= ball.speed / length;
      if (this.state.remaining === 0) {
        this.addScore(RULES.levelBonus);
        if (this.state.levelIndex + 1 === LEVELS.length) {
          this.state.status = 'won';
          this.emit('win');
        } else {
          this.loadLevel(this.state.levelIndex + 1);
        }
      }
      return;
    }

    if (ball.y - r > FIELD.height) {
      this.state.lives -= 1;
      this.emit('lifeLost', { x: ball.x, y: FIELD.height, color: '#ff70ca' });
      if (this.state.lives === 0) this.state.status = 'gameover';
      else this.ready();
    }
  }

  collideBrick(brick) {
    const b = this.state.ball;
    const x = clamp(b.x, brick.x, brick.x + brick.width);
    const y = clamp(b.y, brick.y, brick.y + brick.height);
    let nx = b.x - x;
    let ny = b.y - y;
    const distance = Math.hypot(nx, ny);
    if (distance >= b.radius) return false;
    let depth = b.radius - distance;
    if (distance > 0) {
      nx /= distance;
      ny /= distance;
    } else {
      const faces = [
        [b.x - brick.x, -1, 0],
        [brick.x + brick.width - b.x, 1, 0],
        [b.y - brick.y, 0, -1],
        [brick.y + brick.height - b.y, 0, 1],
      ].sort((a, c) => a[0] - c[0]);
      [depth, nx, ny] = faces[0];
      depth += b.radius;
    }
    b.x += nx * (depth + 0.01);
    b.y += ny * (depth + 0.01);
    const dot = b.vx * nx + b.vy * ny;
    if (dot >= 0) return false;
    b.vx -= 2 * dot * nx;
    b.vy -= 2 * dot * ny;
    // Keep enough vertical motion to prevent near-horizontal stalls.
    if (Math.abs(b.vy) < b.speed * 0.2) {
      b.vy = (b.vy < 0 ? -1 : 1) * b.speed * 0.2;
      b.vx = (b.vx < 0 ? -1 : 1) * Math.sqrt(b.speed ** 2 - b.vy ** 2);
    }
    return true;
  }
}
