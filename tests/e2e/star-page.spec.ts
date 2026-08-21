import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '书签栏' })).toBeVisible()
})

test('search prototype gives visible feedback', async ({ page }) => {
  const search = page.getByPlaceholder('搜索书签或网页…')
  await search.fill('Vue 3')
  await search.press('Enter')
  await expect(page.getByRole('status')).toContainText('原型模式')
})

test('searches bookmarks without overriding the default Enter behavior', async ({ page }) => {
  const search = page.getByPlaceholder('搜索书签或网页…')
  await search.fill('Vue')

  const option = page.getByRole('option', { name: /Vue\.js/ })
  await expect(option).toBeVisible()
  await expect(option).toHaveAttribute('href', 'https://vuejs.org')
  await expect(option.locator('mark')).toHaveText(['Vue', 'vue'])
  await expect(option).toContainText('书签栏 / 开发工具')
  await expect(search).not.toHaveAttribute('aria-activedescendant')

  await search.press('Enter')
  await expect(page.getByRole('status')).toContainText('浏览器默认搜索“Vue”')

  await page.evaluate(() => {
    document.addEventListener(
      'click',
      (event) => {
        const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('.search-suggestion')
        if (!link) return
        event.preventDefault()
        ;(window as typeof window & { openedBookmark?: string }).openedBookmark = link.href
      },
      true,
    )
  })

  await search.fill('Vue.js')
  await search.press('ArrowDown')
  await expect(search).toHaveAttribute('aria-activedescendant', 'bookmark-search-option-0')
  await search.press('Enter')
  await expect.poll(() => page.evaluate(() => (window as typeof window & { openedBookmark?: string }).openedBookmark))
    .toBe('https://vuejs.org/')
})

test('switches the search engine and restores it after reload', async ({ page }) => {
  await page.getByRole('button', { name: '搜索引擎：浏览器默认' }).click()
  await expect(page.getByRole('listbox', { name: '选择搜索引擎' })).toBeVisible()
  await page.getByRole('option', { name: /Bing/ }).click()

  await expect(page.getByRole('button', { name: '搜索引擎：Bing' })).toBeVisible()
  const search = page.getByPlaceholder('搜索书签或网页…')
  await search.fill('星页')
  await search.press('Enter')
  await expect(page.getByRole('status')).toContainText('使用Bing搜索“星页”')

  await page.reload()
  await expect(page.getByRole('button', { name: '搜索引擎：Bing' })).toBeVisible()
})

test('links bookmark search to the 3D sphere and restores the view after clearing', async ({ page }) => {
  await page.getByRole('button', { name: '切换到 3D 星球布局' }).click()
  const sphere = page.getByRole('region', { name: '可旋转和缩放的书签星球' })
  const search = page.getByPlaceholder('搜索书签或网页…')
  const vueNode = page.getByRole('link', { name: '打开书签 Vue.js' })

  await search.fill('Vue')
  await expect(page.getByText('星图定位')).toBeVisible()
  await expect(vueNode).toHaveClass(/constellation-node--search-focus/)
  await expect(sphere.locator('output')).toHaveText('152%')

  await expect(sphere).toHaveAttribute('data-search-camera', 'focused', { timeout: 5000 })
  const [sphereBox, nodeBox] = await Promise.all([sphere.boundingBox(), vueNode.boundingBox()])
  expect(sphereBox).not.toBeNull()
  expect(nodeBox).not.toBeNull()
  expect(Math.abs((nodeBox!.x + nodeBox!.width / 2) - (sphereBox!.x + sphereBox!.width / 2))).toBeLessThan(28)
  expect(Math.abs((nodeBox!.y + nodeBox!.height / 2) - (sphereBox!.y + sphereBox!.height / 2))).toBeLessThan(28)

  await search.fill('V')
  await search.press('ArrowDown')
  await search.press('ArrowDown')
  const viteNode = page.getByRole('link', { name: '打开书签 Vite' })
  await expect(viteNode).toHaveClass(/constellation-node--search-focus/)
  await expect(vueNode).not.toHaveClass(/constellation-node--search-focus/)
  await expect(page.locator('.constellation-search-status strong')).toHaveText('Vite')

  await search.fill('')
  await expect(page.getByText('星图定位')).toBeHidden()
  await expect(vueNode).not.toHaveClass(/constellation-node--search-focus/)
  await expect(sphere.locator('output')).toHaveText('118%')

  await search.fill('GitLab')
  const temporaryNode = page.getByRole('link', { name: '打开书签 GitLab' })
  await expect(temporaryNode).toHaveAttribute('data-constellation-node-id', 'search:node:118')
  await expect(temporaryNode).toHaveClass(/constellation-node--search-focus/)
  await expect(sphere).toHaveAttribute('data-search-camera', 'focused', { timeout: 5000 })
})

