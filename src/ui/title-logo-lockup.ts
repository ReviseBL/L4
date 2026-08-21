import Phaser from 'phaser';

export const BRAND_DISPLAY_FONT = '"Hubi Display", "Arial Narrow", sans-serif';
export const BRAND_TAGLINE_FONT = '"Hubi Tagline", Georgia, serif';
export const BRAND_RED = '#c92b35';
export const BRAND_OFF_WHITE = '#eeeae1';

export function createTitleLogoLockup(
  scene: Phaser.Scene,
  x: number,
  y: number,
): Phaser.GameObjects.Container {
  const l4 = scene.add
    .text(0, 0, 'L4:', displayStyle(82, BRAND_RED))
    .setOrigin(0)
    .setScale(0.82, 1);
  const office = fitTextWidth(
    scene.add.text(2, 82, 'THE OFFICE', displayStyle(45, BRAND_OFF_WHITE)),
    320,
  );
  const escape = fitTextWidth(
    scene.add.text(2, 126, 'ESCAPE', displayStyle(58, BRAND_OFF_WHITE)),
    320,
  );

  return scene.add.container(x, y, [l4, office, escape]);
}

export function createTitleTagline(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: BRAND_TAGLINE_FONT,
      fontSize: '15px',
      fontStyle: 'italic',
      color: '#bbb8b0',
      stroke: '#030405',
      strokeThickness: 2,
    })
    .setOrigin(0, 0.5);
}

function fitTextWidth(text: Phaser.GameObjects.Text, targetWidth: number): Phaser.GameObjects.Text {
  text.setOrigin(0);
  text.setScale(targetWidth / text.width, 1);
  return text;
}

function displayStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: BRAND_DISPLAY_FONT,
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
    padding: { left: 2, right: 2, top: 0, bottom: 0 },
  };
}
