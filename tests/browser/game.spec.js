import { expect, test } from '@playwright/test';

async function pixels(page, color) {
  return page.locator('canvas').evaluate((canvas, rgb) => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width;
    let maxX = -1;
    let minY = canvas.height;
    let maxY = -1;
    let count = 0;
    const rows = new Set();
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (data[i] === rgb[0] && data[i + 1] === rgb[1] && data[i + 2] === rgb[2]) {
          count++;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          rows.add(y);
        }
      }
    }
    let groups = 0;
    for (const row of rows) if (!rows.has(row - 1)) groups++;
    return { minX, maxX, minY, maxY, groups, count };
  }, color);
}

const player = (page) => pixels(page, [97, 230, 196]);
const bullets = (page) => pixels(page, [255, 223, 128]);
const enemies = (page) => pixels(page, [166, 155, 255]);
const canvasImage = (page) => page.locator('canvas').evaluate((canvas) => canvas.toDataURL());

const observeFrameClock = (page) => page.evaluateHandle(() => {
  const sample = { time: 0, request: 0 };
  const observe = (time) => {
    sample.time = time;
    sample.request = requestAnimationFrame(observe);
  };
  sample.request = requestAnimationFrame(observe);
  return sample;
});

async function expectFreshGame(page) {
  await expect(page.getByRole('status')).toContainText('진행 중');
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.getByRole('button', { name: '다시 시작' })).toBeHidden();
  expect(await enemies(page)).toEqual({
    minX: 112, maxX: 655, minY: 72, maxY: 191, groups: 3, count: 23040,
  });
  expect((await player(page)).minX).toBe(381);
  expect((await bullets(page)).groups).toBe(0);
}

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('close', () => expect(errors).toEqual([]));
  await page.clock.install({ time: new Date('2026-09-14T03:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-14T03:00:00Z'));
  await page.goto('/');
});

test('native select owns arrows, Space and Enter, then Tab reaches the start button', async ({ page }) => {
  const selection = page.getByLabel('다음 판 난이도', { exact: true });
  await expect(selection).toHaveValue('normal');
  await expect(page.locator('#current-difficulty')).toHaveText('현재 판: 시작 전');
  await page.keyboard.press('Tab');
  await expect(selection).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(selection).toHaveValue('easy');
  await page.keyboard.press('ArrowDown');
  await expect(selection).toHaveValue('normal');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(selection).toHaveValue('hard');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowRight');
  await page.clock.runFor(1000);
  await expect(page.getByRole('status')).toHaveText('시작 대기');
  expect((await player(page)).count).toBe(0);
  expect((await bullets(page)).count).toBe(0);
  const prevented = await selection.evaluate((select) => {
    return ['keydown', 'keyup'].flatMap((type) =>
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'KeyR', 'KeyP'].map((code) => {
        const event = new KeyboardEvent(type, { code, bubbles: true, cancelable: true });
        select.dispatchEvent(event);
        return event.defaultPrevented;
      }));
  });
  expect(prevented).toEqual(Array(16).fill(false));
  const selected = await selection.inputValue();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '게임 시작' })).toBeFocused();
  await page.keyboard.press('Space');
  await expectFreshGame(page);
  await expect(selection).toHaveValue(selected);
  await expect(selection).toBeDisabled();
});

