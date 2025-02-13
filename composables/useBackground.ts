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

  const selectedBackground = ref<Background>(
    import.meta.client
      ? backgrounds.find(bg => bg.url === localStorage.getItem(STORAGE_KEY)) || backgrounds[0]
      : backgrounds[0],
  )

  function updateBackground(background: Background) {
    selectedBackground.value = background
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, background.url)
      nextTick(() => {
        const splitter = document.querySelector('.splitter') as HTMLElement
        splitter.style.setProperty('background-image', `url(${background.url})`)
      })
    }
  }

  function initBackground() {
    if (import.meta.client) {
      const savedBg = localStorage.getItem(STORAGE_KEY)
      if (savedBg) {
        const background = backgrounds.find(bg => bg.url === savedBg)
        if (background) {
          nextTick(() => {
            updateBackground(background)
          })
        }
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