test('blocks the context menu, page text selection and element dragging', async ({ page }) => {
  const result = await page.evaluate(() => {
    const target = document.querySelector('.brand')!
    const search = document.querySelector('input[type="search"]')!
    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    const pageSelectionEvent = new Event('selectstart', { bubbles: true, cancelable: true })
    const inputSelectionEvent = new Event('selectstart', { bubbles: true, cancelable: true })
    const dragEvent = new DragEvent('dragstart', { bubbles: true, cancelable: true })

    target.dispatchEvent(contextMenuEvent)
    target.dispatchEvent(pageSelectionEvent)
    search.dispatchEvent(inputSelectionEvent)
    target.dispatchEvent(dragEvent)

    return {
      contextMenuBlocked: contextMenuEvent.defaultPrevented,
      pageSelectionBlocked: pageSelectionEvent.defaultPrevented,
      inputSelectionAllowed: !inputSelectionEvent.defaultPrevented,
      dragBlocked: dragEvent.defaultPrevented,
    }
  })

  expect(result).toEqual({
    contextMenuBlocked: true,
    pageSelectionBlocked: true,
    inputSelectionAllowed: true,
    dragBlocked: true,
  })
})

test('opens a folder, navigates deeper and closes it', async ({ page }) => {
  await page.getByRole('button', { name: '打开文件夹 开发工具' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('button', { name: '打开文件夹 代码仓库' })).toBeVisible()
  await page.getByRole('button', { name: '打开文件夹 代码仓库' }).click()
  await expect(page.getByRole('button', { name: '代码仓库' })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('button', { name: '关闭文件夹' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('changes background and display preferences', async ({ page }) => {
  await page.getByRole('button', { name: '打开设置' }).click()
  await expect(page.getByRole('heading', { name: '星页设置' })).toBeVisible()

  await page.getByRole('button', { name: /紫曜轨道/ }).click()
  await expect(page.locator('.star-background')).toHaveClass(/background--violet-orbit/)

  await page.getByText('显示秒数', { exact: true }).click()
  await expect(page.locator('.clock__seconds')).toHaveCount(0)
  await expect(page.getByText('设置已保存到本机')).toBeVisible()

  await page.reload()
  await expect(page.locator('.star-background')).toHaveClass(/background--violet-orbit/)
  await expect(page.locator('.clock__seconds')).toHaveCount(0)
})

test('reorders selected bookmark groups and restores the order after reload', async ({ page }) => {
  await page.getByRole('button', { name: '打开设置' }).click()
  await page.getByRole('checkbox', { name: /开发工具/ }).check()
  await page.getByRole('checkbox', { name: /设计灵感/ }).check()

  await page.getByRole('button', { name: '上移分组 设计灵感' }).click()
  await expect(page.locator('.folder-order__title')).toHaveText(['书签栏', '设计灵感', '开发工具'])
  await expect(page.getByText('设置已保存到本机')).toBeVisible()
  await page.getByRole('button', { name: '关闭设置' }).click()

  await expect(page.locator('.bookmark-section h2')).toHaveText(['书签栏', '设计灵感', '开发工具'])
  await page.reload()
  await expect(page.locator('.bookmark-section h2')).toHaveText(['书签栏', '设计灵感', '开发工具'])
})

test('renders a visibly changing animated star layer for every background', async ({ page }) => {
  const canvas = page.locator('.star-background__canvas')
  await expect(canvas).toHaveAttribute('data-animated', 'true')
  await page.getByRole('button', { name: '打开设置' }).click()

  for (const name of ['星河流尘', '流星夜', '靛蓝星云', '紫曜轨道', '月海薄雾', '蓝星地平线']) {
    await page.getByRole('button', { name: new RegExp(name) }).click()
    await page.waitForTimeout(80)
    const before = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())
    await page.waitForTimeout(420)
    const after = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())

    expect(after, `${name} should animate`).not.toBe(before)
  }
})
