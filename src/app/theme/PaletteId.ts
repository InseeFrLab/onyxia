export const paletteIds = ["onyxia", "france", "AUS"] as const;

export type PaletteId = typeof paletteIds[number];
