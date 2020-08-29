// sources:
// https://github.com/felixpalmer/lod-terrain
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_terrain.html

define(["three", "utils", "scene", "light", "camera", "physics", "player", "shader!terrain.vert", "shader!terrain.frag", "renderer", "eventQ"],
(THREE, Utils, scene, Light, camera, Physics, Player, terrain_vert_shader, terrain_frag_shader, renderer, EventQ) =>
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
        WORLD_WIDTH : Math.pow(2, 12),
        DATA_WIDTH : Math.pow(2, 14),
        LEVELS : 4,
        RESOLUTION : 64.0,
        TILE_WIDTH : 1,

        obj : new THREE.Object3D(),
        geometry : new THREE.PlaneBufferGeometry(),
        top_left_data : new Uint8Array(),
        top_right_data : new Uint8Array(),
        bot_left_data : new Uint8Array(),
        bot_right_data : new Uint8Array(),
        top_left_texture : new THREE.DataTexture(),
        top_right_texture : new THREE.DataTexture(),
        bot_left_texture : new THREE.DataTexture(),
        bot_right_texture : new THREE.DataTexture(),
        frag_shader : terrain_frag_shader,
        init_scale : 32.0,
        global_offset : new THREE.Vector3(0, 0, 0),
        alpha : 1.0,
        isWebGL2 : renderer.capabilities.isWebGL2,

        // physics
        collider_meshes : [],
        collider_mesh : {},
        init_chunk_pos : new THREE.Vector2(0, 0),
        collider : {},
        last_collider_pos : new THREE.Vector3(0, 0, 0),

        init : () =>
        {
            // webgl2.0 : textureLod vs webgl1.0 : texture2DLod in terrain.vert
            if (Terrain.isWebGL2) terrain_vert_shader.define("WEBGL2", 1.0);

            // Event for passing data to player
            EventQ.push(
            {
                verify : () =>
                {
                    return Player.initialized && Object.keys(Terrain.collider_mesh).length > 0;
                },
                action: () =>
                {
                    Player.collider.addMesh("Terrain_Ground", Terrain.collider_mesh);
                    Player.input_handler.toggleAlpha = Terrain.toggleAlpha.bind(Terrain);

                    // initialize the ammo collider
                    Terrain.updateCollider();
                },
                arguments : [],
            });

            console.log(renderer.capabilities.maxTextureSize);

            // Terrain.updateHeightData()
            Terrain.readHeightData().then((uid) =>
            {
                // only do this if updateHeightData is done
                // init Collider mesh and data
                Terrain.createColliderMesh();

                // set the frag shader
                Terrain.frag_shader = terrain_frag_shader;

                // init the geometry
                Terrain.geometry = new THREE.PlaneBufferGeometry(
                    Terrain.TILE_WIDTH, Terrain.TILE_WIDTH,
                    Terrain.RESOLUTION, Terrain.RESOLUTION);

                var translation_matrix = new THREE.Matrix4();
                translation_matrix.makeTranslation(0.5, 0.5, 0.0);
                Terrain.geometry.applyMatrix4(translation_matrix);

                // init tiles
                Terrain.initTiles();
            });
        },

        // --------------
        //   RENDERING
        // --------------

        loadTexture : (data, data_name) =>
        {
            data = new Uint8Array(data);
            data_texture = new THREE.DataTexture(data, Terrain.DATA_WIDTH, Terrain.DATA_WIDTH, THREE.AlphaFormat);
            data_texture.magFilter = THREE.LinearFilter;
            data_texture.minFilter = THREE.LinearMipMapLinearFilter;
            data_texture.generateMipmaps = true;
            data_texture.needsUpdate = true;

            switch (data_name)
            {
                case ("top_left"):
                    Terrain.top_left_data = data;
                    Terrain.top_left_texture = data_texture;
                    break;
                case ("top_right"):
                    Terrain.top_right_data = data;
                    Terrain.top_right_texture = data_texture;
                    break;
                case("bot_left"):
                    Terrain.bot_left_data = data;
                    Terrain.bot_left_texture = data_texture;
                    break;
                case ("bot_right"):
                    Terrain.bot_right_data = data;
                    Terrain.bot_right_texture = data_texture;
                    break;
            }
        },

        readHeightData : () =>
        {
            return new Promise(async (resolve, reject) =>
            {
                const cache = await caches.open('game-cache');
                const cache_names = await cache.keys();

                var count = 0;

                var finished = () =>
                {
                    if (++count == 4)
                    {
                        console.log("Finished Loading Terrain!");
                        return resolve();
                    }
                }
                if (Object.keys(cache_names).length == 0)
                {
                    console.log("Reading from file");

                    const loader = new THREE.FileLoader();

                    loader.setResponseType("blob");

                    loader.load("js/data/HeightData", (blob) =>
                    {
                        // top_left
                        blob.slice(0, Math.pow(Terrain.DATA_WIDTH, 2), 'uint8').arrayBuffer().then((data) =>
                        {
                            cache.put('top_left', new Response(data));
                            Terrain.loadTexture(data, "top_left");
                            finished();
                        });

                        // top_right
                        blob.slice(Math.pow(Terrain.DATA_WIDTH, 2), Math.pow(Terrain.DATA_WIDTH, 2) * 2, 'uint8').arrayBuffer().then((data) =>
                        {
                            cache.put('top_right', new Response(data));
                            Terrain.loadTexture(data, "top_right");
                            finished();
                        });

                        // bot_left
                        blob.slice(Math.pow(Terrain.DATA_WIDTH, 2) * 2, Math.pow(Terrain.DATA_WIDTH, 2) * 3, 'uint8').arrayBuffer().then((data) =>
                        {
                            cache.put('bot_left', new Response(data));
                            Terrain.loadTexture(data, "bot_left");
                            finished();
                        });

                        // bot_right
                        blob.slice(Math.pow(Terrain.DATA_WIDTH, 2) * 3, Math.pow(Terrain.DATA_WIDTH, 2) * 4, 'uint8').arrayBuffer().then((data) =>
                        {
                            cache.put('bot_right', new Response(data));
                            Terrain.loadTexture(data, "bot_right");
                            finished();
                        });
                    });
                }
                else
                {
                    console.log("Read from cache");

                    cache.match('top_left').then(async (response) =>
                    {
                        response.arrayBuffer().then((data) =>
                        {
                            Terrain.loadTexture(data, "top_left");
                            finished();
                        });
                    });
                    cache.match('top_right').then(async (response) =>
                    {
                        response.arrayBuffer().then((data) =>
                        {
                            Terrain.loadTexture(data, "top_right");
                            finished();
                        });
                    });
                    cache.match('bot_left').then(async (response) =>
                    {
                        response.arrayBuffer().then((data) =>
                        {
                            Terrain.loadTexture(data, "bot_left");
                            finished();
                        });
                    });
                    cache.match('bot_right').then(async (response) =>
                    {
                        response.arrayBuffer().then((data) =>
                        {
                            Terrain.loadTexture(data, "bot_right");
                            finished();
                        });
                    });
                }
            });
        },

        initTiles : () =>
        {
            Terrain.init_scale = Terrain.WORLD_WIDTH / Math.pow(2, Terrain.LEVELS);

            // create center tiles
            Terrain.createTile(-Terrain.init_scale, -Terrain.init_scale, Terrain.init_scale, Edge.NONE, true);
            Terrain.createTile(-Terrain.init_scale, 0, Terrain.init_scale, Edge.NONE, true);
            Terrain.createTile(0, 0, Terrain.init_scale, Edge.NONE, true);
            Terrain.createTile(0, -Terrain.init_scale, Terrain.init_scale, Edge.NONE, true);

            // create quadtree of tiles
            for (var scale = Terrain.init_scale; scale < Terrain.WORLD_WIDTH; scale *= 2)
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

        createTile : (tile_offset_x, tile_offset_y, scale, edge_morph, is_collider_mesh = false) =>
        {
            var tile_offset = new THREE.Vector2(tile_offset_x, tile_offset_y);
            var tile_material = Terrain.createMaterial(tile_offset, scale, edge_morph);
            var mesh = new THREE.Mesh(Terrain.geometry, tile_material);
            mesh.frustumCulled = false;

            if (is_collider_mesh)
            {
                Terrain.collider_meshes.push(mesh);
            }

            Terrain.obj.add(mesh);
        },

        createMaterial : (tile_offset, scale, edge_morph) =>
        {
            return new THREE.ShaderMaterial(
            {
                uniforms :
                {
                    uEdgeMorph    :  { type : "i", value : edge_morph },
                    uGlobalOffset :  { type : "v3", value : Terrain.global_offset },
                    uTileOffset   :  { type : "v2", value : tile_offset },
                    uScale        :  { type : "f", value : scale },
                    uAlpha        :  { type : "f", value : Terrain.alpha },
                    uLookDir      :  { type : "v3", value : Player.look_direction },
                    uSunlight     :  {
                                        value :
                                            {
                                             direction : Light.sunlight_direction,
                                             position  : Light.sunlight.position,
                                             ambient   : Light.sunlight_ambient,
                                             diffuse   : Light.sunlight_diffuse,
                                             specular  : Light.sunlight_specular
                                            }
                                     },
                    uHeightData   :  {
                                        value :
                                            {
                                                top_left : Terrain.top_left_texture,
                                                top_right : Terrain.top_right_texture,
                                                bot_left : Terrain.bot_left_texture,
                                                bot_right : Terrain.bot_right_texture,
                                            }
                                     },
                },
                defines :
                {
                    RESOLUTION   : Terrain.RESOLUTION,
                    DATA_WIDTH   : Terrain.DATA_WIDTH,
                    DATA_WIDTH_2 : Terrain.DATA_WIDTH / 2,
                },
                vertexShader  : terrain_vert_shader.value,
                fragmentShader  : Terrain.frag_shader.value,
                transparent : true,
            });
        },

        toggleAlpha : (a) =>
        {
            Terrain.alpha = a;
            for (var c in Terrain.obj.children)
            {
                var tile = Terrain.obj.children[c];
                tile.material.uniforms.uAlpha = { type : "f", value : Terrain.alpha };
            }
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
            Terrain.global_offset.x = camera.position.x;
            Terrain.global_offset.y = camera.position.y;

            if (Player.initialized && (Utils.distance2D(Player.threeObj.position, Terrain.last_collider_pos) >= Terrain.RESOLUTION * 0.75))
            {
                Terrain.updateCollider();
            }
        },

        // --------------
        //    PHYSICS
        // --------------

        createColliderMesh : () =>
        {
            var geometry = new THREE.PlaneBufferGeometry(
                Terrain.RESOLUTION * 2, Terrain.RESOLUTION * 2,
                Terrain.RESOLUTION * 2, Terrain.RESOLUTION * 2);
            var material = new THREE.MeshStandardMaterial({ visible : false });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.frustumCulled = false;
            scene.add(mesh);
            Terrain.collider_mesh = mesh;

            var vertices = [];
            var indices = [];
            var width = Terrain.RESOLUTION;

            var i = 0;

            for (var y = -width; y < width; y++)
            {
                for (var x = -width; x < width; x++)
                {
                    // assign vertex to vertices
                    vertices.push(x, y, 0.0);

                    // // assign 2 faces per vertex
                    if (y != width - 1 && x != width - 1)
                    {
                        // clockwise
                        indices.push(i, i + 1, i + 2 * width);
                        indices.push(i + 1, i + 1 + 2 * width, i + 2 * width);
                    }

                    // face/ vertex index
                    i++;
                }
            }

            // assign indices and vertices to mesh
            Terrain.collider_mesh.geometry.setIndex(indices);
            Terrain.collider_mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        },

        updateCollider : () =>
        {
            // get chunk data
            var cd = Terrain.getChunkData();

            // update last_collider_pos
            Terrain.last_collider_pos.copy(Player.threeObj.position);

            // create collider if one doesn't exist, else update existing collider
            if (Object.keys(Terrain.collider).length == 0)
            {
                Terrain.collider = Physics.createTerrainCollider(cd);
            } else
            {
                Physics.updateTerrainCollider(cd, Terrain.collider);
            }
        },

        getChunkData : () =>
        {
            // find terrain data
            var new_height_data = [];
            var min_height = Number.POSITIVE_INFINITY;
            var max_height = Number.NEGATIVE_INFINITY;
            var res = Terrain.RESOLUTION;
            var width = Terrain.DATA_WIDTH;
            var width2 = Terrain.DATA_WIDTH / 2;
            var xi = 0, yi = 0, h = 0;
            var vertices = [];

            Terrain.init_chunk_pos.x = Math.round(Terrain.global_offset.x);
            Terrain.init_chunk_pos.y = Math.round(Terrain.global_offset.y);

            for (var y = Terrain.init_chunk_pos.y - res; y < Terrain.init_chunk_pos.y + res; y++)
            {
                for (var x = Terrain.init_chunk_pos.x - res; x < Terrain.init_chunk_pos.x + res; x++)
                {
                    xi = (x + width2) % width;
                    yi = (y + width2) % width;

                    // assign height and find min/ max
                    // deals with creases
                    var x2 = x + 1;
                    var y2 = y + 1;
                    if (x2 >= 0 && y2 >= 0)
                    {
                        h = Terrain.top_right_data[xi + yi * width];
                    }
                    else if (x2 < 0 && y2 < 0)
                    {
                        h = Terrain.bot_left_data[xi + yi * width];
                    }
                    else if (x2 < 0 && y2 >= 0)
                    {
                        h = Terrain.top_left_data[xi + yi * width];
                    }
                    else
                    {
                        h = Terrain.bot_right_data[xi + yi * width];
                    }

                    new_height_data.push(h);

                    if (h > max_height) max_height = h;
                    if (h < min_height) min_height = h;

                    // assign new height to vertex attributes
                    vertices.push(x - Terrain.init_chunk_pos.x, y - Terrain.init_chunk_pos.y, h);
                }
            }
            // assign indices and vertices to mesh
            Terrain.collider_mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            Terrain.collider_mesh.position.copy(new THREE.Vector3(Terrain.init_chunk_pos.x, Terrain.init_chunk_pos.y, 0.0));

            // cd stands for Chunk Data
            var cd = {};
            cd.width = res * 2;
            cd.depth = res * 2;
            cd.min_height = min_height;
            cd.max_height = max_height;
            cd.width_extents = res * 2;
            cd.depth_extents = res * 2;
            cd.height_data = new_height_data;
            cd.center_pos = new THREE.Vector3(Terrain.init_chunk_pos.x,
                                              Terrain.init_chunk_pos.y,
                                              0.0);
            return cd;
        },

        // --------------
        //    HELPERS
        // --------------

    };

    return Terrain;
});
