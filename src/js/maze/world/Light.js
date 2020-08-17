define(["three", "scene", "colors", "eventQ", "time"], (THREE, scene, Colors, EventQ, Time) =>
{
    var Light =
    {
        MAX_X : 100,
        MAX_Y : 100,
        MAX_Z : 100,

        player : {},

        // Ambient Light
        ambient : {},
        ambient_intensity : 0.5,
        ambient_color : Colors.white,

        // Hemisphere Light
        hemisphere : {},
        hemisphere_intensity : 0.25,
        hemisphere_sky_color : Colors.light_sky_blue1,
        hemisphere_ground_color : Colors.grass_green,

        // Directional Lights
        sunlight : {},
        sunlight_intensity : 5,
        sunlight_color : Colors.white,
        sunlight_pos : new THREE.Vector3(),

        init : (player) =>
        {
            Light.player = player;

            Light.ambient = new THREE.AmbientLight(Light.ambient_color, Light.ambient_intensity);

            Light.hemisphere = new THREE.HemisphereLight(Light.hemisphere_sky_color, Light.hemisphere_ground_color, Light.hemisphere_intensity);

            Light.sunlight = new THREE.DirectionalLight(Light.sunlight_color, Light.sunlight_intensity);
            // Light.sunlight.castShadow = true;

            // this removes artefacts from shadows
            // Light.sunlight.shadow.bias = -0.0001;
            //
            // // these determine shadow quality and fps (must be a power of 2)
            // // have to account for renderer.capabilities.maxTextureSize
            // Light.sunlight.shadow.mapSize.width = 5000;
            // Light.sunlight.shadow.mapSize.height = 5000;

            EventQ.push(
            {
                verify : () =>
                {
                    return Light.player.initialized;
                },
                action : () =>
                {
                    Light.sunlight.target = Light.player.threeObj;
                },
                arguments : [],
            });

            // var scale = 64;
            // Light.sunlight.shadow.camera = new THREE.OrthographicCamera(
            //     window.innerWidth / -scale, window.innerWidth / scale,
            //     window.innerHeight / scale, window.innerHeight / -scale, 0.1, 1000);
            //
            // const dirLightHelper = new THREE.DirectionalLightHelper(Light.sunlight, 5);
            // scene.add(dirLightHelper);
        },

        render : () =>
        {
            scene.add(Light.ambient);
            scene.add(Light.hemisphere);
            scene.add(Light.sunlight);
        },

        update : (delta) =>
        {
            if (Light.sunlight.visible)
            {
                // set orbit position of sun
                Light.sunlight_pos.x = THREE.MathUtils.lerp(Light.MAX_X, -Light.MAX_X, Time.elapsed_day_time / Time.DAY_LENGTH);
                Light.sunlight_pos.y = THREE.MathUtils.lerp(Light.MAX_Y, -Light.MAX_Y, Time.elapsed_day_time / Time.DAY_LENGTH);

                if (Time.elapsed_day_time < Time.DAY_LENGTH * 0.5)
                {
                    Light.sunlight_pos.z = THREE.MathUtils.lerp(-Light.MAX_Z * 0.1, Light.MAX_Z, Time.elapsed_day_time / (Time.DAY_LENGTH * 0.5));
                }
                else
                {
                    Light.sunlight_pos.z = THREE.MathUtils.lerp(Light.MAX_Z, -Light.MAX_Z * 0.1, (Time.elapsed_day_time - Time.DAY_LENGTH * 0.5) / (Time.DAY_LENGTH * 0.5));
                }

                if (Light.player.initialized) Light.sunlight.position.copy(new THREE.Vector3().addVectors(Light.sunlight_pos, Light.player.threeObj.position));

                if (Time.elapsed_day_time > Time.DAY_LENGTH)
                {
                    Light.sunlight.visible = false;
                }
            } else
            {
                if (Time.elapsed_day_time < Time.DAY_LENGTH)
                {
                    Light.sunlight.visible = true;
                }
                // set orbit position of moon
            }
        },
    };

    return Light;
}) ;
