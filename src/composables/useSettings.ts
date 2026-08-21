import { storeToRefs } from 'pinia'
import { useStarPageStore } from '../stores/starPage'

export function useSettings() {
  const store = useStarPageStore()
  const { settings, settingsOpen, folderOptions, settingsSaveState, settingsError, settingsSyncEnabled } = storeToRefs(store)

  return {
    settings,
    settingsOpen,
    folderOptions,
    settingsSaveState,
    settingsError,
    settingsSyncEnabled,
    updateSettings: store.updateSettings,
    toggleFolderVisibility: store.toggleFolderVisibility,
    moveVisibleFolder: store.moveVisibleFolder,
    setSettingsSyncEnabled: store.setSettingsSyncEnabled,
  }
}
