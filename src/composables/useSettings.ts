import { storeToRefs } from 'pinia'
import { useStarPageStore } from '../stores/starPage'

export function useSettings() {
  const store = useStarPageStore()
  const { settings, settingsOpen, folderOptions, settingsSaveState, settingsError } = storeToRefs(store)

  return {
    settings,
    settingsOpen,
    folderOptions,
    settingsSaveState,
    settingsError,
    updateSettings: store.updateSettings,
    toggleFolderVisibility: store.toggleFolderVisibility,
  }
}
