import type {
  CallNoiseConfig,
  CallNoiseInput,
  CallNoiseResult,
  NoiseRect,
} from '../domain/phone/call-noise-types';

/**
 * Decides whether the manager would hear street noise during a work call.
 * Buildings and hiding spots are always quiet; the street band and a nearby
 * company car are loud. Pure: no Phaser, no suspicion changes.
 */
export function evaluateCallNoise(input: CallNoiseInput, config: CallNoiseConfig): CallNoiseResult {
  const indoors = config.quietZones.find((zone) => contains(zone, input.position));
  if (indoors) return { loud: false, reason: 'indoors', zoneId: indoors.id };
  if (input.hidden) return { loud: false, reason: 'hidden', zoneId: null };

  const carNear = input.cars.some(
    (car) => Math.hypot(car.x - input.position.x, car.y - input.position.y) <= config.carAudibleDistance,
  );
  if (carNear) return { loud: true, reason: 'car', zoneId: null };

  const street = config.loudZones.find((zone) => contains(zone, input.position));
  if (street) return { loud: true, reason: 'street', zoneId: street.id };

  return { loud: false, reason: 'open-air', zoneId: null };
}

function contains(zone: NoiseRect, point: { x: number; y: number }): boolean {
  return (
    Math.abs(point.x - zone.x) <= zone.width / 2 &&
    Math.abs(point.y - zone.y) <= zone.height / 2
  );
}
