class ResourceManager {
    constructor() {
        this.walls = [];
        this.clock = new THREE.Clock();
        this.playerPosition = new THREE.Vector3();
    }

    update(player) {
        if (player.body) this.playerPosition = player.body.position;

        if (Utils.WALL_UPDATE_TIME <= this.clock.elapsedTime) {
            for (i = 0; i < walls.length; i++) {
                let wall = walls[i];

                // if (wall )
            }
        }
    }

    createWallObject(threeObject = {}, distanceFromrigidBody = {}) {
        return {
            threeObject: threeObject,
            rigidBody: rigidBody,
            children: []
        }
    }
}

module.exports = ResourceManager;