for (const [value, label, speed] of [['easy', '쉬움', 32], ['normal', '보통', 64], ['hard', '어려움', 96]]) {
  test(`${value} selection drives Canvas speed, locks through P and resets on reload`, async ({ page }) => {
    const selection = page.getByLabel('다음 판 난이도', { exact: true });
    await selection.selectOption(value);
    await expect(page.locator('#current-difficulty')).toHaveText('현재 판: 시작 전');
    await page.getByRole('button', { name: '게임 시작' }).click();
    await expect(selection).toBeDisabled();
    await expect(page.locator('#current-difficulty')).toHaveText(`현재 판: ${label}`);
    const frameClock = await observeFrameClock(page);
    try {
      for (let cycle = 0; cycle < 2; cycle++) {
        await page.clock.runFor(32);
        const before = await enemies(page);
        const start = await frameClock.evaluate((sample) => sample.time);
        await page.clock.runFor(200);
        const end = await frameClock.evaluate((sample) => sample.time);
        const travel = (await enemies(page)).minX - before.minX;
        const expected = speed * (end - start) / 1000;
        expect(travel).toBeGreaterThanOrEqual(Math.floor(expected));
        expect(travel).toBeLessThanOrEqual(Math.ceil(expected));
        // This synthetic change probes the model guard independently of disabled UI.
        await selection.evaluate((select, attempted) => {
          select.value = attempted;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }, value === 'hard' ? 'easy' : 'hard');
        await expect(selection).toHaveValue(value);
        await page.keyboard.press('p');
        await expect(selection).toBeDisabled();
        const frozen = await canvasImage(page);
        await selection.evaluate((select, attempted) => {
          select.value = attempted;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }, value === 'hard' ? 'easy' : 'hard');
        await expect(selection).toHaveValue(value);
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Space');
        await page.clock.runFor(1000);
        expect(await canvasImage(page)).toBe(frozen);
        await expect(page.locator('#current-difficulty')).toHaveText(`현재 판: ${label}`);
        await page.keyboard.press('p');
      }
    } finally {
      await frameClock.evaluate((sample) => cancelAnimationFrame(sample.request));
      await frameClock.dispose();
    }
    await page.reload();
    await expect(selection).toHaveValue('normal');
    await expect(selection).toBeEnabled();
    await expect(page.locator('#current-difficulty')).toHaveText('현재 판: 시작 전');
    await expect(page.getByRole('status')).toHaveText('시작 대기');
  });
}

test('invalid select changes show an explicit error and preserve selection and scene until corrected', async ({ page }) => {
  const selection = page.getByLabel('다음 판 난이도', { exact: true });
  await selection.selectOption('hard');
  const frozen = await canvasImage(page);
  await selection.evaluate((select) => {
    select.add(new Option('invalid test option', 'invalid'));
    select.value = 'invalid';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    select.querySelector('option[value="invalid"]').remove();
  });
  await expect(page.getByRole('alert')).toContainText('난이도가 올바르지 않습니다.');
  await expect(selection).toHaveValue('hard');
  await expect(page.locator('#current-difficulty')).toHaveText('현재 판: 시작 전');
  await page.clock.runFor(500);
  expect(await canvasImage(page)).toBe(frozen);
  await expect(page.getByRole('alert')).toBeVisible();
  await selection.selectOption('easy');
  await expect(page.getByRole('alert')).toBeHidden();
  await page.getByRole('button', { name: '게임 시작' }).click();
  await expect(page.locator('#current-difficulty')).toHaveText('현재 판: 쉬움');
});

test('title has accessible instructions, ignores gameplay input and starts by button', async ({ page, request }) => {
  await expect(page).toHaveTitle('우주 방어');
  expect((await request.get('/favicon.svg')).status()).toBe(200);
  await expect(page.getByRole('heading', { name: '우주 방어', exact: true })).toBeVisible();
  await expect(page.locator('#controls')).toContainText('A / D');
  await expect(page.getByRole('status')).toHaveText('시작 대기');
  await page.keyboard.press('p');
  await expect(page.getByRole('status')).toHaveText('시작 대기');
  await expect(page.locator('#controls')).toContainText('일시정지/재개: P');
  await expect(page.locator('canvas')).toHaveAttribute('width', '800');
  await expect(page.locator('canvas')).toHaveAttribute('height', '600');
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('Space');
  await page.clock.runFor(320);
  expect((await player(page)).maxX).toBe(-1);
  expect((await bullets(page)).groups).toBe(0);
  await page.getByRole('button', { name: '게임 시작' }).click();
  await page.clock.runFor(100);
  await expect(page.getByRole('button', { name: '게임 시작' })).toBeHidden();
  await expect(page.getByRole('status')).toContainText('진행 중');
  expect((await player(page)).minX).toBe(381);
  expect((await bullets(page)).groups).toBe(0);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('Space');
});

