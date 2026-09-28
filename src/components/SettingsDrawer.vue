<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { BACKGROUND_PRESETS } from '../backgrounds'
import { useBackground } from '../composables/useBackground'
import { useSettings } from '../composables/useSettings'
import type { FolderOption } from '../types'
import IconSymbol from './IconSymbol.vue'

const {
  settings,
  settingsOpen,
  folderOptions,
  settingsSaveState,
  settingsError,
  settingsSyncEnabled,
  updateSettings,
  toggleFolderVisibility,
  moveVisibleFolder,
  setSettingsSyncEnabled,
} = useSettings()
const { prefersReducedMotion } = useBackground()
const selectedFolderOptions = computed(() =>
  settings.value.visibleFolderIds
    .map((id) => folderOptions.value.find((folder) => folder.id === id))
    .filter((folder): folder is FolderOption => Boolean(folder)),
)

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
                <span class="background-option__preview" :class="preset.className" aria-hidden="true">
                  <svg class="background-preview-scene" viewBox="0 0 160 66" preserveAspectRatio="none">
                    <defs v-if="preset.id === 'meteor-night'">
                      <linearGradient id="background-preview-meteor" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#ecf4ff" />
                        <stop offset="100%" stop-color="#a9c6ef" stop-opacity="0" />
                      </linearGradient>
                    </defs>
                    <g v-if="preset.id === 'stellar-drift'">
                      <path class="background-preview-scene__mist" d="M-12 67 Q58 37 173 1" stroke="#a4b4cf" stroke-width="17" opacity="0.24" />
                      <g opacity="0.8">
                        <circle cx="12" cy="57" r="0.7" /><circle cx="23" cy="49" r="0.9" />
                        <circle cx="34" cy="53" r="0.6" /><circle cx="43" cy="41" r="0.8" />
                        <circle cx="56" cy="44" r="0.7" /><circle cx="65" cy="35" r="1" />
                        <circle cx="77" cy="37" r="0.6" /><circle cx="89" cy="25" r="0.8" />
                        <circle cx="98" cy="30" r="0.6" /><circle cx="114" cy="17" r="0.9" />
                        <circle cx="127" cy="21" r="0.6" /><circle cx="145" cy="9" r="0.8" />
                      </g>
                      <g opacity="0.4"><circle cx="19" cy="48" r="0.7" /><circle cx="133" cy="15" r="0.7" /></g>
                    </g>
                    <g v-else-if="preset.id === 'meteor-night'">
                      <g opacity="0.65">
                        <circle cx="17" cy="17" r="0.7" /><circle cx="38" cy="51" r="0.8" />
                        <circle cx="68" cy="12" r="0.6" /><circle cx="112" cy="51" r="0.8" />
                        <circle cx="145" cy="26" r="0.7" />
                      </g>
                      <path d="M76 40 L116 12" stroke="url(#background-preview-meteor)" stroke-width="1" />
                      <path d="M118 40 L140 24" stroke="url(#background-preview-meteor)" stroke-width="0.7" opacity="0.55" />
                    </g>
                    <g v-else-if="preset.id === 'indigo-nebula'">
                      <path class="background-preview-scene__mist" d="M22 12 Q57 15 36 35 M121 33 Q141 55 105 50" stroke="#7b8dbb" stroke-width="19" opacity="0.3" />
                      <g opacity="0.8">
                        <circle cx="25" cy="16" r="0.6" /><circle cx="34" cy="23" r="1" />
                        <circle cx="42" cy="13" r="0.7" /><circle cx="49" cy="27" r="0.6" />
                        <circle cx="113" cy="38" r="0.7" /><circle cx="123" cy="44" r="1" />
                        <circle cx="132" cy="33" r="0.6" /><circle cx="135" cy="50" r="0.7" />
                      </g>
                      <circle cx="78" cy="15" r="0.6" opacity="0.35" />
                    </g>
                    <g v-else-if="preset.id === 'violet-orbit'">
                      <g class="background-preview-scene__orbits">
                        <circle cx="115" cy="16" r="18" stroke-dasharray="12 102" transform="rotate(110 115 16)" />
                        <circle cx="115" cy="16" r="32" stroke-dasharray="17 185" transform="rotate(22 115 16)" />
                        <circle cx="115" cy="16" r="43" stroke-dasharray="24 247" transform="rotate(138 115 16)" />
                        <circle cx="115" cy="16" r="60" stroke-dasharray="28 349" transform="rotate(61 115 16)" />
                        <circle cx="115" cy="16" r="86" stroke-dasharray="32 509" transform="rotate(151 115 16)" />
                      </g>
                      <circle cx="115" cy="16" r="1" opacity="0.8" />
                      <circle cx="20" cy="19" r="0.6" opacity="0.4" />
                    </g>
                    <g v-else-if="preset.id === 'lunar-mist'">
                      <g class="background-preview-scene__mist" stroke="#b9cbd0" opacity="0.25">
                        <path d="M-8 42 Q32 33 106 42" stroke-width="7" />
                        <path d="M50 52 Q107 43 174 52" stroke-width="8" />
                      </g>
                      <g opacity="0.7">
                        <circle cx="26" cy="14" r="0.7" /><circle cx="84" cy="22" r="0.8" />
                        <circle cx="142" cy="11" r="0.6" /><circle cx="125" cy="42" r="0.6" />
                      </g>
                    </g>
                    <g v-else-if="preset.id === 'blue-horizon'">
                      <path class="background-preview-scene__mist" d="M-10 63 Q80 38 170 63" stroke="#6fa5c5" stroke-width="8" opacity="0.28" />
                      <path d="M-10 63 Q80 38 170 63" fill="none" stroke="#9cbdd2" stroke-width="0.7" opacity="0.4" />
                      <g opacity="0.7">
                        <circle cx="18" cy="50" r="0.6" /><circle cx="34" cy="44" r="0.7" />
                        <circle cx="57" cy="55" r="0.9" /><circle cx="69" cy="43" r="0.6" />
                        <circle cx="84" cy="49" r="0.7" /><circle cx="106" cy="43" r="0.8" />
                        <circle cx="125" cy="53" r="0.6" /><circle cx="144" cy="47" r="0.7" />
                      </g>
                      <g opacity="0.45"><circle cx="42" cy="12" r="0.7" /><circle cx="131" cy="19" r="0.6" /></g>
                    </g>
                  </svg>
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
              <h3>同步</h3>
            </div>
            <label class="setting-row">
              <span>
                <strong>Chrome 配置同步</strong>
                <small>同步显示偏好；书签分组选择保存在本机</small>
              </span>
              <input
                type="checkbox"
                :checked="settingsSyncEnabled"
                @change="setSettingsSyncEnabled(($event.target as HTMLInputElement).checked)"
              />
              <span class="switch" aria-hidden="true"></span>
            </label>
          </section>

          <section class="settings-section">
            <div class="settings-section__heading">
              <h3>显示</h3>
            </div>
            <label class="setting-row">
              <span>
                <strong>动态星空</strong>
                <small>关闭后保留星空构图，暂停动态效果</small>
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
              <span>选择并调整主页顺序</span>
            </div>
            <div v-if="selectedFolderOptions.length" class="folder-order">
              <div class="folder-order__heading">
                <strong>展示顺序</strong>
                <span>从上到下排列</span>
              </div>
              <ol class="folder-order__list">
                <li v-for="(folder, index) in selectedFolderOptions" :key="folder.id" class="folder-order__item">
                  <span class="folder-order__index">{{ index + 1 }}</span>
                  <IconSymbol name="folder" :size="16" />
                  <span class="folder-order__title">{{ folder.title }}</span>
                  <span class="folder-order__actions">
                    <button
                      type="button"
                      :aria-label="`上移分组 ${folder.title}`"
                      :disabled="index === 0"
                      @click="moveVisibleFolder(folder.id, -1)"
                    >
                      <span aria-hidden="true">↑</span>
                    </button>
                    <button
                      type="button"
                      :aria-label="`下移分组 ${folder.title}`"
                      :disabled="index === selectedFolderOptions.length - 1"
                      @click="moveVisibleFolder(folder.id, 1)"
                    >
                      <span aria-hidden="true">↓</span>
                    </button>
                  </span>
                </li>
              </ol>
            </div>
            <div class="folder-options__heading">
              <strong>选择分组</strong>
              <span>账号同步分组可在其他设备显示</span>
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
                <small
                  v-if="folder.syncing !== undefined"
                  class="folder-option__sync-state"
                  :class="{ 'folder-option__sync-state--local': !folder.syncing }"
                >
                  {{ folder.syncing ? '账号同步' : '仅本机' }}
                </small>
                <small v-else-if="folder.folderType === 'bookmarks-bar'">默认</small>
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
            {{ settingsSyncEnabled ? '显示设置已同步，分组保存在本机' : '设置已保存到本机' }}
          </template>
          <template v-else-if="settingsSaveState === 'error'">
            <span class="settings-panel__status-dot settings-panel__status-dot--error"></span>
            <span :title="settingsError">设置保存失败</span>
          </template>
          <template v-else>
            <span class="settings-panel__privacy-dot"></span>
            {{ settingsSyncEnabled ? '配置通过 Chrome 同步，书签由浏览器管理' : '所有设置与书签数据仅保存在本机' }}
          </template>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.background-option__preview::after {
  content: none;
}

.background-preview-scene {
  display: block;
  width: 100%;
  height: 100%;
  fill: #dce6f3;
}

.background-preview-scene__mist {
  fill: none;
  filter: blur(3px);
}

.background-preview-scene__orbits {
  fill: none;
  stroke: #c2b4da;
  stroke-width: 0.8;
  opacity: 0.72;
}
</style>
