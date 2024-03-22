// sources:
// https://github.com/felixpalmer/lod-terrain
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_terrain.html
'use strict'
define(["three", "utils", "scene", "light", "time", "camera", "physics",
        "player", "texture", "shader!terrain.vert", "shader!terrain.frag",
        "renderer", "eventQ", "GPUComputationRenderer", "shader!groundCheck.frag",
        "shader!water.vert", "shader!water.frag"],
        (THREE, Utils, scene, Light, Time, camera, Physics, Player, texture,
        TerrainVert, TerrainFrag, renderer, EventQ, GPUComputationRenderer,
        GroundCheckFrag, WaterVert, WaterFrag) => {
    var Edge = {
        NONE : 0,
        TOP : 1,
        LEFT : 2,
        BOTTOM : 4,
        RIGHT : 8
    };

    var Terrain = {
        // rendering
        WORLD_WIDTH : Math.pow(2, 11),
        DATA_WIDTH : Math.pow(2, 12),
        LEVELS : 4,
        RESOLUTION : 32.0,              // 128.0 looks the best and runs at about ~40 fps, 64.0 at ~50 fps, and 32.0 at ~60 fps
        TILE_WIDTH : 1,

        terrain_obj : new THREE.Object3D(),
        water_obj : new THREE.Object3D(),
        geometry : new THREE.PlaneBufferGeometry(),
        height_data : [],
        frag_shader : TerrainFrag,
        init_scale : 32.0,
        global_offset : new THREE.Vector3(0, 0, 0),
        alpha : 1.0,
        isWebGL2 : renderer.capabilities.isWebGL2,
        heightmap_center : new THREE.Vector2(0, 0),

        // physics
        collider_meshes : [],
        collider_mesh : {},
        init_chunk_pos : new THREE.Vector2(0, 0),
        collider : {},
        last_collider_pos : new THREE.Vector3(0, 0, 0),

        init : function() {
            // webgl2.0 : textureLod vs webgl1.0 : texture2DLod in shaders
            if (this.isWebGL2) {
                TerrainVert.define("WEBGL2", 1.0);
                TerrainFrag.define("WEBGL2", 1.0);
                GroundCheckFrag.define("WEBGL2", 1.0);
            }
            WaterVert.define("WAVE_COUNT", 15);

            // Event for passing data to player
            EventQ.push({
                verify : () => {
                    return Player.initialized; //&& Object.keys(this.collider_mesh).length > 0;
                },
                action: () => {
                    // Player.collider.addMesh("this_Ground", this.collider_mesh);
                    Player.input_handler.toggleAlpha = this.toggleAlpha.bind(this);
                    Player.isGrounded = this.isGrounded.bind(this);

                    // initialize the ammo collider
                    this.updateCollider();
                },
                arguments : [],
            });

            this.initGPUCompute().then(() => {
                this.updateHeightData().then(() => {
                    // set the frag shader
                    this.frag_shader = TerrainFrag;

                    // init the geometry
                    this.geometry = new THREE.PlaneBufferGeometry(
                        this.TILE_WIDTH, this.TILE_WIDTH,
                        this.RESOLUTION, this.RESOLUTION);

                    var translation_matrix = new THREE.Matrix4();
                    translation_matrix.makeTranslation(0.5, 0.5, 0.0);
                    this.geometry.applyMatrix4(translation_matrix);

                    // init CDLOD tiles of terrain and water
                    this.initTiles();
                    this.initTiles(true);
                });
            });
        },
        // --------------------------------------------------------------------
        // --------------------------------------------------------------------
        //   RENDERING
        // --------------------------------------------------------------------
        // --------------------------------------------------------------------
        initGPUCompute : function() {
            return new Promise(async (resolve, reject) => {
                // define constants for shaders
                GroundCheckFrag.define("DATA_WIDTH", (this.DATA_WIDTH).toFixed(2));
                GroundCheckFrag.define("DATA_WIDTH_2", (this.DATA_WIDTH / 2).toFixed(2));

                // define gpuCompute
                this.gpuCompute = new GPUComputationRenderer(1, 1, renderer);

                // define ground_check shader, image, and render target
                this.ground_check_mat = this.gpuCompute.createShaderMaterial(
                    GroundCheckFrag.value,
                    {
                        uPlayerPos : { value : new THREE.Vector3() },
                        uCenter    : { value : new THREE.Vector2() },
                        uHeightmap : { value : null },
                    });

                this.ground_check_image = new Uint8Array(4);
                this.groundCheckRenderTarget = new THREE.WebGLRenderTarget(1, 1,
                {
                    wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
                    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
                    format: THREE.RGBAFormat, type: THREE.UnsignedByteType, depthBuffer: false
                });
                // init gpuCompute and check for completeness
                var error = this.gpuCompute.init();
                if (error !== null) console.error("GPU Compute Completeness: " + error);
                return resolve("GPUCompute Initialized");
            });
        },

        updateHeightData : function(new_center_pos = null) {
            return new Promise((resolve, reject) => {
                // update center pos
                if (new_center_pos)
                    this.heightmap_center = new THREE.Vector2(Math.round(new_center_pos.x), Math.round(new_center_pos.y));
                texture.updateTerrainTextures(this.heightmap_center);
                this.height_data = texture.heightmap.array;
                // update uniforms of shaders
                for (var c in this.terrain_obj.children) {
                    var tile = this.terrain_obj.children[c];
                    tile.material.uniforms.uCenter = { type : "v2", value : this.heightmap_center };
                    tile.material.uniforms.uHeightmap = { type : "t", value : texture.heightmap.data_texture };
                    // tile.material.uniforms.uDiffmap = { type : "t", value : texture.heightmap_diff.data_texture };
                }
                this.ground_check_mat.uniforms.uCenter = { type : "v2", value : this.heightmap_center };
                this.ground_check_mat.uniforms.uHeightmap = { type : "t", value : texture.heightmap.data_texture };
                return resolve("update height data");
            });
        },

        initTiles : function(is_water = false) {
            this.init_scale = this.WORLD_WIDTH / Math.pow(2, this.LEVELS);

            // create center tiles
            this.createTile(-this.init_scale, -this.init_scale, this.init_scale, Edge.NONE, is_water);
            this.createTile(-this.init_scale, 0, this.init_scale, Edge.NONE, is_water);
            this.createTile(0, 0, this.init_scale, Edge.NONE, is_water);
            this.createTile(0, -this.init_scale, this.init_scale, Edge.NONE, is_water);

            // create quadtree of tiles
            for (var scale = this.init_scale; scale < this.WORLD_WIDTH; scale *= 2) {
                this.createTile(-2 * scale, -2 * scale, scale, Edge.BOTTOM | Edge.LEFT, is_water);
                this.createTile(-2 * scale, -scale, scale, Edge.LEFT, is_water);
                this.createTile(-2 * scale, 0, scale, Edge.LEFT, is_water);
                this.createTile(-2 * scale, scale, scale, Edge.TOP | Edge.LEFT, is_water);

                this.createTile(-scale, -2 * scale, scale, Edge.BOTTOM, is_water);
                this.createTile(-scale, scale, scale, Edge.TOP, is_water);

                this.createTile(0, -2 * scale, scale, Edge.BOTTOM, is_water);
                this.createTile(0, scale, scale, Edge.TOP, is_water);

                this.createTile(scale, -2 * scale, scale, Edge.BOTTOM | Edge.RIGHT, is_water);
                this.createTile(scale, -scale, scale, Edge.RIGHT, is_water);
                this.createTile(scale, 0, scale, Edge.RIGHT, is_water);
                this.createTile(scale, scale, scale, Edge.TOP | Edge.RIGHT, is_water);
          }
        },

        createTile : function(tile_offset_x, tile_offset_y, scale, edge_morph, is_water) {
            var tile_offset = new THREE.Vector2(tile_offset_x, tile_offset_y);
            var tile_material = this.createMaterial(tile_offset, scale, edge_morph, is_water);
            var mesh = new THREE.Mesh(this.geometry, tile_material);
            mesh.frustumCulled = false;
            if (is_water) {
                this.water_obj.add(mesh);
            } else {
                this.terrain_obj.add(mesh);
            }
        },

        createMaterial : function(tile_offset, scale, edge_morph, is_water) {
            if (is_water) {
                return new THREE.ShaderMaterial({
                    uniforms : {
                        uEdgeMorph    :  { type : "i", value : edge_morph },
                        uGlobalOffset :  { type : "v3", value : this.global_offset },
                        // uWatermap    :  { type : "t", value : texture.water_heightmap.data_texture },
                        uHeightmap    :  { type : "t", value : texture.heightmap.data_texture },
                        uTileOffset   :  { type : "v2", value : tile_offset },
                        uScale        :  { type : "f", value : scale },
                        uAlpha        :  { type : "f", value : this.alpha },
                        uLookDir      :  { type : "v3", value : Player.look_direction },
                        uCenter       :  { type : "v2", value : this.heightmap_center },
                        uSunlight     :  { value : {
                                             direction : Light.sunlight_direction,
                                             position  : Light.sunlight.position,
                                             ambient   : Light.sunlight_ambient,
                                             diffuse   : Light.sunlight_diffuse,
                                             specular  : Light.sunlight_specular
                                            }
                                         },
                        uWaves        :  { value : texture.waves },
                        uTime         :  { type : "f", value : Time.clock.elapsedTime }
                    },
                    defines : {
                        RESOLUTION    :  this.RESOLUTION.toFixed(2),
                        DATA_WIDTH    :  this.DATA_WIDTH.toFixed(2),
                        DATA_WIDTH_2  :  (this.DATA_WIDTH / 2).toFixed(2),
                        WAVE_COUNT    :  15,
                    },
                    vertexShader  : WaterVert.value,
                    fragmentShader  : WaterFrag.value,
                    transparent : true,
                    side : THREE.DoubleSide,
                });
            } else {
                return new THREE.ShaderMaterial({
                    uniforms : {
                        uEdgeMorph    :  { type : "i", value : edge_morph },
                        uGlobalOffset :  { type : "v3", value : this.global_offset },
                        uHeightmap    :  { type : "t", value : texture.heightmap.data_texture },
                        uDiffmap      :  { type : "t", value : texture.heightmap_diff.data_texture },
                        uTileOffset   :  { type : "v2", value : tile_offset },
                        uScale        :  { type : "f", value : scale },
                        uAlpha        :  { type : "f", value : this.alpha },
                        uLookDir      :  { type : "v3", value : Player.look_direction },
                        uCenter       :  { type : "v2", value : this.heightmap_center },
                        uSunlight     :  { value : {
                                             direction : Light.sunlight_direction,
                                             position  : Light.sunlight.position,
                                             ambient   : Light.sunlight_ambient,
                                             diffuse   : Light.sunlight_diffuse,
                                             specular  : Light.sunlight_specular
                                            }
                                         },
                        uGrassLarge   :  { type : "t", value : texture.grass_large_texture },
                        uGrassSmall   :  { type : "t", value : texture.grass_small_texture },
                    },
                    defines : {
                        RESOLUTION    :  this.RESOLUTION.toFixed(2),
                        DATA_WIDTH    :  this.DATA_WIDTH.toFixed(2),
                        DATA_WIDTH_2  :  (this.DATA_WIDTH / 2).toFixed(2),
                    },
                    vertexShader  : TerrainVert.value,
                    fragmentShader  : this.frag_shader.value,
                    transparent : true,
                });
            }
        },
        render : function() {
            // add obj to scene
            scene.add(this.terrain_obj);
            scene.add(this.water_obj);
        },
        // --------------------------------------------------------------------
        // --------------------------------------------------------------------
        //      UPDATE
        // --------------------------------------------------------------------
        // --------------------------------------------------------------------
        update : function() {
            this.global_offset.x = camera.position.x;
            this.global_offset.y = camera.position.y;

            for (var c in this.water_obj.children) {
                var tile = this.water_obj.children[c];
                tile.material.uniforms.uTime.value = Time.clock.elapsedTime;
            }

            if (Player.initialized) {
                if (Utils.distance2D(Player.threeObj.position, this.last_collider_pos) >= this.RESOLUTION * 0.75)
                    this.updateCollider();

                if (Utils.distance2D(Player.threeObj.position, this.heightmap_center) >= this.WORLD_WIDTH)
                    this.updateHeightData(Player.threeObj.position);
            }
        },
        // --------------------------------------------------------------------
        // --------------------------------------------------------------------
        //    PHYSICS
        // --------------------------------------------------------------------
        // --------------------------------------------------------------------
        updateCollider : function() {
            // get chunk data
            var cd = this.getChunkData();

            // update last_collider_pos
            this.last_collider_pos.copy(Player.threeObj.position);

            // create collider if one doesn't exist, else update existing collider
            if (Object.keys(this.collider).length == 0) {
                this.collider = Physics.createTerrainCollider(cd);
            } else {
                Physics.updateTerrainCollider(cd, this.collider);
            }
        },

        getChunkData : function() {
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

            for (var y = this.init_chunk_pos.y - phys_res; y < this.init_chunk_pos.y + phys_res; y++) {
                for (var x = this.init_chunk_pos.x - phys_res; x < this.init_chunk_pos.x + phys_res; x++) {
                    xi = (x + width2 - this.heightmap_center.x) % width;
                    yi = (y + width2 - this.heightmap_center.y) % width;

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
                                    this.init_chunk_pos.y, 0.0);
            return cd;
        },
        // --------------------------------------------------------------------
        // --------------------------------------------------------------------
        //      MISC
        // --------------------------------------------------------------------
        // --------------------------------------------------------------------
        toggleAlpha : function(a) {
            this.alpha = a;
            for (var c in this.terrain_obj.children) {
                var tile = this.terrain_obj.children[c];
                tile.material.uniforms.uAlpha = { type : "f", value : this.alpha };
            }
        },

        isGrounded : function() {
            this.ground_check_mat.uniforms.uPlayerPos.value.set(Player.threeObj.position.x,
                Player.threeObj.position.y, Player.threeObj.position.z);
            this.gpuCompute.doRenderTarget(this.ground_check_mat, this.groundCheckRenderTarget);
            renderer.readRenderTargetPixels(this.groundCheckRenderTarget, 0, 0, 1, 1, this.ground_check_image);
            if (this.ground_check_image[0] != 0) return true;
            return false;
        },
    };

    return Terrain;
});
