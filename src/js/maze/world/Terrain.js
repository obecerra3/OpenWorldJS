// sources:
// https://github.com/felixpalmer/lod-terrain
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_terrain.html

define(["three", "utils", "scene", "ImprovedNoise", "camera", "shader!terrain.vert", "shader!terrain.frag"],
(THREE, Utils, scene, ImprovedNoise, camera, terrain_vert_shader, terrain_frag_shader) =>
{
    var Edge =
    {
        NONE: 0,
        TOP: 1,
        LEFT: 2,
        BOTTOM: 4,
        RIGHT: 8
    };

    var Terrain =
    {
        // Event Queue
        event_queue : [],

        // Constants
        WORLD_WIDTH : 1024,
        LEVELS : 4,
        RESOLUTION : 64.0,

        // rendering
        obj : new THREE.Object3D(),
        geometry : new THREE.PlaneBufferGeometry(),
        height_data  : new THREE.DataTexture(),
        frag_shader  : terrain_frag_shader,
        global_offset  : new THREE.Vector3(0, 0, 0),

        // physics
        // ammo convex hull collider

        init : () =>
        {
            // create height_data
            Terrain.createHeightData();

            // set the frag shader
            Terrain.frag_shader = terrain_frag_shader;

            // create material
            Terrain.material = Terrain.createMaterial();

            // init the geometry
            Terrain.geometry = new THREE.PlaneGeometry(1, 1, Terrain.RESOLUTION, Terrain.RESOLUTION);
            // Terrain.geometry.rotateX(-Math.PI / 2);
            var translation_matrix = new THREE.Matrix4();
            translation_matrix.makeTranslation(0.5, 0.5, 0.0);
            Terrain.geometry.applyMatrix4(translation_matrix);

            // init tiles
            Terrain.initTiles();

            // normally this will be called by GameScreen
            Terrain.render();

        },

        initTiles : () =>
        {
            var init_scale = Terrain.WORLD_WIDTH / Math.pow(2, Terrain.LEVELS);

            // create center tiles
            Terrain.createTile(-init_scale, -init_scale, init_scale, Edge.NONE);
            Terrain.createTile(-init_scale, 0, init_scale, Edge.NONE);
            Terrain.createTile(0, 0, init_scale, Edge.NONE);
            Terrain.createTile(0, -init_scale, init_scale, Edge.NONE);


            // create quadtree of tiles
            for (var scale = init_scale; scale < Terrain.WORLD_WIDTH; scale *= 2)
            {
                Terrain.createTile(-2 * scale, -2 * scale, scale, Edge.BOTTOM | Edge.LEFT);
                Terrain.createTile(-2 * scale, -scale, scale, Edge.LEFT);
                Terrain.createTile(-2 * scale, 0, scale, Edge.LEFT);
                Terrain.createTile(-2 * scale, scale, scale, Edge.TOP | Edge.LEFT);

                Terrain.createTile(-scale, -2 * scale, scale, Edge.BOTTOM);
                Terrain.createTile(-scale, scale, scale, Edge.TOP);

                Terrain.createTile(0, -2 * scale, scale, Edge.BOTTOM);
                Terrain.createTile(0, scale, scale, Edge.TOP);

                Terrain.createTile(scale, -2 * scale, scale, Edge.BOTTOM | Edge.RIGHT);
                Terrain.createTile(scale, -scale, scale, Edge.RIGHT);
                Terrain.createTile(scale, 0, scale, Edge.RIGHT);
                Terrain.createTile(scale, scale, scale, Edge.TOP | Edge.RIGHT);
          }

        },

        createTile : (tile_offset_x, tile_offset_y, scale, edge_morph) =>
        {
            var tile_offset = new THREE.Vector2(tile_offset_x, tile_offset_y);
            var tile_material = Terrain.createMaterial(tile_offset, scale, edge_morph);
            var mesh = new THREE.Mesh(Terrain.geometry, tile_material);
            mesh.frustumCulled = false;
            Terrain.obj.add(mesh);
        },

        createMaterial : (tile_offset, scale, edge_morph) =>
        {
            return new THREE.ShaderMaterial(
            {
                uniforms  :
                {
                    uEdgeMorph    :  { type : "i", value : edge_morph },
                    uGlobalOffset :  { type : "v3", value : Terrain.global_offset },
                    uHeightData   :  { type : "t", value : Terrain.height_data },
                    uResolution   :  { type : "f", value : Terrain.RESOLUTION },
                    uTileOffset   :  { type : "v2", value : tile_offset },
                    uScale        :  { type : "f", value : scale },
                },
                vertexShader  : terrain_vert_shader.value,
                fragmentShader  : Terrain.frag_shader.value,
                transparent : true,
            });
        },

        createHeightData : () =>
        {
            var width = Terrain.WORLD_WIDTH;
            var size = width * width;
            var data = new Uint8Array(size);
            var perlin = new ImprovedNoise();
            var quality = 1;
            var z = Utils.terrainRandom() * 100;
            var max = Number.NEGATIVE_INFINITY;
            var min = Number.POSITIVE_INFINITY;

            for (var j = 0; j < 4; j++)
            {
                for (var i = 0; i < size; i++)
                {
                    var x = i % width;
                    var y = Math.floor(i / width);

                    data[i] += Math.abs( perlin.noise((x / quality), (y / quality), z ) * quality);

                    if (j == 3)
                    {
                        //last iteration so time to check the heights for the stats
                        if (data[i]> max) max = data[i];

                        if (data[i] < min) min = data[i];
                    }
                }
                quality *= 5;
            }

            // console.log("Data Stats : max : " +  max + ", min : " +  min);
            // console.log("Data : ");
            // console.log(data);

            Terrain.height_data = new THREE.DataTexture(data, width, width, THREE.AlphaFormat);
            Terrain.height_data.wrapS = THREE.MirroredRepeatWrapping;
            Terrain.height_data.wrapT = THREE.MirroredRepeatWrapping;
            Terrain.height_data.magFilter = THREE.LinearFilter;
            Terrain.height_data.minFilter = THREE.LinearMipMapLinearFilter;
            Terrain.height_data.generateMipmaps = true;
            Terrain.height_data.needsUpdate = true;
        },

        render : () =>
        {
            // add obj to scene
            scene.add(Terrain.obj);
        },

        //-------------------
        //      UPDATE
        //-------------------

        update : () =>
        {
            Terrain.global_offset.x = camera.position.x;
            Terrain.global_offset.y = camera.position.y;

            Terrain.checkEventQueue();
        },

        checkEventQueue : () =>
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

    };

    return Terrain;
});
