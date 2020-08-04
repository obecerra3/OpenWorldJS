define(["three", "mazeEngine", "utils", "terrain"],
(THREE, MazeEngine, Utils, Terrain) =>
{
    var World = {

        init: () =>
        {
            MazeEngine.init();
            Terrain.init();
            World.render();
        },

        render: () =>
        {
            Terrain.render();
        },

        update: (_delta, _player) =>
        {
            Terrain.update();
        },

    };
    return World;
});
