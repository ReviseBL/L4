import Phaser from 'phaser';
import type { HomeProgressionView } from '../entities/interactables/home-progression-view';
import type { Printer3DView } from '../entities/interactables/printer-3d-view';
import type { GameHud } from '../ui/game-hud';
import type { HomeProgressionSystem } from '../systems/home-progression-system';
import type { Printer3DSystem } from '../systems/printer-3d-system';

export class HomeProgressionDebugControls {
  private readonly addSpoolKeys: readonly Phaser.Input.Keyboard.Key[];
  private readonly completePrintKeys: readonly Phaser.Input.Keyboard.Key[];
  private readonly resetKeys: readonly Phaser.Input.Keyboard.Key[];

  public constructor(
    scene: Phaser.Scene,
    private readonly homeProgression: HomeProgressionSystem,
    private readonly homeView: HomeProgressionView,
    private readonly printer: Printer3DSystem,
    private readonly printerView: Printer3DView,
    private readonly hud: GameHud,
    private readonly onChanged: () => void,
  ) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required for home progression debug controls.');
    }

    this.addSpoolKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F6)];
    this.completePrintKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F7)];
    this.resetKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F8)];
  }

  public update(): void {
    if (this.consumeAny(this.addSpoolKeys)) {
      this.homeProgression.addFilamentSpool('petg');
      this.synchronize('DEBUG: DODANO SZPULĘ PETG');
    }

    if (this.consumeAny(this.completePrintKeys)) {
      const job = this.printer.completePrint('cable-holder');
      this.homeProgression.completePrint('cable-holder');
      this.printerView.completePrinting(job);
      this.synchronize('DEBUG: UCHWYT DO KABLA GOTOWY');
    }

    if (this.consumeAny(this.resetKeys)) {
      this.homeProgression.reset();
      this.printer.reset();
      this.printerView.reset();
      this.synchronize('DEBUG: PROGRES MIESZKANIA ZRESETOWANY');
    }
  }

  public destroy(): void {
    for (const key of [...this.addSpoolKeys, ...this.completePrintKeys, ...this.resetKeys]) {
      key.destroy();
    }
  }

  private synchronize(message: string): void {
    this.homeView.synchronize(this.homeProgression.getVisibleDefinitions());
    this.onChanged();
    this.hud.showMessage(message);
  }

  private consumeAny(keys: readonly Phaser.Input.Keyboard.Key[]): boolean {
    return keys.some((key) => Phaser.Input.Keyboard.JustDown(key));
  }
}
