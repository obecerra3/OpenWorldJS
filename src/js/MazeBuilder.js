
class MazeBuilder {

    constructor () {
        this.geometries = new Map();
        this.wallMaterial = new THREE.MeshPhongMaterial({color: 0xd3d3d3, dithering: true});
    }


    build (mazeArray, mazeSize, cellSize) {
        var wallGeometry = new THREE.Geometry();
        var wallGroup = new THREE.Group();
        var worldMazeSize = cellSize * mazeSize;
        var origin = {x: -worldMazeSize / 2, z: -worldMazeSize / 2};

        var i,j;

        for (i = 0; i < mazeSize; i++) {
            for (j = 0; j < mazeSize - 1; j++) {
                if (!mazeArray[i][j]) continue;
                if (mazeArray[i][j + 1] == 1) {
                    var k = j + 2;
                    while (k < mazeSize && mazeArray[i][k]) {
                        k += 1;
                    }
                    var wallLength = cellSize * (k - j - 1) + Utils.WALL_WIDTH;
                    var wallCenter = new THREE.Vector3(origin.x + (j * cellSize) + (wallLength / 2) - Utils.WALL_WIDTH / 2, Utils.WALL_HEIGHT / 2, origin.z + (i * cellSize) + (cellSize / 2));
                    var wall = new THREE.Mesh(this.getGeometry(wallLength, Utils.WALL_WIDTH));
                    wall.position.copy(wallCenter);

                    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(wall.geometry.parameters.width * 0.5, wall.geometry.parameters.height * 0.5, wall.geometry.parameters.depth * 0.5));
                    let body = this.physics.createRigidBody(wall, colShape, 0, wall.position, wall.quaternion);

                    wallGeometry.mergeMesh(wall);
                    j = k;
                }
            }
        }


        for (j = 0; j < mazeSize; j++) {
            for (i = 0; i < mazeSize - 1; i++) {
                if (!mazeArray[i][j]) continue;
                if (mazeArray[i + 1][j] == 1) {
                    var k = i + 2;
                    while (k < mazeSize && mazeArray[k][j]) {
                        k += 1;
                    }
                    var wallLength = cellSize * (k - i - 1);
                    var wallCenter = new THREE.Vector3(origin.x + (j * cellSize), Utils.WALL_HEIGHT / 2, origin.z + (i * cellSize) + (cellSize / 2) + (wallLength / 2));
                    var wall = new THREE.Mesh(this.getGeometry(Utils.WALL_WIDTH, wallLength));
                    wall.position.copy(wallCenter);

                    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(wall.geometry.parameters.width * 0.5, wall.geometry.parameters.height * 0.5, wall.geometry.parameters.depth * 0.5));
                    let body = this.physics.createRigidBody(wall, colShape, 0, wall.position, wall.quaternion);

                    wallGeometry.mergeMesh(wall);
                    i = k;
                }
            }
        }

        var bufGeometry = new THREE.BufferGeometry().fromGeometry(wallGeometry);
        var wallMesh = new THREE.Mesh(bufGeometry, this.wallMaterial);
        wallMesh.matrixAutoUpdate = false;

        return wallMesh;

    }

    getGeometry(xLength, zLength) {
        var geoLookup = this.geometries.get(Utils.pair(xLength, zLength));
        if (geoLookup == undefined) {
            var geometry = new THREE.BoxGeometry(xLength, Utils.WALL_HEIGHT, zLength);
            this.geometries.set(Utils.pair(xLength, zLength), geometry);
            return geometry;
        } else {
            return geoLookup;
        }
    }
}


module.exports = MazeBuilder;
