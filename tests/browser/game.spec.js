import { expect, test } from '@playwright/test';

async function pixels(page, color) {
  return page.locator('canvas').evaluate((canvas, rgb) => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width;
    let maxX = -1;
    let minY = canvas.height;
    let maxY = -1;
    const rows = new Set();
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (data[i] === rgb[0] && data[i + 1] === rgb[1] && data[i + 2] === rgb[2]) {
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
    return { minX, maxX, minY, maxY, groups };
  }, color);
}

const player = (page) => pixels(page, [97, 230, 196]);
const bullets = (page) => pixels(page, [255, 223, 128]);

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

test('title has accessible instructions, ignores gameplay input and starts by button', async ({ page, request }) => {
  await expect(page).toHaveTitle('우주 방어');
  expect((await request.get('/favicon.svg')).status()).toBe(200);
  await expect(page.getByRole('heading', { name: '우주 방어', exact: true })).toBeVisible();
  await expect(page.locator('#controls')).toContainText('A / D');
  await expect(page.getByRole('status')).toHaveText('시작 대기');
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
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.keyboard.down('Space');
  await page.clock.runFor(16);
  const first = await bullets(page);
  expect(first.groups).toBe(1);
  expect(first.minX).toBe(398);
  expect(first.maxX).toBe(401);
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
  await expect(page.getByRole('button', { name: '게임 시작' })).toBeFocused();
  await page.keyboard.press('Enter');
  for (const code of ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space']) {
    expect(await dispatch(code)).toBe(true);
  }
  expect(await dispatch('KeyZ')).toBe(false);
  expect(await dispatch('Enter')).toBe(false);
  expect(await dispatch('KeyR')).toBe(false);
});
