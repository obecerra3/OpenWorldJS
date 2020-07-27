// sources:
// https://github.com/felixpalmer/lod-terrain
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_terrain.html

define(["three", "utils", "scene", "ImprovedNoise", "camera", "physics", "player", "shader!terrain.vert", "shader!terrain.frag"],
(THREE, Utils, scene, ImprovedNoise, camera, Physics, Player, terrain_vert_shader, terrain_frag_shader) =>
{
    var Edge =
    {
        NONE : 0,
        TOP : 1,
        LEFT : 2,
        BOTTOM : 4,
        RIGHT : 8
    };

    var Terrain =
    {
        // rendering
        WORLD_WIDTH : 1024,
        LEVELS : 4,
        RESOLUTION : 64.0,
        TILE_WIDTH : 1,
        obj : new THREE.Object3D(),
        geometry : new THREE.PlaneBufferGeometry(),
        height_data_texture : new THREE.DataTexture(),
        height_data : [],
        frag_shader : terrain_frag_shader,
        init_scale : 0,
        global_offset : new THREE.Vector3(0, 0, 0),

        // physics
        collider_meshes : [],
        collider : {},
        last_player_pos : new THREE.Vector3(0, 0, 0),
        UPDATE_DISTANCE : 100.0,
        init_chunk_top_left : new THREE.Vector2(0, 0),

        // Event Queue
        event_queue : [],

        init : () =>
        {
            // create height_data
            Terrain.createHeightData();
            console.log(Terrain.height_data);

            // set the frag shader
            Terrain.frag_shader = terrain_frag_shader;

            // create material
            Terrain.material = Terrain.createMaterial();

            // init the geometry
            // Terrain.geometry = new THREE.PlaneGeometry(
            //     Terrain.TILE_WIDTH, Terrain.TILE_WIDTH,
            //     Terrain.RESOLUTION - 1, Terrain.RESOLUTION - 1);
            Terrain.geometry = new THREE.PlaneGeometry(
                Terrain.TILE_WIDTH, Terrain.TILE_WIDTH,
                Terrain.RESOLUTION, Terrain.RESOLUTION);

            var translation_matrix = new THREE.Matrix4();
            translation_matrix.makeTranslation(0.5, 0.5, 0.0);
            Terrain.geometry.applyMatrix4(translation_matrix);

            // init tiles
            Terrain.initTiles();

            Terrain.updateCollider();

            // normally this will be called by GameScreen
            Terrain.render();

        },

        // --------------
        //   RENDERING
        // --------------

        initTiles : () =>
        {
            Terrain.init_scale = Terrain.WORLD_WIDTH / Math.pow(2, Terrain.LEVELS);

            // create center tiles
            Terrain.createTile(-Terrain.init_scale, -Terrain.init_scale, Terrain.init_scale, Edge.NONE, true);
            Terrain.createTile(-Terrain.init_scale, 0, Terrain.init_scale, Edge.NONE, true);
            Terrain.createTile(0, 0, Terrain.init_scale, Edge.NONE, true);
            Terrain.createTile(0, -Terrain.init_scale, Terrain.init_scale, Edge.NONE, true);

          //   // create quadtree of tiles
          //   for (var scale = Terrain.init_scale; scale < Terrain.WORLD_WIDTH; scale *= 2)
          //   {
          //       Terrain.createTile(-2 * scale, -2 * scale, scale, Edge.BOTTOM | Edge.LEFT);
          //       Terrain.createTile(-2 * scale, -scale, scale, Edge.LEFT);
          //       Terrain.createTile(-2 * scale, 0, scale, Edge.LEFT);
          //       Terrain.createTile(-2 * scale, scale, scale, Edge.TOP | Edge.LEFT);
          //
          //       Terrain.createTile(-scale, -2 * scale, scale, Edge.BOTTOM);
          //       Terrain.createTile(-scale, scale, scale, Edge.TOP);
          //
          //       Terrain.createTile(0, -2 * scale, scale, Edge.BOTTOM);
          //       Terrain.createTile(0, scale, scale, Edge.TOP);
          //
          //       Terrain.createTile(scale, -2 * scale, scale, Edge.BOTTOM | Edge.RIGHT);
          //       Terrain.createTile(scale, -scale, scale, Edge.RIGHT);
          //       Terrain.createTile(scale, 0, scale, Edge.RIGHT);
          //       Terrain.createTile(scale, scale, scale, Edge.TOP | Edge.RIGHT);
          // }

        },

        createTile : (tile_offset_x, tile_offset_y, scale, edge_morph, is_collider_mesh = false) =>
        {
            var tile_offset = new THREE.Vector2(tile_offset_x, tile_offset_y);
            var tile_material = Terrain.createMaterial(tile_offset, scale, edge_morph);
            var mesh = new THREE.Mesh(Terrain.geometry, tile_material);
            mesh.frustumCulled = false;

            if (is_collider_mesh) Terrain.collider_meshes.push(mesh);

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
                    uHeightData   :  { type : "t", value : Terrain.height_data_texture },
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

            Terrain.height_data = data;
            Terrain.height_data_texture = new THREE.DataTexture(data, width, width, THREE.AlphaFormat);
            Terrain.height_data_texture.wrapS = THREE.MirroredRepeatWrapping;
            Terrain.height_data_texture.wrapT = THREE.MirroredRepeatWrapping;
            Terrain.height_data_texture.magFilter = THREE.LinearFilter;
            Terrain.height_data_texture.minFilter = THREE.LinearMipMapLinearFilter;
            Terrain.height_data_texture.generateMipmaps = true;
            Terrain.height_data_texture.needsUpdate = true;
        },

        render : () =>
        {
            console.log("Terrain render called, must only happen once");
            // add obj to scene
            scene.add(Terrain.obj);
        },

        //-------------------
        //      UPDATE
        //-------------------

        update : () =>
        {
            // Terrain.global_offset.x = camera.position.x;
            // Terrain.global_offset.y = camera.position.y;

            // if the player exists in the scene and (the player has moved
            // UPDATE_DISTANCE or the collider is empty)  --> updateCurrentChunkCollider
            // if (Object.keys(Player.body).length != 0
            //     && (Utils.distance2D(Player.body.position, Terrain.last_player_pos) > Terrain.UPDATE_DISTANCE
            //     || Object.keys(Terrain.collider).length === 0))
            //     Terrain.updateCollider();

            Terrain.checkEventQueue();
        },

        // --------------
        //    PHYSICS
        // --------------

        updateCollider : () =>
        {
            // Terrain.last_player_pos.copy(Player.body.position);
            var cd = Terrain.getChunkData();
            var new_collider = Physics.createTerrainCollider(cd);
            // if (Object.keys(Terrain.collider).length != 0) Physics.ammo.destroy(Terrain.collider);
            Terrain.collider = new_collider;
        },

        getChunkData : () =>
        {
            // find terrain data
            var new_height_data = [];
            var min_height = Number.POSITIVE_INFINITY;
            var max_height = Number.NEGATIVE_INFINITY;

            // vPosition = uScale * position + vec3(uTileOffset, 0.0) + uGlobalOffset;
            // float grid = uScale / uResolution;
            // vPosition = floor(vPosition / grid) * grid;
            // GETHEIGHT
            // vec2 st = pos.xy / 1024.0;
            // float lod = 0.0;
            // float height = 1024.0 * textureLod(uHeightData, st, lod).a;
            // height += 64.0 * textureLod(uHeightData, 16.0 * st, lod).a;
            // height += 4.0 * textureLod(uHeightData, 256.0 * st, lod).a;
            // return height * height / 2000.0;
            // FINAL
            // vPosition = vPosition + normal * getHeight(vPosition);
            var width = 130;
            var perlin = new ImprovedNoise();
            var z = Utils.terrainRandom() * 100;
            for (i = 0; i <  16900; i++)
            {
                var x = i % width;
                var y = Math.floor(i / width);

                h = Math.abs(perlin.noise(x, y, z ));

                if (h > max_height) max_height = h;
                if (h < min_height) min_height = h;
                new_height_data.push(h);
            }

            console.log("new height data");
            console.log(new_height_data);
            //     if (h > max_height) max_height = h;
            //     if (h < min_height) min_height = h;
            //     new_height_data.push(h);


            // cd stands for Chunk Data
            var cd = {};
            cd.width = 130;
            cd.depth = 130;
            cd.min_height = min_height;
            cd.max_height = max_height;
            cd.width_extents = 120;
            cd.depth_extents = 120;
            cd.height_data = new_height_data;

            return cd;
        },

        // --------------
        //    HELPERS
        // --------------

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
