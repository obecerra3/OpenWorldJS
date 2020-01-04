require('three-instanced-mesh')(THREE);

class MazeBuilder {

    constructor () {
        this.geometries = new Map();
        this.wallMaterial = new THREE.MeshPhongMaterial({color: 0xd3d3d3, dithering: true});
    }


    build (mazeArray, mazeSize, cellSize, worldState, physics, player) {
        let wallGeometry = new THREE.BoxBufferGeometry(2, 2, 2);
        let worldMazeSize = cellSize * mazeSize;
        let origin = {x: -worldMazeSize / 2, z: -worldMazeSize / 2};

        let cluster = new THREE.InstancedMesh(wallGeometry, this.wallMaterial, 312, false, true, false);
        let wallIndex = 0;
        let wallPosition = new THREE.Vector3();
        let wallScale = new THREE.Vector3();

        let i,j;

        for (i = 0; i < mazeSize; i++) {
            for (j = 0; j < mazeSize - 1; j++) {
                if (!mazeArray[i][j]) continue;
                if (mazeArray[i][j + 1] == 1) {
                    let k = j + 2;
                    while (k < mazeSize && mazeArray[i][k]) {
                        k += 1;
                    }
                    let wallLength = cellSize * (k - j - 1) + Utils.WALL_WIDTH;
                    let wallCenter = new THREE.Vector3(origin.x + (j * cellSize) + (wallLength / 2) - Utils.WALL_WIDTH / 2, Utils.WALL_HEIGHT / 2, origin.z + (i * cellSize) + (cellSize / 2));
                    cluster.setPositionAt(wallIndex, wallPosition.copy(wallCenter));
                    cluster.setScaleAt(wallIndex, wallScale.set(wallLength * 0.5, Utils.WALL_HEIGHT * 0.5, Utils.WALL_WIDTH * 0.5));

                    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(wallLength * 0.5, Utils.WALL_HEIGHT * 0.5, Utils.WALL_WIDTH * 0.5));
                    let body = physics.createRigidBody({wallIndex, cluster}, colShape, 0, wallCenter, new THREE.Quaternion());

                    wallIndex++;
                    j = k;
                }
            }
        }


        for (j = 0; j < mazeSize; j++) {
            for (i = 0; i < mazeSize - 1; i++) {
                if (!mazeArray[i][j]) continue;
                if (mazeArray[i + 1][j] == 1) {
                    let k = i + 2;
                    while (k < mazeSize && mazeArray[k][j]) {
                        k += 1;
                    }
                    let wallLength = cellSize * (k - i - 1);
                    let wallCenter = new THREE.Vector3(origin.x + (j * cellSize), Utils.WALL_HEIGHT / 2, origin.z + (i * cellSize) + (cellSize / 2) + (wallLength / 2));
                    cluster.setPositionAt(wallIndex, wallPosition.copy(wallCenter));
                    cluster.setScaleAt(wallIndex, wallScale.set(Utils.WALL_WIDTH * 0.5, Utils.WALL_HEIGHT * 0.5, wallLength * 0.5));

                    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(Utils.WALL_WIDTH * 0.5, Utils.WALL_HEIGHT * 0.5, wallLength * 0.5));
                    let body = physics.createRigidBody({wallIndex, cluster}, colShape, 0, wallCenter, new THREE.Quaternion());

                    wallIndex++;
                    i = k;
                }
            }
        }

        worldState.scene.add(cluster);

    }

    getGeometry(xLength, zLength) {
        let geoLookup = this.geometries.get(Utils.pair(xLength, zLength));
        if (geoLookup == undefined) {
            let geometry = new THREE.BoxGeometry(xLength, Utils.WALL_HEIGHT, zLength);
            this.geometries.set(Utils.pair(xLength, zLength), geometry);
            return geometry;
        } else {
            return geoLookup;
        }
    }
}


module.exports = MazeBuilder;
