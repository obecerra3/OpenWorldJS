define( ["three", "camera", "container", "renderer", "scene", "physics", "world", "player", "debug"],
(THREE, camera, container, renderer, scene, physics, world, player, Debug) =>
{
    var maze =
    {
        clock: new THREE.Clock(),
        Physics: new Physics(),
        event_queue: [],

        init: () =>
        {
            THREE.Cache.enabled = true;
            world.init();
            Physics.init();
            player.init();
            Debug.init();
        },

        update: () =>
        {

        },


    };
    return maze;
});
