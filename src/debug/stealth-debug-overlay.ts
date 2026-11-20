import Phaser from 'phaser';
import type { ObstacleBounds } from '../core/math/geometry-types';
import type { Player } from '../entities/player/player';
import type { NpcController } from '../entities/npc/npc-controller';
import type { HrController } from '../entities/npc/hr-controller';
import { UI_FONT_FAMILY } from '../ui/text-style';

export class StealthDebugOverlay {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly toggleKey: Phaser.Input.Keyboard.Key;

  public constructor(
    scene: Phaser.Scene,
    private readonly occluders: readonly ObstacleBounds[],
    private enabled: boolean,
    private readonly available = true,
  ) {
    const keyboard = scene.input.keyboard;

    if (!keyboard) {
      throw new Error('Keyboard input is required for the stealth debug toggle.');
    }

    this.graphics = scene.add.graphics().setDepth(99_990);
    this.statusText = scene.add
      .text(942, 18, '', {
        fontFamily: UI_FONT_FAMILY,
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#8ecae6',
        backgroundColor: '#0b0f14dd',
        padding: { x: 8, y: 6 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100_010);
    this.toggleKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
    this.refreshStatusText();
  }

  public update(time: number, player: Player, npcController: NpcController, hrController?: HrController): void {
    if (!this.available) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.toggleKey)) {
      this.enabled = !this.enabled;
      this.refreshStatusText();
    }

    this.graphics.clear();

    if (!this.enabled) {
      return;
    }

    const npc = npcController.getNpc();
    const lastKnown = npcController.getLastKnownPosition();
    const pulseAlpha = 0.65 + Math.sin(time * 0.008) * 0.25;

    this.graphics.lineStyle(1, 0x80ed99, 0.48);
    for (const bounds of this.occluders) {
      this.graphics.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
    }

    this.graphics.lineStyle(2, 0x00b4d8, 0.95);
    if (player.body) {
      this.drawBody(player.body);
    }
    this.graphics.lineStyle(2, 0xff595e, 0.95);
    if (npc.body) {
      this.drawBody(npc.body);
    }

    this.graphics.lineStyle(1, 0xffffff, 0.35);
    for (const point of npcController.getVisionPoints()) {
      this.graphics.lineBetween(npc.x, npc.y, point.x, point.y);
    }

    if (lastKnown) {
      this.graphics.lineStyle(3, 0xff00ff, pulseAlpha);
      this.graphics.lineBetween(lastKnown.x - 12, lastKnown.y, lastKnown.x + 12, lastKnown.y);
      this.graphics.lineBetween(lastKnown.x, lastKnown.y - 12, lastKnown.x, lastKnown.y + 12);
      this.graphics.lineBetween(npc.x, npc.y, lastKnown.x, lastKnown.y);
    }

    if (hrController?.isEnabled()) {
      const hr = hrController.getNpc();
      const hrLastKnown = hrController.getLastKnownPosition();
      this.graphics.lineStyle(2, 0xc77dff, 0.95);
      if (hr.body) this.drawBody(hr.body);
      this.graphics.lineStyle(1, 0xe0aaff, 0.4);
      for (const point of hrController.getVisionPoints()) {
        this.graphics.lineBetween(hr.x, hr.y, point.x, point.y);
      }
      if (hrLastKnown) {
        this.graphics.lineStyle(3, 0xc77dff, pulseAlpha);
        this.graphics.strokeCircle(hrLastKnown.x, hrLastKnown.y, 12);
        this.graphics.lineBetween(hr.x, hr.y, hrLastKnown.x, hrLastKnown.y);
      }
    }

    const homeDebugKeys = import.meta.env.DEV
      ? '\nF6 SZPULA  F7 WYDRUK  F8 RESET DOMU'
      : '';
    const hrStatus = hrController?.isEnabled() ? `  |  HR: ${hrController.getState()}` : '';
    this.statusText.setText(`F3 DEBUG: ON  |  AI: ${npcController.getState()}${hrStatus}${homeDebugKeys}`);
  }

  public isEnabled(): boolean {
    return this.available && this.enabled;
  }

  public destroy(): void {
    this.graphics.destroy();
    this.statusText.destroy();
    this.toggleKey.destroy();
  }

  private drawBody(body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody): void {
    if ('x' in body && 'y' in body && 'width' in body && 'height' in body) {
      this.graphics.strokeRect(body.x, body.y, body.width, body.height);
    }
  }

  private refreshStatusText(): void {
    if (!this.available) {
      this.enabled = false;
      this.statusText.setVisible(false);
      return;
    }

    this.statusText.setText(this.enabled ? 'F3 DEBUG: ON' : 'F3 DEBUG: OFF');
    this.statusText.setColor(this.enabled ? '#8ecae6' : '#6c757d');
  }
}
