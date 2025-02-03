export function updatePrimaryColors(primaryColor: ColorDefinition) {
  if (import.meta.client) {
    Object.keys(primaryColor.palette).forEach((key) => {
      const shade = key as unknown as PaletteShade
      document.documentElement.style.setProperty(`--p-primary-${shade}`, primaryColor.palette[shade])
    })
  }
}
