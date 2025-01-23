import type { Config } from 'tailwindcss'

export default {
  content: [],
  theme: {
    extend: {
      colors: {
        'bg-day': '#8ec5fc',
        'bg-night': '#07223d',
      },
      backgroundImage: {
        'bg-day-backgrounImage': 'linear-gradient(62deg, #8ec5fc 0%, #e0c3fc 100%)',
        'bg-night-backgroundImage': 'linear-gradient(62deg, #0a2a4a 0%, #270845 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config
