define(["three", "scene", "physics", "container", "stats", "ammoDebugDrawer"],
(THREE, scene, Physics, container, Stats, ammoDebugDrawer) =>
{
    var Debug =
    {
        stats_fps: new Stats(),
        stats_ms: new Stats(),
        debug_drawer: new THREE.AmmoDebugDrawer(scene, Physics.physicsWorld),

        init: () =>
        {
            stats_fps.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            stats_ms.showPanel(1);
            stats_fps.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
            stats_ms.domElement.style.cssText = 'position:absolute;top:0px;left:80px;';
            container.appendChild(stats_fps.dom);
            container.appendChild(stats_ms.dom);
        },
    };

    return Debug;
});
