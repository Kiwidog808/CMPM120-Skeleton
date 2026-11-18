export class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, image) {
        super(scene, x, y, image);

        scene.add.existing(this);
    }
    
    init(data) {
        this.friction = data.find(x => x.name == 'friction').value // 10;
        this.speed = data.find(x => x.name == 'speed').value // 0.25;
        this.airSpeed = 20;
        this.maxSpeed = data.find(x => x.name == 'maxSpeed').value // 0.025;
        this.airMaxSpeed = 0.05;
        this.jumpSpeed = data.find(x => x.name == 'jump').value // 0.075;
        this.dashSpeed = 0.115;
        this.gravity = 0.3;
        this.gravCap = 0.2;
        this.cyoteTime = 0.15;
        this.curCyoteBuffer = 0;
        this.dashCount = 1;
        this.startFrame = this.frame.name;
        this.airTime = 0;
        this.walkSfxSpeed = 100;
        this.walkT = 0;

        // Particles
        const particle = data.find(x => x.name === 'particle');
        // Choose particle based on level
        const particleKey = particle ? particle.value : 'pb';
        this.landingParticles = this.scene.add.particles(0, 0, particleKey, {
            emitting: false,
            speed: { min: 15, max: 45 },
            // Cone upward
            angle: { min: 200, max: 340 },
            gravityY: 150,
            lifespan: { min: 250, max: 450 },
            // See 0.5 of the particle, then scale down to 0
            scale: { start: 0.25, end: 0 },
            // Random rotation
            rotate: { min: 0, max: 360 },
        });
        this.dashParticles = this.scene.add.particles(0, 0, 'dash', {
            emitting: false,
            frequency: 20,
            speed: { min: 0, max: 15 },
            lifespan: 300,
            scale: { start: 1, end: 0 },
            // Start at 75% opacity, then fade out to 0
            alpha: { start: 0.75, end: 0 },
        });
        this.dashParticles.startFollow(this);
    }

    checkpoint(forced = false) {
        if (!forced && !this.body.blocked.down) return false;

        this.xSpawn = this.x;
        this.ySpawn = this.y;

        this.scene.checkpointObj.x = this.x;
        this.scene.checkpointObj.y = this.y + 8;
        this.scene.tweens.add({
                targets: this.scene.checkpointObj,
                // End
                y: this.y,
                // Distance/speed seconds
                duration: 400
            });

        // sound
        let checkpointSfx = this.scene.sound.add('checkpointPlace');
        checkpointSfx.setVolume(3); 
        checkpointSfx.play();

        return true;
    }

    respawn() {
        // Respawn player at last checkpoint
        this.body.reset(this.xSpawn, this.ySpawn);    

        this.curCyoteBuffer = 0;
        this.dashCount = 0;
        this.airTime = 0;

        // Stop dash particles on death
        this.dashParticles.stop();
    }

    // Play landing particles
    playLandingParticles() {
        this.landingParticles.explode(8, this.x, this.body.bottom);
        this.walkT = 2; // set walkT to over 1 so it instantly plays the step sound on land
    }

    // Play dash particles
    playDashParticles() {
        // Play for 150ms, then stop
        this.dashParticles.start(0, 150);
    }

    update(dt, xInput, yInput, jumpPressed) {
        if (this.dashCount == 0) {
            this.tint = 0xDDAAAA;
        }
        else {
            this.clearTint();
        }

        // get data
        let xVelocity = this.body.velocity.x / 1000;
        let yVelocity = this.body.velocity.y / 1000;

        let groundedFlag = this.body.blocked.down;
        let bufferGroundedFlag = groundedFlag;

        if (!groundedFlag) {
            this.curCyoteBuffer -= dt;
            bufferGroundedFlag = this.curCyoteBuffer > 0;
        }

        // velocity
        let curSpeed = this.airSpeed;
        let curMaxSpeed = this.airMaxSpeed;
        if (groundedFlag && yVelocity >= 0) {
            xVelocity -= xVelocity * dt * this.friction;

            curSpeed = this.speed;
            curMaxSpeed = this.maxSpeed;

            this.curCyoteBuffer = this.cyoteTime;
            this.dashCount = 1;
        }

        let xSpeed = xInput * dt * this.speed;
        let absX = Math.abs(xVelocity);
        if (Math.abs(xVelocity + xSpeed) < absX) {
            xVelocity += xSpeed;
        }
        else if (absX < curMaxSpeed) {
            xVelocity += xSpeed;

            if (absX > curMaxSpeed) {
                xVelocity *= curMaxSpeed / absX;
            }
        }

        yVelocity += dt * this.gravity;
        if (jumpPressed && bufferGroundedFlag) {
            yVelocity -= this.jumpSpeed;
            this.curCyoteBuffer = 0;

            let jumpSfx = this.scene.sound.add('jump');
            jumpSfx.setVolume(5); 
            jumpSfx.play();
        }
        
        // dashing
        if (jumpPressed && !bufferGroundedFlag && this.dashCount && (xInput || yInput)) {
            let curDash = this.dashSpeed;

            // half speed if corner dashing
            if (xInput && yInput) {
                curDash *= Math.sqrt(0.5); // get hypotenuse so dash magnitude is same
            }

            // apply speed
            xVelocity = 0;
            yVelocity = 0;
            if (xInput) {
                xVelocity = curDash * xInput;
            }
            if (yInput) {
                yVelocity = -curDash * yInput;
            }
            
            this.dashCount--;

            // sound
            let jumpSfx = this.scene.sound.add('dash');
            jumpSfx.setVolume(0.3); 
            jumpSfx.play();

            // particles
            this.playDashParticles(xVelocity, yVelocity);
        }

        // cap downwards velocity to prevent phasing through ground (expecially when respawning)
        if (yVelocity > this.gravCap) {
            yVelocity = this.gravCap;
        }

        if (xVelocity != 0) {
            this.flipX = xVelocity < 0;
        }

        // Landing detection for particles
        if (!groundedFlag) {
            this.airTime += dt;
        }
        else {
            // Landed if was in air for more than 0.1 seconds
            if (this.airTime > 0.1) this.playLandingParticles();
            this.airTime = 0;
        }

        // jumping anim :)
        let curFrame = this.startFrame;
        if (yVelocity < 0) {
            curFrame++;
        }

        this.setFrame(curFrame);

        // walking sound 
        if (groundedFlag && (xVelocity != 0 || this.walkT > 1)) {
            this.walkT += dt * this.walkSfxSpeed * Math.abs(xVelocity);
            if (this.walkT > 1) {
                this.walkT = 0;
                this.scene.walkSfx.play();
            }
        }

        // update physics velocity
        this.body.setVelocityX(xVelocity * 1000);
        this.body.setVelocityY(yVelocity * 1000);
    }
    

}