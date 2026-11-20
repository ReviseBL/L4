import Phaser from 'phaser';
import { gameConfig } from './game-config';
import { installCrispText } from './text-rendering';

export function createGame(): Phaser.Game {
  installCrispText();
  return new Phaser.Game(gameConfig);
}
