import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
await mkdir('.cache/tmp', { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  env: { ...process.env, TMPDIR: path.resolve('.cache/tmp') },
  args: ['--disable-crash-reporter', '--disable-breakpad'],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  reducedMotion: 'reduce',
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`${page.url()}: ${m.text()}`);
});
await page.goto('http://localhost:3000/review');
await page.getByTestId('autonomy').filter({ hasText: '68%' }).waitFor();
await page.screenshot({ path: 'docs/review.png', fullPage: true });
await page.getByRole('button', { name: 'Approve action', exact: true }).click();
assert.match(await page.getByRole('tab', { name: /Decided/ }).innerText(), /1/);
await page.getByRole('button', { name: 'Undo last decision' }).click();
await page.getByRole('button', { name: 'Policy settings' }).click();
const slider = page.getByRole('slider', { name: 'Review threshold' });
await slider.focus();
for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
assert.match(await page.getByTestId('autonomy').innerText(), /76%/);
await page.getByRole('button', { name: 'Close', exact: true }).click();
await page.keyboard.press('Meta+k');
await page.getByRole('dialog', { name: 'Commands' }).waitFor();
await page.getByText('Jump to blocked', { exact: true }).click();
assert.equal(await page.getByRole('button', { name: 'Approve action', exact: true }).count(), 0);
await page.goto('http://localhost:3000/review');
await page.getByRole('button', { name: 'Edit & approve', exact: true }).click();
await page.getByLabel('Email draft').fill('Hi Maya, let us discuss the annual plan on Thursday.');
await page.getByRole('button', { name: 'Save & approve' }).click();
assert.match(await page.getByTestId('audit').innerText(), /1 field changed/);
await page.getByRole('button', { name: 'Reject action', exact: true }).click();
const dialog = page.getByRole('dialog', { name: 'Reject this action' });
assert.equal(
  await dialog.getByRole('button', { name: 'Reject action', exact: true }).isDisabled(),
  true,
);
await dialog.getByLabel('Reason').fill('Confirm intent with the account owner.');
await dialog.getByRole('button', { name: 'Reject action', exact: true }).click();
assert.match(await page.getByTestId('audit').innerText(), /Confirm intent/);
await expect(page.getByRole('checkbox')).toHaveCount(7);
for (const box of (await page.getByRole('checkbox').all()).slice(0, 3)) await box.click();
await page.getByRole('button', { name: /Approve selected/ }).click();
assert.match(await page.getByRole('tab', { name: /Decided/ }).innerText(), /5/);
for (const route of ['review', 'story']) {
  await page.goto(`http://localhost:3000/${route}`);
  for (const width of [320, 375, 414, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: innerWidth,
    }));
    assert.ok(sizes.scroll <= sizes.width, `${route} overflow at ${width}: ${sizes.scroll}`);
    if (width === 375) await page.screenshot({ path: `docs/${route}-mobile.png`, fullPage: true });
  }
  if (route === 'story') {
    for (const label of [
      'The company',
      'The permission problem',
      'Before and after',
      'The decision',
      'How it works',
      'The impact',
    ])
      assert.equal(await page.getByRole('region', { name: label, exact: true }).count(), 1);
    await page.screenshot({ path: 'docs/story.png', fullPage: true });
  }
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await page.screenshot({ path: `docs/${route}-dark.png`, fullPage: true });
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
}
await page.emulateMedia({ reducedMotion: 'no-preference' });
await page.goto('http://localhost:3000/story');
await page.getByRole('region', { name: 'The impact', exact: true }).scrollIntoViewIfNeeded();
await page.waitForFunction(
  () => document.querySelector('[data-testid="autonomy"]')?.textContent.includes('76%'),
  {},
  { timeout: 15000 },
);
const response = await page.request.get('http://localhost:3000/api/actions?threshold=50');
const data = await response.json();
assert.equal(data.filter((x) => x.result.tier === 'auto').length, 26);
assert.deepEqual(errors, []);
await browser.close();
console.log(
  'Browser smoke passed: review interactions, policy slider, command palette, six story sections, motion, dark mode, six viewport widths, no console errors, and scored API.',
);
