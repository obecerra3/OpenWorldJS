define(["three", "mazeEngine", "utils", "terrain", "light"],
(THREE, MazeEngine, Utils, Terrain, Light) =>
{
    var World = {

        init: (clock, player) =>
        {
            Light.init(clock, player);
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

        update: (_delta) =>
        {
            Light.update();
            Terrain.update();
        },

    };
    return World;
});
