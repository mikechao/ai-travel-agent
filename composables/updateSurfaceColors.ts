export function updateSurfaceColors(surfaceColor: ColorDefinition) {
  if (import.meta.client) {
    Object.keys(surfaceColor.palette).forEach((key) => {
      const shade = key as unknown as PaletteShade
      document.documentElement.style.setProperty(`--p-surface-${shade}`, surfaceColor.palette[shade])
    })
  }
}
