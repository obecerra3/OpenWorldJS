var THREE = require('three');
var Utils = require('./Utils.js');
var PointerLockControls = require('pointerlockcontrols');

class ControlState {
    constructor(worldState) {
        this.controls = new PointerLockControls(worldState.camera);
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.toggleFlashlight = null;
        this.toggleCrouch = null;
        this.toggleJump = null;

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

        document.addEventListener('keydown', (event) => {
            if (this.controls.isLocked) {
                switch (event.keyCode) {
                    case 70:
                        this.toggleFlashlight();
                        break;
                    case 16:
                        this.toggleCrouch();
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
                }
            }
        }, false);

        document.addEventListener('keyup', (event) => {
            if (this.controls.isLocked) {
                switch (event.keyCode) {
                    case 16:
                        this.toggleCrouch();
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
