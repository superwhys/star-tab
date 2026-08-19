import { onBeforeUnmount, onMounted } from 'vue'

const TEXT_EDITING_SELECTOR = 'input, textarea, [contenteditable="true"]'

function isTextEditingTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(TEXT_EDITING_SELECTOR))
}

export function usePageInteractionGuards() {
  function preventContextMenu(event: MouseEvent) {
    event.preventDefault()
  }

  function preventPageSelection(event: Event) {
    if (!isTextEditingTarget(event.target)) event.preventDefault()
  }

  function preventElementDrag(event: DragEvent) {
    event.preventDefault()
  }

  onMounted(() => {
    document.addEventListener('contextmenu', preventContextMenu, true)
    document.addEventListener('selectstart', preventPageSelection, true)
    document.addEventListener('dragstart', preventElementDrag, true)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('contextmenu', preventContextMenu, true)
    document.removeEventListener('selectstart', preventPageSelection, true)
    document.removeEventListener('dragstart', preventElementDrag, true)
  })
}