test('Enter starts once; arrows and A/D move, cancel and clamp without resetting', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.clock.runFor(32);
  const initial = await player(page);
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(100);
  const moved = await player(page);
  expect(moved.minX - initial.minX).toBeGreaterThanOrEqual(30);
  expect(moved.minX - initial.minX).toBeLessThanOrEqual(36);
  await page.keyboard.down('a');
  await page.clock.runFor(160);
  expect(await player(page)).toEqual(moved);
  await page.keyboard.up('ArrowRight');
  await page.clock.runFor(2400);
  expect((await player(page)).minX).toBe(1);
  await page.keyboard.up('a');
  await page.keyboard.down('d');
  await page.clock.runFor(2600);
  expect((await player(page)).maxX).toBe(798);
  await page.keyboard.up('d');
  const rightEdge = await player(page);
  await page.keyboard.press('Enter');
  await page.keyboard.press('r');
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter');
  await page.keyboard.up('Enter');
  await page.clock.runFor(100);
  expect(await player(page)).toEqual(rightEdge);
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(100);
  await page.keyboard.up('ArrowLeft');
  expect((await player(page)).minX).toBeLessThan(rightEdge.minX);
});

test('Space fires upward repeatedly with interval and releases without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 700 });
  await page.keyboard.press('Enter');
  await page.clock.runFor(32);
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(1300);
  await page.keyboard.up('ArrowLeft');
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.keyboard.down('Space');
  await page.clock.runFor(16);
  const first = await bullets(page);
  expect(first.groups).toBe(1);
  expect(first.minX).toBe(18);
  expect(first.maxX).toBe(21);
  expect(first.maxY).toBeLessThan(550);
  await page.clock.runFor(160);
  const rising = await bullets(page);
  expect(rising.groups).toBe(1);
  expect(first.minY - rising.minY).toBeGreaterThanOrEqual(90);
  expect(first.minY - rising.minY).toBeLessThanOrEqual(102);
  await page.clock.runFor(64);
  expect((await bullets(page)).groups).toBe(2);
  await page.clock.runFor(400);
  expect((await bullets(page)).groups).toBe(4);
  await page.keyboard.up('Space');
  await page.clock.runFor(1100);
  expect((await bullets(page)).groups).toBe(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
});

test('browser blur and hidden-page events clear held input without pausing', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.clock.runFor(32);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('Space');
  await page.clock.runFor(100);
  const moved = await player(page);
  const shot = await bullets(page);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.clock.runFor(100);
  expect(await player(page)).toEqual(moved);
  expect((await bullets(page)).minY).toBeLessThan(shot.minY);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('Space');
  await page.keyboard.down('d');
  await page.keyboard.down('Space');
  await page.clock.runFor(32);
  const beforeHidden = await player(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
  });
  await page.clock.runFor(1100);
  expect(await player(page)).toEqual(beforeHidden);
  expect((await bullets(page)).groups).toBe(0);
  await expect(page.getByRole('status')).toContainText('진행 중');
  await page.keyboard.up('d');
  await page.keyboard.up('Space');
});

