import type { Config } from 'tailwindcss'
import primeui from 'tailwindcss-primeui'

export default {
  darkMode: ['selector', '[class~="p-dark"]'],
  content: [],
  theme: {},
  plugins: [primeui],
} satisfies Config
