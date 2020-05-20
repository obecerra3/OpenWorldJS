define(["three", "container"],
(THREE, container) =>
{
    container.innerHTML = "";
    var renderer = new THREE.WebGLRenderer({antialias: true, clearColor: 0x000000});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = false;
    renderer.autoClear = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.gammaFactor = 2.2;
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', () =>
    {
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio( 2 );
    }, false);

    return renderer;
});
