<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import BookmarkDashboard from './components/BookmarkDashboard.vue'
import ClockDisplay from './components/ClockDisplay.vue'
import FolderOverlay from './components/FolderOverlay.vue'
import IconSymbol from './components/IconSymbol.vue'
import SearchBar from './components/SearchBar.vue'
import SettingsDrawer from './components/SettingsDrawer.vue'
import StarBackground from './components/StarBackground.vue'
import { isExtensionRuntime } from './services/browser'
import { useStarPageStore } from './stores/starPage'

const store = useStarPageStore()
const { settings, settingsOpen, activeFolder } = storeToRefs(store)
const prototypeMode = computed(() => !isExtensionRuntime())

function handleEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (activeFolder.value) store.closeFolder()
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
      'app-shell--dialog-open': activeFolder || settingsOpen,
      'app-shell--motion': settings.motionEnabled,
    }"
    data-screen-label="星页主页"
  >
    <StarBackground />

    <div class="app-chrome">
      <a class="brand" href="#" aria-label="星页主页" @click.prevent>
        <span class="brand__mark"><IconSymbol name="star" :size="15" /></span>
        <span><strong>星页</strong><small>STAR TAB</small></span>
      </a>
      <button type="button" class="settings-button" aria-label="打开设置" @click="settingsOpen = true">
        <IconSymbol name="settings" :size="19" />
        <span>设置</span>
      </button>
    </div>

    <main class="new-tab-content">
      <section class="hero" aria-label="时间与搜索">
        <ClockDisplay :show-seconds="settings.showSeconds" />
        <SearchBar />
      </section>

      <BookmarkDashboard :compact="settings.compactMode" @open-settings="settingsOpen = true" />
    </main>

    <p v-if="prototypeMode" class="prototype-note">交互原型 · 当前展示模拟书签</p>

    <FolderOverlay />
    <SettingsDrawer />
  </div>
</template>
