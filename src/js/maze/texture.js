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
        // render targets
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
        heightmap_center : new THREE.Vector2(),
        heightmap_texture_ : null,
        heightmap_ : null,
        height_texture_to_blur : null,
        blur_heightmap_texture_ : null,
        blur_heightmap_ : null,
        erosion_heightmap_texture_ : null,
        erosion_heightmap_ : null,
        height_diff_texture_ : null,
        height_diff_ : null,

        updateTerrainTextures : function(new_heightmap_center) {
            this.heightmap_center = new_heightmap_center;
            this.updateHeightmap();
            this.updateBlurHeightmap();
            this.updateErosionHeightmap();
            this.updateHeightDiff();
        },

        get heightmap_texture() {
            if (this.heightmap_texture_ === null) this.updateHeightmap();
            return this.heightmap_texture_;
        },

        get heightmap() {
            if (this.heightmap_ === null) this.updateHeightmap();
            return this.heightmap_;
        },

        updateHeightmap : function() {
            var error = this.gpuCompute4096.init();
            if (error !== null) console.error("GPU Compute updateHeightmap Completeness Error: " + error);
            this.heightmap_gen_mat.uniforms.uCenter.value = this.heightmap_center;
            var pixels = new Uint8Array(4 * 4096 * 4096);
            this.gpuCompute4096.doRenderTarget(this.heightmap_gen_mat, this.renderTarget4096);
            this.height_texture_to_blur = this.renderTarget4096.texture;
            renderer.readRenderTargetPixels(this.renderTarget4096, 0, 0, 4096, 4096, pixels);
            var floatmap = new Float32Array(4096 * 4096);
            for (var i = 0, j = 0; j < pixels.length; i++, j+=4) {
                floatmap[i] = (pixels[j] + (pixels[j + 1] << 8)) / 70.0;
            }
            this.heightmap_ = floatmap;
            this.heightmap_texture_ = new THREE.DataTexture(
                floatmap, 4096, 4096, THREE.RedFormat, THREE.FloatType,
                THREE.UVMapping, THREE.ClampToEdgeWrapping,THREE.ClampToEdgeWrapping,
                THREE.LinearFilter,THREE.LinearMipMapLinearFilter, 1);
            this.heightmap_texture_.generateMipmaps = true;
            this.heightmap_texture_.needsUpdate = true;
        },

        get blur_heightmap_texture() {
            if (this.blur_heightmap_texture_ === null) this.updateBlurHeightmap();
            return this.blur_heightmap_texture_;
        },

        get blur_heightmap() {
            if (this.blur_heightmap_ === null) this.updateBlurHeightmap();
            return this.blur_heightmap_;
        },

        updateBlurHeightmap : function() {
            this.boxblur_mat.uniforms.uHeightmap.value = this.height_texture_to_blur;
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
            var floatmap2 = new Float32Array(4096 * 4096);
            for (var i = 0, j = 0; j < pixels.length; i++, j+=4) {
                floatmap2[i] = (pixels[j] + (pixels[j + 1] << 8)) / 70.0;
            }
            this.blur_heightmap_ = floatmap2;
            this.blur_heightmap_texture_ = new THREE.DataTexture(
                floatmap2, 4096, 4096, THREE.RedFormat, THREE.FloatType,
                THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
                THREE.LinearFilter, THREE.LinearMipMapLinearFilter, 1);
            this.blur_heightmap_texture_.generateMipmaps = true;
            this.blur_heightmap_texture_.needsUpdate = true;
        },

        get erosion_heightmap_texture() {
            if (this.erosion_heightmap_texture_ === null) this.updateErosionHeightmap();
            return this.erosion_heightmap_texture_;
        },

        get erosion_heightmap() {
            if (this.erosion_heightmap === null) this.updateErosionHeightmap();
            return this.erosion_heightmap_;
        },

        updateErosionHeightmap : function() {
            //TODO
        },

        get height_diff_texture() {
            if (this.height_diff_texture_ === null) this.updateHeightDiff();
            return this.height_diff_texture_;
        },

        get height_diff() {
            if (this.height_diff_ === null)  this.updateHeightDiff();
            return this.height_diff_;
        },

        updateHeightDiff : function() {
            var floatmap3 = new Float32Array(4096 * 4096);
            for (var i = 0; i < this.heightmap.length; i++) {
                var value = this.heightmap[i] - this.blur_heightmap[i];
                if (value < 1.0) {
                    value = 0.0;
                }
                floatmap3[i] = THREE.MathUtils.clamp(value, 0.0, 1.0);
            }
            this.height_diff_ = floatmap3;
            this.height_diff_texture_ = new THREE.DataTexture(
                floatmap3, 4096, 4096, THREE.RedFormat, THREE.FloatType,
                THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
                THREE.LinearFilter, THREE.LinearMipMapLinearFilter, 1);
            this.height_diff_texture_.generateMipmaps = true;
            this.height_diff_texture_.needsUpdate = true;
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
                    BoxBlurFrag.value, { uHeightmap : { value : this.heightmap_texture }, });
            }
            return this.boxblur_mat_;
        },
    };
});
