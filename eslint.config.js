import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  typescript: true,
  vue: true,
  markdown: false,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },
  ignores: [
    '**.md',
  ],
})
