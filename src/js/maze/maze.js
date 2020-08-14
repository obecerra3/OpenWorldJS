define( ["three", "renderer", "camera", "container", "scene", "physics", "world", "player", "debug", "multiplayer", "eventQ"],
(THREE, renderer, camera, container, scene, Physics, World, Player, Debug, Multiplayer, EventQ) =>
{
    var maze =
    {
        clock: new THREE.Clock(),

        init: () =>
        {
            THREE.Cache.enabled = true;

            // Multiplayer.init();
            Physics.init();
            Debug.init();
            Player.init(maze.clock);
            World.init(maze.clock, Player);
        },

        update: () =>
        {
            requestAnimationFrame(maze.update);

            Debug.updateStart();

            var time = performance.now();
            var delta = maze.clock.getDelta();

            EventQ.update();
            Physics.update(delta);
            Player.update(delta);
            // Multiplayer.update(time);
            World.update(delta, Player);

            renderer.render(scene, camera);

            Debug.updateEnd();
        },


    };
    return maze;
});
