define(["three", "gltfLoader", "dracoLoader", "animator", "collider", "ray", "physics", "scene", "utils", "states", "playerInputHandler"],
(THREE, GLTFLoader, dracoLoader, Animator, Collider, Ray, Physics, scene, Utils, States, PlayerInputHandler) => {

    var Player =
    {
        username: "",
        input_handler: PlayerInputHandler,
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

        //====================================================================
        //====================================================================
        //  Init Methods
        //====================================================================
        //====================================================================

        init: (_username = "empty_username", _position = new THREE.Vector3()) =>
        {
            Player.input_handler.init();
            Player.initGraphics();
            Player.initPhysics();
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
                    return Object.keys(Player.body).length > 0;
                },
                action: () =>
                {
                    var capsule_shape = new Physics.ammo.btCapsuleShape(2, 6.5);
                    var rigidbody = Physics.createRigidBody(Player.body, capsule_shape, Utils.PLAYER_MASS, Player.body.position, Player.body.quaternion, Player.rigidbody_offset);
                    rigidbody.setAngularFactor(new Physics.ammo.btVector3(0.0, 0.0, 0.0));
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
                "any to jump_charging" : (weight = 0.5) => {
                    Player.animator.playAnimation('CrouchIdle', weight);
                },
                "any to fallIdle" : () => {
                    Player.animator.stopAnimation('CrouchIdle', 0);
                    Player.animator.playAnimation('FallIdle', 1, 0.1);
                }
            }
        },

        //====================================================================
        //====================================================================
        //  Update Methods
        //====================================================================
        //====================================================================

        update: (_delta) =>
        {
            Player.eventQueueUpdate();

            if (Object.keys(Player.rigidbody) > 0)
            {
                Player.updateAnimation();
            }

        },

        //This is going to change to use a PlayerState Class which will contain different
        //definitiosn for player states and handle animation switching/ state switching there
        //https://gameprogrammingpatterns.com/state.html
        updateAnimation: () =>
        {
            if (Object.keys(Player.animator).length > 0) Player.animator.update();

            switch (Player.state) {
                case States.IDLE:
                    if (Player.input_handler.move_forward || Player.input_handler.move_left || Player.input_handler.move_right || Player.input_handler.move_backward)
                    {
                        Player.state = States.WALK;
                        Player.transitions["idle to walk"]();
                    } else if (Player.crouching)
                    {
                        Player.state = States.CROUCH_IDLE;
                        Player.transitions["idle to crouchIdle"]();
                    } else if (Player.jump_pressed)
                    {
                        Player.jump_charging = true;
                        Player.transitions["any to jump_charging"](0.75);
                        Player.jump_pressed = false;
                    } else if (Player.jump_charging)
                    {

                    }

                    break;
                case States.WALK:
                    if (!Player.input_handler.move_forward && !Player.input_handler.move_left && !Player.input_handler.move_right && !Player.input_handler.move_backward)
                    {
                        Player.state = States.IDLE;
                        Player.transitions["walk to idle"]();
                    } else if (Player.running)
                    {
                        Player.state = States.RUN;
                        Player.transitions["walk to run"]();
                    } else if (Player.crouching)
                    {
                        Player.state = States.CROUCH_WALK;
                        Player.transitions["walk to crouchWalk"]();
                    } else if (Player.jump_pressed)
                    {
                        Player.jump_charging = true;
                        Player.transitions["any to jump_charging"](0.2);
                        Player.jump_pressed = false;
                    }
                    break;
                case States.RUN:
                    if (!Player.input_handler.move_forward && !Player.input_handler.move_left && !Player.input_handler.move_right && !Player.input_handler.move_backward)
                    {
                        Player.state = States.IDLE;
                        Player.transitions["run to idle"]();
                    } else if (!Player.running)
                    {
                        Player.state = States.WALK;
                        Player.transitions["run to walk"]();
                    } else if (Player.jump_pressed)
                    {
                        Player.jump_charging = true;
                        Player.transitions["any to jump_charging"](0.25);
                        Player.jump_pressed = false;
                    }

                    break;
                case States.CROUCH_IDLE:
                    if (Player.crouching)
                    {
                        if (Player.input_handler.move_forward || Player.input_handler.move_left || Player.input_handler.move_right || Player.input_handler.move_backward)
                        {
                            Player.state = States.CROUCH_WALK;
                            Player.transitions["crouchIdle to crouchWalk"]();
                        }
                    } else
                    {
                        if (Player.input_handler.move_forward || Player.input_handler.move_left || Player.input_handler.move_right || Player.input_handler.move_backward)
                        {
                            Player.state = States.WALK;
                            Player.transitions["crouchIdle to walk"]();
                        } else
                        {
                            Player.state = States.IDLE;
                            Player.transitions["crouchIdle to idle"]();
                        }
                    }
                    break;
                case States.CROUCH_WALK:
                    if (Player.crouching)
                    {
                        if (!Player.input_handler.move_forward && !Player.input_handler.move_left && !Player.input_handler.move_right && !Player.input_handler.move_backward)
                        {
                            Player.state = States.CROUCH_IDLE;
                            Player.transitions["crouchWalk to crouchIdle"]();
                        }
                    } else
                    {
                        if (Player.input_handler.move_forward || Player.input_handler.move_left || Player.input_handler.move_right || Player.input_handler.move_backward)
                        {
                            Player.state = States.WALK;
                            Player.transitions["crouchWalk to walk"]();
                        } else
                        {
                            Player.state = States.IDLE;
                            Player.transitions["crouchWalk to idle"]();
                        }
                    }
                    break;
                case States.FALL_IDLE:
                    var currentVelocity = Player.rigidbody.getLinearVelocity();
                    // console.log(currentVelocity.y());
                    if (currentVelocity.y() < -20)
                    {
                        Player.rigidbody.setLinearVelocity(new Physics.ammo.btVector3(currentVelocity.x(), 0, currentVelocity.z()));
                    }
                    if (Player.collider.isGrounded(Player))
                    {
                        // console.log(currentVelocity.y());
                        Player.state = States.IDLE;
                        Player.transitions["fallIdle to idle"]();
                    }
                    break;
                }

                if (!(Player.state == States.FALL_IDLE) && Player.body && !Player.collider.isGrounded(Player))
                {
                    Player.state = States.FALL_IDLE;
                    Player.transitions["any to fallIdle"]();
                }
        },

        eventQueueUpdate: () =>
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

    }
    return Player;
});
