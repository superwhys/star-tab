<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useBookmarkContextMenu } from '../composables/useBookmarkContextMenu'
import { useBookmarkEditor } from '../composables/useBookmarkEditor'
import { useStarPageStore } from '../stores/starPage'

const store = useStarPageStore()
const menu = ref<HTMLElement>()
const copied = ref(false)
const { contextMenu, closeContextMenu } = useBookmarkContextMenu()
const { openCreateBookmark, openEditBookmark, openDeleteBookmark } = useBookmarkEditor()
let copiedTimer = 0

const menuStyle = computed(() => {
  const state = contextMenu.value
  if (!state) return undefined
  return {
    left: `${Math.min(Math.max(8, state.x), Math.max(8, window.innerWidth - 224))}px`,
    top: `${Math.min(Math.max(8, state.y), Math.max(8, window.innerHeight - (state.node.type === 'bookmark' ? 270 : 116)))}px`,
  }
})

function openFolder() {
  const node = contextMenu.value?.node
  if (!node || node.type !== 'folder') return
  store.openFolder(node)
  closeContextMenu()
}

function addBookmark() {
  const node = contextMenu.value?.node
  if (!node || node.type !== 'folder') return
  openCreateBookmark(node)
  closeContextMenu()
}

function editBookmark() {
  const node = contextMenu.value?.node
  if (!node || node.type !== 'bookmark') return
  openEditBookmark(node)
  closeContextMenu()
}

function deleteBookmark() {
  const node = contextMenu.value?.node
  if (!node || node.type !== 'bookmark') return
  openDeleteBookmark(node)
  closeContextMenu()
}

async function copyLink() {
  const url = contextMenu.value?.node.url
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    window.clearTimeout(copiedTimer)
    copiedTimer = window.setTimeout(closeContextMenu, 650)
  } catch {
    closeContextMenu()
  }
}

function handlePointerDown(event: PointerEvent) {
  if (contextMenu.value && !menu.value?.contains(event.target as Node)) closeContextMenu()
}

watch(contextMenu, async (state) => {
  copied.value = false
  if (!state) return
  await nextTick()
  menu.value?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
})

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown, true)
  window.addEventListener('blur', closeContextMenu)
  window.addEventListener('resize', closeContextMenu)
  window.addEventListener('scroll', closeContextMenu, true)
})

onBeforeUnmount(() => {
  window.clearTimeout(copiedTimer)
  document.removeEventListener('pointerdown', handlePointerDown, true)
  window.removeEventListener('blur', closeContextMenu)
  window.removeEventListener('resize', closeContextMenu)
  window.removeEventListener('scroll', closeContextMenu, true)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="bookmark-menu">
      <div
        v-if="contextMenu"
        ref="menu"
        class="bookmark-context-menu"
        :style="menuStyle"
        role="menu"
        :aria-label="`${contextMenu.node.title} 操作菜单`"
        @contextmenu.prevent
      >
        <template v-if="contextMenu.node.type === 'bookmark'">
          <a :href="contextMenu.node.url" role="menuitem" @click="closeContextMenu">
            <span aria-hidden="true">↵</span>
            在当前标签页打开
          </a>
          <a :href="contextMenu.node.url" target="_blank" rel="noopener noreferrer" role="menuitem" @click="closeContextMenu">
            <span aria-hidden="true">↗</span>
            在新标签页打开
          </a>
          <button type="button" role="menuitem" @click="copyLink">
            <span aria-hidden="true">⧉</span>
            {{ copied ? '已复制链接' : '复制链接' }}
          </button>
          <span class="bookmark-context-menu__separator" role="separator"></span>
          <button type="button" role="menuitem" @click="editBookmark">
            <span aria-hidden="true">✎</span>
            编辑书签
          </button>
          <button type="button" class="bookmark-context-menu__danger" role="menuitem" @click="deleteBookmark">
            <span aria-hidden="true">×</span>
            删除书签
          </button>
        </template>
        <template v-else>
          <button type="button" role="menuitem" @click="openFolder">
            <span aria-hidden="true">⌁</span>
            打开文件夹
          </button>
          <button type="button" role="menuitem" @click="addBookmark">
            <span aria-hidden="true">＋</span>
            新增书签
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bookmark-context-menu {
  position: fixed;
  z-index: 120;
  display: grid;
  width: 216px;
  gap: 3px;
  padding: 6px;
  border: 1px solid rgba(209, 220, 255, 0.18);
  border-radius: 13px;
  background: rgba(14, 20, 49, 0.9);
  box-shadow: 0 18px 48px rgba(1, 4, 24, 0.45);
  backdrop-filter: blur(24px) saturate(140%);
}

.bookmark-context-menu a,
.bookmark-context-menu button {
  display: grid;
  width: 100%;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: rgba(238, 242, 255, 0.9);
  font: inherit;
  font-size: 12px;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.bookmark-context-menu a:hover,
.bookmark-context-menu a:focus-visible,
.bookmark-context-menu button:hover,
.bookmark-context-menu button:focus-visible {
  outline: none;
  background: rgba(137, 161, 232, 0.14);
  color: #fff;
}

.bookmark-context-menu span {
  color: rgba(171, 193, 255, 0.72);
  font-size: 15px;
  text-align: center;
}

.bookmark-context-menu__separator {
  display: block;
  height: 1px;
  margin: 3px 8px;
  background: rgba(211, 222, 255, 0.09);
}

.bookmark-context-menu .bookmark-context-menu__danger,
.bookmark-context-menu .bookmark-context-menu__danger span {
  color: rgba(255, 151, 167, 0.9);
}

.bookmark-menu-enter-active,
.bookmark-menu-leave-active {
  transition: opacity 100ms ease, transform 100ms ease;
  transform-origin: top left;
}

.bookmark-menu-enter-from,
.bookmark-menu-leave-to {
  opacity: 0;
  transform: translateY(-3px) scale(0.98);
}
</style>
