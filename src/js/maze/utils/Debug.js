//Class for Debugging purposes
//stats_fps show fps of game
//stats_ms show memory usage of game
//ammo_drawer is a 3rd party library that will draw the ammojs rigidbody collision boxes
//TODO: toggle debug stats with a button click and toggle ammo_drawer with a button click

define(["three", "scene", "physics", "container", "stats", "ammoDebugDrawer", "renderer"],
(THREE, scene, Physics, container, Stats, AmmoDebugDrawer, renderer) =>
{
    var Debug =
    {
        stats_fps: new Stats(),
        stats_ms: new Stats(),
        ammo_drawer: {},
        show_render_calls: false,
        show_ammo_drawer: true,

        init: () =>
        {
            Debug.stats_fps.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            Debug.stats_ms.showPanel(1);
            Debug.stats_fps.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
            Debug.stats_ms.domElement.style.cssText = 'position:absolute;top:0px;left:80px;';
            container.appendChild(Debug.stats_fps.dom);
            container.appendChild(Debug.stats_ms.dom);

            //draw collision boxes for rigidbodies
            Debug.ammo_drawer = new THREE.AmmoDebugDrawer(scene, Physics.physicsWorld);
        },

        updateStart: () =>
        {
            Debug.stats_fps.begin();
            Debug.stats_ms.begin();
            Debug.ammo_drawer.update();

            if (Debug.show_render_calls)
            {
                console.log("Render Calls:" + renderer.info.render.calls);
            }
        },

        updateEnd: () =>
        {
            Debug.stats_fps.end();
            Debug.stats_ms.end();
        },

        toggleAmmoDrawer: (_value) =>
        {
            (_value) ? Debug.ammo_drawer.enable() : Debug.ammo_drawer.disable();
        },
    };

    return Debug;
});
