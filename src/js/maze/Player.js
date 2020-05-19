define(["three", "gltfLoader", "dracoLoader", "animator", "collider", "ray", "physics", "ammo", "scene", "utils", "states"],
(THREE, GLTFLoader, dracoLoader, Animator, Collider, Ray, Physics, Ammo, scene, Utils, States) => {

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
        state: States.IDLE,
        running: false,
        crouched: false,
        jump_pressed: false,
        jump_charging: false,
        flashlight: {},
        model: {},
        body: {},
        animator: {},
        transitions: {},
        look_direction: new THREE.Vector3(),
        prev_position: new THREE.Vector3(),
        move_direction: new THREE.Vector3(),
        rigidbody_offset: new THREE.Vector3(0, 5, 0),
        flight_enabled: false,
        rigidbody: {},
        event_queue: [],

        init: (_username = "empty_username", _position = new THREE.Vector3()) =>
        {
            Player.initGraphics();
            Player.initPhysics();
        },

        update: () =>
        {
            if (Player.event_queue.length > 0)
            {
                var event_obj = Player.event_queue[0];
                if (event_obj.verify())
                {
                    event_obj.action.apply(this, event_obj.arguments);
                    Player.event_queue.shift();
                }
            }
        },

        //Collider is used to check if the player is grounded to decide if we can jump when jump is pressed.
        //The rays are all ground rays pointing downwards from the player.
        //The player's rigidbody will be a capsule
        initPhysics: () =>
        {
            //Collider
            var rays = [
                Ray(scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils.X.multiplyScalar(1.5), 0xff00ff),
                Ray(scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils._X.multiplyScalar(1.5), 0xff00ff),
                Ray(scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils.Z.multiplyScalar(1.5), 0xff00ff),
                Ray(scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils._Z.multiplyScalar(1.5), 0xff00ff)
            ];

            Player.collider = Collider(rays, 4);

            Player.event_queue.push(
            {
                verify: () =>
                {
                    return Player.body != {};
                },
                action: () =>
                {
                    var capsule_shape = new Ammo.btCapsuleShape(2, 6.5);
                    var rigidbody = Physics.createRigidBody(Player.body, capsule_shape, Utils.PLAYER_MASS, Player.position, Player.body.quaternion, Player.rigidbody_offset);
                    body.setAngularFactor(new Ammo.btVector3(0.0, 0.0, 0.0));
                    Player.rigidbody = rigidbody;
                },
                arguments: []
            });
        },

        //init graphical components of the player/ do file io for the gltf file
        initGraphics: () =>
        {
            //flashlight
            Player.flashlight = new THREE.SpotLight(0xffffff, 1, 300, 0.5, 0.1, 10.0);
            Player.flashlight.castShadow = true;
            Player.flashlight.visible = false;
            scene.add(Player.flashlight);

            //gltf body
            var loader = new THREE.GLTFLoader();
            var dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath("../lib/draco/");
            loader.setDRACOLoader(dracoLoader);
            loader.load("./js/models/fpsCharacter.glb", (gltf) =>
            {
                Player.model = gltf;
                Player.body = gltf.scene;

                Player.body.traverse(function (object)
                {
                    object.castShadow = true;
                    object.receiveShadow = true;
                    //need to fix the bounding sphere of the model's geometry in order to enable frustum culling
                    object.frustumCulled = false;
                });

                Player.initAnimations(gltf.animations);

                Player.body.scale.set(6, 6, 6);
                scene.add(Player.body);
            }, undefined, (error) =>
            {
                console.error("Player.js: gltf loader error: ", error);
            });
        },

        initAnimations: (_animations) =>
        {
            mixer = new THREE.AnimationMixer(Player.body);

            let animationData = {};

            _animations.forEach((clip) =>
            {
                animationData[clip.name] =
                {
                    "action": mixer.clipAction(clip),
                    "duration": clip.duration,
                    "weight": Utils.DEFAULT_WEIGHT
                };
            });

            Player.animator = Animator(mixer, animationData);

            Player.transitions = {
                "idle to walk" : () => {
                    Player.animator.prepareCrossFade('Idle', 'Walk', 0.5);
                },
                "walk to idle" : () => {
                    Player.animator.prepareCrossFade('Walk', 'Idle', 0.5);
                },
                "run to walk" : () => {
                    Player.animator.prepareCrossFade('Run', 'Walk', 0.25);
                },
                "walk to run" : () => {
                    Player.animator.prepareCrossFade('Walk', 'Run', 0.5);
                },
                "run to idle" : () => {
                    Player.animator.prepareCrossFade('Run', 'Idle', 0.1);
                },
                "idle to crouchIdle" : () => {
                    Player.animator.prepareCrossFade('Idle', 'CrouchIdle', 0.25);
                },
                "walk to crouchWalk" : () => {
                    Player.animator.prepareCrossFade('Walk', 'CrouchWalk', 0.5);
                },
                "run to slide" : () => {
                    Player.animator.prepareCrossFade('Run', 'Slide', 0.5);
                },
                "crouchIdle to idle" : () => {
                    Player.animator.prepareCrossFade('CrouchIdle', 'Idle', 0.25, 0.25);
                },
                "crouchIdle to crouchWalk" : () => {
                    Player.animator.prepareCrossFade('CrouchIdle', 'CrouchWalk', 0.5);
                },
                "crouchWalk to crouchIdle" : () => {
                    Player.animator.prepareCrossFade('CrouchWalk', 'CrouchIdle', 0.5);
                },
                "crouchWalk to walk" : () => {
                    Player.animator.prepareCrossFade('CrouchWalk', 'Walk', 0.5);
                },
                "crouchWalk to idle" : () => {
                    Player.animator.prepareCrossFade('CrouchWalk', 'Idle', 0.5);
                },
                "crouchIdle to walk" : () => {
                    Player.animator.prepareCrossFade('CrouchIdle', 'Walk', 0.5);
                },
                "any to crouchIdle" : () => {
                    Player.animator.prepareCrossFade(Player.state, 'CrouchIdle', 0.5);
                },
                "crouchIdle to fallIdle" : () => {
                    Player.animator.prepareCrossFade('CrouchIdle', 'FallIdle', 0.1);
                },
                "fallIdle to idle" : () => {
                    Player.animator.prepareCrossFade('FallIdle', 'Idle', 0.25);
                },
                "any to jumpCharging" : (weight = 0.5) => {
                    Player.animator.playAnimation('CrouchIdle', weight);
                },
                "any to fallIdle" : () => {
                    Player.animator.stopAnimation('CrouchIdle', 0);
                    Player.animator.playAnimation('FallIdle', 1, 0.1);
                }
            }
        },
    }
    return Player;
});
