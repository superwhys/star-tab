<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { BACKGROUND_PRESETS } from '../backgrounds'
import { useBackground } from '../composables/useBackground'
import { useSettings } from '../composables/useSettings'
import IconSymbol from './IconSymbol.vue'

const {
  settings,
  settingsOpen,
  folderOptions,
  settingsSaveState,
  settingsError,
  updateSettings,
  toggleFolderVisibility,
} = useSettings()
const { prefersReducedMotion } = useBackground()

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && settingsOpen.value) settingsOpen.value = false
}

onMounted(() => window.addEventListener('keydown', handleEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-backdrop">
      <div v-if="settingsOpen" class="settings-backdrop" @mousedown.self="settingsOpen = false"></div>
    </Transition>
    <Transition name="settings-drawer">
      <aside v-if="settingsOpen" class="settings-panel" aria-labelledby="settings-title">
        <header class="settings-panel__header">
          <div>
            <span>STAR TAB</span>
            <h2 id="settings-title">星页设置</h2>
          </div>
          <button type="button" class="icon-button" aria-label="关闭设置" @click="settingsOpen = false">
            <IconSymbol name="close" />
          </button>
        </header>

        <div class="settings-panel__content">
          <section class="settings-section">
            <div class="settings-section__heading">
              <h3>星空背景</h3>
              <span>6 款内置主题</span>
            </div>
            <div class="background-options">
              <button
                v-for="preset in BACKGROUND_PRESETS"
                :key="preset.id"
                type="button"
                class="background-option"
                :class="{ 'background-option--active': settings.backgroundId === preset.id }"
                :aria-pressed="settings.backgroundId === preset.id"
                @click="updateSettings({ backgroundId: preset.id })"
              >
                <span class="background-option__preview" :class="preset.className">
                  <span></span><span></span><span></span>
                </span>
                <span class="background-option__copy">
                  <strong>{{ preset.name }}</strong>
                  <small>{{ preset.description }}</small>
                </span>
                <span v-if="settings.backgroundId === preset.id" class="background-option__check">✓</span>
              </button>
            </div>
          </section>

          <section class="settings-section">
            <div class="settings-section__heading">
              <h3>显示</h3>
            </div>
            <label class="setting-row">
              <span>
                <strong>动态星空</strong>
                <small>关闭后暂停星尘与流星动画</small>
              </span>
              <input
                type="checkbox"
                :checked="settings.motionEnabled"
                @change="updateSettings({ motionEnabled: ($event.target as HTMLInputElement).checked })"
              />
              <span class="switch" aria-hidden="true"></span>
            </label>
            <p v-if="prefersReducedMotion" class="motion-notice">
              系统已开启“减少动态效果”，星空动画会自动暂停。
            </p>
            <label class="setting-row">
              <span>
                <strong>显示秒数</strong>
                <small>在时间右侧显示当前秒数</small>
              </span>
              <input
                type="checkbox"
                :checked="settings.showSeconds"
                @change="updateSettings({ showSeconds: ($event.target as HTMLInputElement).checked })"
              />
              <span class="switch" aria-hidden="true"></span>
            </label>
            <label class="setting-row">
              <span>
                <strong>紧凑布局</strong>
                <small>缩小图标间距，展示更多书签</small>
              </span>
              <input
                type="checkbox"
                :checked="settings.compactMode"
                @change="updateSettings({ compactMode: ($event.target as HTMLInputElement).checked })"
              />
              <span class="switch" aria-hidden="true"></span>
            </label>
          </section>

          <section class="settings-section">
            <div class="settings-section__heading">
              <h3>书签分组</h3>
              <span>选择主页展示内容</span>
            </div>
            <div class="folder-options">
              <label
                v-for="folder in folderOptions"
                :key="folder.id"
                class="folder-option"
                :style="{ '--folder-depth': folder.depth }"
              >
                <input
                  type="checkbox"
                  :checked="settings.visibleFolderIds.includes(folder.id)"
                  @change="toggleFolderVisibility(folder.id)"
                />
                <span class="folder-option__check" aria-hidden="true"></span>
                <IconSymbol name="folder" :size="17" />
                <span>{{ folder.title }}</span>
                <small v-if="folder.folderType === 'bookmarks-bar'">默认</small>
              </label>
            </div>
          </section>
        </div>

        <footer class="settings-panel__footer">
          <template v-if="settingsSaveState === 'saving'">
            <span class="settings-panel__status-dot settings-panel__status-dot--saving"></span>
            正在保存设置…
          </template>
          <template v-else-if="settingsSaveState === 'saved'">
            <span class="settings-panel__status-dot settings-panel__status-dot--saved"></span>
            设置已保存到本机
          </template>
          <template v-else-if="settingsSaveState === 'error'">
            <span class="settings-panel__status-dot settings-panel__status-dot--error"></span>
            <span :title="settingsError">设置保存失败</span>
          </template>
          <template v-else>
            <span class="settings-panel__privacy-dot"></span>
            所有设置与书签数据仅保存在本机
          </template>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>
