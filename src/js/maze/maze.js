define( ["three", "camera", "container", "renderer", "scene", "physics", "world", "player", "debug"],
(THREE, camera, container, renderer, scene, Physics, World, Player, Debug) =>
{
    var maze =
    {
        clock: new THREE.Clock(),
        event_queue: [],

        init: () =>
        {
            THREE.Cache.enabled = true;

            physics = new Physics();
            console.log(physics);
            // World.init();
            // Physics.init();
            // Debug.init();
            // Player.init();
        },

        update: () =>
        {

        },


    };
    return maze;
});
