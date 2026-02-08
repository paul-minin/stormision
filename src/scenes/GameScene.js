export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  preload() {
    // load vehicle images. Prefer PNG if present, fall back to JPG or SVG.
    this.load.image('tiv1_png','/assets/vehicles/tiv1.png');
    this.load.image('tiv1_jpg','/assets/vehicles/tiv1.jpg');
    this.load.image('tiv1','/assets/vehicles/tiv1.svg');
    this.load.image('tiv2','/assets/vehicles/tiv2.svg');
    this.load.image('dom1','/assets/vehicles/dom1.svg');
    this.load.image('dom2','/assets/vehicles/dom2.svg');
    this.load.image('dom3','/assets/vehicles/dom3.svg');
  }

  create() {
    this.worldWidth = 2400; this.worldHeight = 1600;
    this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);
    this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);

    // Background grid
    const g = this.add.graphics(); g.lineStyle(1,0x333333);
    for (let x=0;x<this.worldWidth;x+=64) g.lineBetween(x,0,x,this.worldHeight);
    for (let y=0;y<this.worldHeight;y+=64) g.lineBetween(0,y,this.worldWidth,y);

    // player is created on spawn
    this.player = null;

    // center camera on map initially
    this.cameras.main.centerOn(this.worldWidth/2, this.worldHeight/2);

    // controls
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      deploy: Phaser.Input.Keyboard.KeyCodes.SPACE,
      start: Phaser.Input.Keyboard.KeyCodes.ENTER
    });

    // tornado group
    this.tornados = this.physics.add.group();

    // UI hooks (touch & start overlay)
    const startOverlayBtn = document.getElementById('startOverlayBtn');
    const startBtn2 = document.getElementById('startBtn2');
    const spawnBtn = document.getElementById('spawnBtn');
    const spawnClose = document.getElementById('spawnClose');

    if (startOverlayBtn) startOverlayBtn.onclick = () => this.enterGame();
    if (startBtn2) startBtn2.onclick = () => { if (!this.started) this.enterGame(); else this.startWave(); };
    if (spawnBtn) spawnBtn.onclick = () => this.showSpawnModal();
    if (spawnClose) spawnClose.onclick = () => this.hideSpawnModal();

    document.querySelectorAll('.spawn-option').forEach(b=> {
      b.onclick = (e) => { const v = e.currentTarget.dataset.vehicle; this.spawnVehicle(v); this.hideSpawnModal(); };
    });

    // vehicle select fallback
    const vehicleSelect = document.getElementById('vehicle');
    if (vehicleSelect) vehicleSelect.onchange = (e) => this.changeVehicle(e.target.value);

    // minimap: small camera top-left, hidden until start
    this.minimap = this.cameras.add(10, 10, 180, 120).setZoom(0.08).setName('mini');
    this.minimap.setBackgroundColor(0x071427);
    this.minimap.setVisible(false);

    // handle resizes so minimap and camera view keep correct positions
    this.scale.on('resize', this.onResize, this);
    this.onResize();

    // collisions - overlap handling will check for player existence
    this.physics.add.overlap(this.tornados, this.tornados, ()=>{});

    // spawn timer off by default
    this.waveActive = false;

    // HUD (hidden until start)
    this.hudText = this.add.text(10,10,'WASD = Move • SPACE = Deploy • ENTER = Start',{fontSize:'16px', color:'#fff'}).setScrollFactor(0).setVisible(false);

    // started flag
    this.started = false;
  }

  update(time,delta) {
    // handle input only after game started and player exists
    if (this.started && this.player) this.handleInput(delta);

    // update tornados - rotate sprite and simple movement
    this.tornados.getChildren().forEach(t=>{
      t.rotation += 0.01 * t.spin;
      t.x += Math.cos(t.dir)*t.speed*(delta/1000);
      t.y += Math.sin(t.dir)*t.speed*(delta/1000);
      // bounce on bounds to stay on map
      if (t.x<20||t.x>this.worldWidth-20) t.dir = Math.PI - t.dir;
      if (t.y<20||t.y>this.worldHeight-20) t.dir = -t.dir;
    });

    // keyboard start/deploy: Enter enters the game if not started, otherwise starts wave
    if (Phaser.Input.Keyboard.JustDown(this.keys.start)) {
      if (!this.started) this.enterGame(); else this.startWave();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.deploy)) this.attemptDeploy();

    // cleanup tornados out of map
    this.tornados.getChildren().forEach(t=>{
      if (t.x< -100 || t.y < -100 || t.x > this.worldWidth+100 || t.y > this.worldHeight+100) t.destroy();
    });
  }

  handleInput(delta){
    const p = this.player; p.body.setVelocity(0);
    if (this.keys.left.isDown) p.body.setVelocityX(-p.speed);
    if (this.keys.right.isDown) p.body.setVelocityX(p.speed);
    if (this.keys.up.isDown) p.body.setVelocityY(-p.speed);
    if (this.keys.down.isDown) p.body.setVelocityY(p.speed);
  }

  startWave(){
    if (this.waveActive) return;
    this.waveActive = true;
    // spawn some tornados randomly on roads (here: random points)
    for (let i=0;i<6;i++){ this.spawnTornado(); }
    // stop wave after 20s
    this.time.delayedCall(20000, ()=> this.waveActive=false);
  }

  spawnTornado(){
    const x = Phaser.Math.Between(100,this.worldWidth-100);
    const y = Phaser.Math.Between(100,this.worldHeight-100);
    const t = this.add.triangle(x,y, 0,-18, 16,10, -16,10, 0xff0000).setDepth(1);
    this.physics.add.existing(t);
    t.body.setCircle(14);
    t.body.setOffset(-14,-14);
    t.dir = Phaser.Math.FloatBetween(0,Math.PI*2);
    t.speed = Phaser.Math.Between(30,140);
    t.spin = Phaser.Math.FloatBetween(0.2,2);
    t.strength = Phaser.Math.Between(1,6); // 1..6 map to colors
    this.updateTornadoColor(t);
    this.tornados.add(t);
    return t;
  }

  updateTornadoColor(t){
    // green(1)->yellow(2-3)->red(4)->magenta(5)->black(6)
    const s = t.strength;
    let color = 0x00ff00;
    if (s<=1) color = 0x00ff00; else if (s<=3) color = 0xffff00; else if (s==4) color = 0xff5500; else if (s==5) color = 0xff00ff; else color = 0x000000;
    t.fillColor = color;
  }

  attemptDeploy(){
    // find nearest tornado within range
    const nearest = this.tornados.getChildren().reduce((best,t)=>{
      const d = Phaser.Math.Distance.Between(this.player.x,this.player.y,t.x,t.y);
      if (!best || d<best.d) return {t,d}; return best;
    }, null);
    if (!nearest || nearest.d>160) return; // out of deploy range
    const t = nearest.t;
    // check strength vs capacity
    if (t.strength > this.player.capacity){
      // vehicle gets ripped: simulate launch
      this.player.setTint(0xff9999);
      this.tweens.add({targets:this.player, y:this.player.y-300, duration:700, ease:'Cubic.easeOut', yoyo:true, onComplete:()=>{ this.player.clearTint(); this.player.x = Phaser.Math.Clamp(this.player.x+Phaser.Math.Between(-30,30), 50, this.worldWidth-50); this.player.y = Phaser.Math.Clamp(this.player.y+Phaser.Math.Between(-30,30), 50, this.worldHeight-50); }});
      t.strength = Math.max(1, t.strength-1); this.updateTornadoColor(t);
    } else {
      // intercept success — destroy tornado
      t.destroy();
    }
  }

  changeVehicle(key){
    const mapping = { tiv1:{speed:220,cap:2}, tiv2:{speed:240,cap:3}, dom1:{speed:180,cap:1}, dom2:{speed:200,cap:2}, dom3:{speed:160,cap:4} };
    const m = mapping[key] || mapping.tiv1;
    if (this.player) {
      const tex = (key === 'tiv1' && this.textures.exists('tiv1_png')) ? 'tiv1_png' : key;
      this.player.setTexture(tex);
      this.player.setDisplaySize(64,64);
      this.player.speed = m.speed; this.player.capacity = m.cap;
    }
  }

  // Called when user presses Start on overlay
  enterGame(){
    if (this.started) return;
    this.started = true;
    const overlay = document.getElementById('startOverlay'); if (overlay) overlay.style.display='none';
    const ui = document.getElementById('ui'); if (ui) ui.style.display='block';
    const touch = document.getElementById('touchButtons'); if (touch) touch.style.display='flex';
    // show minimap camera (no DOM element)
    this.minimap.setVisible(true);
    this.hudText.setVisible(true);
    // center camera on map when entering
    this.cameras.main.centerOn(this.worldWidth/2, this.worldHeight/2);
    document.getElementById('spawnBtn').style.display = 'inline-block';
  }

  showSpawnModal(){
    const m = document.getElementById('spawnModal'); if (m) m.style.display='block';
  }
  hideSpawnModal(){
    const m = document.getElementById('spawnModal'); if (m) m.style.display='none';
  }

  spawnVehicle(type){
    // spawn at center of camera view (use world center of main camera)
    const cam = this.cameras.main;
    const x = cam.worldView.x + cam.worldView.width / 2;
    const y = cam.worldView.y + cam.worldView.height / 2;
    if (this.player) { this.player.destroy(); this.player = null; }
    // if tiv1 PNG exists prefer it, otherwise use the key as given
    const textureKey = (type === 'tiv1' && this.textures.exists('tiv1_png')) ? 'tiv1_png' : type;
    this.player = this.physics.add.sprite(x,y,textureKey).setDepth(2);
    this.player.setCollideWorldBounds(true);
    // make vehicles uniform size
    this.player.setDisplaySize(64,64);
    const mapping = { tiv1:{speed:220,cap:2}, tiv2:{speed:240,cap:3}, dom1:{speed:180,cap:1}, dom2:{speed:200,cap:2}, dom3:{speed:160,cap:4} };
    const m = mapping[type] || mapping.tiv1;
    this.player.speed = m.speed; this.player.capacity = m.cap;
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    if (this.minimap) this.minimap.startFollow(this.player, true);
    // ensure spawn UI hides
    this.hideSpawnModal();
  }

  onResize(gameSize, baseSize, displaySize, previousSize){
    // reposition minimap top-left at (10,10) with fixed size; called on scale resize
    const mmW = 180; const mmH = 120; const pad = 10;
    if (this.minimap) this.minimap.setViewport(pad, pad, mmW, mmH);
    // ensure HUD text stays visible (scrollFactor 0 keeps it in place)
    if (this.hudText) this.hudText.setScrollFactor(0);
  }
}
