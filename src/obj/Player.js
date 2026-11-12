export class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, image) {
        super(scene, x, y, image);

        scene.add.existing(this);

        // player vals
        this.friction = 10;
        this.speed = 0.25;
        this.airSpeed = 20;
        this.maxSpeed = 0.15;
        this.airMaxSpeed = 0.05;
        this.jumpSpeed = 0.075;
        this.dashSpeed = 0.115;
        this.gravity = 0.3;
        this.cyoteTime = 0.15;
        this.curCyoteBuffer = 0;

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

        this.body.velocity.x = 0;
        this.body.velocity.y = 0;
    }

    update(dt, xInput, yInput, jumpPressed) {
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
            console.log(this.curCyoteBuffer);
            yVelocity -= this.jumpSpeed;
            this.curCyoteBuffer = 0;
        }
        
        // dashing
        if (jumpPressed && !bufferGroundedFlag && this.dashCount && (xInput || yInput)) {
            let curDash = this.dashSpeed;

            // half speed if corner dashing
            if (xInput && yInput) {
                curDash *= Math.sqrt(0.5);
            }
            console.log(curDash);

            // apply speed
            if (xInput) {
                xVelocity = curDash * xInput;
            }
            if (yInput) {
                yVelocity = -curDash * yInput;
            }

            this.dashCount--;
        }

        // update physics velocity
        this.body.velocity.x = xVelocity * 1000;
        this.body.velocity.y = yVelocity * 1000;
    }
    

}