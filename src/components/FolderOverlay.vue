<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useBookmarks } from '../composables/useBookmarks'
import BookmarkTile from './BookmarkTile.vue'
import IconSymbol from './IconSymbol.vue'

const {
  activeFolder,
  activeFolderPath,
  enterFolder,
  navigateFolder,
  closeFolder,
} = useBookmarks()

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && activeFolder.value) closeFolder()
}

onMounted(() => window.addEventListener('keydown', handleEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<template>
  <Teleport to="body">
    <Transition name="folder-overlay">
      <div v-if="activeFolder" class="folder-overlay" role="presentation" @mousedown.self="closeFolder">
        <section
          class="folder-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`folder-title-${activeFolder.id}`"
        >
          <header class="folder-dialog__header">
            <button
              v-if="activeFolderPath.length > 1"
              type="button"
              class="icon-button icon-button--quiet"
              aria-label="返回上一级"
              @click="navigateFolder(activeFolderPath.length - 2)"
            >
              <IconSymbol name="arrow-left" />
            </button>
            <span v-else class="folder-dialog__mark" aria-hidden="true">
              <IconSymbol name="folder" :size="20" />
            </span>

            <nav class="folder-breadcrumbs" aria-label="文件夹路径">
              <template v-for="(folder, index) in activeFolderPath" :key="folder.id">
                <IconSymbol v-if="index > 0" name="chevron-right" :size="14" />
                <button
                  type="button"
                  :id="index === activeFolderPath.length - 1 ? `folder-title-${activeFolder.id}` : undefined"
                  :aria-current="index === activeFolderPath.length - 1 ? 'page' : undefined"
                  @click="navigateFolder(index)"
                >
                  {{ folder.title }}
                </button>
              </template>
            </nav>

            <button type="button" class="icon-button icon-button--quiet" aria-label="关闭文件夹" @click="closeFolder">
              <IconSymbol name="close" />
            </button>
          </header>

          <div class="folder-dialog__body">
            <div v-if="activeFolder.children.length" class="bookmark-grid bookmark-grid--dialog">
              <BookmarkTile
                v-for="node in activeFolder.children"
                :key="node.id"
                :node="node"
                @open-folder="enterFolder"
              />
            </div>
            <div v-else class="folder-dialog__empty">
              <span><IconSymbol name="folder" :size="30" /></span>
              <h2 :id="`folder-title-${activeFolder.id}`">空文件夹</h2>
              <p>收藏新的网页后，它们会像星星一样出现在这里。</p>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
