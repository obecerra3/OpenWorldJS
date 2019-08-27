var THREE = require('three');
var Utils = require('./Utils.js');
var MazeBuilder = require('./MazeBuilder.js');
var Collider = require('./Collider.js');
var MessageBuilder = require('./MessageBuilder.js');

var camera, scene, renderer, theta, mazeMesh;

class WorldState {
    constructor() {
        this.otherPlayers = {};
        this.mazeBuilder = new MazeBuilder();
        this.messageBuilder = new MessageBuilder();
        this.collider = new Collider(PLAYER_SIZE);
        this.prevUpdateTime = -Utils.UPDATE_DELTA;
        this.prevTime = performance.now();
        this.floor = 

    }
}

module.exports = WorldState;
