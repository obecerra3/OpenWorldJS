require('../lib/three-instanced-mesh/index.js')(THREE);

class MazeBuilder {

    constructor () {
        this.geometries = new Map();
        this.wallMaterial = new THREE.MeshLambertMaterial();
        this.wallColor = 0xdfdfdf;
    }


    build (mazeArray, mazeSize, cellSize, worldState, physics, player) {
        let wallGeometry = new THREE.BoxBufferGeometry(2, 2, 2);
        let worldMazeSize = cellSize * mazeSize;
        let origin = {x: -worldMazeSize / 2, z: -worldMazeSize / 2};

        let cluster = new THREE.InstancedMesh(wallGeometry, this.wallMaterial, 312, false, true, false);
        let wallIndex = 0;
        let wallPosition = new THREE.Vector3();
        let wallScale = new THREE.Vector3();
        let k, wallLength, wallCenter, colShapeVector;

        let resourceManager = worldState.resourceManager;
        resourceManager.wallManager.loadWallKeys(player.body.position, cluster);

        let i,j;

        for (i = 0; i < mazeSize; i++) {
            for (j = 0; j < mazeSize - 1; j++) {
                if (!mazeArray[i][j]) continue;
                if (mazeArray[i][j + 1] == 1) {
                    k = j + 2;
                    while (k < mazeSize && mazeArray[i][k]) {
                        k += 1;
                    }
                    wallLength = cellSize * (k - j - 1) + Utils.WALL_WIDTH;
                    wallCenter = new THREE.Vector3(origin.x + (j * cellSize) + (wallLength / 2) - Utils.WALL_WIDTH / 2, Utils.WALL_HEIGHT / 2, origin.z + (i * cellSize) + (cellSize / 2));
                    cluster.setPositionAt(wallIndex, wallPosition.copy(wallCenter));
                    cluster.setScaleAt(wallIndex, wallScale.set(wallLength * 0.4999, Utils.WALL_HEIGHT * 0.5, Utils.WALL_WIDTH * 0.499));
                    cluster.setColorAt(wallIndex, new THREE.Color(this.wallColor));

                    colShapeVector = new Ammo.btVector3(wallLength * 0.4999, Utils.WALL_HEIGHT * 0.5, Utils.WALL_WIDTH * 0.5);
                    resourceManager.wallManager.createWallObject(wallIndex, colShapeVector, wallCenter);

                    wallIndex++;
                    j = k;
                }
            }
        }

        for (j = 0; j < mazeSize; j++) {
            for (i = 0; i < mazeSize - 1; i++) {
                if (!mazeArray[i][j]) continue;
                if (mazeArray[i + 1][j] == 1) {
                    k = i + 2;
                    while (k < mazeSize && mazeArray[k][j]) {
                        k += 1;
                    }
                    wallLength = cellSize * (k - i - 1);
                    wallCenter = new THREE.Vector3(origin.x + (j * cellSize), Utils.WALL_HEIGHT / 2, origin.z + (i * cellSize) + (cellSize / 2) + (wallLength / 2));
                    cluster.setPositionAt(wallIndex, wallPosition.copy(wallCenter));
                    cluster.setScaleAt(wallIndex, wallScale.set(Utils.WALL_WIDTH * 0.5, Utils.WALL_HEIGHT * 0.5, wallLength * 0.5));
                    cluster.setColorAt(wallIndex, new THREE.Color(this.wallColor));

                    colShapeVector = new Ammo.btVector3(Utils.WALL_WIDTH * 0.5, Utils.WALL_HEIGHT * 0.5, wallLength * 0.5);
                    resourceManager.wallManager.createWallObject(wallIndex, colShapeVector, wallCenter);

                    wallIndex++;
                    i = k;
                }
            }
        }

        resourceManager.wallManager.wallsLoaded(player.body.position);

        worldState.scene.add(cluster);

    }
}


module.exports = MazeBuilder;
