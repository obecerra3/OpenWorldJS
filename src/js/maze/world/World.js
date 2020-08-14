define(["three", "mazeEngine", "utils", "terrain", "light"],
(THREE, MazeEngine, Utils, Terrain, Light) =>
{
    var World = {

        init: () =>
        {
            Light.init();
            // MazeEngine.init();
            Terrain.init();

            // call render
            World.render();
        },

        render: () =>
        {
            Light.render();
            Terrain.render();
        },

        update: (_delta, _player) =>
        {
            Light.init();
            Terrain.update();
        },

    };
    return World;
});
