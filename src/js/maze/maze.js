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
            World.init();
            Physics.init();
            Player.init();
            Debug.init();
        },

        update: () =>
        {

        },


    };
    return maze;
});
