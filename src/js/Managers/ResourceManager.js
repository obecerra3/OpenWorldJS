let WallManager = require('./WallManager.js');
let PlantManager = require('./PlantManager.js');
let TerrainManager = require('./TerrainManager.js');

//Supposed to handle the chunking of different resources, similar to level of detail
class ResourceManager {
    constructor(worldState) {
        this.playerPosition = new THREE.Vector3();
        this.worldState = worldState;

        //Resource Managers
        this.wallManager = new WallManager(worldState);
        this.plantManager = new PlantManager(worldState);
        this.terrainManager = new TerrainManager(worldState);
    }

    update(player) {
        if (player.body) this.playerPosition = player.body.position;

        this.wallManager.update(this.playerPosition);
    }

}

module.exports = ResourceManager;
