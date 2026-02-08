import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'gameContainer',
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [ GameScene ]
};

window.game = new Phaser.Game(config);

// Simple key mapping info
window.KEYS = { up: 'W', left: 'A', down: 'S', right: 'D', deploy: 'SPACE', start: 'ENTER' };
