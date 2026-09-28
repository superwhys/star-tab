<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import BookmarkDashboard from './components/BookmarkDashboard.vue'
import BookmarkContextMenu from './components/BookmarkContextMenu.vue'
import BookmarkEditorDialog from './components/BookmarkEditorDialog.vue'
import ClockDisplay from './components/ClockDisplay.vue'
import FolderOverlay from './components/FolderOverlay.vue'
import IconSymbol from './components/IconSymbol.vue'
import SearchBar from './components/SearchBar.vue'
import SettingsDrawer from './components/SettingsDrawer.vue'
import StarBackground from './components/StarBackground.vue'
import { usePageInteractionGuards } from './composables/usePageInteractionGuards'
import { useBookmarkContextMenu } from './composables/useBookmarkContextMenu'
import { useBookmarkEditor } from './composables/useBookmarkEditor'
import { isExtensionRuntime } from './services/browser'
import { useStarPageStore } from './stores/starPage'

usePageInteractionGuards()

const store = useStarPageStore()
const { contextMenu, closeContextMenu } = useBookmarkContextMenu()
const { editorState, closeBookmarkEditor } = useBookmarkEditor()
const { settings, settingsOpen, activeFolder } = storeToRefs(store)
const prototypeMode = computed(() => !isExtensionRuntime())

function handleEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (editorState.value) closeBookmarkEditor()
  else if (contextMenu.value) closeContextMenu()
  else if (activeFolder.value) store.closeFolder()
  else if (settingsOpen.value) settingsOpen.value = false
}

onMounted(() => {
  void store.init()
  window.addEventListener('keydown', handleEscape)
})
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<template>
  <div
    class="app-shell"
    :class="{
      'app-shell--dialog-open': activeFolder || settingsOpen || editorState,
    }"
    data-screen-label="星页主页"
  >
    <StarBackground />

    <div class="app-chrome">
      <a class="brand" href="#" aria-label="星页主页" @click.prevent>
        <span class="brand__mark" aria-hidden="true">✦</span>
        <span><strong>星页</strong><small>STAR TAB</small></span>
      </a>
      <button type="button" class="settings-button" aria-label="打开设置" @click="settingsOpen = true">
        <IconSymbol name="settings" :size="19" />
        <span>设置</span>
      </button>
    </div>

    <main class="new-tab-content">
      <section class="hero" aria-label="时间与搜索">
        <p class="hero__eyebrow">A LITTLE SPACE FOR YOUR DAY</p>
        <ClockDisplay :show-seconds="settings.showSeconds" />
        <SearchBar />
        <p class="hero__hint">按 <kbd>/</kbd> 开始搜索<span>·</span>从这里，去往你的宇宙</p>
      </section>

      <BookmarkDashboard
        :compact="settings.compactMode"
        @open-settings="settingsOpen = true"
      />
    </main>

    <footer class="page-footer">
      <span class="page-footer__motto"><span aria-hidden="true">✧</span> 心有旷野，眼有星河</span>
      <span v-if="prototypeMode" class="prototype-note">预览模式 · 示例书签</span>
      <span v-else class="page-footer__signature">STAR TAB · 你的星空起点</span>
    </footer>

    <FolderOverlay />
    <SettingsDrawer />
    <BookmarkContextMenu />
    <BookmarkEditorDialog />
  </div>
</template>
