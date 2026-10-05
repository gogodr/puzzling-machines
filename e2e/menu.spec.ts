import { expect, test } from '@playwright/test'

test('menu locks later scenes until the previous one is completed', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await expect(page.getByRole('heading', { name: 'Puzzling Machines' })).toBeVisible()
  await page.getByTestId('menu-play').click()
  await expect(page.getByTestId('play-first-steps')).toBeEnabled()
  await expect(page.getByTestId('play-up-the-wall')).toBeDisabled()
  await expect(page.getByTestId('play-the-gap')).toBeDisabled()

  await page.evaluate(() => {
    localStorage.setItem(
      'pm.progress.v1',
      JSON.stringify({ completed: ['first-steps'], onboardingDone: true }),
    )
  })
  await page.reload()
  await page.getByTestId('menu-play').click()
  await expect(page.getByTestId('play-up-the-wall')).toBeEnabled()
  await page.getByTestId('play-up-the-wall').click()
  await expect(page.getByRole('heading', { name: /Up the Wall/ })).toBeVisible()
})
