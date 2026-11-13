import { Player } from '../obj/Player.js';

// Enemy paths for each enemy
const enemyPaths = [
    // Start with bottom right enemy
    { left: 1, right: 2, speed: 30 },
    { left: 1, right: 2, speed: 15 },
    { left: 1, right: 2, speed: 20 },
    { left: 2, right: 1, speed: 35 },
    { left: 0, right: 1, speed: 6.67 },
    { left: 2, right: 1, speed: 20 },
];

const jumpPadSpeed = 0.125;

export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        // Load
        this.load.tilemapTiledJSON('tilemap', 'assets/PeanutButter.tmj');
        this.load.spritesheet('tileset', 'assets/tilemap_packed.png', { frameWidth: 8, frameHeight: 8 });
        this.load.spritesheet('tileset_transparent', 'assets/tilemap_packed_transparent.png', { frameWidth: 8, frameHeight: 8 });

        // Load particles
        this.load.image('pb', 'assets/pb.png');
        this.load.image('jelly', 'assets/jelly.png');
        this.load.image('dash', 'assets/dash.png');
    }

    create() {
        const map = this.make.tilemap({ key: 'tilemap' });

        // tilesets
        const pico  = map.addTilesetImage('Pico', 'tileset');
        const transparent = map.addTilesetImage('tilemap_packed_transparent', 'tileset_transparent');
        const maps = [pico, transparent];

        // Layers
        const bg     = map.createLayer('BG', maps, 0, 0);
        const deco   = map.createLayer('Deco', maps, 0, 0);
        const blocks = map.createLayer('Blocks', maps, 0, 0);
        const spikes = map.createLayer('Spikes', maps, 0, 0);
        const objects = map.getObjectLayer('Objects');

        // Make all blocks solid
        blocks.setCollisionByExclusion([-1]);
        //spikes.setCollisionByExclusion([-1]);

        // Camera
        const cam = this.cameras.main;
        cam.setBackgroundColor('#a4816a');
        cam.setZoom(5);
        cam.centerOn(80, 400-(cam.height/10));

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
        let gid = objects.objects.find(x => x.name == 'player').gid % 150 - 92;
        let jumpImage = this.textures.getFrame('tileset_transparent', gid);
        //this.player.frame = gid;

        cam.startFollow(this.player, false, 0, 0.08, 0, 0);
        cam.setBounds(-cam.width / 32, 0, 0, map.heightInPixels);

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
        this.coinCount = 0;
        this.keyCount = 0;

        this.last_time = 0;

        // Inputs
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey('W');
        this.keyA = this.input.keyboard.addKey('A');
        this.keyD = this.input.keyboard.addKey('D');
        this.keyS = this.input.keyboard.addKey('S');
        this.keyC = this.input.keyboard.addKey('C');

        // Enemies
        // Loop through each enemy and set movement
        this.enemies.forEach((enemy, i) => {
            // Get path or use default path if undefined
            const { left, right, speed } = enemyPaths[i] ?? { left: 2, right: 2, speed: 20 };
            const startX = enemy.x - left * 8;
            const endX   = enemy.x + right * 8;

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
    }

    // Hide item when collected
    hideItem(item) {
        item.body.enable = false;
        item.setVisible(false);
    }

    // Bring item back when respawned
    showItem(item) {
        item.body.enable = true;
        item.setVisible(true);
    }
    
    killPlayer() {
        // Respawn player
        this.player.respawn();
        // Reset collected items
        this.coinGroup.getChildren().forEach(coin => this.showItem(coin));
        this.keys.getChildren().forEach(key => this.showItem(key));
        this.coinCount = 0;
        this.keyCount = 0;
    }

    update(time) {
        let dt = (time - this.last_time)/1000;
        this.last_time = time;

        if (dt > 0.1) {
            return;
        }

        if (this.keyC.isDown) this.player.checkpoint();
        
        let xDir = 0;
        if (this.cursors.left.isDown || this.keyA.isDown) xDir--;
        if (this.cursors.right.isDown || this.keyD.isDown) xDir++;

        let yDir = 0;
        if (this.cursors.down.isDown || this.keyS.isDown) yDir--;
        if (this.cursors.up.isDown || this.keyW.isDown) yDir++;

        this.player.update(dt, xDir, yDir, Phaser.Input.Keyboard.JustDown(this.cursors.space));
    }
}
