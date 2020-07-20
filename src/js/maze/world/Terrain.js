define(["three", "utils", "scene", "improvedNoise", "shader!terrain.vert", "shader!terrain.frag"],
(THREE, Utils, scene, ImprovedNoise, terrain_vert_shader, terrain_frag_shader) =>
{
    var Terrain =
    {
        // Event Queue
        event_queue: [],

        // Constants
        WORLD_WIDTH: 1024,
        RESOLUTION: 64.0,

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
            // init the geometry
            Terrain.geometry = new THREE.PlaneBufferGeometry(7500, 7500, 256, 256);
            Terrain.geometry.rotateX(-Math.PI/2);

            // load
            Terrain.load();
        },

        load: () =>
        {
            Terrain.frag_shader = terrain_frag_shader;
            Terrain.createHeightData();
            Terrain.material = Terrain.createMaterial();
            Terrain.render();
        },

        createHeightData: () =>
        {
            var width = Terrain.WORLD_WIDTH;
            var size = width * width;
            var data = new Uint8Array(size);
            var perlin = new ImprovedNoise();
            var quality = 1;
            var z = Math.random() * 100;
            var max = Number.NEGATIVE_INFINITY;
            var min = Number.POSITIVE_INFINITY;

            for (var j = 0; j < 4; j++)
            {
                for (var i = 0; i < size; i++)
                {
                    var x = i % width;
                    var y = Math.floor(i / width);

                    data[i] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality );

                    if (j == 3)
                    {
                        //last iteration so time to check the heights for the stats
                        if (data[i]> max) max = data[i];

                        if (data[i] < min) min = data[i];
                    }
                }
                quality *= 5;
            }

            console.log("Data Stats: max: " +  max + ", min: " +  min);
            console.log("Data: ");
            console.log(data);

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
            Terrain.mesh = new THREE.Mesh(Terrain.geometry, Terrain.material);
            Terrain.obj.add(Terrain.mesh);
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
            var material = new THREE.ShaderMaterial(
            {
                uniforms :
                {
                    uHeightData: { type: "t", value: Terrain.height_data },
                    uResolution: { type: "f", value: Terrain.RESOLUTION },
                },
                vertexShader : terrain_vert_shader.value,
                fragmentShader : Terrain.frag_shader.value,
            });
            return material;
        },
    };
    return Terrain;
});
