import { Player } from '../obj/Player.js';

export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.tilemapTiledJSON('tilemap', 'assets/PeanutButter.tmj');
        this.load.spritesheet('tileset', 'assets/tilemap_packed.png', { frameWidth: 8, frameHeight: 8 });
        this.load.spritesheet('tileset_transparent', 'assets/tilemap_packed_transparent.png', { frameWidth: 8, frameHeight: 8 });
    }

    create() {
    const map = this.make.tilemap({ key: 'tilemap' });

    const pico  = map.addTilesetImage('Pico', 'tileset');
    const transparent = map.addTilesetImage('tilemap_packed_transparent', 'tileset_transparent');
    const maps = [pico, transparent];

    const bg     = map.createLayer('BG', maps, 0, 0);
    const deco   = map.createLayer('Deco', maps, 0, 0);
    const blocks = map.createLayer('Blocks', maps, 0, 0);
    const spikes = map.createLayer('Spikes', maps, 0, 0);
    const objects = map.getObjectLayer('Objects');

    // Make all blocks solid
    blocks.setCollisionByExclusion([-1]);

    const cam = this.cameras.main;
    cam.setBackgroundColor('#a4816a');
    cam.setZoom(5);
    cam.centerOn(80, 400-(cam.height/10));

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

    this.player.cam = cam;

    this.physics.add.existing(this.player);
    this.physics.add.collider(blocks, this.player);

    this.last_time = 0;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey('W');
    this.keyA = this.input.keyboard.addKey('A');
    this.keyD = this.input.keyboard.addKey('D');
    this.keyS = this.input.keyboard.addKey('S');
}

    update(time) {
        let dt = (time - this.last_time)/1000;
        this.last_time = time;
        
        let xDir = 0;
        if (this.cursors.left.isDown || this.keyA.isDown) xDir--;
        if (this.cursors.right.isDown || this.keyD.isDown) xDir++;

        let yDir = 0;
        if (this.cursors.down.isDown || this.keyS.isDown) xDir--;
        if (this.cursors.up.isDown || this.keyW.isDown) xDir++;

        this.player.update(dt, xDir, yDir, Phaser.Input.Keyboard.JustDown(this.cursors.space));
    }
    
}
