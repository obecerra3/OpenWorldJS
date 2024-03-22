define(["three"],
       (THREE) => {
    let scene = new THREE.Scene();
    let cube_texture = new THREE.CubeTextureLoader()
        .setPath("js/textures/")
        .load(["skybox_right.bmp", "skybox_left.bmp", "skybox_back.bmp", 
               "skybox_front.bmp", "skybox_top.bmp", "skybox_bottom.bmp"]);
    scene.background = cube_texture;
    return scene;
});
