define(["three", "gltfLoader", "dracoLoader", "animator", "collider", "ray", "physics", "scene", "utils", "states"],
(THREE, GLTFLoader, dracoLoader, Animator, Collider, Ray, Physics, scene, Utils, States) => {

    var OnlinePlayerConstructor = (_username, _position) =>
    {
        var OnlinePlayer =
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
                OnlinePlayer.username = _username;
                OnlinePlayer.position = _position;
                OnlinePlayer.initGraphics();
                OnlinePlayer.initPhysics();
            },

            update: () =>
            {
                if (OnlinePlayer.event_queue.length > 0)
                {
                    var event_obj = OnlinePlayer.event_queue[0];
                    if (event_obj.verify())
                    {
                        event_obj.action.apply(this, event_obj.arguments);
                        OnlinePlayer.event_queue.shift();
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

                OnlinePlayer.collider = Collider(rays, 4);

                OnlinePlayer.event_queue.push(
                {
                    verify: () =>
                    {
                        return OnlinePlayer.threeObj != {};
                    },
                    action: () =>
                    {
                        var capsule_shape = new Physics.ammo.btCapsuleShape(2, 6.5);
                        var rigidbody = Physics.createRigidBody(OnlinePlayer.threeObj, capsule_shape, Utils.PLAYER_MASS, OnlinePlayer.position, OnlinePlayer.threeObj.quaternion, OnlinePlayer.rigidbody_offset);
                        body.setAngularFactor(new Physics.ammo.btVector3(0.0, 0.0, 0.0));
                        OnlinePlayer.rigidbody = rigidbody;
                    },
                    arguments: []
                });
            },

            //init graphical components of the player/ do file io for the gltf file
            initGraphics: () =>
            {
                //flashlight
                OnlinePlayer.flashlight = new THREE.SpotLight(0xffffff, 1, 300, 0.5, 0.1, 10.0);
                OnlinePlayer.flashlight.castShadow = true;
                OnlinePlayer.flashlight.visible = false;
                scene.add(OnlinePlayer.flashlight);

                //gltf body
                var loader = new THREE.GLTFLoader();
                var dracoLoader = new THREE.DRACOLoader();
                dracoLoader.setDecoderPath("../lib/draco/");
                loader.setDRACOLoader(dracoLoader);
                loader.load("./js/models/fpsCharacter.glb", (gltf) =>
                {
                    OnlinePlayer.model = gltf;
                    OnlinePlayer.threeObj = gltf.scene;

                    OnlinePlayer.threeObj.traverse(function (object)
                    {
                        object.castShadow = true;
                        object.receiveShadow = true;
                        //need to fix the bounding sphere of the model's geometry in order to enable frustum culling
                        object.frustumCulled = false;
                    });

                    OnlinePlayer.initAnimations(gltf.animations);

                    OnlinePlayer.threeObj.scale.set(6, 6, 6);
                    scene.add(OnlinePlayer.threeObj);
                }, undefined, (error) =>
                {
                    console.error("OnlinePlayer.js: gltf loader error: ", error);
                });
            },

            initAnimations: (_animations) =>
            {
                mixer = new THREE.AnimationMixer(OnlinePlayer.threeObj);

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

                OnlinePlayer.animator = Animator(mixer, animationData);

                OnlinePlayer.transitions = {
                    "idle to walk" : () => {
                        OnlinePlayer.animator.prepareCrossFade('Idle', 'Walk', 0.5);
                    },
                    "walk to idle" : () => {
                        OnlinePlayer.animator.prepareCrossFade('Walk', 'Idle', 0.5);
                    },
                    "run to walk" : () => {
                        OnlinePlayer.animator.prepareCrossFade('Run', 'Walk', 0.25);
                    },
                    "walk to run" : () => {
                        OnlinePlayer.animator.prepareCrossFade('Walk', 'Run', 0.5);
                    },
                    "run to idle" : () => {
                        OnlinePlayer.animator.prepareCrossFade('Run', 'Idle', 0.1);
                    },
                    "idle to crouchIdle" : () => {
                        OnlinePlayer.animator.prepareCrossFade('Idle', 'CrouchIdle', 0.25);
                    },
                    "walk to crouchWalk" : () => {
                        OnlinePlayer.animator.prepareCrossFade('Walk', 'CrouchWalk', 0.5);
                    },
                    "run to slide" : () => {
                        OnlinePlayer.animator.prepareCrossFade('Run', 'Slide', 0.5);
                    },
                    "crouchIdle to idle" : () => {
                        OnlinePlayer.animator.prepareCrossFade('CrouchIdle', 'Idle', 0.25, 0.25);
                    },
                    "crouchIdle to crouchWalk" : () => {
                        OnlinePlayer.animator.prepareCrossFade('CrouchIdle', 'CrouchWalk', 0.5);
                    },
                    "crouchWalk to crouchIdle" : () => {
                        OnlinePlayer.animator.prepareCrossFade('CrouchWalk', 'CrouchIdle', 0.5);
                    },
                    "crouchWalk to walk" : () => {
                        OnlinePlayer.animator.prepareCrossFade('CrouchWalk', 'Walk', 0.5);
                    },
                    "crouchWalk to idle" : () => {
                        OnlinePlayer.animator.prepareCrossFade('CrouchWalk', 'Idle', 0.5);
                    },
                    "crouchIdle to walk" : () => {
                        OnlinePlayer.animator.prepareCrossFade('CrouchIdle', 'Walk', 0.5);
                    },
                    "any to crouchIdle" : () => {
                        OnlinePlayer.animator.prepareCrossFade(OnlinePlayer.state, 'CrouchIdle', 0.5);
                    },
                    "crouchIdle to fallIdle" : () => {
                        OnlinePlayer.animator.prepareCrossFade('CrouchIdle', 'FallIdle', 0.1);
                    },
                    "fallIdle to idle" : () => {
                        OnlinePlayer.animator.prepareCrossFade('FallIdle', 'Idle', 0.25);
                    },
                    "any to jumpCharging" : (weight = 0.5) => {
                        OnlinePlayer.animator.playAnimation('CrouchIdle', weight);
                    },
                    "any to fallIdle" : () => {
                        OnlinePlayer.animator.stopAnimation('CrouchIdle', 0);
                        OnlinePlayer.animator.playAnimation('FallIdle', 1, 0.1);
                    }
                }
            },
        }
        OnlinePlayer.init(_username, _position);
        return OnlinePlayer;
    };
});
