// Object that initializes and holds data textures
'use strict'
define( ["three", "renderer", "GPUComputationRenderer", "shader!HeightmapGen.frag",
        "shader!TextureGen.frag", "shader!BoxBlur.frag", "shader!Erosion.frag"],
        (THREE, renderer, GPUComputationRenderer, HeightmapGenFrag, TextureGenFrag,
        BoxBlurFrag, ErosionFrag) => {
    return {
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        // gpuCompute
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        gpuCompute256 : new GPUComputationRenderer(256, 256, renderer),
        gpuCompute1024 : new GPUComputationRenderer(1024, 1024, renderer),
        gpuCompute4096 : new GPUComputationRenderer(4096, 4096, renderer),
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        // general render targets
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        renderTarget256 : new THREE.WebGLRenderTarget(256, 256,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
        renderTarget1024 : new THREE.WebGLRenderTarget(1024, 1024,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
        renderTarget4096 : new THREE.WebGLRenderTarget(4096, 4096,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
        renderTarget4096_2 : new THREE.WebGLRenderTarget(4096, 4096,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        // Noise
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        noise_texture_ : null,

        get noise_texture() {
            if (this.noise_texture_ === null) {
                var error = this.gpuCompute256.init();
                if (error !== null) console.error("GPU Compute Completeness Error noise_texture: " + error);
                var pixels = new Uint8Array(4 * 256 * 256);
                this.gpuCompute256.doRenderTarget(this.texture_gen_mat256, this.renderTarget256);
                renderer.readRenderTargetPixels(this.renderTarget256, 0, 0, 256, 256, pixels);
                var noise_data = new Uint8Array(256 * 256);
                for (var i = 0, j = 0; j < pixels.length; i++, j+=4) {
                    noise_data[i] = pixels[j];
                }
                this.noise_texture_ = new THREE.DataTexture(
                    noise_data, 256, 256, THREE.AlphaFormat, THREE.UnsignedByteType,
                    THREE.UVMapping, THREE.MirroredRepeatWrapping, THREE.MirroredRepeatWrapping,
                    THREE.LinearFilter, THREE.LinearMipMapLinearFilter, 1);
                this.noise_texture_.generateMipmaps = true;
                this.noise_texture_.needsUpdate = true;
            }
            return this.noise_texture_;
        },
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        // Terrain
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        heightmap_center      :      new THREE.Vector2(),
        heightmap_            :      { data_texture : null, texture : null, array : null },
        blur_heightmap_       :      { data_texture : null, array : null },
        erosion_heightmap_    :      { data_texture : null, array : null },
        heightmap_diff_       :      { data_texture : null, array : null },

        updateTerrainTextures : function(new_heightmap_center) {
            this.heightmap_center = new_heightmap_center;
            this.updateHeightmap();
            this.updateBlurHeightmap();
            this.updateErosionHeightmap();
            this.updateHeightmapDiff();
        },

        get heightmap() {
            if (Object.values(this.heightmap_).includes(null))
                this.updateHeightmap();
            return this.heightmap_;
        },

        updateHeightmap : function() {
            var error = this.gpuCompute4096.init();
            if (error !== null) console.error("GPU Compute updateHeightmap Completeness Error: " + error);
            this.heightmap_gen_mat.uniforms.uCenter.value = this.heightmap_center;
            var pixels = new Uint8Array(4 * 4096 * 4096);
            this.gpuCompute4096.doRenderTarget(this.heightmap_gen_mat, this.heightRenderTarget4096);
            this.heightmap_.texture = this.heightRenderTarget4096.texture;
            renderer.readRenderTargetPixels(this.heightRenderTarget4096, 0, 0, 4096, 4096, pixels);
            var float_array = new Float32Array(4096 * 4096);
            for (var i = 0, j = 0; j < pixels.length; i++, j+=4) {
                float_array[i] = (pixels[j] + (pixels[j + 1] << 8)) / 70.0;
            }
            this.heightmap_.array = float_array;
            this.heightmap_.data_texture = new THREE.DataTexture(float_array, 4096, 4096,
                THREE.RedFormat, THREE.FloatType, THREE.UVMapping,
                THREE.ClampToEdgeWrapping,THREE.ClampToEdgeWrapping,
                THREE.LinearFilter,THREE.LinearMipMapLinearFilter, 1);
            this.heightmap_.data_texture.generateMipmaps = true;
            this.heightmap_.data_texture.needsUpdate = true;
        },

        get blur_heightmap() {
            if (Object.values(this.blur_heightmap_).includes(null))
                this.updateBlurHeightmap();
            return this.blur_heightmap_;
        },

        updateBlurHeightmap : function() {
            var error = this.gpuCompute4096.init();
            if (error !== null) console.error("GPU Compute updateHeightmap Completeness Error: " + error);
            this.boxblur_mat.uniforms.uHeightmap.value = this.heightmap.texture;
            this.gpuCompute4096.doRenderTarget(this.boxblur_mat, this.renderTarget4096_2);
            for (var i = 0; i < 100; i++) {
                if (i % 2 == 0) {
                    this.boxblur_mat.uniforms.uHeightmap.value = this.renderTarget4096_2.texture;
                    this.gpuCompute4096.doRenderTarget(this.boxblur_mat, this.renderTarget4096);
                } else {
                    this.boxblur_mat.uniforms.uHeightmap.value = this.renderTarget4096.texture;
                    this.gpuCompute4096.doRenderTarget(this.boxblur_mat, this.renderTarget4096_2);
                }
            }
            var pixels = new Uint8Array(4 * 4096 * 4096);
            renderer.readRenderTargetPixels(this.renderTarget4096, 0, 0, 4096, 4096, pixels);
            var float_array = new Float32Array(4096 * 4096);
            for (var i = 0, j = 0; j < pixels.length; i++, j+=4) {
                float_array[i] = (pixels[j] + (pixels[j + 1] << 8)) / 70.0;
            }
            this.blur_heightmap_.array = float_array;
            this.blur_heightmap_.data_texture = new THREE.DataTexture(
                float_array, 4096, 4096, THREE.RedFormat, THREE.FloatType,
                THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
                THREE.LinearFilter, THREE.LinearMipMapLinearFilter, 1);
            this.blur_heightmap_.data_texture.generateMipmaps = true;
            this.blur_heightmap_.data_texture.needsUpdate = true;
        },

        get erosion_heightmap() {
            if (Object.values(this.erosion_heightmap_).includes(null))
                this.updateErosionHeightmap();
            return this.erosion_heightmap_;
        },

        erosion_rts : [],

        updateErosionHeightmap : function() {
            // initialize erosion render targets
            if (this.erosion_rts.length == 0) {
                for (var i = 0; i < 14; i++) {
                    this.erosion_rts.push(new THREE.WebGLRenderTarget(4096, 4096, {
                        wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
                        minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
                        format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
                        depthBuffer: false,
                    }));
                }
            }
            // initialize uniforms
            var error = this.gpuCompute4096.init();
            if (error !== null) console.error("GPU Compute updateHeightmap Completeness Error: " + error);
            var u = this.erosion_mat.uniforms;
            //delta : 0.000125
            u.uSC.value = {
                A : 1, lX : 1, lY : 1, g : -10, Kc : 1.0, Ks : 0.5, Kd : 1.0,
                Ke : 0.015, delta : 0.00125,
            };
            u.uT1.value = this.heightmap.texture;
            u.uT2.value = new THREE.Texture();
            u.uT3.value = new THREE.Texture();
            u.uHash.value = false;
            u.uNoise.value = this.noise_texture;
            // simulation loop
            var steps = 100;
            var currentRenderTarget;
            for (var i = 0; i < steps; i++) {
                var offset = i % 2;
                u.uFrame.value = i;
                // simulate rainfall
                u.uStep.value = 1;
                currentRenderTarget = this.erosion_rts[offset];
                this.gpuCompute4096.doRenderTarget(this.erosion_mat, currentRenderTarget);
                u.uT1.value = currentRenderTarget.texture;
                // simulate flow
                u.uStep.value = 2;
                currentRenderTarget = this.erosion_rts[2 + offset];
                this.gpuCompute4096.doRenderTarget(this.erosion_mat, currentRenderTarget);
                u.uT2.value = currentRenderTarget.texture;
                // update velocity field
                u.uStep.value = 3;
                currentRenderTarget = this.erosion_rts[4 + offset];
                this.gpuCompute4096.doRenderTarget(this.erosion_mat, currentRenderTarget);
                u.uT3.value = currentRenderTarget.texture;
                // update water surface, erosion and deposition, suspended sediment transport, evaporation
                for (var j = 4; j < 8; j++) {
                    u.uStep.value = j;
                    currentRenderTarget = this.erosion_rts[(j - 1) * 2 + offset];
                    this.gpuCompute4096.doRenderTarget(this.erosion_mat, currentRenderTarget);
                    u.uT1.value = currentRenderTarget.texture;
                }
            }
            var pixels = new Uint8Array(4 * 4096 * 4096);
            renderer.readRenderTargetPixels(this.erosion_rts[13], 0, 0, 4096, 4096, pixels);
            var float_array = new Float32Array(4096 * 4096);
            for (var i = 0, j = 0; j < pixels.length; i++, j+=4) {
                float_array[i] = (pixels[j] + (pixels[j + 1] << 8)) / 70.0;
                // float_array[i] = pixels[j + 2];
            }
            this.erosion_heightmap_.array = float_array;
            this.erosion_heightmap_.data_texture = new THREE.DataTexture(float_array, 4096, 4096,
                THREE.RedFormat, THREE.FloatType, THREE.UVMapping,
                THREE.ClampToEdgeWrapping,THREE.ClampToEdgeWrapping,
                THREE.LinearFilter,THREE.LinearMipMapLinearFilter, 1);
            this.erosion_heightmap_.data_texture.generateMipmaps = true;
            this.erosion_heightmap_.data_texture.needsUpdate = true;
        },

        get heightmap_diff() {
            if (Object.values(this.heightmap_diff_).includes(null))
                this.updateHeightmapDiff();
            return this.heightmap_diff_;
        },

        updateHeightmapDiff : function() {
            var heightmap_array = this.heightmap.array;
            var size = heightmap_array.length;
            // var blur_heightmap_array = this.blur_heightmap.array;
            var erosion_heightmap_array = this.erosion_heightmap.array;
            var float_array = new Float32Array(4096 * 4096);
            for (var i = 0; i < size; i++) {
                var value = heightmap_array[i] - erosion_heightmap_array[i];
                // var value = heightmap_array[i] - blur_heightmap_array[i];
                // if (value < 1.0) {
                //     value = 0.0;
                // }
                float_array[i] = THREE.MathUtils.clamp(value, 0.0, 1.0);
            }
            this.heightmap_diff_.array = float_array;
            this.heightmap_diff_.data_texture = new THREE.DataTexture(
                float_array, 4096, 4096, THREE.RedFormat, THREE.FloatType,
                THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
                THREE.LinearFilter, THREE.LinearMipMapLinearFilter, 1);
            this.heightmap_diff_.data_texture.generateMipmaps = true;
            this.heightmap_diff_.data_texture.needsUpdate = true;
        },
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        // Grass
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        grass_small_texture_ : null,
        grass_large_texture_ : null,

        get grass_small_texture() {
            if (this.grass_small_texture_ === null) {
                var pixels = new Uint8Array(4 * 256 * 256);
                this.texture_gen_mat256.uniforms.uTextureType.value = 2;
                this.gpuCompute256.doRenderTarget(this.texture_gen_mat256, this.renderTarget256);
                renderer.readRenderTargetPixels(this.renderTarget256, 0, 0, 256, 256, pixels);
                var grass_data = new Uint8Array(pixels.buffer);
                this.grass_small_texture_ = new THREE.DataTexture(
                    grass_data, 256, 256, THREE.RGBAFormat, THREE.UnsignedByteType,
                    THREE.UVMapping, THREE.MirroredRepeatWrapping, THREE.MirroredRepeatWrapping,
                    THREE.LinearFilter, THREE.LinearMipMapLinearFilter, 1);
                this.grass_small_texture_.generateMipmaps = true;
                this.grass_small_texture_.needsUpdate = true;
            }
            return this.grass_small_texture_;
        },

        get grass_large_texture() {
            if (this.grass_large_texture_ === null) {
                var pixels = new Uint8Array(4 * 1024 * 1024);
                this.texture_gen_mat1024.uniforms.uTextureType.value = 1;
                this.gpuCompute1024.doRenderTarget(this.texture_gen_mat1024, this.renderTarget1024);
                renderer.readRenderTargetPixels(this.renderTarget1024, 0, 0, 1024, 1024, pixels);
                var grass_data = new Uint8Array(pixels.buffer);
                this.grass_large_texture_ = new THREE.DataTexture(
                    grass_data, 1024, 1024, THREE.RGBAFormat, THREE.UnsignedByteType,
                    THREE.UVMapping, THREE.MirroredRepeatWrapping, THREE.MirroredRepeatWrapping,
                    THREE.LinearFilter, THREE.LinearMipMapLinearFilter, 1);
                this.grass_large_texture_.generateMipmaps = true;
                this.grass_large_texture_.needsUpdate = true;
            }
            return this.grass_large_texture_;
        },
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        // Shader Materials
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        texture_gen_mat256_ : null,
        texture_gen_mat1024_ : null,
        heightmap_gen_mat_ : null,
        boxblur_mat_ : null,
        erosion_mat_ : null,

        get texture_gen_mat256() {
            if (this.texture_gen_mat256_ === null) {
                this.texture_gen_mat256_ = this.gpuCompute256.createShaderMaterial(
                    TextureGenFrag.value, { uHash : { value : true }, uTextureType : { value : 0 }, });
            }
            return this.texture_gen_mat256_;
        },

        get texture_gen_mat1024() {
            if (this.texture_gen_mat1024_ === null) {
                this.texture_gen_mat1024_ = this.gpuCompute1024.createShaderMaterial(
                    TextureGenFrag.value, { uHash : { value : true }, uTextureType : { value : 0 }, });
            }
            return this.texture_gen_mat1024_;
        },

        get heightmap_gen_mat() {
            if (this.heightmap_gen_mat_ === null) {
                HeightmapGenFrag.define("DATA_WIDTH_2", (4096 / 2).toFixed(2));
                this.heightmap_gen_mat_ = this.gpuCompute4096.createShaderMaterial(
                    HeightmapGenFrag.value, { uHash : { value : false },
                    uCenter : { value : new THREE.Vector2() }, uNoise : { value : this.noise_texture }, });
            }
            return this.heightmap_gen_mat_;
        },

        get boxblur_mat() {
            if (this.boxblur_mat_ === null) {
                this.boxblur_mat_ = this.gpuCompute4096.createShaderMaterial(
                    BoxBlurFrag.value, { uHeightmap : { value : this.heightmap_datatexture }, });
            }
            return this.boxblur_mat_;
        },

        get erosion_mat() {
            if (this.erosion_mat_ === null) {
                this.erosion_mat_ = this.gpuCompute4096.createShaderMaterial(
                    ErosionFrag.value, { uSC : { value : null },
                    uT1 : { value : null }, uT2 : { value : null}, uT3 : { value : null },
                    uStep : { value : null}, uHash : { value : false },
                    uNoise : { value : null }, uFrame : { value : null } });
            }
            return this.erosion_mat_;
        },
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        // specific render targets
        // -------------------------------------------------------------------
        // -------------------------------------------------------------------
        heightRenderTarget4096 : new THREE.WebGLRenderTarget(4096, 4096,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
        step1rT : new THREE.WebGLRenderTarget(4096, 4096,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
        step1rT2 : new THREE.WebGLRenderTarget(4096, 4096,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
        step2rT : new THREE.WebGLRenderTarget(4096, 4096,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
        step2rT2 : new THREE.WebGLRenderTarget(4096, 4096,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
        step3rT : new THREE.WebGLRenderTarget(4096, 4096,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
        step3rT2 : new THREE.WebGLRenderTarget(4096, 4096,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
        step4rT : new THREE.WebGLRenderTarget(4096, 4096,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
        step4rT2 : new THREE.WebGLRenderTarget(4096, 4096,
        {
            wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
            depthBuffer: false,
        }),
    };
});
