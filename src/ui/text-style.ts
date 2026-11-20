/**
 * Shared look of in-game text. A bold humanist sans reads much better at
 * small sizes than the thin Courier the prototype used.
 */
export const UI_FONT_FAMILY = '"Trebuchet MS", Verdana, "DejaVu Sans", sans-serif';

/**
 * Text is rasterised at this multiple and smoothed when drawn. The game runs
 * with pixelArt (nearest-neighbour) and is scaled up to the window, which
 * otherwise makes small text blocky and hard to read.
 */
export const UI_TEXT_RESOLUTION = 3;
