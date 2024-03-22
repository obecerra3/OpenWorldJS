define(["three", "physics", "scene", "utils"],
       (THREE, Physics, scene, Utils) => {

    var MazeEngine = {
        wall_material: new THREE.MeshLambertMaterial(),
        wall_color: new THREE.Color(0x727272),
        walls: [],

        init : () => {
            MazeEngine.readMazeFile();
        },

        readMazeFile: () => {
            var loader = new THREE.FileLoader();

            loader.setResponseType("arraybuffer");

            loader.load("maze.bin", (buffer) => {
                var byteArray = new Uint8Array(buffer);

                var mazeArray = byteArray.reduce((array, curr, idx) => {
                    var i, type, overall;
                    for (i = 0; i < 8; i++) {
                        type = curr >> (7-i) & 1;
                        overall = idx * 8 + i;
                        if ((overall % Utils.MAZE_SIZE) == 0) {
                            array.push([type]);
                        } else {
                            array[Math.floor(overall / Utils.MAZE_SIZE)].push(type);
                        }
                    }
                    return array;
                }, []);

                MazeEngine.build(mazeArray, Utils.MAZE_SIZE, Utils.CELL_SIZE);
            });
        },

        createWallObject: (_walls_mesh, _wall_index, _wall_shape, _position) => {
            MazeEngine.walls.push({
                wall_index: _wall_index,
                wall_shape: _wall_shape,
                position: _position,
                rigidBody: Physics.createRigidbody({_wall_index, _walls_mesh}, new Physics.ammo.btBoxShape(_wall_shape), 0, _position, new THREE.Quaternion()),
                children: null
            });
        },

        build: (_maze_array, _maze_size, _cell_size) => {
            console.log("build MazeEngine");
            MazeEngine.wall_material.color = MazeEngine.wall_color;
            var wall_geometry = new THREE.BoxBufferGeometry(2, 2, 2);
            var world_maze_size = _cell_size * _maze_size;
            var origin = {x: -world_maze_size / 2, z: -world_maze_size / 2};

            var walls_mesh = new THREE.InstancedMesh(wall_geometry, MazeEngine.wall_material, 312);
            var wall_index = 0;
            var wall_position = new THREE.Vector3();
            var wall_scale = new THREE.Vector3();
            var k, wall_length, wall_center, wall_shape;

            var position = new THREE.Vector3();
            var scale = new THREE.Vector3();
            var quaternion = new THREE.Quaternion();
            var matrix = new THREE.Matrix4();

            var i,j;

            for (i = 0; i < _maze_size; i++) {
                for (j = 0; j < _maze_size - 1; j++) {
                    if (!_maze_array[i][j]) continue;
                    if (_maze_array[i][j + 1] == 1) {
                        k = j + 2;
                        while (k < _maze_size && _maze_array[i][k]) {
                            k += 1;
                        }
                        wall_length = _cell_size * (k - j - 1) + Utils.WALL_WIDTH;
                        wall_center = new THREE.Vector3(origin.x + (j * _cell_size) + (wall_length / 2) - Utils.WALL_WIDTH / 2, Utils.WALL_HEIGHT / 2, origin.z + (i * _cell_size) + (_cell_size / 2));

                        position.copy(wall_center);
                        scale.set(wall_length * 0.4999, Utils.WALL_HEIGHT * 0.5, Utils.WALL_WIDTH * 0.499);
                        matrix.compose( position, quaternion, scale );
                        walls_mesh.setMatrixAt(wall_index, matrix);

                        wall_shape = new Physics.ammo.btVector3(wall_length * 0.4999, Utils.WALL_HEIGHT * 0.5, Utils.WALL_WIDTH * 0.5);
                        MazeEngine.createWallObject(walls_mesh, wall_index, wall_shape, wall_center);

                        wall_index++;
                        j = k;
                    }
                }
            }

            for (j = 0; j < _maze_size; j++) {
                for (i = 0; i < _maze_size - 1; i++) {
                    if (!_maze_array[i][j]) continue;
                    if (_maze_array[i + 1][j] == 1) {
                        k = i + 2;
                        while (k < _maze_size && _maze_array[k][j]) {
                            k += 1;
                        }
                        wall_length = _cell_size * (k - i - 1);
                        wall_center = new THREE.Vector3(origin.x + (j * _cell_size), Utils.WALL_HEIGHT / 2, origin.z + (i * _cell_size) + (_cell_size / 2) + (wall_length / 2));

                        position.copy(wall_center);
                        scale.set(Utils.WALL_WIDTH * 0.5, Utils.WALL_HEIGHT * 0.5, wall_length * 0.5);
                        matrix.compose( position, quaternion, scale );
                        walls_mesh.setMatrixAt(wall_index, matrix);

                        wall_shape = new Physics.ammo.btVector3(Utils.WALL_WIDTH * 0.5, Utils.WALL_HEIGHT * 0.5, wall_length * 0.5);
                        MazeEngine.createWallObject(walls_mesh, wall_index, wall_shape, wall_center);

                        wall_index++;
                        i = k;
                    }
                }
            }
            walls_mesh.frustumCulled = false;

            scene.add(walls_mesh);
        }
    };
    return MazeEngine;
});
