export class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, image) {
        super(scene, x, y, image);

        scene.add.existing(this);

        // cam vals
        this.cam = undefined; // cam obj
        this.camBuffer = 20;
        this.camSpeed = 10;
        this.camVelocityMod = 2; // move cam in direction of player velocity

        // player vals
        this.xVelocity = 0;
        this.yVelocity = 0;

        this.friction = 0.25;
        this.speed = 1;
        this.airSpeed = 4;
        this.maxSpeed = 2;
        this.airMaxSpeed = 8;
        this.jumpSpeed = 15;
        this.dashSpeed = 15;
        this.gravity = 0.1;

        this.xSpawn = x;
        this.ySpawn = y;
        this.dashCount = 1;
    }

    checkpoint(x, y) {
        this.xSpawn = x;
        this.ySpawn = y;
    }

    respawn() {
        this.x = this.xSpawn;
        this.y = this.ySpawn;
    }

    camUpdate(dt) {
        let targetPos = this.y - (this.yVelocity * this.camVelocityMod);
        if (Math.abs(targetPos - this.cam.y) < this.camBuffer) return;

        this.cam.y += targetPos * dt * this.camSpeed;
    }

    update(dt, xInput, yInput, jumpPressed) {
        let groundedFlag = this.body.blocked.down;

        // velocity
        this.xVelocity -= this.xVelocity * dt * this.friction;

        let curSpeed = this.speed;
        let curMaxSpeed = this.maxSpeed;
        if (!groundedFlag) {
            curSpeed = this.airSpeed;
            curMaxSpeed = this.airMaxSpeed;
        }

        if (Math.abs(this.xVelocity) < curMaxSpeed) {
            this.xVelocity += xInput * dt * this.speed;

            if (Math.abs(this.xVelocity) > curMaxSpeed) {
                this.xVelocity = curMaxSpeed;
            }
        }

        console.log(jumpPressed+' && '+groundedFlag);
        if (!groundedFlag) {
            this.yVelocity += dt * this.gravity;
        }
        else {
            this.yVelocity = 0;

            if (jumpPressed) {
                this.yVelocity -= dt * this.jumpSpeed;
            }
        }
        

        // dashing
        if (jumpPressed && !groundedFlag && this.dashCount && (xInput || yInput)) {
            let curDash = this.dashSpeed * dt;

            // half speed if corner dashing
            if (xInput && yInput) {
                curDash /= 2;
            }

            // apply speed
            if (xInput) {
                this.xVelocity += curDash * xInput;
            }
            if (yInput) {
                this.yVelocity -= curDash * yInput;
            }

            this.dashCount--;
        }

        console.log(this.xVelocity +" | "+ this.yVelocity);
        // update physics velocity
        this.body.velocity.x = this.xVelocity * 1000;
        this.body.velocity.y = this.yVelocity * 1000;

        // update cam
        //this.camUpdate(dt);
    }
    

}