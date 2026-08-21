<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useBookmarkEditor } from '../composables/useBookmarkEditor'
import { useStarPageStore } from '../stores/starPage'
import { normalizeDirectUrl } from '../utils/urls'
import IconSymbol from './IconSymbol.vue'

const store = useStarPageStore()
const titleInput = ref<HTMLInputElement>()
const title = ref('')
const url = ref('')
const error = ref('')
const submitting = ref(false)
const { editorState, closeBookmarkEditor } = useBookmarkEditor()

const dialogTitle = computed(() => {
  if (editorState.value?.mode === 'create') return '新增书签'
  if (editorState.value?.mode === 'edit') return '编辑书签'
  return '删除书签'
})

function close() {
  if (!submitting.value) closeBookmarkEditor()
}

async function submitBookmark() {
  const state = editorState.value
  if (!state || state.mode === 'delete' || submitting.value) return

  const nextTitle = title.value.trim()
  const nextUrl = normalizeDirectUrl(url.value)
  if (!nextTitle) {
    error.value = '请输入书签名称'
    return
  }
  if (!nextUrl) {
    error.value = '请输入有效的网址，例如 example.com'
    return
  }

  submitting.value = true
  error.value = ''
  try {
    if (state.mode === 'create') await store.createBookmark(state.parent.id, nextTitle, nextUrl)
    else await store.updateBookmark(state.bookmark.id, nextTitle, nextUrl)
    closeBookmarkEditor()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '书签保存失败'
  } finally {
    submitting.value = false
  }
}

async function confirmDelete() {
  const state = editorState.value
  if (!state || state.mode !== 'delete' || submitting.value) return

  submitting.value = true
  error.value = ''
  try {
    await store.deleteBookmark(state.bookmark.id)
    closeBookmarkEditor()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '书签删除失败'
  } finally {
    submitting.value = false
  }
}

