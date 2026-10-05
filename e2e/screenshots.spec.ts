import { test, type Page } from '@playwright/test'
import type { Vec2 } from '@shared/math'
import { ROTATION_STEP } from '../src/game/build/placement'
import { computeOrthoFraming } from '../src/game/render/framing'
import { SCENES } from '../src/game/scenes/registry'
import type { SceneDefinition } from '../src/game/scenes/schema'
import { CAMERA_PADDING, frameBounds, traySlotCenter } from '../src/game/ui/layout'

/** Documentation screenshots, not a check: `SCREENSHOTS=1 npx playwright test screenshots`. */
test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to capture docs/ screenshots')

const OUT = process.env.SCREENSHOTS_PREFIX ?? 'docs/screenshots/phase-4'

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}-${name}.jpg`, type: 'jpeg', quality: 82 })

async function placeReference(page: Page, scene: SceneDefinition) {
  const box = (await page.locator('canvas').boundingBox())!
  const { zoom, center } = computeOrthoFraming(frameBounds(scene), box, CAMERA_PADDING)
  const toScreen = ([x, y]: Vec2): Vec2 => [
    box.x + box.width / 2 + (x - center[0]) * zoom,
    box.y + box.height / 2 - (y - center[1]) * zoom,
  ]
  for (const item of scene.referenceSolution) {
    const slot = scene.inventory.findIndex((e) => e.type === item.type)
    await page.mouse.move(...toScreen(traySlotCenter(scene.bounds, slot, scene.inventory.length)))
    await page.mouse.down()
    await page.mouse.move(...toScreen(item.position), { steps: 12 })
    await page.mouse.up()
    const turns = Math.round(item.angle / ROTATION_STEP)
    for (let i = 0; i < Math.abs(turns); i++) await page.keyboard.press(turns < 0 ? 'r' : 'Shift+R')
  }
}

test('capture scene screenshots', async ({ page }) => {
  test.setTimeout(300_000)
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem(
      'pm.settings.v1',
      JSON.stringify({ sound: false, reducedMotion: false, cameraFollow: false, unlockAll: true }),
    )
  })
  await page.reload()
  await shot(page, 'menu')
  await page.getByTestId('menu-play').click()
  await page.waitForTimeout(500)
  await shot(page, 'select')

  for (const scene of SCENES.filter((s) => !s.dev)) {
    await page.getByTestId(`play-${scene.id}`).click()
    await page.waitForTimeout(2000)
    await placeReference(page, scene)
    await page.mouse.move(5, 5)
    await shot(page, `${scene.id}-build`)
    await page.keyboard.press('Space')
    await page.waitForTimeout(1800)
    await shot(page, `${scene.id}-run`)
    await page.getByRole('dialog').waitFor({ timeout: 40_000 })
    await page.waitForTimeout(600)
    await shot(page, `${scene.id}-result`)
    await page.reload()
    await page.getByTestId('menu-play').click()
  }
})
