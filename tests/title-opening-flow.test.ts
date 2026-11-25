import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GAME_BRAND, TITLE_KEY_ART } from '../src/data/branding/brand-config';
import { openingPanels } from '../src/data/narrative/opening-sequence';
import { TITLE_FLOW_SCENE, resolveTitleFlowScene } from '../src/systems/title-flow-system';
import { calculateCoverPlacement } from '../src/ui/title-cover-layout';

describe('title and opening flow', () => {
  it('uses the canonical title and Herbi L4 tagline', () => {
    expect(GAME_BRAND).toEqual({
      title: 'L4: The Office Escape',
      tagline: 'The story of Herbert “Herbi L4”',
    });
  });

  it('routes only a new game through the opening', () => {
    expect(resolveTitleFlowScene('new-game')).toBe(TITLE_FLOW_SCENE.opening);
    expect(resolveTitleFlowScene('continue')).toBe(TITLE_FLOW_SCENE.campaign);
  });

  it('keeps the professional title key art in a replaceable external slot', () => {
    expect(TITLE_KEY_ART).toMatchObject({
      key: 'branding/title-key-art',
      url: 'assets/branding/title-key-art.png',
      focalPoint: { x: 0.72, y: 0.48 },
    });
  });

  it('cover-fits title art without stretching it', () => {
    expect(calculateCoverPlacement(2400, 1600, 960, 540)).toEqual({
      x: 0,
      y: -50,
      scale: 0.4,
    });
    expect(calculateCoverPlacement(1920, 1080, 960, 540)).toEqual({
      x: 0,
      y: 0,
      scale: 0.5,
    });

    const finalArt = calculateCoverPlacement(1672, 941, 960, 540, 0.72, 0.48);
    expect(1672 * finalArt.scale).toBeGreaterThanOrEqual(960);
    expect(941 * finalArt.scale).toBeGreaterThanOrEqual(540);
    expect(finalArt.scale).toBeCloseTo(960 / 1672, 6);
  });

  it('keeps the storyboard short, replaceable, and stable', () => {
    expect(openingPanels).toHaveLength(15);
    expect(new Set(openingPanels.map((panel) => panel.id)).size).toBe(openingPanels.length);
    expect(openingPanels.every((panel) => panel.assetKey.length > 0)).toBe(true);
    expect(openingPanels.every((panel) => Array.from(panel.text).length <= 150)).toBe(true);
    expect(openingPanels.at(-1)).toMatchObject({
      visual: 'legend',
      speaker: GAME_BRAND.title,
      text: GAME_BRAND.tagline,
    });
  });

  it('maps every opening slide to its final external illustration', () => {
    expect(openingPanels.map((panel) => panel.assetUrl)).toEqual([
      'assets/intro/intro-01-bylem-zwyklym-informatykiem.png',
      'assets/intro/intro-02-nie-mialem-wielkich-ambicji.png',
      'assets/intro/intro-03-komputer-kawa-kabel-restart-powtorz.png',
      'assets/intro/intro-04-praca-u-klienta.png',
      'assets/intro/intro-05-padalo-tak-jakby-miasto-probowalo-cos-zmyc.png',
      'assets/intro/intro-06-serwerownia-byla-przyjazna.png',
      'assets/intro/intro-07-lidka-sie-usmiechnela.png',
      'assets/intro/intro-08-w-szafie-wszystko-mialo-swoje-miejsce.png',
      'assets/intro/intro-09-popelnilem-fatalny-blad.png',
      'assets/intro/intro-10-faktycznie-zaczalem-cos-robic.png',
      'assets/intro/intro-11-klik.png',
      'assets/intro/intro-12-a-potem-zgaslo-wszystko.png',
      'assets/intro/intro-13-zostalem-sam-z-kablem-rj45.png',
      'assets/intro/intro-14-nie-pamietalem-od-czego-byl.png',
      'assets/intro/intro-15-tak-narodzila-sie-legenda-hubi-l4.png',
    ]);
    expect(
      openingPanels.every((panel) =>
        existsSync(fileURLToPath(new URL(`../public/${panel.assetUrl}`, import.meta.url))),
      ),
    ).toBe(true);
  });

  it('cover-fits opening art without changing its aspect ratio', () => {
    const placement = calculateCoverPlacement(1672, 941, 960, 540, 0.4, 0.46, 1.07);
    expect(1672 * placement.scale).toBeGreaterThanOrEqual(960);
    expect(941 * placement.scale).toBeGreaterThanOrEqual(540);
    expect(placement.scale).toBeCloseTo((960 / 1672) * 1.07, 6);
  });

  it('keeps the RJ-45 motif weapon-free in opening copy', () => {
    const copy = openingPanels.map((panel) => `${panel.speaker} ${panel.text}`).join(' ').toLowerCase();
    expect(copy).toContain('rj-45');
    expect(copy).not.toMatch(/pistolet|karabin|rewolwer|broń/u);
  });
});
