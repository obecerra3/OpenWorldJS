var PointerLockControls = require('../lib/PointerLockControls.js');

class ControlState {
    constructor(worldState) {
        this.controls = new PointerLockControls(worldState.camera, worldState.renderer.domElement);
        this.debugMode = false;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.speed = 40;
        this.spacePressedTime;
        this.clock = worldState.clock;
        this.isCrouched = false;
        this.isJumping = false;

        // Callbacks defined in Player.js
        this.toggleFlashlight = null;
        this.toggleCrouch = null;
        this.toggleJump = null;
        this.printState = null;
        this.toggleFlight = null;
        this.toggleRun = null;

        var blocker = document.getElementById('blocker');

        blocker.addEventListener('click', () => {
            this.controls.lock();
        }, false );

        this.controls.addEventListener('lock', () => {
            blocker.style.display = 'none';
        });

        this.controls.addEventListener('unlock', () => {
            blocker.style.display = 'block';
        });

        worldState.scene.add(this.controls.getObject());

        //embedded these instead of doing bind(this) for the event callbacks
        document.addEventListener('keydown', (event) => {
            if (this.controls.isLocked) {
                if (this.debugMode) {
                    let offset = new THREE.Vector3();
                    switch (event.keyCode) {
                        case 38: //w
                        case 87: //forward arrow
                            offset = this.controls.getDirection(new THREE.Vector3())
                            worldState.camera.position.add(offset.multiplyScalar(this.speed));
                            break;
                        case 40: //s
                        case 83: //backward arrow
                            offset = this.controls.getDirection(new THREE.Vector3())
                            worldState.camera.position.add(offset.multiplyScalar(-this.speed));
                            break;
                        case 49: //1
                            this.speed -= 5;
                            break;
                        case 57: //9
                            this.speed += 5;
                            break;
                        case 48: //0
                            this.debugMode = !this.debugMode;
                            break;
                    }
                } else {
                    switch (event.keyCode) {
                        case 70: //f
                            this.toggleFlashlight();
                            break;
                        case 67: //c
                            if (!this.isCrouched) {
                                this.toggleCrouch();
                                this.isCrouched = true;
                            }
                            break;
                        case 16: //shift
                            this.toggleRun(true);
                            break;
                        case 38: // up
                        case 87: // w
                            this.moveForward = true;
                            break;
                        case 37: // left
                        case 65: // a
                            this.moveLeft = true;
                            break;
                        case 40: // down
                        case 83: // s
                            this.moveBackward = true;
                            break;
                        case 39: // right
                        case 68: // d
                            this.moveRight = true;
                            break;
                        case 32: // space
                            if (!this.spacePressedTime) {
                                this.spacePressedTime = this.clock.elapsedTime;
                                this.toggleJump(0);
                            }
                            break;
                        case 80: // p
                            this.printState();
                            break;
                        case 79: // o
                            this.toggleFlight();
                            break;
                        case 48: //0
                            this.debugMode = !this.debugMode;
                            break;
                    }
                }
            }
        }, false);

        document.addEventListener('keyup', (event) => {
            if (this.controls.isLocked && !this.debugMode) {
                switch (event.keyCode) {
                    case 16: //shift
                        this.toggleRun(false);
                        break;
                    case 67: //c
                        this.isCrouched = false;
                        break;
                    case 38: // up
                    case 87: // w
                        this.moveForward = false;
                        break;
                    case 37: // left
                    case 65: // a
                        this.moveLeft = false;
                        break;
                    case 40: // down
                    case 83: // s
                        this.moveBackward = false;
                        break;
                    case 39: // right
                    case 68: // d
                        this.moveRight = false;
                        break;
                    case 32: //space
                        this.toggleJump(this.clock.elapsedTime - this.spacePressedTime);
                        this.spacePressedTime = null;
                        break;
                }
            }
        }, false);
    }
}

module.exports = ControlState;