test('repeat Enter is ignored and only current game keys prevent browser defaults', async ({ page }) => {
  const dispatch = (code, repeat = false) => page.evaluate(({ code, repeat }) => {
    const event = new KeyboardEvent('keydown', { code, repeat, bubbles: true, cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  }, { code, repeat });
  expect(await dispatch('Enter', true)).toBe(true);
  await expect(page.getByRole('status')).toHaveText('시작 대기');
  expect(await dispatch('KeyA')).toBe(false);
  expect(await dispatch('KeyZ')).toBe(false);
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('다음 판 난이도', { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '게임 시작' })).toBeFocused();
  await page.keyboard.press('Enter');
  for (const code of ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space']) {
    expect(await dispatch(code)).toBe(true);
  }
  expect(await dispatch('KeyZ')).toBe(false);
  expect(await dispatch('Enter')).toBe(false);
  expect(await dispatch('KeyR')).toBe(false);
});

test('formation moves right, reverses with a drop, and real hits change score and pixels', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expectFreshGame(page);
  await page.clock.runFor(32);
  const initial = await enemies(page);
  await page.clock.runFor(1000);
  const moved = await enemies(page);
  expect(moved.minX - initial.minX).toBeGreaterThanOrEqual(63);
  expect(moved.minX - initial.minX).toBeLessThanOrEqual(65);
  expect(moved.minY).toBe(72);
  await page.clock.runFor(1300);
  const dropped = await enemies(page);
  expect(dropped.minY).toBe(96);
  await page.clock.runFor(100);
  expect((await enemies(page)).minX).toBeLessThan(dropped.minX);
  await page.keyboard.down('Space');
  await page.clock.runFor(1500);
  await page.keyboard.up('Space');
  expect(Number(await page.locator('#score').innerText())).toBeGreaterThan(0);
  expect((await enemies(page)).count).toBeLessThan(dropped.count);
});

test('natural defeat freezes the canvas and supports repeated fresh restarts by R and button', async ({ page }) => {
  test.setTimeout(120_000);
  await page.keyboard.press('Enter');
  await page.clock.runFor(54_000);
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(1000);
  await expect(page.getByRole('heading', { name: '패배', exact: true })).toBeVisible();
  await expect(page.locator('#result-description')).toHaveText('적이 방어선에 도달했습니다.');
  await expect(page.locator('#score')).toHaveText('0');
  const frozen = await canvasImage(page);
  await page.keyboard.press('p');
  await expect(page.getByRole('status')).toContainText('패배');
  await page.keyboard.down('Space');
  await page.clock.runFor(1000);
  expect(await canvasImage(page)).toBe(frozen);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', {
    code: 'KeyR', repeat: true, bubbles: true, cancelable: true,
  })));
  await expect(page.getByRole('heading', { name: '패배', exact: true })).toBeVisible();
  const selection = page.getByLabel('다음 판 난이도', { exact: true });
  await expect(selection).toBeEnabled();
  await selection.selectOption('hard');
  await expect(page.locator('#current-difficulty')).toHaveText('현재 판: 보통');
  expect(await canvasImage(page)).toBe(frozen);
  await page.locator('canvas').focus();
  await page.keyboard.press('r');
  await expectFreshGame(page);
  await expect(page.locator('#current-difficulty')).toHaveText('현재 판: 어려움');
  await expect(selection).toBeDisabled();
  await page.clock.runFor(100);
  expect((await player(page)).minX).toBe(381);
  expect((await bullets(page)).groups).toBe(0);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('Space');
  await page.clock.runFor(55_000);
  await expect(page.getByRole('heading', { name: '패배', exact: true })).toBeVisible();
  await selection.selectOption('easy');
  await expect(page.locator('#current-difficulty')).toHaveText('현재 판: 어려움');
  await page.locator('canvas').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '다시 시작' })).toBeFocused();
  await page.getByRole('button', { name: '다시 시작' }).click();
  await expectFreshGame(page);
  await expect(selection).toHaveValue('easy');
  await expect(page.locator('#current-difficulty')).toHaveText('현재 판: 쉬움');
  const frameClock = await observeFrameClock(page);
  try {
    await page.clock.runFor(32);
    const initial = await player(page);
    const start = await frameClock.evaluate((sample) => sample.time);
    await page.keyboard.down('d');
    await page.keyboard.down('Space');
    await page.clock.runFor(100);
    await page.keyboard.up('d');
    await page.keyboard.up('Space');
    const end = await frameClock.evaluate((sample) => sample.time);
    const moved = await player(page);
    // A clock interval can straddle different animation-frame boundaries.
    const expectedTravel = 320 * (end - start) / 1000;
    expect(end).toBeGreaterThan(start);
    expect(moved.minX - initial.minX).toBeGreaterThanOrEqual(Math.floor(expectedTravel));
    expect(moved.minX - initial.minX).toBeLessThanOrEqual(Math.ceil(expectedTravel));
    expect((await bullets(page)).groups).toBe(1);
  } finally {
    await frameClock.evaluate((sample) => cancelAnimationFrame(sample.request));
    await frameClock.dispose();
  }
});

