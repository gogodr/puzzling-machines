import { expect, test, type Page } from '@playwright/test'
import type { Vec2 } from '@shared/math'
import { ROTATION_STEP } from '../src/game/build/placement'
import { computeOrthoFraming } from '../src/game/render/framing'
import { firstSteps } from '../src/game/scenes/01-first-steps'
import { CAMERA_PADDING, frameBounds, traySlotCenter } from '../src/game/ui/layout'

const scene = firstSteps
const GOLDEN_SCORE = 297

/** Maps world coordinates to page pixels using the same framing as the game camera. */
async function worldToScreen(page: Page) {
  const box = (await page.locator('canvas').boundingBox())!
  const { zoom, center } = computeOrthoFraming(frameBounds(scene), box, CAMERA_PADDING)
  return ([x, y]: Vec2): Vec2 => [
    box.x + box.width / 2 + (x - center[0]) * zoom,
    box.y + box.height / 2 - (y - center[1]) * zoom,
  ]
}

async function drag(page: Page, from: Vec2, to: Vec2) {
  await page.mouse.move(...from)
  await page.mouse.down()
  await page.mouse.move(...to, { steps: 12 })
  await page.mouse.up()
}

test('solve Scene 1 with the reference solution and reach the leaderboard', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByTestId('menu-play').click()
  await page.getByTestId('play-first-steps').click()
  await expect(page.getByRole('heading', { name: /First Steps/ })).toBeVisible()
  await page.waitForTimeout(1500)

  const toScreen = await worldToScreen(page)
  for (const item of scene.referenceSolution) {
    const slot = scene.inventory.findIndex((e) => e.type === item.type)
    await drag(
      page,
      toScreen(traySlotCenter(scene.bounds, slot, scene.inventory.length)),
      toScreen(item.position),
    )
    const turns = Math.round(item.angle / ROTATION_STEP)
    for (let i = 0; i < Math.abs(turns); i++) await page.keyboard.press(turns < 0 ? 'r' : 'Shift+R')
  }

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pm.layouts.v1') ?? '{}'))
  const strip = (items: { type: string; position: Vec2; angle: number }[]) =>
    items.map(({ type, position, angle }) => ({ type, position, angle: Number(angle.toFixed(6)) }))
  expect(strip(saved[scene.id])).toEqual(strip(scene.referenceSolution))

  await page.keyboard.press('Space')
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Machine complete!' })).toBeVisible({ timeout: 30_000 })
  await expect(dialog.getByText(String(GOLDEN_SCORE), { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Keep building' }).click()
  await page.keyboard.press('Space')
  await expect(page.getByRole('dialog').getByText(String(GOLDEN_SCORE), { exact: true })).toBeVisible({
    timeout: 30_000,
  })

  await dialog.getByLabel(/your name/i).fill('Ana')
  await page.keyboard.press('Enter')
  await expect(dialog.getByRole('row', { name: /Ana\s+297/ })).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: 'Leaderboards' }).click()
  await page.getByTestId('board-first-steps').click()
  await expect(page.getByRole('row', { name: /Ana\s+297/ })).toBeVisible()
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('pm.layouts.v1') ?? '{}'))
  expect(restored[scene.id]).toHaveLength(scene.referenceSolution.length)
})
