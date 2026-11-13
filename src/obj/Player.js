export class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, image, data) {
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
    }

    checkpoint(forced = false) {
        if (!forced && !this.body.blocked.down) return false;

        this.xSpawn = this.x;
        this.ySpawn = this.y;

        return true;
    }

    respawn() {
        this.x = this.xSpawn;
        this.y = this.ySpawn;

        console.log(this.body.velocity.y);
        this.body.setVelocityX(0);
        this.body.setVelocityY(0);      

        this.curCyoteBuffer = 0;
        this.dashCount = 0;
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
        }

        // cap downwards velocity to prevent phasing through ground (expecially when respawning)
        if (yVelocity > this.gravCap) {
            yVelocity = this.gravCap;
        }

        if (xVelocity != 0) {
            this.flipX = xVelocity < 0;
        }

        let curFrame = this.startFrame;
        if (yVelocity < 0) {
            curFrame++;
        }

        this.setFrame(curFrame);

        // update physics velocity
        this.body.setVelocityX(xVelocity * 1000);
        this.body.setVelocityY(yVelocity * 1000);
    }
    

}