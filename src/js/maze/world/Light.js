define( ["three", "scene", "colors"], ( THREE, scene, Colors ) =>
{
    var Light =
    {
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

        init : () =>
        {
            Light.ambient = new THREE.AmbientLight( Light.ambient_color, Light.ambient_intensity );

            Light.hemisphere = new THREE.HemisphereLight( Light.hemisphere_sky_color, Light.hemisphere_ground_color, Light.hemisphere_intensity );

            Light.sunlight = new THREE.DirectionalLight( Light.sunlight_color, Light.sunlight_intensity );
            Light.sunlight.position.set( 0, 100, 25 ) ;
            Light.sunlight.castShadow = true;

            const dirLightHelper = new THREE.DirectionalLightHelper(Light.sunlight, 5);
            scene.add(dirLightHelper);

            Light.sunlight.shadow.mapSize.width = 8192;
            Light.sunlight.shadow.mapSize.height = 8192;

            var scale = 32;
            Light.sunlight.shadow.camera = new THREE.OrthographicCamera(
                window.innerWidth / -scale, window.innerWidth / scale,
                window.innerHeight / scale, window.innerHeight / -scale, 0.1, 200);
        },

        render : () =>
        {
            scene.add( Light.ambient );
            scene.add( Light.hemisphere );
            scene.add( Light.sunlight );
        },

        update : ( delta ) =>
        {

        },
    };

    return Light;
} ) ;
