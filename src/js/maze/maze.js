define(["three", "renderer", "camera", "container", "scene", "physics", "world",
        "player", "debug", "multiplayer", "eventQ", "time"],
        (THREE, renderer, camera, container, scene, Physics, World, Player, Debug,
         Multiplayer, EventQ, Time) => {

    var maze = {
        init: () => {
            THREE.Cache.enabled = true;

            Physics.init();
            Debug.init();
            Player.init();
            World.init(Player);
        },

        update: () => {
            requestAnimationFrame(maze.update);

            Debug.updateStart();

            var delta = Time.clock.getDelta();

            EventQ.update();
            Physics.update(delta);
            Player.update(delta);
            World.update(delta, Player);

            renderer.render(scene, camera);

            Debug.updateEnd();
        },


    };
    return maze;
});
