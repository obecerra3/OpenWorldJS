define( ["three", "camera", "container", "renderer", "scene", "physics", "world", "player", "debug", "multiplayer"],
(THREE, camera, container, renderer, scene, Physics, World, Player, Debug, Multiplayer) =>
{
    var maze =
    {
        clock: new THREE.Clock(),
        event_queue: [],

        init: () =>
        {
            THREE.Cache.enabled = true;
            Multiplayer.init();
            Physics.init();
            Debug.init();
            Player.init();
        },

        update: () =>
        {

        },


    };
    return maze;
});
