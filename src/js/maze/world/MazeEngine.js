// require('../lib/three-instanced-mesh/index.js')(THREE);

define(["three", "instancedMesh", "physics", "player"], (THREE, InstancedMesh, Physics, Player) =>
{
    var MazeEngine =
    {
        wall_material: new THREE.MeshLambertMaterial(),
        wall_color: 0xdfdfdf,

        init: () =>
        {

        },

        build: (_maze_array, _maze_size, _cell_size) =>
        {
            var wall_geometry = new THREE.BoxBufferGeometry(2, 2, 2);
            var world_maze_size = _cell_size * _maze_size;
            var origin = {x: -world_maze_size / 2, z: -world_maze_size / 2};

            var cluster = new THREE.InstancedMesh(wall_geometry, MazeEngine.wall_material, 312, false, true, false);
            var wall_index = 0;
            var wall_position = new THREE.Vector3();
            var wall_scale = new THREE.Vector3();
            var k, wall_length, wall_center, wall_shape;

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
                        cluster.setPositionAt(wall_index, wall_position.copy(wall_center));
                        cluster.setScaleAt(wall_index, wall_scale.set(wall_length * 0.4999, Utils.WALL_HEIGHT * 0.5, Utils.WALL_WIDTH * 0.499));
                        cluster.setColorAt(wall_index, new THREE.Color(MazeEngine.wall_color));
                        wall_shape = new Ammo.btVector3(wall_length * 0.4999, Utils.WALL_HEIGHT * 0.5, Utils.WALL_WIDTH * 0.5);
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
                        cluster.setPositionAt(wall_index, wall_position.copy(wall_center));
                        cluster.setScaleAt(wall_index, wall_scale.set(Utils.WALL_WIDTH * 0.5, Utils.WALL_HEIGHT * 0.5, wall_length * 0.5));
                        cluster.setColorAt(wall_index, new THREE.Color(MazeEngine.wall_color));
                        wall_shape = new Ammo.btVector3(Utils.WALL_WIDTH * 0.5, Utils.WALL_HEIGHT * 0.5, wall_length * 0.5);
                        wall_index++;
                        i = k;
                    }
                }
            }
            scene.add(cluster);
        }
    }
    return this;
});
