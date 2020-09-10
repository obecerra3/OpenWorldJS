// sources:
// https://github.com/felixpalmer/lod-terrain
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_terrain.html

define(["three", "utils", "scene", "light", "ImprovedNoise", "camera", "physics",
        "player", "shader!terrain.vert", "shader!terrain.frag", "renderer",
        "eventQ", "GPUComputationRenderer", "shader!Heightmap.frag",
        "shader!SmoothHeightmap.frag"],
        (THREE, Utils, scene, Light, ImprovedNoise, camera, Physics, Player,
        TerrainVert, TerrainFrag, renderer, EventQ, GPUComputationRenderer,
        HeightmapFrag, SmoothHeightmapFrag) =>
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
        WORLD_WIDTH : Math.pow(2, 10),
        DATA_WIDTH : Math.pow(2, 12),
        LEVELS : 4,
        RESOLUTION : 128.0,
        TILE_WIDTH : 1,

        obj : new THREE.Object3D(),
        geometry : new THREE.PlaneBufferGeometry(),
        height_data_texture : new THREE.DataTexture(),
        height_data : [],
        frag_shader : TerrainFrag,
        init_scale : 32.0,
        global_offset : new THREE.Vector3(0, 0, 0),
        alpha : 1.0,
        isWebGL2 : renderer.capabilities.isWebGL2,
        height_data_center : new THREE.Vector2(0, 0),

        // physics
        collider_meshes : [],
        collider_mesh : {},
        init_chunk_pos : new THREE.Vector2(0, 0),
        collider : {},
        last_collider_pos : new THREE.Vector3(0, 0, 0),

        init : () =>
        {
            // webgl2.0 : textureLod vs webgl1.0 : texture2DLod in shaders
            if (Terrain.isWebGL2)
            {
                TerrainVert.define("WEBGL2", 1.0);
            }

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

            Terrain.initGPUCompute();

            // // create height_data using Promise
            Terrain.updateHeightData().then((uid) =>
            {
                // only do this if updateHeightData is done
                // init Collider mesh and data
                Terrain.createColliderMesh();

                // set the frag shader
                Terrain.frag_shader = TerrainFrag;

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

        initGPUCompute : () =>
        {
            // define constants for HeightmapFrag Shader
            HeightmapFrag.define("DATA_WIDTH_2", (Terrain.DATA_WIDTH / 2).toFixed(2));

            // define gpuCompute
            Terrain.gpuCompute = new GPUComputationRenderer(Terrain.DATA_WIDTH, Terrain.DATA_WIDTH, renderer);

            // define height_texture and height_variable and set dependencies
            Terrain.height_texture = Terrain.gpuCompute.createTexture();
            Terrain.height_variable = Terrain.gpuCompute.addVariable("heightmap", HeightmapFrag.value, Terrain.height_texture);
            Terrain.gpuCompute.setVariableDependencies(Terrain.height_variable, [Terrain.height_variable]);
            // set uniforms
            var uniforms = Terrain.height_variable.material.uniforms;
            uniforms["uCenter"] = { value : new THREE.Vector2() };

            // define height_texture and height_variable and set dependencies
            // Terrain.smooth_texture = Terrain.gpuCompute.createTexture();
            // Terrain.smooth_variable = Terrain.gpuCompute.addVariable("blurmap", SmoothHeightmapFrag.value, Terrain.smooth_texture);
            // Terrain.gpuCompute.setVariableDependencies(Terrain.smooth_variable, [Terrain.smooth_variable]);
            // // set uniforms
            // var uniforms = Terrain.smooth_variable.material.uniforms;
            // uniforms["uHeightmap"] = { value : null };

            // init gpuCompute and check for completeness
            var error = Terrain.gpuCompute.init();

            if (error !== null)
            {
                console.error("GPU Compute Completeness: " + error);
            }

            Terrain.readHeightRenderTarget = new THREE.WebGLRenderTarget(
                Terrain.DATA_WIDTH,
                Terrain.DATA_WIDTH,
                {
                     wrapS: THREE.ClampToEdgeWrapping,
                     wrapT: THREE.ClampToEdgeWrapping,
                     minFilter: THREE.NearestFilter,
                     magFilter: THREE.NearestFilter,
                     format: THREE.RGBAFormat,
                     type: THREE.UnsignedByteType,
                     depthBuffer: false
                }
            );
        },

        updateHeightData : (new_center_pos = null) =>
        {
            return new Promise((resolve, reject) =>
            {
                var start_time = new Date();

                // update center pos
                if (new_center_pos)
                {
                    Terrain.height_data_center = new THREE.Vector2(Math.round(new_center_pos.x), Math.round(new_center_pos.y));
                }

                // initial compute of heighmap
                Terrain.height_variable.material.uniforms.uCenter.value = Terrain.height_data_center;
                // Terrain.gpuCompute.compute();
                // var currentRenderTarget = Terrain.gpuCompute.getCurrentRenderTarget(Terrain.height_variable);
                // Terrain.smooth_variable.material.uniforms.uHeightmap.value = currentRenderTarget.texture;
                //
                // var myRenderTarget = Terrain.gpuCompute.createRenderTarget();
                // Terrain.gpuCompute.doRenderTarget(Terrain.smooth_variable.material, myRenderTarget);
                // Terrain.smooth_variable.material.uniforms.uHeightmap.value = myRenderTarget.texture;
                //
                // // smooth out height data
                // var i = 100;
                // while (i - 2 > 0)
                // {
                //     myRenderTarget = Terrain.gpuCompute.createRenderTarget();
                //     Terrain.gpuCompute.doRenderTarget(Terrain.smooth_variable.material, myRenderTarget);
                //     Terrain.smooth_variable.material.uniforms.uHeightmap.value = myRenderTarget.texture;
                //     i--;
                // }

                // read from framebuffer
                var pixels = new Uint8Array(4 * Terrain.DATA_WIDTH * Terrain.DATA_WIDTH);

                Terrain.gpuCompute.doRenderTarget(Terrain.height_variable.material, Terrain.readHeightRenderTarget);
                renderer.readRenderTargetPixels(Terrain.readHeightRenderTarget, 0, 0, Terrain.DATA_WIDTH, Terrain.DATA_WIDTH, pixels);

                var uint16map = new Uint16Array(Terrain.DATA_WIDTH * Terrain.DATA_WIDTH);
                var floatmap = new Float32Array(Terrain.DATA_WIDTH * Terrain.DATA_WIDTH);

                for (var i = 0, j = 0; j < pixels.length; i++, j+=4)
                {
                    var value = (pixels[j] + (pixels[j + 1] << 8));
                    uint16map[i] = value;
                    floatmap[i] = value / 70.0;
                }

                // set new Terrain height_data and height_data_texture
                Terrain.height_data = floatmap;
                Terrain.height_data_texture = new THREE.DataTexture(
                    floatmap,
                    Terrain.DATA_WIDTH,
                    Terrain.DATA_WIDTH,
                    THREE.RedFormat,
                    THREE.FloatType,
                    THREE.UVMapping,
                    THREE.ClampToEdgeWrapping,
                    THREE.ClampToEdgeWrapping,
                    THREE.LinearFilter,
                    THREE.LinearMipMapLinearFilter,
                    1
                );
                Terrain.height_data_texture.generateMipmaps = true;
                Terrain.height_data_texture.needsUpdate = true;

                // update uniforms of shaders
                for (var c in Terrain.obj.children)
                {
                    var tile = Terrain.obj.children[c];
                    tile.material.uniforms.uCenter = { type : "v2", value : Terrain.height_data_center };
                    tile.material.uniforms.uHeightData = { type : "t", value : Terrain.height_data_texture };
                }

                var end_time = (new Date() - start_time) / 1000;
                console.log("end: " + end_time);

                return resolve("height map generated");
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
                    uHeightData   :  { type : "t", value : Terrain.height_data_texture },
                    uTileOffset   :  { type : "v2", value : tile_offset },
                    uScale        :  { type : "f", value : scale },
                    uAlpha        :  { type : "f", value : Terrain.alpha },
                    uLookDir      :  { type : "v3", value : Player.look_direction },
                    uCenter       :  { type : "v2", value : Terrain.height_data_center },
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
                },
                defines :
                {
                    RESOLUTION  : Terrain.RESOLUTION,
                    DATA_WIDTH : Terrain.DATA_WIDTH,
                    DATA_WIDTH_2 : Terrain.DATA_WIDTH / 2,
                },
                vertexShader  : TerrainVert.value,
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

            if (Player.initialized)
            {

                if (Utils.distance2D(Player.threeObj.position, Terrain.last_collider_pos) >= Terrain.RESOLUTION * 0.75)
                {
                    Terrain.updateCollider();
                }

                if (Utils.distance2D(Player.threeObj.position, Terrain.height_data_center) >= Terrain.WORLD_WIDTH)
                {
                    Terrain.updateHeightData(Player.threeObj.position);
                }
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
            var material = new THREE.MeshStandardMaterial({ visible : false, color : 0x004433 });
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
            var xi = 0, yi = 0;
            var vertices = [];

            Terrain.init_chunk_pos.x = Math.round(Terrain.global_offset.x);
            Terrain.init_chunk_pos.y = Math.round(Terrain.global_offset.y);

            var x_count = 0;
            var y_count = 0;
            var h_count = 0;
            var h = 0;
            var start_counting = false;

            for (var y = Terrain.init_chunk_pos.y - res; y < Terrain.init_chunk_pos.y + res; y++)
            {
                for (var x = Terrain.init_chunk_pos.x - res; x < Terrain.init_chunk_pos.x + res; x++)
                {
                    xi = (x + width2 - Terrain.height_data_center.x) % width;
                    yi = (y + width2 - Terrain.height_data_center.y) % width;

                    // assign height and find min/ max
                    h = Terrain.height_data[xi + yi * width];
                    new_height_data.push(h);

                    if (h > max_height) max_height = h;
                    if (h < min_height) min_height = h;

                    // assign new height to vertex attributes
                    vertices.push(x - Terrain.init_chunk_pos.x, y - Terrain.init_chunk_pos.y, h);
                }
            }
            // assign vertices to mesh
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
