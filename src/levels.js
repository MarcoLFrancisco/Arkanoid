// All geometry uses logical pixels; rendering scales to the displayed canvas.
export const FIELD = Object.freeze({ width: 960, height: 640 });

export const RULES = Object.freeze({
  startingLives: 3,
  ballRadius: 8,
  paddleHeight: 16,
  paddleBottom: 44,
  paddleSpeed: 760,
  maxBallSpeed: 760,
  hitAcceleration: 5,
  pointsPerHit: 25,
  pointsPerBrick: 100,
  levelBonus: 500,
});

const GRID = Object.freeze({ columns: 12, margin: 48, top: 82, gap: 8, height: 24 });

function defineLevel(name, ballSpeed, paddleWidth, colors, rows) {
  if (rows.some(row => row.length !== GRID.columns || /[^0123]/.test(row))) {
    throw new Error(`Invalid brick pattern for ${name}`);
  }
  return Object.freeze({
    name,
    ballSpeed,
    paddleWidth,
    colors: Object.freeze(colors),
    rows: Object.freeze(rows),
  });
}

// Digits indicate hit points; zero leaves a gap. Every brick is destructible.
export const LEVELS = Object.freeze([
  defineLevel('First Light', 360, 144,
    ['#ff70ca', '#b58cff', '#69a7ff', '#61f4ff', '#8affcd'], [
      '111111111111',
      '111111111111',
      '110011110011',
      '011111111110',
      '001111111100',
    ]),
  defineLevel('Prism Gates', 410, 136,
    ['#ffca75', '#ff8aa5', '#ff70ca', '#bc83ff', '#61f4ff'], [
      '022200002220',
      '211120021112',
      '110011110011',
      '110001100011',
      '211120021112',
      '022200002220',
    ]),
  defineLevel('Ion Diamond', 460, 128,
    ['#61f4ff', '#67c3ff', '#9d93ff', '#df83ff', '#ff70ca', '#ffb58b'], [
      '000022220000',
      '000211112000',
      '002112211200',
      '021123321120',
      '002112211200',
      '000211112000',
      '000022220000',
    ]),
  defineLevel('Cyber Circuit', 510, 120,
    ['#a5ff80', '#62f5be', '#61f4ff', '#74aaff', '#be8aff', '#ff70ca'], [
      '222022220222',
      '100010010001',
      '123012210321',
      '101010010101',
      '123012210321',
      '100010010001',
      '222022220222',
    ]),
  defineLevel('Supernova', 560, 112,
    ['#fff09a', '#ffc078', '#ff907e', '#ff70ca', '#cb88ff', '#7eaaff', '#61f4ff'], [
      '303022220303',
      '032211112230',
      '022122221220',
      '221233332122',
      '022122221220',
      '032211112230',
      '303022220303',
    ]),
]);

/**
 * Create fresh mutable bricks for a zero-based level index.
 * The engine owns hp; the renderer uses maxHp, color, and rectangle geometry.
 * Coordinates describe the top-left corner of each brick.
 */
export function createBricks(levelIndex) {
  const level = LEVELS[levelIndex];
  if (!Number.isInteger(levelIndex) || !level) {
    throw new RangeError('Level index must identify an existing level');
  }

  const width = (FIELD.width - GRID.margin * 2 - GRID.gap * (GRID.columns - 1)) / GRID.columns;
  const bricks = [];
  level.rows.forEach((row, rowIndex) => {
    [...row].forEach((digit, column) => {
      const hp = Number(digit);
      if (hp === 0) return;
      bricks.push({
        id: rowIndex * GRID.columns + column,
        x: GRID.margin + column * (width + GRID.gap),
        y: GRID.top + rowIndex * (GRID.height + GRID.gap),
        width,
        height: GRID.height,
        hp,
        maxHp: hp,
        color: level.colors[rowIndex % level.colors.length],
      });
    });
  });
  return bricks;
}
