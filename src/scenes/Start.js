import { Player } from '../obj/Player.js';

// Enemy paths for each enemy
const enemyPaths = [
    // Start with bottom right enemy
    { left: 1, right: 2, speed: 30 },
    { left: 1, right: 2, speed: 15 },
    { left: 1, right: 2, speed: 20 },
    { left: 2, right: 1, speed: 25 },
    { left: 1, right: 1, speed: 20 },
    { left: 2, right: 1, speed: 20 },
];

export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        // Load
        this.load.tilemapTiledJSON('tilemap', 'assets/PeanutButter.tmj');
        this.load.spritesheet('tileset', 'assets/tilemap_packed.png', { frameWidth: 8, frameHeight: 8 });
        this.load.spritesheet('tileset_transparent', 'assets/tilemap_packed_transparent.png', { frameWidth: 8, frameHeight: 8 });
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
        spikes.setCollisionByExclusion([-1]);

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
cam.width
        cam.startFollow(this.player, true, 0, 0.08, 0, 0);
        cam.setBounds(-cam.width / 32, 0, 0, map.heightInPixels);

        // Physics
        this.physics.add.existing(this.player);
        this.physics.add.collider(blocks, this.player);

        this.physics.add.collider(spikes, this.player, () => {
            this.player.respawn();
        });

        this.physics.add.overlap(this.enemies, this.player, () => {
            this.player.respawn();
        });

        this.player.body.setSize(4, 6);
        this.player.body.setOffset(2, 2);

        this.player.checkpoint(this.player.x, this.player.y);

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

        // Enemies
        // Loop through each enemy and set movement
        this.enemies.forEach((enemy, i) => {
            // Get path or use default path if undefined
            const { left, right, speed } = enemyPaths[i] ?? { left: 2, right: 2, speed: 20 };
            const startX = enemy.x - left * 8;
            const endX   = enemy.x + right * 8;

            // Enemy physics
            this.physics.add.existing(enemy);
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
        // Check for overlap between player and coins
        this.physics.add.overlap(this.player, this.coinGroup, (player, coin) => {
            // If overlap, collect coin and increment coin count
            coin.destroy();
            this.coinCount++;
        });
    }

    update(time) {
        let dt = (time - this.last_time)/1000;
        this.last_time = time;

        if (dt > 0.1) {
            return; // prevent lag spikes from sending the player into the ground
        }
        
        let xDir = 0;
        if (this.cursors.left.isDown || this.keyA.isDown) xDir--;
        if (this.cursors.right.isDown || this.keyD.isDown) xDir++;

        let yDir = 0;
        if (this.cursors.down.isDown || this.keyS.isDown) yDir--;
        if (this.cursors.up.isDown || this.keyW.isDown) yDir++;

        this.player.update(dt, xDir, yDir, Phaser.Input.Keyboard.JustDown(this.cursors.space));
    }
}
