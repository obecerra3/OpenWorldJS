//Class for Debugging purposes
//stats_fps show fps of game
//stats_ms show memory usage of game
//debug_drawer is a 3rd party library that will draw the ammojs rigidbody collision boxes
//TODO: toggle debug stats with a button click and toggle debug_drawer with a button click

define(["three", "scene", "physics", "container", "stats", "ammoDebugDrawer"],
(THREE, scene, Physics, container, Stats, ammoDebugDrawer) =>
{
    var Debug =
    {
        stats_fps: new Stats(),
        stats_ms: new Stats(),
        debug_drawer: {},

        init: () =>
        {
            Debug.stats_fps.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            Debug.stats_ms.showPanel(1);
            Debug.stats_fps.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
            Debug.stats_ms.domElement.style.cssText = 'position:absolute;top:0px;left:80px;';
            container.appendChild(Debug.stats_fps.dom);
            container.appendChild(Debug.stats_ms.dom);

            //draw collision boxes for rigidbodies
            debug_drawer = new THREE.AmmoDebugDrawer(scene, Physics.physicsWorld);
            // debug_drawer.enable();
        },
    };

    return Debug;
});
