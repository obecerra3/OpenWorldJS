var PointerLockControls = require('../lib/PointerLockControls.js');

class ControlState {
    constructor(worldState) {
        this.controls = new PointerLockControls(worldState.camera, document.body);
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

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
                switch (event.keyCode) {
                    case 70:
                        this.toggleFlashlight();
                        break;
                    case 91:
                        this.toggleCrouch(true);
                        break;
                    case 16:
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
                        this.toggleJump();
                        break;
                    case 80: // p
                        this.printState();
                        break;
                    case 79: // o
                        this.toggleFlight();
                        break;
                }
            }
        }, false);

        document.addEventListener('keyup', (event) => {
            if (this.controls.isLocked) {
                switch (event.keyCode) {
                    case 16:
                        this.toggleRun(false);
                        break;
                    case 91:
                        this.toggleCrouch(false);
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
                }
            }
        }, false);
    }
}

module.exports = ControlState;
