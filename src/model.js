export const DIFFICULTIES = Object.freeze({
  easy: Object.freeze({ label: '쉬움', speed: 32 }),
  normal: Object.freeze({ label: '보통', speed: 64 }),
  hard: Object.freeze({ label: '어려움', speed: 96 }),
});

export class DifficultyError extends RangeError {
  constructor() {
    super('난이도가 올바르지 않습니다. 쉬움, 보통, 어려움 중에서 선택해 주세요.');
    this.name = 'DifficultyError';
  }
}

export function getDifficulty(value) {
  if (typeof value !== 'string' || !Object.hasOwn(DIFFICULTIES, value)) {
    throw new DifficultyError();
  }
  return DIFFICULTIES[value];
}

export const RULES = Object.freeze({
  width: 800,
  height: 600,
  playerWidth: 40,
  playerHeight: 20,
  playerX: 380,
  playerY: 550,
  playerSpeed: 320,
  bulletWidth: 4,
  bulletHeight: 12,
  bulletSpeed: 600,
  fireInterval: 0.2,
  enemyRows: 3,
  enemyColumns: 8,
  enemyWidth: 40,
  enemyHeight: 24,
  enemyX: 112,
  enemyY: 72,
  enemyGapX: 72,
  enemyGapY: 48,
  enemyDrop: 24,
  pointsPerEnemy: 10,
  defenseY: 520,
  initialLives: 3,
  maxDelta: 0.1,
  step: 1 / 120,
});

export function createGame() {
  return {
    status: 'title',
    lives: RULES.initialLives,
    pendingDifficulty: 'normal',
    currentDifficulty: 'normal',
    player: { x: RULES.playerX, y: RULES.playerY },
    bullets: [],
    enemies: Array.from({ length: RULES.enemyRows * RULES.enemyColumns }, (_, index) => ({
      x: RULES.enemyX + (index % RULES.enemyColumns) * RULES.enemyGapX,
      y: RULES.enemyY + Math.floor(index / RULES.enemyColumns) * RULES.enemyGapY,
    })),
    enemyDirection: 1,
    score: 0,
    elapsed: 0,
    fireCooldown: 0,
  };
}

export function startGame(game) {
  return game.status === 'title' ? newRound(game.pendingDifficulty) : game;
}

function newRound(difficulty) {
  getDifficulty(difficulty);
  return {
    ...createGame(),
    status: 'playing',
    pendingDifficulty: difficulty,
    currentDifficulty: difficulty,
  };
}

export function canSelectDifficulty(game) {
  return game.status === 'title' || isFinished(game);
}

export function selectDifficulty(game, difficulty) {
  getDifficulty(difficulty);
  return canSelectDifficulty(game) ? { ...game, pendingDifficulty: difficulty } : game;
}

export function isFinished(game) {
  return game.status === 'won' || game.status === 'lost';
}

export function restartGame(game) {
  return isFinished(game) ? newRound(game.pendingDifficulty) : game;
}

export function nextAttempt(game) {
  return game.status === 'retry'
    ? { ...newRound(game.currentDifficulty), lives: game.lives }
    : game;
}

export function togglePause(game) {
  if (game.status !== 'playing' && game.status !== 'paused') return game;
  return { ...game, status: game.status === 'playing' ? 'paused' : 'playing' };
}

function moveEnemies(game, dt, speed) {
  const left = Math.min(...game.enemies.map((enemy) => enemy.x));
  const right = Math.max(...game.enemies.map((enemy) => enemy.x + RULES.enemyWidth));
  const available = Math.max(0, game.enemyDirection === 1 ? RULES.width - right : left);
  const distance = speed * dt;
  const travel = Math.min(distance, available);
  for (const enemy of game.enemies) enemy.x += game.enemyDirection * travel;
  if (available <= distance + 1e-9) {
    game.enemyDirection *= -1;
    for (const enemy of game.enemies) {
      enemy.y += RULES.enemyDrop;
      enemy.x += game.enemyDirection * (distance - travel);
    }
  }
}

function resolveCombat(game) {
  game.bullets = game.bullets.filter((bullet) => {
    const index = game.enemies.findIndex((enemy) =>
      bullet.x < enemy.x + RULES.enemyWidth &&
      bullet.x + RULES.bulletWidth > enemy.x &&
      bullet.y < enemy.y + RULES.enemyHeight &&
      bullet.y + RULES.bulletHeight > enemy.y);
    if (index === -1) return true;
    game.enemies.splice(index, 1);
    game.score += RULES.pointsPerEnemy;
    return false;
  });
  if (game.enemies.length === 0) game.status = 'won';
  else if (game.enemies.some((enemy) => enemy.y + RULES.enemyHeight >= RULES.defenseY)) {
    game.lives -= 1;
    game.status = game.lives > 0 ? 'retry' : 'lost';
  }
}

function fireIfReady(game, input) {
  if (input.fire && game.fireCooldown <= 1e-9) {
    game.bullets.push({
      x: game.player.x + (RULES.playerWidth - RULES.bulletWidth) / 2,
      y: game.player.y - RULES.bulletHeight,
    });
    game.fireCooldown = RULES.fireInterval;
  }
}

export function updateGame(game, delta, input = {}) {
  if (!Number.isFinite(delta) || delta < 0) {
    throw new RangeError('delta must be a finite, non-negative number of seconds');
  }
  const { speed } = getDifficulty(game.currentDifficulty);
  if (game.status !== 'playing') return;

  resolveCombat(game);
  if (game.status !== 'playing') return;
  let remaining = Math.min(delta, RULES.maxDelta);
  const direction = Number(Boolean(input.right)) - Number(Boolean(input.left));
  fireIfReady(game, input);

  while (remaining > 1e-9) {
    const untilShot = input.fire && game.fireCooldown > 1e-9 ? game.fireCooldown : Infinity;
    const dt = Math.min(remaining, RULES.step, untilShot);
    game.player.x = Math.max(0, Math.min(
      RULES.width - RULES.playerWidth,
      game.player.x + direction * RULES.playerSpeed * dt,
    ));
    for (const bullet of game.bullets) bullet.y -= RULES.bulletSpeed * dt;
    game.bullets = game.bullets.filter((bullet) => bullet.y + RULES.bulletHeight > 0);
    moveEnemies(game, dt, speed);
    game.fireCooldown = Math.max(0, game.fireCooldown - dt);
    game.elapsed += dt;
    resolveCombat(game);
    if (game.status !== 'playing') break;
    fireIfReady(game, input);
    remaining -= dt;
  }
}
