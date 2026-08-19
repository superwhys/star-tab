import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useStarPageStore } from '../stores/starPage'

export function useBookmarks() {
  const store = useStarPageStore()
  const refs = storeToRefs(store)

  onMounted(() => void store.init())

  return {
    ...refs,
    refreshBookmarks: store.refreshBookmarks,
    openFolder: store.openFolder,
    enterFolder: store.enterFolder,
    navigateFolder: store.navigateFolder,
    closeFolder: store.closeFolder,
  }
}

