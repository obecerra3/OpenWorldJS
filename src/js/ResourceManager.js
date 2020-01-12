let WallManager = require('./WallManager.js');

class ResourceManager {
    constructor(worldState) {
        this.playerPosition = new THREE.Vector3();
        this.worldState = worldState;

        //Resource Managers
        this.wallManager = new WallManager(worldState);
    }

    update(player) {
        if (player.body) this.playerPosition = player.body.position;

        this.wallManager.update(this.playerPosition);
    }

}

module.exports = ResourceManager;
