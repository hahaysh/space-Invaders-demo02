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
  maxDelta: 0.1,
  step: 1 / 120,
});

export function createGame() {
  return {
    status: 'title',
    player: { x: RULES.playerX, y: RULES.playerY },
    bullets: [],
    elapsed: 0,
    fireCooldown: 0,
  };
}

export function startGame(game) {
  return game.status === 'title' ? { ...createGame(), status: 'playing' } : game;
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
    game.fireCooldown = Math.max(0, game.fireCooldown - dt);
    game.elapsed += dt;
    fireIfReady(game, input);
    remaining -= dt;
  }
}
