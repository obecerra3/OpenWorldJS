define(["three", "gltfLoader", "animator", "collider", "ray", "physics", "ammo", "scene"],
(THREE, GLTFLoader, Animator, Collider, Ray, Physics, Ammo, scene) => {

    Ammo().then((AmmoLib) =>
    {
        Ammo = AmmoLib;
    });

    var Player =
    {
        username: "",
        position: {},
        input_handler: {},
        collider: {},

        init: (_username = "empty_username", _position = new THREE.Vector3()) =>
        {
            Player.initCollider();
        },

        update: () =>
        {

        },

        initCollider: () =>
        {
            var ray = Ray();
            console.log(ray);
            // var rays = [
            //     Ray(this.worldState.scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils.X.multiplyScalar(1.5), 0xff00ff),
            //     new Ray(this.worldState.scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils._X.multiplyScalar(1.5), 0xff00ff),
            //     new Ray(this.worldState.scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils.Z.multiplyScalar(1.5), 0xff00ff),
            //     new Ray(this.worldState.scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils._Z.multiplyScalar(1.5), 0xff00ff)
            // ]
        },
    }
    return Player;
});
