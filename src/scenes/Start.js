import { Player } from '../obj/Player.js';

// Enemy paths for each enemy

const jumpPadSpeed = 0.125;

const coinPoints = 100;
const starPoints = 500;

export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    init(data) {
        // Set level key to load, default to Start
        this.levelKey = data.level ?? 'Start';
        this.isPractice = data.isPractice;
        // Carry over score
        this.startCoins = data.coinCount ?? 0;
        this.startStars = data.starCount ?? 0;
        // Reset when spawning into start
        if (this.levelKey == 'Start') {        
            this.startCoins = 0;
            this.startStars = 0;
        }
    }

    preload() {
        // Load
        this.load.tilemapTiledJSON('Start', 'assets/Start.tmj');
        this.load.tilemapTiledJSON('PeanutButter', 'assets/PeanutButter.tmj');
        this.load.tilemapTiledJSON('Jelly', 'assets/Jelly.tmj');
        this.load.tilemapTiledJSON('End', 'assets/end.tmj');
        this.load.spritesheet('tileset', 'assets/tilemap_packed.png', { frameWidth: 8, frameHeight: 8 });
        this.load.spritesheet('tileset_transparent', 'assets/tilemap_packed_transparent.png', { frameWidth: 8, frameHeight: 8 });
        this.load.spritesheet('tileset_colorDif', 'assets/tilemap_colorDif.png', { frameWidth: 8, frameHeight: 8 });

        // Load particles
        this.load.image('pb', 'assets/pb.png');
        this.load.image('jelly', 'assets/jelly.png');
        this.load.image('ground', 'assets/ground.png');
        this.load.image('dash', 'assets/dash.png');
        
        // Load checkpoint
        this.load.image('checkpoint', 'assets/checkpoint.png');
    }

    create() {
        // Set map using levelKey
        console.log('loading level:', this.levelKey);
        const map = this.make.tilemap({ key: this.levelKey });

        // tilesets
        const pico  = map.addTilesetImage('Pico', 'tileset');
        const transparent = map.addTilesetImage('tilemap_packed_transparent', 'tileset_transparent');
        const grayscale = map.addTilesetImage('grayscale', 'tileset_colorDif');
        const maps = [pico, transparent, grayscale];

        // Layers
        const bg = map.createLayer('BG', maps, 0, 0);
        const deco = map.createLayer('Deco', maps, 0, 0);
        const blocks = map.createLayer('Blocks', maps, 0, 0);
        const spikes = map.createLayer('Spikes', maps, 0, 0);
        const objects = map.getObjectLayer('Objects');
        const platforms = map.createLayer('Platforms', maps, 0, 0);

        // Make all blocks solid
        blocks.setCollisionByExclusion([-1]);

        // Camera
        const cam = this.cameras.main;
        cam.setBackgroundColor('#a4816a');
        cam.setZoom(5);
        cam.centerOn(80, 400-(cam.height/10));

        // Checkpoint obj
        this.checkpointObj = new Phaser.GameObjects.Sprite(this, 0, 0, 'checkpoint');
        this.add.existing(this.checkpointObj);

        // Set depth of bg, deco, and flag so that flag is behind blocks
        bg.setDepth(-2);
        deco.setDepth(-2);
        this.checkpointObj.setDepth(-1);

        // Objects
        this.coins = map.createFromObjects('Objects', { 
            name: 'coin', 
        });
        this.keys = map.createFromObjects('Objects', { 
            name: 'key', 
        });
        this.jumpPads = map.createFromObjects('Objects', { 
            name: 'jumpPad', 
        });
        this.exit = map.createFromObjects('Objects', { 
            name: 'exit', 
        });
        this.signs = map.createFromObjects('Objects', { 
            name: 'sign', 
        });
        this.enemies = map.createFromObjects('Objects', { 
            name: 'enemy', 
        });
        this.locks = map.createFromObjects('Objects', { 
            name: 'lock', 
        });
        this.checkpoints = map.createFromObjects('Objects', { 
            name: 'checkpoint', 
        });
        this.stars = map.createFromObjects('Objects', { 
            name: 'star', 
        });
        this.player = map.createFromObjects('Objects', { 
            name: 'player', 
            classType: Player
        })[0];

        cam.startFollow(this.player, false, 0, 0.08, 0, 0);
        const viewWidth = cam.width / cam.zoom;
        cam.setBounds(map.widthInPixels / 2 - viewWidth / 2, 0, viewWidth, map.heightInPixels);

        // Physics
        this.physics.add.existing(this.player);
        this.physics.add.collider(blocks, this.player);

        // Spike hitboxes
        spikes.forEachTile((tile) => {
            if (tile.index == -1) return;

            let hitbox = this.add.zone(tile.x * 8 + 4, tile.y * 8 + 4, 3, 3);
            this.physics.add.existing(hitbox);
            this.physics.add.overlap(hitbox, this.player, () => {
                this.killPlayer();
            });
        });

        // Platforms
        if (platforms) {
            platforms.setCollisionByExclusion([-1]);
            // Only top face of platform has collision
            platforms.forEachTile(tile => {
                tile.collideLeft = false;
                tile.collideRight = false;
                tile.collideDown = false;
            });
            this.physics.add.collider(this.player, platforms, null, (player, tile) => {
                // Collide only if the player is falling/standing and is above the tile
                const wasAbove = player.body.prev.y + player.body.height <= tile.pixelY + 1;
                return player.body.velocity.y >= 0 && wasAbove;
            });
        }

        // Lock hitboxes
        this.locks.forEach(lock => {
            // Get width and height from object
            const width = lock.getData('blockWidth') ?? lock.displayWidth;
            const height = lock.getData('blockHeight') ?? lock.displayHeight;

            // Create a hitbox in the center of the lock
            const center = lock.getCenter();
            const blocker = this.add.zone(center.x, center.y, width - 5, height);
            this.physics.add.existing(blocker, true); 
            lock.blocker = blocker;

            // Open lock when player overlaps with blocker
            this.physics.add.collider(this.player, blocker, () => {
                if (this.keyCount > 0) {
                    this.keyCount--;
                    this.openLock(lock);
                    this.updateScore();
                }
            });
        });

        // Kill player on enemy collision
        this.physics.add.overlap(this.enemies, this.player, () => {
            this.killPlayer();
        });

        // Player hitbox
        this.player.body.setSize(4, 6);
        this.player.body.setOffset(2, 2);

        this.player.init(objects.objects.find(obj => obj.name === 'player').properties);
        this.player.checkpoint(true);

        // World border
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.player.body.setCollideWorldBounds(true);

        // Game stats
        this.coinCount = this.startCoins;
        this.starCount = this.startStars;
        this.keyCount = 0;
        this.checkpointCount = this.isPractice ? 100 : 0;

        // Saved game stats
        // Items currently collected
        this.collected = new Set();
        // Items saved
        this.savedCollected = new Set();
        this.savedCoinCount = this.startCoins;
        this.savedStarCount = this.startStars;
        this.savedKeyCount = 0;
        this.savedCheckpointCount = this.checkpointCount;

        this.last_time = 0;

        // Inputs
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey('W');
        this.keyA = this.input.keyboard.addKey('A');
        this.keyD = this.input.keyboard.addKey('D');
        this.keyS = this.input.keyboard.addKey('S');
        this.keyC = this.input.keyboard.addKey('C');
        this.keyE = this.input.keyboard.addKey('E');
        this.keyR = this.input.keyboard.addKey('R');
        this.key0 = this.input.keyboard.addKey('ZERO');

        // Signs
        this.signGroup = this.physics.add.staticGroup(this.signs);
        this.signGroup.getChildren().forEach(sign => sign.body.setSize(6, 6));
        this.physics.add.overlap(this.player, this.signs, (player, sign) => {
            this.hitSign(sign.data.list.text);
        });

        // Enemies
        // Loop through each enemy and set movement
        this.enemies.forEach((enemy, i) => {
            let left = enemy.data.list.left;
            let right = enemy.data.list.right;
            let speed = enemy.data.list.speed;
            
            let startX = enemy.x - left * 8;
            let endX   = enemy.x + right * 8;

            // Enemy physics
            this.physics.add.existing(enemy);
            enemy.body.setSize(5, 5);
            enemy.body.setAllowGravity(false);
            // Start at left end of path
            enemy.x = startX;

            // Tween to move
            this.tweens.add({
                targets: enemy,
                // End
                x: endX,
                // Distance/speed seconds
                duration: (endX - startX) / speed * 1000,
                // Loop back to start
                yoyo: true,
                // Repeat forever
                repeat: -1,
            });
        });

        // Coins
        this.coinGroup = this.physics.add.staticGroup(this.coins);
        // Smaller hitbox
        this.coinGroup.getChildren().forEach(coin => coin.body.setSize(4, 4));
        // Check for overlap between player and coins
        this.physics.add.overlap(this.player, this.coinGroup, (player, coin) => {
            // If overlap, collect coin and increment coin count
            this.hideItem(coin);
            this.coinCount++;
            this.updateScore();
        });

        // Keys
        this.keys = this.physics.add.staticGroup(this.keys);
        // Smaller hitbox
        this.keys.getChildren().forEach(key => key.body.setSize(5, 5));
        // Check for overlap between player and keys
        this.physics.add.overlap(this.player, this.keys, (player, key) => {
            // If overlap, collect key and increment key count
            this.hideItem(key);
            this.keyCount++;
            this.updateScore();
        });

        // Stars
        this.stars = this.physics.add.staticGroup(this.stars);
        // Smaller hitbox
        this.stars.getChildren().forEach(star => star.body.setSize(4, 4));
        // Check for overlap between player and stars
        this.physics.add.overlap(this.player, this.stars, (player, star) => {
            // If overlap, collect star and increment star count
            this.hideItem(star); 
            this.starCount++;
            this.updateScore();
        });

        // Jump pads
        // Make jump pad hitboxes
        this.jumpPadZones = this.jumpPads.map((pad) => {
            let zone = this.add.zone(pad.x, pad.y + 2, 6, 4);
            this.physics.add.existing(zone, true);
            return zone;
        });
        // Jump pad overlap
        this.physics.add.overlap(this.player, this.jumpPadZones, (player) => {
            player.body.velocity.y = -jumpPadSpeed * 1000;
            // Reset dash
            player.dashCount = 1;
        });

        // Checkpoints
        this.checkpointGroup = this.physics.add.staticGroup(this.checkpoints);
        // Smaller hitbox
        this.checkpointGroup.getChildren().forEach(cp => cp.body.setSize(5, 5));
        // Collecting a checkpoint gives the player one placement
        this.physics.add.overlap(this.player, this.checkpointGroup, (player, cp) => {
            this.hideItem(cp);
            this.checkpointCount += 1;
            this.updateScore();
        });
        console.log(this.isPractice);
        // Exit
        this.exitGroup = this.physics.add.staticGroup(this.exit);
        this.exitGroup.getChildren().forEach(exit => exit.body.setSize(8, 5));
        this.physics.add.overlap(this.player, this.exitGroup, (player, exit) => {
            // Restart scene with new level (set coins and stars to saved values)
            this.scene.restart({
                level: this.isPractice ? 'Start' : exit.data.list.level,
                isPractice: exit.data.list.isPractice,
                coinCount: this.coinCount,
                starCount: this.starCount,
            });
        });

        // UI
        this.signText = this.add.text(640, 360, '', {
            fontFamily: 'monospace',
            fontSize: '50px',
            align: 'center',
            color: '#ffffff',
            backgroundColor: '#00000088'
        }).setOrigin(0.5);
        this.scoreText = this.add.text(8, 8, '', {
            fontFamily: 'monospace',
            fontSize: '25px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
        });
        this.updateScore();

        // Set UI camera
        this.uiCam = this.cameras.add(0, 0, cam.width, cam.height);
        // Don't show everything except scoreText
        this.uiCam.ignore(this.children.list.filter(obj => obj !== this.scoreText && obj != this.signText));
        // Don't show scoreText in main camera
        cam.ignore(this.scoreText);
        cam.ignore(this.signText);
    }

    // Hide item when collected
    hideItem(item) {
        item.body.enable = false;
        item.setVisible(false);
        // Add item to collected set
        this.collected.add(item);
    }

    // Bring item back when respawned
    showItem(item) {
        item.body.enable = true;
        item.setVisible(true);
        // Delete item from collected set
        this.collected.delete(item);
    }

    // Open lock when player overlaps
    openLock(lock) {
        lock.setVisible(false);
        lock.blocker.body.enable = false;
        // Track it so checkpoints save opened locks
        this.collected.add(lock);
    }

    // Close lock when respawned
    closeLock(lock) {
            lock.setVisible(true);
            lock.blocker.body.enable = true;
            this.collected.delete(lock);
        }
    
    saveProgress() {
        // Update saved game stats
        this.savedCollected = new Set(this.collected);
        this.savedCoinCount = this.coinCount;
        this.savedStarCount = this.starCount;
        this.savedKeyCount = this.keyCount;
        this.savedCheckpointCount = this.checkpointCount;
    }

    hitSign(text) {
        if (this.keyE.isDown) { // check sign interaction
            this.signText.setText(text); // set sign text
        }
    }

    killPlayer() {
        // Respawn player
        this.player.respawn();

        // Restore all items that were not saved at checkpoint
        const restore = (item) => {
            if (!this.savedCollected.has(item)) this.showItem(item);
        };
        
        // Reset collected items
        this.coinGroup.getChildren().forEach(restore);
        this.keys.getChildren().forEach(restore);
        this.stars.getChildren().forEach(restore);
        this.checkpointGroup.getChildren().forEach(restore);
        // Revert to saved collected items
        this.coinCount = this.savedCoinCount;
        this.keyCount = this.savedKeyCount;
        this.starCount = this.savedStarCount;
        this.checkpointCount = this.savedCheckpointCount;
        this.updateScore();

        // Close locks that weren't saved
        this.locks.forEach(lock => {
            if (!this.savedCollected.has(lock)) this.closeLock(lock);
        });
    }

    getScore() {
        // Compute score based on coins and stars
        return this.coinCount * coinPoints + this.starCount * starPoints;
    }

    updateScore() {
        // Update score text
        this.scoreText.setText('Score: ' + this.getScore() + '\nCheckpoints: ' + this.checkpointCount + '\nKeys: ' + this.keyCount);
    }

    update(time) {
        let dt = (time - this.last_time)/1000;
        this.last_time = time;

        if (dt > 0.1) {
            // cap lower fps physics
            dt = 0.1;
        }

        // Playtesting Checkpoints
        //if (this.keyC.isDown && this.player.checkpoint()) this.saveProgress();
        if (this.checkpointCount > 0 && Phaser.Input.Keyboard.JustDown(this.keyC) && this.player.checkpoint()) {
            this.checkpointCount--;
            this.saveProgress();
            this.updateScore();
        }
        
        let xDir = 0;
        if (this.cursors.left.isDown || this.keyA.isDown) xDir--;
        if (this.cursors.right.isDown || this.keyD.isDown) xDir++;

        let yDir = 0;
        if (this.cursors.down.isDown || this.keyS.isDown) yDir--;
        if (this.cursors.up.isDown || this.keyW.isDown) yDir++;

        this.player.update(dt, xDir, yDir, Phaser.Input.Keyboard.JustDown(this.cursors.space));

        if (!this.keyE.isDown) {
            this.signText.setText('');
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
            this.killPlayer();
        }

        if (Phaser.Input.Keyboard.JustDown(this.key0)) {
            this.scene.restart({
                level: 'Start',
                isPractice: false,
                coinCount: 0,
                starCount: 0,
            });
        }
    }
}
