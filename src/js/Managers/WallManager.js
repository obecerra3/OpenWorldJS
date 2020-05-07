class WallManager {
    constructor(worldState) {
        this.worldState = worldState;
        this.walls = {};
        this.lastUpdatedPlayerPosition = new THREE.Vector3();
        this.wallsCenterPosition = new THREE.Vector3();
        this.cluster;
    }

    update(position) {
        if (this.lastUpdatedPlayerPosition.distanceTo(position) >= Utils.WALL_UPDATE_DISTANCE) {
            let closestKeys = this.getClosestWallKeys(position);
            closestKeys.forEach((key) => {
                this.activateWalls(key, position);
            })

            this.lastUpdatedPlayerPosition.copy(position);
        }
    }

    loadWallKeys(position, cluster) {
        let worldSize = Utils.CELL_SIZE * Utils.MAZE_SIZE;
        for (var i = -(worldSize / 2) + position.x; i < (worldSize / 2) + position.x; i += Utils.WALL_QUADRANT_SIZE) {
            for (var j = -(worldSize / 2) + position.z; j < (worldSize / 2) + position.z; j += Utils.WALL_QUADRANT_SIZE) {
                this.walls[Utils.vector3ToString(new THREE.Vector3(i, 0, j))] = [];
            }
        }
        this.wallsCenterPosition.copy(position);
        this.cluster = cluster;
    }


    wallsLoaded(position) {
        this.getClosestWallKeys(position).forEach((key) => {
            this.activateWalls(key, position);
         });
    }
    deactivateWall(wall) {
        this.worldState.physicsWorld.removeRigidBody(wall.rigidBody);
        wall.rigidBody = null;
    }

    activateWalls(key, position) {
        let colShape, wallIndex, cluster;
        this.walls[key].forEach((wall) => {

            if (wall.position.distanceTo(position) <= Utils.PHYSICS_RENDER_DISTANCE) {
                if (!wall.rigidBody) {
                    colShape = new Ammo.btBoxShape(wall.colShapeVector);
                    wallIndex = wall.wallIndex;
                    cluster = this.cluster;
                    wall.rigidBody = this.worldState.physics.createRigidBody({wallIndex, cluster}, colShape, 0, wall.position, new THREE.Quaternion());
                }
            } else {
                if (wall.rigidBody) {
                    this.deactivateWall(wall);
                }
            }
        });
    }

    createWallObject(wallIndex, colShapeVector, position) {
        this.walls[this.getClosestWallKey(position)].push({
            wallIndex: wallIndex,
            colShapeVector: colShapeVector,
            position: position,
            rigidBody: null,
            children: null
        });
    }

    getClosestWallKey(position) {
        let minDistance = Infinity;
        let distanceToKey;
        let currentKey;
        for (var key of Object.keys(this.walls)) {
            distanceToKey = position.distanceTo(Utils.stringToVector3(key));
            if (distanceToKey < minDistance) {
                minDistance = distanceToKey;
                currentKey = key;
            }
        }
        return currentKey;
    }

    getClosestWallKeys(position) {
        let wallKeys = Object.keys(this.walls);
        wallKeys.sort((a, b) => {
            return Utils.stringToVector3(a).distanceTo(position) - Utils.stringToVector3(b).distanceTo(position);
        })
        let count = 0;
        for (let key of Object.keys(this.walls)) {
            count += this.walls[key].length;
        }
        return wallKeys;
    }

    colorWalls() {
        let color;
        for (let key of Object.keys(this.walls)) {
            color = new THREE.Color(Math.random() * 0xffffff);
            if (this.walls[key]) {
                this.walls[key].forEach((wall) => {
                    this.cluster.setColorAt(wall.wallIndex, color);
                });
            }
        }
    }

}

module.exports = WallManager;
