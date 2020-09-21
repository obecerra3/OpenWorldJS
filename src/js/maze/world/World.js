define(["three", "mazeEngine", "utils", "terrain", "light", "time"],
       (THREE, MazeEngine, Utils, Terrain, Light, Time) => {
    var World = {
        init: (player) => {
            Light.init(player);
            Terrain.init();

            World.render();
        },

        render: () => {
            Light.render();
            Terrain.render();
        },

        update: (delta) => {
            Time.update();
            Light.update();
            Terrain.update();
        },

    };
    return World;
});
