export interface CoverPlacement {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

export function calculateCoverPlacement(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  focalX = 0.5,
  focalY = 0.5,
  zoom = 1,
): CoverPlacement {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    throw new Error('Cover art dimensions must be positive.');
  }

  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight) * Math.max(1, zoom);
  const overflowX = sourceWidth * scale - targetWidth;
  const overflowY = sourceHeight * scale - targetHeight;
  return {
    x: normalizeZero(-overflowX * clamp01(focalX)),
    y: normalizeZero(-overflowY * clamp01(focalY)),
    scale,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalizeZero(value: number): number {
  return value === 0 ? 0 : value;
}
