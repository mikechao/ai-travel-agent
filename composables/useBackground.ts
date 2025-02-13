export interface Background {
  name: string
  url: string
}

const STORAGE_KEY = 'ai-travel-agent-bg'

export function useBackground() {
  const backgrounds = [
    { name: 'Mac', url: '/window.webp' },
    { name: 'XP', url: '/xp.webp' },
  ] as const

  const selectedBackground = ref<Background>(backgrounds[0])

  function updateBackground(background: Background) {
    selectedBackground.value = background
    localStorage.setItem(STORAGE_KEY, background.url)
    const splitter = document.querySelector('.splitter') as HTMLElement
    splitter.style.setProperty('background-image', `url(${background.url})`)
  }

  function initBackground() {
    const savedBg = localStorage.getItem(STORAGE_KEY)
    if (savedBg) {
      const background = backgrounds.find(bg => bg.url === savedBg)
      if (background) {
        updateBackground(background)
      }
    }
  }

  return {
    backgrounds,
    selectedBackground,
    updateBackground,
    initBackground,
  }
}
