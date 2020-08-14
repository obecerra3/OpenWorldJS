define(["three", "scene", "colors"], (THREE, scene, Colors) =>
{
    var Light =
    {
        MAX_T : 1,
        MAX_X : 100,
        MAX_Y : 100,
        MAX_Z : 100,

        clock : {},
        player : {},

        // Ambient Light
        ambient : {},
        ambient_intensity : 0.2,
        ambient_color : Colors.white,

        // Hemisphere Light
        hemisphere : {},
        hemisphere_intensity : 0.2,
        hemisphere_sky_color : Colors.light_sky_blue0,
        hemisphere_ground_color : Colors.dark_blue,

        // Directional Lights
        sunlight : {},
        sunlight_intensity : 1,
        sunlight_color : Colors.white,
        sunlight_pos : new THREE.Vector3(),

        init : (clock, player) =>
        {
            Light.clock = clock;
            Light.player = player;

            Light.ambient = new THREE.AmbientLight(Light.ambient_color, Light.ambient_intensity);

            Light.hemisphere = new THREE.HemisphereLight(Light.hemisphere_sky_color, Light.hemisphere_ground_color, Light.hemisphere_intensity);

            Light.sunlight = new THREE.DirectionalLight(Light.sunlight_color, Light.sunlight_intensity);
            Light.sunlight.position.set(Light.MAX_X, Light.MAX_Y, Light.MAX_Z);
            Light.sunlight.castShadow = true;

            // Light.sunlight.target = Light.player.threeObj;

            const dirLightHelper = new THREE.DirectionalLightHelper(Light.sunlight, 5);
            scene.add(dirLightHelper);

            Light.sunlight.shadow.mapSize.width = 12000;
            Light.sunlight.shadow.mapSize.height = 12000;

            var scale = 32;
            Light.sunlight.shadow.camera = new THREE.OrthographicCamera(
                window.innerWidth / -scale, window.innerWidth / scale,
                window.innerHeight / scale, window.innerHeight / -scale, 0.1, 200);
        },

        render : () =>
        {
            scene.add(Light.ambient);
            scene.add(Light.hemisphere);
            scene.add(Light.sunlight);
        },

        update : (delta) =>
        {
        },
    };

    return Light;
}) ;
