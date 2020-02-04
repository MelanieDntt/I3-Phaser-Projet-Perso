const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 400,
        debug: false
      }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);
let player, sky, picots, porte, plantes, barrieres, platform;
let gameOver = false;

/*---------------------------------- PRELOAD ----------------------------------*/
function preload() {
  this.load.spritesheet("cat", "./assets/img/cat.png", {
    frameWidth: 34.11,
    frameHeight: 29
  });

  this.load.image("sky", "./assets/img/sky.png");

  this.load.image("tiles", "./assets/img/tile.png");
  this.load.image("picots", "./assets/img/picots.png");
  this.load.image("porte", "./assets/img/porte.png");
  this.load.image("plantes", "./assets/img/plante.png");
  this.load.image("barrieres", "./assets/img/barriere.png");
  this.load.image("platform", "./assets/img/platform.png");

  this.load.tilemapTiledJSON("backgroundMap", "background.json");
}

/*---------------------------------- CREATE ----------------------------------*/
function create() {
  sky = this.add.image(400, 200, "sky");

  cursors = this.input.keyboard.createCursorKeys();

  player = this.physics.add.sprite(50, 350, "cat");
  player.setBounce(0.1);
  player.setDepth(1);
  player.body.setSize(player.width - 22, player.height).setOffset(22, 0);

  this.anims.create({
    key: "catLeft",
    frames: this.anims.generateFrameNumbers("cat", {
      start: 0,
      end: 2
    }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: "catRight",
    frames: this.anims.generateFrameNumbers("cat", {
      start: 4,
      end: 6
    }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: "catStop",
    frames: [{ key: "cat", frame: 3 }],
    frameRate: 20,
    repeat: -1
  });

  picots = this.physics.add.group({
    allowGravity: false,
    immovable: true
  });

  plantes = this.physics.add.group({
    allowGravity: false,
    immovable: true
  });

  barrieres = this.physics.add.group({
    allowGravity: false,
    immovable: true
  });

  // BACKGROUND
  const map = this.make.tilemap({ key: "backgroundMap" });
  var tiles = map.addTilesetImage("Parc", "tiles", 64, 64, 0, 0);
  var layer = map.createStaticLayer(0, tiles, 0, 0);

  // Every tile in our map was given an index by Tiled to reference what should be shown there.
  // An index of our platform can only be greater than 0.
  // setCollisionByExclusion tells Phaser to enable collisions for every tile whose index isn't -1, therefore, all tiles.
  layer.setCollisionByExclusion(-1, true);
  this.physics.add.collider(player, layer);

  // set bounds so the camera won't go outside the game world
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  // make the camera follow the player
  this.cameras.main.startFollow(player);
  // background
  // this.cameras.main.setBackgroundColor("#87CEEB");

  // pour garder le background ciel quand la caméra bouge
  sky.setScrollFactor(0);

  // Picots
  const picotsObjects = map.getObjectLayer("Picots")["objects"];
  picotsObjects.forEach(picotsObject => {
    const spike = picots
      .create(picotsObject.x, picotsObject.y - picotsObject.height, "picots")
      .setOrigin(0, 0);
    spike.body.setSize(picots.width - 10, picots.height - 35).setOffset(10, 35);
  });

  // Porte
  const door = map.getObjectLayer("Porte")["objects"];
  porte = this.physics.add
    .image(2500, 450, "porte")
    .setOrigin(0, 0)
    .setImmovable(true);
  porte.body.setAllowGravity(false);

  // Plantes
  const plantesObjects = map.getObjectLayer("DecorPlante")["objects"];
  plantesObjects.forEach(planteObject => {
    const plante = plantes
      .create(planteObject.x, planteObject.y - planteObject.height, "plantes")
      .setOrigin(0, 0);
  });

  // Barrières
  const barrieresObjects = map.getObjectLayer("DecorBarriere")["objects"];
  barrieresObjects.forEach(barriereObject => {
    const barriere = barrieres
      .create(
        barriereObject.x,
        barriereObject.y - barriereObject.height,
        "barrieres"
      )
      .setOrigin(0, 0);
  });
  // 1380
  platform = this.physics.add.image(1295, 295, "platform").setImmovable(true);
  platform.body.setAllowGravity(false);
  platform.setVelocityX(100);
  this.physics.add.collider(player, platform, playerJump);
  // TWEENS
  // this.tweens.add({
  //   targets: platform,
  //   x: 1650,
  //   duration: 3000,
  //   ease: "linear",
  //   yoyo: true,
  //   repeat: -1
  // });
}

/*---------------------------------- UPDATE ----------------------------------*/
function update() {
  if (gameOver) {
    return;
  }

  if (cursors.left.isDown) {
    player.setVelocityX(-120);
    player.anims.play("catLeft", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(120);
    player.anims.play("catRight", true);
  } else {
    player.setVelocityX(0);
    player.anims.play("catStop", true);
  }
  if ((cursors.space.isDown || cursors.up.isDown) && player.body.blocked.down) {
    player.setVelocityY(-300);
  }
  if (player.x < 20) player.x = 20;
  if (player.x > 2560) player.x = 2560;

  // Platform velocity
  if (platform.x < 1290) platform.setVelocityX(100);
  if (platform.x > 1650) platform.setVelocityX(-100);

  // Vérifier si collision entre le player et les picots en faisant appel à la fonction playerHit
  this.physics.add.collider(player, picots, playerHit, null, this);

  // Verifier si collision entre le player et la porte en faisant appel à la fonction playerWin
  this.physics.add.collider(player, porte, playerWin, null, this);
}

function playerHit(_player, _picots) {
  this.physics.pause();
  _player.setVelocity(0, 0);
  _player.alpha = 0.4;
  player.anims.play("catStop", true);
  gameOver = true;
  setTimeout(function() {
    location.replace("./lost.html");
  }, 1000);
}

function playerWin(_player, _porte) {
  this.physics.pause();
  _player.setVelocity(0, 0);
  player.anims.play("catStop", true);
  gameOver = true;
  setTimeout(function() {
    location.replace("./win.html");
  }, 1000);
}

function playerJump() {
  if (cursors.space.isDown || cursors.up.isDown) {
    player.setVelocityY(-300);
  }
}
