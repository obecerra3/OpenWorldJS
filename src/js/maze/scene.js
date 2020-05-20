define( ["three"],
(THREE) =>
{
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xB3F3FF);
    scene.fog = new THREE.Fog(0x000000, 200, 1000);
    return scene;
});
