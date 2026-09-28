import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '书签栏' })).toBeVisible()
})

test('keeps the bookmark heading and add button on one row', async ({ page }) => {
  const heading = page.getByRole('heading', { name: '书签栏' })
  const addButton = page.getByRole('button', { name: '在书签栏新增书签' })
  const [headingBox, addBox] = await Promise.all([heading.boundingBox(), addButton.boundingBox()])

  expect(headingBox).not.toBeNull()
  expect(addBox).not.toBeNull()
  expect(headingBox!.x + headingBox!.width).toBeLessThanOrEqual(addBox!.x)
  expect(Math.abs((headingBox!.y + headingBox!.height / 2) - (addBox!.y + addBox!.height / 2))).toBeLessThan(2)
})

for (const width of [320, 390]) {
  test(`keeps every bookmark card clickable without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.evaluate(() => {
      document.addEventListener(
        'click',
        (event) => {
          const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a.bookmark-tile')
          if (!link) return
          event.preventDefault()
          ;(window as typeof window & { openedBookmark?: string }).openedBookmark = link.href
        },
        true,
      )
    })

    const cards = page.locator('.bookmark-dashboard .bookmark-tile')
    await expect(cards).toHaveCount(10)
    for (const card of await cards.all()) {
      await card.scrollIntoViewIfNeeded()
      const box = await card.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width)
      expect(box!.height).toBeGreaterThanOrEqual(44)

      const href = await card.getAttribute('href')
      await card.click()
      if (href) {
        await expect.poll(() => page.evaluate(() => (window as typeof window & { openedBookmark?: string }).openedBookmark))
          .toBe(new URL(href).href)
      } else {
        await expect(page.getByRole('dialog')).toBeVisible()
        await page.getByRole('button', { name: '关闭文件夹' }).click()
        await expect(page.getByRole('dialog')).toBeHidden()
      }
    }

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(hasHorizontalOverflow).toBe(false)
  })
}

test('search prototype gives visible feedback', async ({ page }) => {
  const search = page.getByPlaceholder('搜索书签或网页…')
  await search.fill('Vue 3')
  await search.press('Enter')
  await expect(page.getByRole('status')).toContainText('原型模式')
})

test('opens a typed URL directly instead of searching it', async ({ page }) => {
  await page.evaluate(() => {
    document.addEventListener(
      'click',
      (event) => {
        const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('.search-bar__direct-link')
        if (!link) return
        event.preventDefault()
        ;(window as typeof window & { openedDirectUrl?: string }).openedDirectUrl = link.href
      },
      true,
    )
  })

  const search = page.getByPlaceholder('搜索书签或网页…')
  await search.fill('example.com/docs?q=1')
  await expect(page.getByRole('button', { name: /直接访问 https:\/\/example\.com/ })).toBeVisible()
  await search.press('Enter')
  await expect.poll(() => page.evaluate(() => (window as typeof window & { openedDirectUrl?: string }).openedDirectUrl))
    .toBe('https://example.com/docs?q=1')
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

test('enables Chrome configuration sync and restores the preference', async ({ page }) => {
  await page.getByRole('button', { name: '打开设置' }).click()
  const syncToggle = page.getByRole('checkbox', { name: /Chrome 配置同步/ })
  await page.locator('label.setting-row').filter({ hasText: 'Chrome 配置同步' }).click()
  await expect(syncToggle).toBeChecked()
  await expect(page.getByText('显示设置已同步，分组保存在本机')).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: '打开设置' }).click()
  await expect(page.getByRole('checkbox', { name: /Chrome 配置同步/ })).toBeChecked()
})

test('restores legacy sphere settings as a bookmark grid without losing preferences', async ({ page }) => {
  await page.evaluate(() => {
    const settings = JSON.parse(localStorage.getItem('star-page:settings')!)
    localStorage.setItem('star-page:settings', JSON.stringify({
      ...settings,
      bookmarkLayout: 'constellation',
      visibleFolderIds: ['1', '120'],
      backgroundId: 'violet-orbit',
      showSeconds: false,
    }))
  })
  await page.reload()

  await expect(page.locator('.bookmark-section h2')).toHaveText(['书签栏', '设计灵感'])
  await expect(page.getByRole('link', { name: '打开 Dribbble' })).toHaveAttribute('href', 'https://dribbble.com')
  await expect(page.getByRole('button', { name: /3D 星球/ })).toHaveCount(0)
  await expect(page.getByRole('region', { name: '可旋转和缩放的书签星球' })).toHaveCount(0)
  await expect(page.locator('.star-background')).toHaveClass(/background--violet-orbit/)
  await expect(page.locator('.clock__seconds')).toHaveCount(0)

  await page.getByRole('button', { name: '打开设置' }).click()
  await page.getByText('显示秒数', { exact: true }).click()
  await expect(page.getByText('设置已保存到本机')).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('star-page:settings')!).bookmarkLayout)).toBe('grid')
})

test('opens a custom context menu for bookmarks and folders', async ({ page }) => {
  await page.getByRole('link', { name: '打开 GitHub' }).first().click({ button: 'right' })
  const bookmarkMenu = page.getByRole('menu', { name: 'GitHub 操作菜单' })
  await expect(bookmarkMenu).toBeVisible()
  await expect(bookmarkMenu.getByRole('menuitem', { name: '在当前标签页打开' })).toHaveAttribute('href', 'https://github.com')
  await expect(bookmarkMenu.getByRole('menuitem', { name: '在新标签页打开' })).toHaveAttribute('target', '_blank')
  await expect(bookmarkMenu.getByRole('menuitem', { name: '复制链接' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(bookmarkMenu).toBeHidden()

  await page.getByRole('button', { name: '打开文件夹 开发工具' }).click({ button: 'right' })
  const folderMenu = page.getByRole('menu', { name: '开发工具 操作菜单' })
  await expect(folderMenu.getByRole('menuitem', { name: '打开文件夹' })).toBeVisible()
})

test('creates, edits and deletes a bookmark', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 580 })
  await page.getByRole('button', { name: '在书签栏新增书签' }).click()
  const createDialog = page.getByRole('dialog', { name: '新增书签' })
  await createDialog.getByLabel('名称').fill('Example Site')
  await createDialog.getByLabel('网址').fill('example.com/docs')
  await createDialog.getByRole('button', { name: '新增书签' }).click()

  const createdBookmark = page.getByRole('link', { name: '打开 Example Site' })
  await expect(createdBookmark).toHaveAttribute('href', 'https://example.com/docs')

  await createdBookmark.click({ button: 'right' })
  await page.getByRole('menuitem', { name: '编辑书签' }).click()
  const editDialog = page.getByRole('dialog', { name: '编辑书签' })
  await editDialog.getByLabel('名称').fill('Updated Site')
  await editDialog.getByLabel('网址').fill('updated.example.com')
  await editDialog.getByRole('button', { name: '保存修改' }).click()

  const updatedBookmark = page.getByRole('link', { name: '打开 Updated Site' })
  await expect(updatedBookmark).toHaveAttribute('href', 'https://updated.example.com/')

  await updatedBookmark.click({ button: 'right' })
  await page.getByRole('menuitem', { name: '删除书签' }).click()
  const deleteDialog = page.getByRole('dialog', { name: '删除书签' })
  await deleteDialog.getByRole('button', { name: '确认删除' }).click()
  await expect(updatedBookmark).toBeHidden()
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
  const dialog = page.getByRole('dialog')
  const addBookmark = page.getByRole('button', { name: '在开发工具新增书签' })
  const closeFolder = page.getByRole('button', { name: '关闭文件夹' })
  await expect(dialog).toBeVisible()
  await expect(addBookmark).toBeVisible()

  const [dialogBox, addBox, closeBox] = await Promise.all([
    dialog.boundingBox(),
    addBookmark.boundingBox(),
    closeFolder.boundingBox(),
  ])
  expect(dialogBox).not.toBeNull()
  expect(addBox).not.toBeNull()
  expect(closeBox).not.toBeNull()
  expect(addBox!.x + addBox!.width).toBeLessThanOrEqual(dialogBox!.x + dialogBox!.width)
  expect(closeBox!.x + closeBox!.width).toBeLessThanOrEqual(dialogBox!.x + dialogBox!.width)
  expect(Math.abs((addBox!.y + addBox!.height / 2) - (closeBox!.y + closeBox!.height / 2))).toBeLessThan(2)

  await expect(page.getByRole('button', { name: '打开文件夹 代码仓库' })).toBeVisible()
  await page.getByRole('button', { name: '打开文件夹 代码仓库' }).click()
  await expect(page.getByRole('button', { name: '代码仓库', exact: true })).toHaveAttribute('aria-current', 'page')
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

test('keeps six distinct canvas star fields when motion is disabled', async ({ page }) => {
  await page.getByRole('button', { name: '打开设置' }).click()
  await page.getByText('动态星空', { exact: true }).click()
  await expect(page.getByText('设置已保存到本机')).toBeVisible()
  await page.reload()

  const canvas = page.locator('.star-background__canvas')
  await expect(canvas).toHaveAttribute('data-animated', 'false')
  await page.getByRole('button', { name: '打开设置' }).click()
  const starFields = new Set<string>()

  for (const name of ['星河流尘', '流星夜', '靛蓝星云', '紫曜轨道', '月海薄雾', '蓝星地平线']) {
    const preset = page.getByRole('button', { name: new RegExp(name) })
    await preset.click()
    await expect(preset).toHaveAttribute('aria-pressed', 'true')
    const frame = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())
    expect(starFields.has(frame), `${name} should have its own canvas composition`).toBe(false)
    starFields.add(frame)

    await page.waitForTimeout(120)
    expect(await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL()), `${name} should stay still`)
      .toBe(frame)
  }
})

test('freezes hidden stars and resumes without jumping after a minute', async ({ page }) => {
  const start = new Date('2026-09-28T03:00:00Z')
  await page.clock.install({ time: start })
  await page.reload()
  await expect(page.getByRole('heading', { name: '书签栏' })).toBeVisible()
  await page.clock.pauseAt(new Date(start.getTime() + 1000))
  await page.clock.runFor(80)

  const canvas = page.locator('.star-background__canvas')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(canvas).toHaveAttribute('data-animated', 'false')
  const paused = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())
  await page.clock.runFor(60_000)
  expect(await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())).toBe(paused)

  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden')
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(canvas).toHaveAttribute('data-animated', 'true')
  await page.clock.runFor(16)
  expect(await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())).toBe(paused)
  await page.clock.runFor(600)
  expect(await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())).not.toBe(paused)
})
