define(["three", "mazeEngine", "utils", "terrain"],
(THREE, MazeEngine, Utils, Terrain) =>
{
    var World = {

        init: () =>
        {
            // World.readMazeFile();
            Terrain.init();
        },

        render: () =>
        {
            // Terrain.render();
        },

        update: (_delta, _player) =>
        {
            Terrain.update();
        },

        readMazeFile: () =>
        {
            var loader = new THREE.FileLoader();

            loader.setResponseType("arraybuffer");

            loader.load("maze.bin", (buffer) =>
            {
                var byteArray = new Uint8Array(buffer);

                var mazeArray = byteArray.reduce((array, curr, idx) =>
                {
                    var i, type, overall;
                    for (i = 0; i < 8; i++)
                    {
                        type = curr >> (7-i) & 1;
                        overall = idx * 8 + i;
                        if ((overall % Utils.MAZE_SIZE) == 0)
                        {
                            array.push([type]);
                        } else
                        {
                            array[Math.floor(overall / Utils.MAZE_SIZE)].push(type);
                        }
                    }
                    return array;
                }, []);

                MazeEngine.build(mazeArray, Utils.MAZE_SIZE, Utils.CELL_SIZE);
            });
        },

    };
    return World;
});
