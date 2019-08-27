var THREE = require('three');
var Utils = require('./Utils.js');
var PointerLockControls = require('pointerlockcontrols');

class Controls {
    constructor(camera) {
        this.controls = new PointerLockControls(camera);
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
    }
}

module.exports = Controls;
