// Entry point: registers every scene and boots Phaser.
import { GAME_W, GAME_H } from './config.js';
import { state } from './core/state.js';
import { audio } from './core/audio.js';
import { STAGE } from './story.js';
import { BootScene, MenuScene, IntroScene } from './scenes/menu.js';
import { TravelScene, EndingScene } from './scenes/cinematics.js';
import { PauseScene, JournalScene, MapScene, GameOverScene } from './scenes/overlays.js';
import { RomeScene } from './scenes/levels/rome.js';
import { BarScene } from './scenes/levels/bar.js';
import { ApartmentScene } from './scenes/levels/apartment.js';
import { PortScene } from './scenes/levels/port.js';
import { QuesturaScene } from './scenes/levels/questura.js';
import { VillaScene } from './scenes/levels/villa.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#100d0d',
  pixelArt: true,
  roundPixels: true,
  input: { gamepad: true },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 2200 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene, MenuScene, IntroScene, TravelScene, EndingScene,
    RomeScene, BarScene, ApartmentScene, PortScene, QuesturaScene, VillaScene,
    PauseScene, JournalScene, MapScene, GameOverScene
  ]
};

const game = new Phaser.Game(config);

// Development hooks: open the game with ?dev to jump between chapters from
// the browser console, e.g. SANGUE.warp('port', STAGE.INFILTRATE_PORT).
if (new URLSearchParams(window.location.search).has('dev')) {
  window.SANGUE = {
    game, state, audio, STAGE,
    warp(scene, stage, entry = 'start') {
      if (Number.isInteger(stage)) state.stage = stage;
      game.scene.getScenes(true).forEach((s) => game.scene.stop(s.scene.key));
      game.scene.start(scene, { entry });
    }
  };
}
