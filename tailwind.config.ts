import type { Config } from 'tailwindcss'
import scrollbar from 'tailwind-scrollbar'
import primeui from 'tailwindcss-primeui'

export default <Config> {
  darkMode: ['selector', '[class~="p-dark"]'],
  content: [
    './components/**/*.{vue,js}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        scrollbar: {
          track: 'rgb(var(--surface-200) / 0.1)',
          thumb: 'rgb(var(--surface-400) / 0.5)',
        },
      },
    },
  },
  plugins: [
    primeui,
    scrollbar({ nocompatible: true, preferredStrategy: 'pseudoelements' }),
  ],
}
