define(["three", "utils", "scene", "shader!terrain.vert", "shader!terrain.frag"],
(THREE, Utils, scene, terrain_vert_shader, terrain_frag_shader) =>
{
    var Terrain =
    {
        // Event Queue
        event_queue: [],

        // Constants
        WIDTH: 50.0,
        RESOLUTION: 128.0,
        NOISE_FREQ: 0.3,

        // rendering
        obj: new THREE.Object3D(),
        mesh: new THREE.Mesh(),
        geometry: new THREE.PlaneBufferGeometry(),
        material: new THREE.ShaderMaterial(),
        height_data: new THREE.DataTexture(),
        loaded: false,
        frag_shader: terrain_frag_shader,

        // physics
        // ammo convex hull collider

        init: () =>
        {
            // seed the noise generator
            noise.seed(Utils.TERRAIN_SEED);

            // init the geometry
            Terrain.geometry = new THREE.PlaneBufferGeometry(Terrain.WIDTH, Terrain.WIDTH, Terrain.RESOLUTION, Terrain.RESOLUTION);
            Terrain.geometry.rotateX(-Math.PI/2);

            // setup material
            Terrain.material = Terrain.createMaterial();

            // load
            Terrain.load();
        },

        load: () =>
        {
            terrain_vert_shader.define("TILE_RESOLUTION", Terrain.RESOLUTION.toFixed(1));
            frag_shader = terrain_frag_shader;
            Terrain.mesh = new THREE.Mesh(Terrain.geometry, Terrain.material);
            Terrain.obj.add(Terrain.mesh);
            Terrain.createHeightData();
            Terrain.loaded = true
            Terrain.render();
        },

        createHeightData: () =>
        {
            var width = Terrain.RESOLUTION;
            var size = width * width;
            var center = new THREE.Vector3(0, 0, 0);
            var top_left = center - new THREE.Vector3(width / 2, 0, width / 2);
            var data = [];

            for (var i = 0; i < size; i++)
            {
                var x = i % width;
                var z = Math.floor(x / width);
                data[i] = Utils.perlinNoise(x, z, Terrain.NOISE_FREQ);
            }

            Terrain.height_data = new THREE.DataTexture(data, width, width, THREE.AlphaFormat);
            Terrain.height_data.wrapS = THREE.MirroredRepeatWrapping;
            Terrain.height_data.wrapT = THREE.MirroredRepeatWrapping;
            Terrain.height_data.magFilter = THREE.LinearFilter;
            Terrain.height_data.minFilter = THREE.LinearMipMapLinearFilter;
            Terrain.height_data.generateMipmaps = true;
            Terrain.height_data.needsUpdate = true;
        },

        render: () =>
        {
            scene.add(Terrain.obj);
        },

        update: () =>
        {
            if (Terrain.event_queue.length > 0)
            {
                Terrain.event_queue.forEach((event_obj) =>
                {
                    if (event_obj.verify())
                    {
                        event_obj.action.apply(this, event_obj.arguments);
                        Terrain.event_queue.shift();
                    }
                });
            }
        },

        createMaterial: () =>
        {
            return new THREE.ShaderMaterial(
            {
                uniforms:
                {
                    uHeightData: { type: "t", value: Terrain.height_data },
                    uResolution: { type: "f", value: Terrain.RESOLUTION },
                },
                vertexShader: terrain_vert_shader.value,
                fragmentShader: Terrain.frag_shader.value,
            });
        },
    };
    return Terrain;
});
