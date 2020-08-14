define( ["three", "renderer", "camera", "container", "scene", "physics", "world", "player", "debug", "multiplayer"],
(THREE, renderer, camera, container, scene, Physics, World, Player, Debug, Multiplayer) =>
{
    var maze =
    {
        clock: new THREE.Clock(),
        event_queue: [],

        init: () =>
        {
            THREE.Cache.enabled = true;

            // Multiplayer.init();
            Physics.init();
            Debug.init();
            Player.init(maze.clock);
            World.init();
        },

        update: () =>
        {
            requestAnimationFrame(maze.update);

            Debug.updateStart();

            var time = performance.now();
            var delta = maze.clock.getDelta();

            Physics.update(delta);
            Player.update(delta);
            // Multiplayer.update(time);
            World.update(delta, Player);

            renderer.render(scene, camera);

            if (maze.event_queue.length > 0)
            {
                var event_obj = maze.event_queue[0];
                if (event_obj.verify())
                {
                    event_obj.action.apply(this, event_obj.arguments);
                    maze.event_queue.shift();
                }
            }

            Debug.updateEnd();
        },


    };
    return maze;
});