test('natural firing sweep wins, freezes remaining bullets, and restarts with clean score and input', async ({ page }) => {
  test.setTimeout(120_000);
  await page.getByRole('button', { name: '게임 시작' }).click();
  await page.clock.runFor(32);
  await page.keyboard.down('Space');
  for (let turn = 0; turn < 20; turn++) {
    const direction = turn % 2 === 0 ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.down(direction);
    await page.clock.runFor(3000);
    await page.keyboard.up(direction);
    if (await page.getByRole('button', { name: '다시 시작' }).isVisible()) break;
  }
  await expect(page.getByRole('heading', { name: '승리!', exact: true })).toBeVisible();
  await expect(page.locator('#result-description')).toHaveText('모든 적을 제거했습니다.');
  await expect(page.locator('#score')).toHaveText('240');
  expect((await enemies(page)).count).toBe(0);
  const frozen = await canvasImage(page);
  await page.keyboard.press('p');
  await expect(page.getByRole('status')).toContainText('승리');
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(2000);
  expect(await canvasImage(page)).toBe(frozen);
  await expect(page.locator('#score')).toHaveText('240');
  const selection = page.getByLabel('다음 판 난이도', { exact: true });
  await expect(selection).toBeEnabled();
  await selection.selectOption('easy');
  await expect(page.locator('#current-difficulty')).toHaveText('현재 판: 보통');
  expect(await canvasImage(page)).toBe(frozen);
  await page.getByRole('button', { name: '다시 시작' }).click();
  await expectFreshGame(page);
  await expect(page.locator('#current-difficulty')).toHaveText('현재 판: 쉬움');
  await expect(selection).toBeDisabled();
  await page.clock.runFor(100);
  expect((await player(page)).minX).toBe(381);
  expect((await bullets(page)).groups).toBe(0);
  await page.keyboard.up('Space');
  await page.keyboard.up('ArrowLeft');
});

test('P freezes the entire scene and score, ignores repeats and preserves paused input rules', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.clock.runFor(32);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('Space');
  await page.clock.runFor(100);
  await page.keyboard.down('p');
  const frozen = await canvasImage(page);
  const score = await page.locator('#score').textContent();
  expect((await bullets(page)).groups).toBe(1);
  await expect(page.getByRole('status')).toHaveText('일시정지 · P로 재개하세요.');
  await page.keyboard.down('p');
  await page.clock.runFor(2000);
  expect(await canvasImage(page)).toBe(frozen);
  await page.keyboard.up('p');
  await page.keyboard.press('Enter');
  await page.keyboard.press('r');
  const scroll = await page.evaluate(() => window.scrollY);
  const prevented = await page.evaluate(() => {
    return ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'KeyP', 'KeyZ'].map((code) => {
      const event = new KeyboardEvent('keydown', { code, repeat: true, cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });
  });
  expect(prevented).toEqual([true, true, true, true, true, true, false]);
  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
  });
  await page.clock.runFor(30_000);
  expect(await canvasImage(page)).toBe(frozen);
  await expect(page.locator('#score')).toHaveText(score);
  await expect(page.getByRole('status')).toContainText('일시정지');
  expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
  await page.keyboard.down('p');
  await expect(page.getByRole('status')).toContainText('진행 중');
  await page.keyboard.down('p');
  await expect(page.getByRole('status')).toContainText('진행 중');
  await page.keyboard.up('p');
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('Space');
});

