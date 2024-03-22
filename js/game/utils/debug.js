//Class for Debugging purposes
//stats_fps show fps of game
//stats_ms show memory usage of game
//ammo_drawer is a 3rd party library that will draw the ammojs rigidbody collision boxes
//TODO: toggle debug stats with a button click and toggle ammo_drawer with a button click

define(["three", "scene", "physics", "container", "stats", "ammoDebugDrawer", "renderer"],
       (THREE, scene, Physics, container, Stats, debug_drawer_output, renderer) =>
{
    var Debug =
    {
        stats_fps: new Stats(),
        stats_ms: new Stats(),
        ammo_drawer: {},
        debug_geometry: {},
        show_render_calls: false,
        show_ammo_drawer: false,

        init: function()
        {
            // init stats panels
            // -----------------
            this.stats_fps.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            this.stats_ms.showPanel(1);
            this.stats_fps.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
            this.stats_ms.domElement.style.cssText = 'position:absolute;top:0px;left:80px;';
            container.appendChild(Debug.stats_fps.dom);
            container.appendChild(Debug.stats_ms.dom);

            // setup ammo debug drawer
            // -----------------------
            var DefaultBufferSize = debug_drawer_output[0];
            var AmmoDebugConstants = debug_drawer_output[1];
            var AmmoDebugDrawer = debug_drawer_output[2];

            var debugVertices = new Float32Array(DefaultBufferSize);
            var debugColors = new Float32Array(DefaultBufferSize);
            this.debug_geometry = new THREE.BufferGeometry();
            var verts_ba = new THREE.BufferAttribute(debugVertices, 3).setUsage(THREE.DynamicDrawUsage);
            var colors_ba = new THREE.BufferAttribute(debugColors, 3).setUsage(THREE.DynamicDrawUsage);
            this.debug_geometry.setAttribute("position", verts_ba);
            this.debug_geometry.setAttribute("color", colors_ba);
            var debugMaterial = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
            var debugMesh = new THREE.LineSegments(Debug.debug_geometry, debugMaterial);
            debugMesh.frustumCulled = false;
            scene.add(debugMesh);
            this.ammo_drawer = new AmmoDebugDrawer(null, debugVertices, debugColors, Physics.physicsWorld);
        },

        updateStart: function()
        {
            this.stats_fps.begin();
            this.stats_ms.begin();
            this.ammo_drawer.update();

            if (this.show_ammo_drawer && this.ammo_drawer)
            {
                if (this.ammo_drawer.index !== 0)
                {
                    this.debug_geometry.attributes.position.needsUpdate = true;
                    this.debug_geometry.attributes.color.needsUpdate = true;
                }

                this.debug_geometry.setDrawRange(0, this.ammo_drawer.index);
            }

            if (Debug.show_render_calls)
            {
                console.log("Render Calls:" + renderer.info.render.calls);
            }
        },

        updateEnd: function()
        {
            this.stats_fps.end();
            this.stats_ms.end();
        },

        toggleAmmoDrawer: function(value)
        {
            (value) ? this.ammo_drawer.enable() : this.ammo_drawer.disable();
            this.show_ammo_drawer = value;
        },
    };

    return Debug;
});
