import { ref, provide, inject, Ref } from 'vue'
 
const ModalSymbol = Symbol('modal')
 
export function useModal() {
 
  const injected = inject<{
    isModalOpen: Ref<boolean>
    openModal: () => void
    closeModal: () => void
    toggleModal: () => void
  }>(ModalSymbol)
 
  if (injected) {
    return injected
  }
 
  const isModalOpen = ref(false)
 
  const openModal = () => {
    isModalOpen.value = true
  }
 
  const closeModal = () => {
    isModalOpen.value = false
  }
 
  const toggleModal = () => {
    isModalOpen.value = !isModalOpen.value
  }
 
  const modalState = {
    isModalOpen,
    openModal,
    closeModal,
    toggleModal
  }
 
  provide(ModalSymbol, modalState)
 
  return modalState
}
