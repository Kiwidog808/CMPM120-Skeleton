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

    for (const obj of objects.objects) {
        // Link object to sprite
        const frame = (obj.gid - 1) % 150;

        // Center sprite
        const x = obj.x + 4;
        const y = obj.y - 4;

        // Grab sprite from 'tileset_transparent'
        const sprite = this.add.sprite(x, y, 'tileset_transparent', frame);
    }
}

    update(time) {
        let dt = (time - this.last_time)/1000;
        this.last_time = time;
        
    }
    
}