test('pause transitions discard held and paused-only input even when keys repeat after resume', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.clock.runFor(32);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('Space');
  await page.clock.runFor(80);
  await page.keyboard.press('p');
  const stopped = await player(page);
  await page.keyboard.down('a');
  await page.clock.runFor(500);
  await page.keyboard.press('p');
  for (const key of ['ArrowRight', 'Space', 'a']) await page.keyboard.down(key);
  await page.clock.runFor(1100);
  expect(await player(page)).toEqual(stopped);
  expect((await bullets(page)).groups).toBe(0);
  for (const key of ['ArrowRight', 'Space', 'a']) await page.keyboard.up(key);
  await page.keyboard.down('a');
  await page.keyboard.down('Space');
  await page.clock.runFor(100);
  expect((await player(page)).minX).toBeLessThan(stopped.minX);
  expect((await bullets(page)).groups).toBe(1);
  await page.keyboard.up('a');
  await page.keyboard.up('Space');
});

test('repeated P resumes reset the first frame and retain normal movement and firing speed', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.clock.runFor(32);
  const frameClock = await observeFrameClock(page);
  try {
    for (let cycle = 0; cycle < 5; cycle++) {
      await page.keyboard.press('p');
      await page.clock.runFor(503);
      const frozen = await canvasImage(page);
      await page.keyboard.press('p');
      const firstFrame = await page.evaluateHandle(() => {
        const sample = { image: null };
        requestAnimationFrame(() => {
          sample.image = document.querySelector('canvas').toDataURL();
        });
        return sample;
      });
      await page.clock.runFor(16);
      expect(await firstFrame.evaluate((sample) => sample.image)).toBe(frozen);
      await firstFrame.dispose();
      await page.clock.runFor(32);
      const initialPlayer = await player(page);
      const initialEnemies = await enemies(page);
      const start = await frameClock.evaluate((sample) => sample.time);
      await page.keyboard.down('d');
      await page.clock.runFor(100);
      await page.keyboard.up('d');
      const end = await frameClock.evaluate((sample) => sample.time);
      const dt = (end - start) / 1000;
      for (const [actual, expected] of [
        [(await player(page)).minX - initialPlayer.minX, 320 * dt],
        [(await enemies(page)).minX - initialEnemies.minX, 64 * dt],
      ]) {
        expect(actual).toBeGreaterThanOrEqual(Math.floor(expected));
        expect(actual).toBeLessThanOrEqual(Math.ceil(expected));
      }
    }
    await page.keyboard.down('ArrowLeft');
    await page.clock.runFor(2000);
    await page.keyboard.up('ArrowLeft');
    await page.keyboard.press('p');
    await page.clock.runFor(2000);
    await page.keyboard.press('p');
    await page.clock.runFor(32);
    await page.keyboard.down('Space');
    await page.clock.runFor(16);
    const first = await bullets(page);
    expect(first.groups).toBe(1);
    const start = await frameClock.evaluate((sample) => sample.time);
    await page.clock.runFor(160);
    const rising = await bullets(page);
    const end = await frameClock.evaluate((sample) => sample.time);
    expect(rising.groups).toBe(1);
    const travel = 600 * (end - start) / 1000;
    expect(first.minY - rising.minY).toBeGreaterThanOrEqual(Math.floor(travel));
    expect(first.minY - rising.minY).toBeLessThanOrEqual(Math.ceil(travel));
    await page.clock.runFor(64);
    expect((await bullets(page)).groups).toBe(2);
    await page.keyboard.up('Space');
  } finally {
    await frameClock.evaluate((sample) => cancelAnimationFrame(sample.request));
    await frameClock.dispose();
  }
});
