define(["three", "scene"], (THREE, scene) =>
{
    var light =
    {
        init : () =>
        {
            const ambient_light = new THREE.AmbientLight(0xffffff, 0.75);
            scene.add(ambient_light);

            const hemisphere_light = new THREE.HemisphereLight(0xB1E1FF, 0x189d4f, 0.5); // light blue and tonal green
            scene.add(hemisphere_light);
        },
    };

    return light;
});
