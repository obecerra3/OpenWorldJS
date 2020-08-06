
define(["three", "container"], (THREE, container) =>
{
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 5000);

    window.addEventListener('resize', () =>
    {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }, false);

    return camera;
});
