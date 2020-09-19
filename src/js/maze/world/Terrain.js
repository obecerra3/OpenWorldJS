// sources:
// https://github.com/felixpalmer/lod-terrain
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_terrain.html
'use strict'
define(["three", "utils", "scene", "light", "ImprovedNoise", "camera", "physics",
        "player", "shader!Terrain.vert", "shader!Terrain.frag", "renderer",
        "eventQ", "GPUComputationRenderer", "shader!HeightmapGen.frag",
        "shader!GroundCheck.frag", "shader!TextureGen.frag", "shader!BoxBlur.frag",
        "shader!Erosion.frag", "texture"],
        (THREE, Utils, scene, Light, ImprovedNoise, camera, Physics, Player,
        TerrainVert, TerrainFrag, renderer, EventQ, GPUComputationRenderer,
        HeightmapGenFrag, GroundCheckFrag, TextureGenFrag, BoxBlurFrag,
        ErosionFrag, texture) =>
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
        WORLD_WIDTH : Math.pow(2, 11),
        DATA_WIDTH : Math.pow(2, 12),
        LEVELS : 4,
        RESOLUTION : 32.0,              // 128.0 looks the best and runs at about ~40 fps, 64.0 at ~50 fps, and 32.0 at ~60 fps
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

        init : function()
        {
            // webgl2.0 : textureLod vs webgl1.0 : texture2DLod in shaders
            if (this.isWebGL2)
            {
                TerrainVert.define("WEBGL2", 1.0);
                TerrainFrag.define("WEBGL2", 1.0);
                GroundCheckFrag.define("WEBGL2", 1.0);
            }

            // Event for passing data to player
            EventQ.push(
            {
                verify : () =>
                {
                    return Player.initialized; //&& Object.keys(this.collider_mesh).length > 0;
                },
                action: () =>
                {
                    // Player.collider.addMesh("this_Ground", this.collider_mesh);
                    Player.input_handler.toggleAlpha = this.toggleAlpha.bind(this);
                    Player.isGrounded = this.isGrounded.bind(this);

                    // initialize the ammo collider
                    this.updateCollider();
                },
                arguments : [],
            });

            this.initGPUCompute().then(() =>
            {
                // // create height_data using Promise
                this.updateHeightData().then((uid) =>
                {
                    // only do this if updateHeightData is done
                    // init Collider mesh and data
                    this.createColliderMesh();

                    // set the frag shader
                    this.frag_shader = TerrainFrag;

                    // init the geometry
                    this.geometry = new THREE.PlaneBufferGeometry(
                        this.TILE_WIDTH, this.TILE_WIDTH,
                        this.RESOLUTION, this.RESOLUTION);

                    var translation_matrix = new THREE.Matrix4();
                    translation_matrix.makeTranslation(0.5, 0.5, 0.0);
                    this.geometry.applyMatrix4(translation_matrix);

                    // init tiles
                    this.initTiles();
                });
            });
        },

        // --------------
        //   RENDERING
        // --------------

        initGPUCompute : function()
        {
            return new Promise(async (resolve, reject) =>
            {
                var start_time = new Date();

                // define constants for shaders
                HeightmapGenFrag.define("DATA_WIDTH_2", (this.DATA_WIDTH / 2).toFixed(2));
                GroundCheckFrag.define("DATA_WIDTH", (this.DATA_WIDTH).toFixed(2));
                GroundCheckFrag.define("DATA_WIDTH_2", (this.DATA_WIDTH / 2).toFixed(2));

                // define gpuCompute
                this.gpuCompute = new GPUComputationRenderer(this.DATA_WIDTH, this.DATA_WIDTH, renderer);

                // define texture LUT generator shader
                var textureGenShader = this.gpuCompute.createShaderMaterial(
                    TextureGenFrag.value,
                    {
                        uHash : { value : true },
                        uTextureType : { value : 0 },
                    }
                );

                // define heightmap generator shader, image, and render target
                this.heightmapGenShader = this.gpuCompute.createShaderMaterial(
                    HeightmapGenFrag.value,
                    {
                        uHash : { value : false },
                        uCenter : { value : new THREE.Vector2() },
                        uNoise : { value : null },
                    }
                );

                this.readHeightRenderTarget = new THREE.WebGLRenderTarget(
                    this.DATA_WIDTH,
                    this.DATA_WIDTH,
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

                // define ground_check shader, image, and render target
                this.groundCheckShader = this.gpuCompute.createShaderMaterial(
                    GroundCheckFrag.value,
                    {
                        uPlayerPos : { value : new THREE.Vector3() },
                        uCenter    : { value : new THREE.Vector2() },
                        uHeightmap : { value : null },
                    }
                );

                this.ground_check_image = new Uint8Array(4);
                this.groundCheckRenderTarget = new THREE.WebGLRenderTarget(1, 1,
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

                // define erosion shader
                this.erosionShader = this.gpuCompute.createShaderMaterial(
                    ErosionFrag.value,
                    {
                        uHeightmap : { value : null },
                    }
                );

                // define boxblur shader
                this.boxBlurShader = this.gpuCompute.createShaderMaterial(
                    BoxBlurFrag.value,
                    {
                        uHeightmap : { value : null },
                    }
                );

                // init gpuCompute and check for completeness
                var error = this.gpuCompute.init();

                if (error !== null)
                {
                    console.error("GPU Compute Completeness: " + error);
                }

                this.readSmoothHeightRenderTarget = new THREE.WebGLRenderTarget(
                    this.DATA_WIDTH,
                    this.DATA_WIDTH,
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

                // compute noise texture
                var smallRenderTarget = new THREE.WebGLRenderTarget(256, 256,
                    {
                        wrapS: THREE.ClampToEdgeWrapping,
                        wrapT: THREE.ClampToEdgeWrapping,
                        minFilter: THREE.NearestFilter,
                        magFilter: THREE.NearestFilter,
                        format: THREE.RGBAFormat,
                        type: THREE.UnsignedByteType,
                        depthBuffer: false,
                    }
                );
                var pixels = new Uint8Array(4 * 256 * 256);
                this.gpuCompute.doRenderTarget(textureGenShader, smallRenderTarget);
                renderer.readRenderTargetPixels(smallRenderTarget, 0, 0, 256, 256, pixels);
                var noise_data = new Uint8Array(256 * 256);
                for (var i = 0, j = 0; j < pixels.length; i++, j+=4)
                {
                    noise_data[i] = pixels[j];
                }
                this.noise_texture = new THREE.DataTexture(
                    noise_data,
                    256,
                    256,
                    THREE.AlphaFormat,
                    THREE.UnsignedByteType,
                    THREE.UVMapping,
                    THREE.MirroredRepeatWrapping,
                    THREE.MirroredRepeatWrapping,
                    THREE.LinearFilter,
                    THREE.LinearMipMapLinearFilter,
                    1
                );
                this.noise_texture.generateMipmaps = true;
                this.noise_texture.needsUpdate = true;

                // compute grass textures
                var grass_width = Math.pow(2, 10);
                var largeRenderTarget = new THREE.WebGLRenderTarget(grass_width, grass_width,
                    {
                        wrapS: THREE.ClampToEdgeWrapping,
                        wrapT: THREE.ClampToEdgeWrapping,
                        minFilter: THREE.NearestFilter,
                        magFilter: THREE.NearestFilter,
                        format: THREE.RGBAFormat,
                        type: THREE.UnsignedByteType,
                        depthBuffer: false,
                    }
                );
                pixels = new Uint8Array(4 * grass_width * grass_width);
                textureGenShader.uniforms.uTextureType.value = 1;
                this.gpuCompute.doRenderTarget(textureGenShader, largeRenderTarget);
                renderer.readRenderTargetPixels(largeRenderTarget, 0, 0, grass_width, grass_width, pixels);
                var grass_data = new Uint8Array(pixels.buffer);
                this.grass_texture = new THREE.DataTexture(
                    grass_data,
                    grass_width,
                    grass_width,
                    THREE.RGBAFormat,
                    THREE.UnsignedByteType,
                    THREE.UVMapping,
                    THREE.MirroredRepeatWrapping,
                    THREE.MirroredRepeatWrapping,
                    THREE.LinearFilter,
                    THREE.LinearMipMapLinearFilter,
                    1
                );
                this.grass_texture.generateMipmaps = true;
                this.grass_texture.needsUpdate = true;

                grass_width = Math.pow(2, 8);
                pixels = new Uint8Array(4 * grass_width * grass_width);
                textureGenShader.uniforms.uTextureType.value = 2;
                this.gpuCompute.doRenderTarget(textureGenShader, smallRenderTarget);
                renderer.readRenderTargetPixels(smallRenderTarget, 0, 0, grass_width, grass_width, pixels);
                grass_data = new Uint8Array(pixels.buffer);
                this.grass_small_texture = new THREE.DataTexture(
                    grass_data,
                    grass_width,
                    grass_width,
                    THREE.RGBAFormat,
                    THREE.UnsignedByteType,
                    THREE.UVMapping,
                    THREE.MirroredRepeatWrapping,
                    THREE.MirroredRepeatWrapping,
                    THREE.LinearFilter,
                    THREE.LinearMipMapLinearFilter,
                    1
                );
                this.grass_small_texture.generateMipmaps = true;
                this.grass_small_texture.needsUpdate = true;


                // set uniforms
                var uniforms = this.heightmapGenShader.uniforms;
                uniforms["uCenter"] = { value : new THREE.Vector2() };
                uniforms["uHash"] = { value : false };
                uniforms["uNoise"] = { value : this.noise_texture };

                var end_time = (new Date() - start_time) / 1000;
                console.log("Init GPUCompute Time: " + end_time);

                return resolve("GPUCompute Initialized");
            });
        },

        updateHeightData : function(new_center_pos = null)
        {
            return new Promise((resolve, reject) =>
            {
                var start_time = new Date();

                // update center pos
                if (new_center_pos)
                {
                    this.height_data_center = new THREE.Vector2(Math.round(new_center_pos.x), Math.round(new_center_pos.y));
                }

                // initial compute of heighmap
                this.heightmapGenShader.uniforms.uCenter.value = this.height_data_center;

                // read from framebuffer
                var pixels = new Uint8Array(4 * this.DATA_WIDTH * this.DATA_WIDTH);

                this.gpuCompute.doRenderTarget(this.heightmapGenShader, this.readHeightRenderTarget);
                renderer.readRenderTargetPixels(this.readHeightRenderTarget, 0, 0, this.DATA_WIDTH, this.DATA_WIDTH, pixels);
                var floatmap = new Float32Array(this.DATA_WIDTH * this.DATA_WIDTH);

                for (var i = 0, j = 0; j < pixels.length; i++, j+=4)
                {
                    floatmap[i] = (pixels[j] + (pixels[j + 1] << 8)) / 70.0;
                }

                this.height_data = floatmap;
                this.height_data_texture = new THREE.DataTexture(
                    floatmap,
                    this.DATA_WIDTH,
                    this.DATA_WIDTH,
                    THREE.RedFormat,
                    THREE.FloatType,
                    THREE.UVMapping,
                    THREE.ClampToEdgeWrapping,
                    THREE.ClampToEdgeWrapping,
                    THREE.LinearFilter,
                    THREE.LinearMipMapLinearFilter,
                    1
                );
                this.height_data_texture.generateMipmaps = true;
                this.height_data_texture.needsUpdate = true;

                // calculate eroded height_data


                // calculate box blur height_data
                this.boxBlurShader.uniforms.uHeightmap.value = this.readHeightRenderTarget.texture;
                this.gpuCompute.doRenderTarget(this.boxBlurShader, this.readSmoothHeightRenderTarget);

                for (var i = 0; i < 100; i++)
                {
                    if (i % 2 == 0)
                    {
                        this.boxBlurShader.uniforms.uHeightmap.value = this.readSmoothHeightRenderTarget.texture;
                        this.gpuCompute.doRenderTarget(this.boxBlurShader, this.readHeightRenderTarget);
                    }
                    else
                    {
                        this.boxBlurShader.uniforms.uHeightmap.value = this.readHeightRenderTarget.texture;
                        this.gpuCompute.doRenderTarget(this.boxBlurShader, this.readSmoothHeightRenderTarget);
                    }
                }

                renderer.readRenderTargetPixels(this.readSmoothHeightRenderTarget, 0, 0, this.DATA_WIDTH, this.DATA_WIDTH, pixels);
                var floatmap2 = new Float32Array(this.DATA_WIDTH * this.DATA_WIDTH);
                for (var i = 0, j = 0; j < pixels.length; i++, j+=4)
                {
                    floatmap2[i] = (pixels[j] + (pixels[j + 1] << 8)) / 70.0;
                }
                this.smooth_height_texture = new THREE.DataTexture(
                    floatmap2,
                    this.DATA_WIDTH,
                    this.DATA_WIDTH,
                    THREE.RedFormat,
                    THREE.FloatType,
                    THREE.UVMapping,
                    THREE.ClampToEdgeWrapping,
                    THREE.ClampToEdgeWrapping,
                    THREE.LinearFilter,
                    THREE.LinearMipMapLinearFilter,
                    1
                );
                this.smooth_height_texture.generateMipmaps = true;
                this.smooth_height_texture.needsUpdate = true;
                var floatmap3 = new Float32Array(this.DATA_WIDTH * this.DATA_WIDTH);
                for (var i = 0; i < floatmap.length; i++)
                {
                    var value = floatmap[i] - floatmap2[i];
                    if (value < 1.0)
                    {
                        value = 0.0;
                    }
                    floatmap3[i] = THREE.MathUtils.clamp(value, 0.0, 1.0);
                }
                this.height_diff_texture = new THREE.DataTexture(
                    floatmap3,
                    this.DATA_WIDTH,
                    this.DATA_WIDTH,
                    THREE.RedFormat,
                    THREE.FloatType,
                    THREE.UVMapping,
                    THREE.ClampToEdgeWrapping,
                    THREE.ClampToEdgeWrapping,
                    THREE.LinearFilter,
                    THREE.LinearMipMapLinearFilter,
                    1
                );
                this.height_diff_texture.generateMipmaps = true;
                this.height_diff_texture.needsUpdate = true;

                // update uniforms of shaders
                for (var c in this.obj.children)
                {
                    var tile = this.obj.children[c];
                    tile.material.uniforms.uCenter = { type : "v2", value : this.height_data_center };
                    tile.material.uniforms.uHeightmap = { type : "t", value : this.height_data_texture };
                    tile.material.uniforms.uDiffmap = { type : "t", value : this.height_diff_texture };
                }

                this.groundCheckShader.uniforms.uCenter = { type : "v2", value : this.height_data_center };
                this.groundCheckShader.uniforms.uHeightmap = { type : "t", value : this.height_data_texture };

                var end_time = (new Date() - start_time) / 1000;
                console.log("Update Height Data Time: " + end_time);

                return resolve("height map generated");
            });
        },

        initTiles : function()
        {
            this.init_scale = this.WORLD_WIDTH / Math.pow(2, this.LEVELS);

            // create center tiles
            this.createTile(-this.init_scale, -this.init_scale, this.init_scale, Edge.NONE, true);
            this.createTile(-this.init_scale, 0, this.init_scale, Edge.NONE, true);
            this.createTile(0, 0, this.init_scale, Edge.NONE, true);
            this.createTile(0, -this.init_scale, this.init_scale, Edge.NONE, true);

            // create quadtree of tiles
            for (var scale = this.init_scale; scale < this.WORLD_WIDTH; scale *= 2)
            {
                this.createTile(-2 * scale, -2 * scale, scale, Edge.BOTTOM | Edge.LEFT);
                this.createTile(-2 * scale, -scale, scale, Edge.LEFT);
                this.createTile(-2 * scale, 0, scale, Edge.LEFT);
                this.createTile(-2 * scale, scale, scale, Edge.TOP | Edge.LEFT);

                this.createTile(-scale, -2 * scale, scale, Edge.BOTTOM);
                this.createTile(-scale, scale, scale, Edge.TOP);

                this.createTile(0, -2 * scale, scale, Edge.BOTTOM);
                this.createTile(0, scale, scale, Edge.TOP);

                this.createTile(scale, -2 * scale, scale, Edge.BOTTOM | Edge.RIGHT);
                this.createTile(scale, -scale, scale, Edge.RIGHT);
                this.createTile(scale, 0, scale, Edge.RIGHT);
                this.createTile(scale, scale, scale, Edge.TOP | Edge.RIGHT);
          }
        },

        createTile : function(tile_offset_x, tile_offset_y, scale, edge_morph, is_collider_mesh = false)
        {
            var tile_offset = new THREE.Vector2(tile_offset_x, tile_offset_y);
            var tile_material = this.createMaterial(tile_offset, scale, edge_morph);
            var mesh = new THREE.Mesh(this.geometry, tile_material);
            mesh.frustumCulled = false;

            if (is_collider_mesh)
            {
                this.collider_meshes.push(mesh);
            }

            this.obj.add(mesh);
        },

        createMaterial : function(tile_offset, scale, edge_morph)
        {
            return new THREE.ShaderMaterial(
            {
                uniforms :
                {
                    uEdgeMorph    :  { type : "i", value : edge_morph },
                    uGlobalOffset :  { type : "v3", value : this.global_offset },
                    uHeightmap    :  { type : "t", value : this.height_data_texture },
                    uDiffmap      :  { type : "t", value : this.height_diff_texture },
                    uTileOffset   :  { type : "v2", value : tile_offset },
                    uScale        :  { type : "f", value : scale },
                    uAlpha        :  { type : "f", value : this.alpha },
                    uLookDir      :  { type : "v3", value : Player.look_direction },
                    uCenter       :  { type : "v2", value : this.height_data_center },
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
                    uGrassLarge   :  { type : "t", value : this.grass_texture },
                    uGrassSmall   :  { type : "t", value : this.grass_small_texture },
                },
                defines :
                {
                    RESOLUTION  : this.RESOLUTION.toFixed(2),
                    DATA_WIDTH : this.DATA_WIDTH.toFixed(2),
                    DATA_WIDTH_2 : (this.DATA_WIDTH / 2).toFixed(2),
                },
                vertexShader  : TerrainVert.value,
                fragmentShader  : this.frag_shader.value,
                transparent : true,
            });
        },

        render : function()
        {
            // add obj to scene
            scene.add(this.obj);
        },

        //-------------------
        //      UPDATE
        //-------------------

        update : function()
        {
            this.global_offset.x = camera.position.x;
            this.global_offset.y = camera.position.y;

            if (Player.initialized)
            {

                if (Utils.distance2D(Player.threeObj.position, this.last_collider_pos) >= this.RESOLUTION * 0.75)
                {
                    this.updateCollider();
                }

                if (Utils.distance2D(Player.threeObj.position, this.height_data_center) >= this.WORLD_WIDTH)
                {
                    this.updateHeightData(Player.threeObj.position);
                }
            }
        },

        // --------------
        //    PHYSICS
        // --------------

        createColliderMesh : function()
        {
            var res = 0.0
            var geometry = new THREE.PlaneBufferGeometry(
                res * 2, res * 2,
                res * 2, res * 2);
            var material = new THREE.MeshStandardMaterial({ visible : false, color : 0x004433 });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.frustumCulled = false;
            scene.add(mesh);
            this.collider_mesh = mesh;

            var vertices = [];
            var indices = [];
            var width = res;

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
            this.collider_mesh.geometry.setIndex(indices);
            this.collider_mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        },

        updateCollider : function()
        {
            // get chunk data
            var cd = this.getChunkData();

            // update last_collider_pos
            this.last_collider_pos.copy(Player.threeObj.position);

            // create collider if one doesn't exist, else update existing collider
            if (Object.keys(this.collider).length == 0)
            {
                this.collider = Physics.createTerrainCollider(cd);
            } else
            {
                Physics.updateTerrainCollider(cd, this.collider);
            }
        },

        getChunkData : function()
        {
            // find terrain data
            var new_height_data = [];
            var min_height = Number.POSITIVE_INFINITY;
            var max_height = Number.NEGATIVE_INFINITY;
            // var res = 128.0;
            var phys_res = this.RESOLUTION;
            var width = this.DATA_WIDTH;
            var width2 = this.DATA_WIDTH / 2;
            var xi = 0, yi = 0;
            var vertices = [];

            this.init_chunk_pos.x = Math.round(this.global_offset.x);
            this.init_chunk_pos.y = Math.round(this.global_offset.y);

            var x_count = 0;
            var y_count = 0;
            var h_count = 0;
            var h = 0;
            var start_counting = false;

            // for (var y = this.init_chunk_pos.y - res; y < this.init_chunk_pos.y + res; y++)
            // {
            //     for (var x = this.init_chunk_pos.x - res; x < this.init_chunk_pos.x + res; x++)
            //     {
            //         xi = (x + width2 - this.height_data_center.x) % width;
            //         yi = (y + width2 - this.height_data_center.y) % width;
            //         h = this.height_data[xi + yi * width];
            //         // assign new height to vertex attributes
            //         vertices.push(x - this.init_chunk_pos.x, y - this.init_chunk_pos.y, h);
            //     }
            // }
            // assign vertices to mesh
            // this.collider_mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            // this.collider_mesh.position.copy(new THREE.Vector3(this.init_chunk_pos.x, this.init_chunk_pos.y, 0.0));

            for (var y = this.init_chunk_pos.y - phys_res; y < this.init_chunk_pos.y + phys_res; y++)
            {
                for (var x = this.init_chunk_pos.x - phys_res; x < this.init_chunk_pos.x + phys_res; x++)
                {
                    xi = (x + width2 - this.height_data_center.x) % width;
                    yi = (y + width2 - this.height_data_center.y) % width;

                    // assign height and find min/ max
                    h = this.height_data[xi + yi * width];
                    new_height_data.push(h);

                    if (h > max_height) max_height = h;
                    if (h < min_height) min_height = h;
                }
            }

            // cd stands for Chunk Data
            var cd = {};
            cd.width = phys_res * 2;//res * 2;
            cd.depth = phys_res * 2;//res * 2;
            cd.min_height = min_height;
            cd.max_height = max_height;
            cd.width_extents = phys_res * 2;//res * 2;
            cd.depth_extents = phys_res * 2;//res * 2;
            cd.height_data = new_height_data;
            cd.center_pos = new THREE.Vector3(this.init_chunk_pos.x,
                                              this.init_chunk_pos.y,
                                              0.0);
            return cd;
        },

        // --------------
        //      MISC
        // --------------

        toggleAlpha : function(a)
        {
            this.alpha = a;
            for (var c in this.obj.children)
            {
                var tile = this.obj.children[c];
                tile.material.uniforms.uAlpha = { type : "f", value : this.alpha };
            }
        },


        isGrounded : function()
        {
            this.groundCheckShader.uniforms.uPlayerPos.value.set(Player.threeObj.position.x, Player.threeObj.position.y, Player.threeObj.position.z);
            this.gpuCompute.doRenderTarget(this.groundCheckShader, this.groundCheckRenderTarget);
            renderer.readRenderTargetPixels(this.groundCheckRenderTarget, 0, 0, 1, 1, this.ground_check_image);
            if (this.ground_check_image[0] != 0) return true;
            return false;
        },

    };

    return Terrain;
});