watch(editorState, async (state) => {
  error.value = ''
  submitting.value = false
  if (!state) return
  if (state.mode === 'edit') {
    title.value = state.bookmark.title
    url.value = state.bookmark.url ?? ''
  } else {
    title.value = ''
    url.value = ''
  }
  if (state.mode !== 'delete') {
    await nextTick()
    titleInput.value?.focus()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="bookmark-editor">
      <div v-if="editorState" class="bookmark-editor-backdrop" @mousedown.self="close">
        <section class="bookmark-editor" role="dialog" aria-modal="true" aria-labelledby="bookmark-editor-title">
          <header>
            <div>
              <span>STAR TAB</span>
              <h2 id="bookmark-editor-title">{{ dialogTitle }}</h2>
            </div>
            <button type="button" class="bookmark-editor__close" aria-label="关闭书签编辑器" @click="close">
              <IconSymbol name="close" :size="18" />
            </button>
          </header>

          <template v-if="editorState.mode === 'delete'">
            <div class="bookmark-editor__delete-copy">
              <span aria-hidden="true">✦</span>
              <p>确定删除书签“<strong>{{ editorState.bookmark.title }}</strong>”吗？此操作会同步修改 Chrome 书签。</p>
            </div>
            <p v-if="error" class="bookmark-editor__error" role="alert">{{ error }}</p>
            <footer>
              <button type="button" class="bookmark-editor__secondary" :disabled="submitting" @click="close">取消</button>
              <button type="button" class="bookmark-editor__danger" :disabled="submitting" @click="confirmDelete">
                {{ submitting ? '正在删除…' : '确认删除' }}
              </button>
            </footer>
          </template>

          <form v-else @submit.prevent="submitBookmark">
            <p v-if="editorState.mode === 'create'" class="bookmark-editor__destination">
              保存到：{{ editorState.parent.title || '书签' }}
            </p>
            <label>
              <span>名称</span>
              <input ref="titleInput" v-model="title" name="title" autocomplete="off" maxlength="200" />
            </label>
            <label>
              <span>网址</span>
              <input v-model="url" name="url" type="text" inputmode="url" autocomplete="off" placeholder="example.com" />
            </label>
            <p v-if="error" class="bookmark-editor__error" role="alert">{{ error }}</p>
            <footer>
              <button type="button" class="bookmark-editor__secondary" :disabled="submitting" @click="close">取消</button>
              <button type="submit" class="bookmark-editor__primary" :disabled="submitting">
                {{ submitting ? '正在保存…' : editorState.mode === 'create' ? '新增书签' : '保存修改' }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bookmark-editor-backdrop {
  position: fixed;
  z-index: 130;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(2, 5, 20, 0.58);
  backdrop-filter: blur(12px);
}

.bookmark-editor {
  width: min(430px, 100%);
  overflow: hidden;
  border: 1px solid rgba(211, 222, 255, 0.17);
  border-radius: 20px;
  background: rgba(14, 20, 49, 0.94);
  box-shadow: 0 28px 80px rgba(0, 3, 20, 0.55);
  color: rgba(241, 244, 255, 0.94);
}

.bookmark-editor header,
.bookmark-editor footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bookmark-editor header {
  padding: 20px 22px 16px;
  border-bottom: 1px solid rgba(211, 222, 255, 0.09);
}

.bookmark-editor header span {
  color: rgba(173, 193, 255, 0.5);
  font-size: 9px;
  letter-spacing: 0.18em;
}

.bookmark-editor h2 {
  margin: 3px 0 0;
  font-size: 18px;
}

.bookmark-editor__close {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 10px;
  background: rgba(141, 161, 222, 0.08);
  color: rgba(230, 236, 255, 0.72);
  cursor: pointer;
}

.bookmark-editor form {
  display: grid;
  gap: 15px;
  padding: 20px 22px 22px;
}

.bookmark-editor label {
  display: grid;
  gap: 7px;
  color: rgba(218, 226, 255, 0.72);
  font-size: 11px;
}

.bookmark-editor input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid rgba(203, 216, 255, 0.14);
  border-radius: 11px;
  outline: none;
  background: rgba(4, 8, 29, 0.48);
  color: #f7f9ff;
  font: inherit;
  font-size: 13px;
}

.bookmark-editor input:focus {
  border-color: rgba(143, 170, 255, 0.48);
  box-shadow: 0 0 0 3px rgba(108, 139, 235, 0.1);
}

.bookmark-editor__destination {
  margin: 0;
  color: rgba(190, 204, 247, 0.55);
  font-size: 11px;
}

.bookmark-editor__delete-copy {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 13px;
  align-items: start;
  padding: 24px 22px 8px;
}

.bookmark-editor__delete-copy > span {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 11px;
  background: rgba(255, 105, 126, 0.12);
  color: #ff9aaa;
}

.bookmark-editor__delete-copy p {
  margin: 2px 0 0;
  color: rgba(224, 230, 250, 0.72);
  font-size: 13px;
  line-height: 1.7;
}

.bookmark-editor__error {
  margin: 0;
  color: #ff9aaa;
  font-size: 11px;
}

.bookmark-editor > footer,
.bookmark-editor form footer {
  justify-content: flex-end;
  padding-top: 4px;
}

.bookmark-editor > footer {
  padding: 18px 22px 22px;
}

.bookmark-editor footer button {
  padding: 9px 15px;
  border: 1px solid transparent;
  border-radius: 10px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.bookmark-editor__secondary {
  background: rgba(138, 158, 220, 0.08);
  color: rgba(226, 232, 252, 0.72);
}

.bookmark-editor__primary {
  background: linear-gradient(135deg, #667eea, #7c68d9);
  color: white;
}

.bookmark-editor__danger {
  background: rgba(225, 73, 96, 0.88);
  color: white;
}

.bookmark-editor footer button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.bookmark-editor-enter-active,
.bookmark-editor-leave-active {
  transition: opacity 150ms ease;
}

.bookmark-editor-enter-active .bookmark-editor,
.bookmark-editor-leave-active .bookmark-editor {
  transition: transform 150ms ease, opacity 150ms ease;
}

.bookmark-editor-enter-from,
.bookmark-editor-leave-to,
.bookmark-editor-enter-from .bookmark-editor,
.bookmark-editor-leave-to .bookmark-editor {
  opacity: 0;
}

.bookmark-editor-enter-from .bookmark-editor,
.bookmark-editor-leave-to .bookmark-editor {
  transform: translateY(8px) scale(0.98);
}
</style>
