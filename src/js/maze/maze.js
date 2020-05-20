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

            var axesHelper = new THREE.AxesHelper(10);
            scene.add(axesHelper);

            var light = new THREE.AmbientLight(0x404040);
            scene.add(light);

            var floorGeometry = new THREE.PlaneBufferGeometry(2000, 2000);
            floorGeometry.rotateX(-Math.PI/2);
            let floorMaterial = new THREE.MeshBasicMaterial({color: new THREE.Color(0x8CE78C)});
            var floor = new THREE.Mesh(floorGeometry, floorMaterial);
            scene.add(floor);

            Multiplayer.init();
            Physics.init();
            Debug.init();
            Player.init();
        },

        update: () =>
        {
            requestAnimationFrame(maze.update);

            Debug.updateStart();

            var time = performance.now();
            var delta = maze.clock.getDelta();

            Physics.update(delta, Player);
            Player.update(delta);
            Multiplayer.update(time);
            // World.update(delta);

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
