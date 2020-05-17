var WallManager = require('./WallManager.js');
var PlantManager = require('./PlantManager.js');
var TerrainManager = require('./TerrainManager.js');

//Supposed to handle the chunking of different resources, similar to level of detail
class ResourceManager {
    constructor(worldState) {
        this.player_position = new THREE.Vector3();
        this.worldState = worldState;

        //Resource Managers
        this.wallManager = new WallManager(worldState);
        this.plantManager = new PlantManager(worldState);
        this.terrainManager = new TerrainManager(worldState);
    }

    update(player) {
        if (player.body) this.player_position = player.body.position;

        this.wallManager.update(this.player_position);
        this.terrainManager.update(this.player_position)
    }

}

module.exports = ResourceManager;
