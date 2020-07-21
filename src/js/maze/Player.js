define(["three", "gltfLoader", "dracoLoader", "animator", "collider", "ray", "physics", "scene", "camera", "utils", "states", "playerInputHandler"],
(THREE, GLTFLoader, dracoLoader, Animator, Collider, Ray, Physics, scene, camera, Utils, States, PlayerInputHandler) => {

    var Player =
    {
        username: "",
        input_handler: PlayerInputHandler,
        collider: {},
        state: States.IDLE,
        running: false,
        crouching: false,
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
        rigidbody_offset: new THREE.Vector3(0, 0.83, 0),
        flight_enabled: false,
        rigidbody: {},
        event_queue: [],
        initialized: false,

        //====================================================================
        //====================================================================
        //  Init Methods
        //====================================================================
        //====================================================================

        init: (_clock, _username = "empty_username", _position = new THREE.Vector3()) =>
        {
            Player.initInput(_clock);
            Player.initGraphics();
            Player.initPhysics();

            Player.event_queue.push(
            {
                verify: () =>
                {
                    return Object.keys(Player.body).length > 0 &&
                            Object.keys(Player.animator).length > 0 &&
                            Object.keys(Player.rigidbody).length > 0 &&
                            Object.keys(Player.input_handler).length > 0;
                },
                action: () =>
                {
                    Player.initialized = true;
                },
                arguments: [],
            });
        },

        initInput: (_clock) =>
        {
            Player.input_handler.init(_clock);
            Player.input_handler.toggleJump = Player.toggleJump.bind(Player);
            Player.input_handler.toggleCrouch = Player.toggleCrouch.bind(Player);
            Player.input_handler.toggleFlashlight = Player.toggleFlashlight.bind(Player);
            Player.input_handler.printState = Player.printState.bind(Player);
            Player.input_handler.toggleFlight = Player.toggleFlight.bind(Player);
            Player.input_handler.toggleRun = Player.toggleRun.bind(Player);
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

            // var floorGeometry = new THREE.PlaneBufferGeometry(100, 100);
            // floorGeometry.rotateX(-Math.PI/2);
            // var floorMaterial = new THREE.MeshBasicMaterial(
            // {
            //     opacity : 0.0,
            //     transparent: true,
            // });
            // var floor = new THREE.Mesh(floorGeometry, floorMaterial);
            // scene.add(floor);
            // Player.collider.addMesh("floor", floor);
            // var floor_width = 5;
            // var colShape = new Physics.ammo.btBoxShape(new Physics.ammo.btVector3(floor.geometry.parameters.width * 0.5, floor_width, floor.geometry.parameters.height * 0.5));
            // var floor_offset = new THREE.Vector3(0, -floor_width, 0);
            // var body = Physics.createRigidbody(floor, colShape, 0, floor.position, floor.quaternion, floor_offset);
            // floor.userData.physicsBody = body;

            Player.event_queue.push(
            {
                verify: () =>
                {
                    return Object.keys(Player.body).length > 0;
                },
                action: () =>
                {
                    var capsule_shape = new Physics.ammo.btCapsuleShape(0.3, 1.1);
                    var rigidbody = Physics.createRigidbody(Player.body, capsule_shape, Utils.PLAYER_MASS, Player.body.position, Player.body.quaternion, Player.rigidbody_offset);
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
            // Player.flashlight = new THREE.SpotLight(0xffffff, 1, 300, 0.5, 0.1, 10.0);
            // Player.flashlight.castShadow = true;
            // Player.flashlight.visible = false;
            // scene.add(Player.flashlight);

            //gltf body
            // var loader = new THREE.GLTFLoader();
            // var dracoLoader = new THREE.DRACOLoader();
            // dracoLoader.setDecoderPath("../lib/draco/");
            // loader.setDRACOLoader(dracoLoader);
            // loader.load("./js/models/fpsCharacter.glb", (gltf) =>
            // {
            //     Player.model = gltf;
            //     Player.body = gltf.scene;
            //
            //     Player.body.traverse(function (object)
            //     {
            //         object.castShadow = true;
            //         object.receiveShadow = true;
            //         //need to fix the bounding sphere of the model's geometry in order to enable frustum culling
            //         object.frustumCulled = false;
            //     });
            //
            //     Player.initAnimations(gltf.animations);
            //
            //     scene.add(Player.body);
            // }, undefined, (error) =>
            // {
            //     console.error("Player.js: gltf loader error: ", error);
            // });
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

        update: (delta) =>
        {
            if (Player.initialized)
            {
                Player.updateAnimation();

                Player.input_handler.controls.getDirection(Player.look_direction);

                Player.collider.update(Player);

                Player.updateMoveDirection();
                Player.updateVelocity(delta);
                Player.updateRotation();
                Player.updateFlashlight();

                if (!Player.input_handler.orbit_enabled) Player.updateCameraPosition();
            };

            Player.eventQueueUpdate();
        },

        // This is going to change to use a PlayerState Class which will contain different
        // definitions for player states and handle animation switching/ state switching there
        // (hierarchical and concurrent FSMs)
        // https://gameprogrammingpatterns.com/state.html
        updateAnimation: () =>
        {
            Player.animator.update();

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

        updateMoveDirection: () =>
        {
            Player.move_direction.z = Number(Player.input_handler.move_forward) - Number(Player.input_handler.move_backward);
            Player.move_direction.x = Number(Player.input_handler.move_left) - Number(Player.input_handler.move_right);
            Player.move_direction.normalize();
            let theta = 0;

            if (Player.look_direction.z > 0)
            {
                theta = Math.atan(Player.look_direction.x / Player.look_direction.z);
            } else if (Player.look_direction.x > 0)
            {
                theta = Math.PI/2 + Math.atan(-Player.look_direction.z/ Player.look_direction.x);
            } else
            {
                if (Player.look_direction.x == 0)
                {
                    theta = Math.PI;
                } else
                {
                    theta = -Math.PI/2 - Math.atan(-Player.look_direction.z/ -Player.look_direction.x);
                }
            }
            Player.move_direction.applyAxisAngle(Utils.Y, theta);
        },

        updateVelocity: (delta) =>
        {
            var yVelocity = Player.rigidbody.getLinearVelocity().y();

            if (Player.running)
            {
                Player.rigidbody.setLinearVelocity(new Physics.ammo.btVector3(Player.move_direction.x * Utils.PLAYER_RUNNING_SPEED * delta, yVelocity, Player.move_direction.z * Utils.PLAYER_RUNNING_SPEED * delta));
            } else
            {
                Player.rigidbody.setLinearVelocity(new Physics.ammo.btVector3(Player.move_direction.x * Utils.PLAYER_WALKING_SPEED * delta, yVelocity, Player.move_direction.z * Utils.PLAYER_WALKING_SPEED * delta));
            }
        },

        updateRotation: () =>
        {
            if (Object.keys(Player.body).length > 0 && Player.look_direction.y > -0.97)
            {
                Player.body.rotation.y = Math.atan2(Player.look_direction.x, Player.look_direction.z);
            }
        },

        updateCameraPosition: () =>
        {
            if (Object.keys(Player.body).length > 0)
            {
                if (Player.look_direction.y > -0.97)
                {
                    let offset = new THREE.Vector3(Player.look_direction.x, 0, Player.look_direction.z); //used to be * 1.75
                    offset.normalize();
                    offset.multiplyScalar(-3); //2 for fps -10 for 3rd person
                    camera.position.x = Player.body.position.x + offset.x;
                    camera.position.z = Player.body.position.z + offset.z;
                }
                camera.position.y = Player.body.position.y + 3;

                // naive camera shake
                // if (Player.running && Player.state == States.RUN)
                // {
                //     let max = 0.07;
                //     let min = -0.07;
                //     camera.position.x += Math.random() * (max - min) + min;
                //     camera.position.z += Math.random() * (max - min) + min;
                //     camera.position.y += Math.random() * (max - min) + min;
                // }
            }
        },

        updateFlashlight: () =>
        {
            Player.flashlight.position.copy(camera.position);

            Player.flashlight.position.y -= 1;
            Player.flashlight.position.x += Player.look_direction.x * 1.5;
            Player.flashlight.position.z += Player.look_direction.z * 1.5;

            Player.flashlight.target.position.set(Player.flashlight.position.x + Player.look_direction.x,
                                                Player.flashlight.position.y + Player.look_direction.y,
                                                Player.flashlight.position.z + Player.look_direction.z);

            Player.flashlight.target.updateMatrixWorld();
        },

        //====================================================================
        //====================================================================
        //  Input Handler Method Callbacks
        //====================================================================
        //====================================================================

        toggleCrouch: () =>
        {
            Player.crouching = !Player.crouching;
        },

        toggleJump: (time_pressed) =>
        {
            if ((Player.collider.isGrounded(Player) && !Player.crouching) || Player.flight_emabled)
            {
                if (time_pressed == 0)
                {
                    Player.jump_pressed = true;
                    return;
                }
                time_pressed = time_pressed % 5;
                let y_velocity = Utils.PLAYER_JUMP_FORCE + (time_pressed * 50);
                Player.jump_charging = false;
                Player.rigidbody.setLinearVelocity(new Physics.ammo.btVector3(Player.rigidbody.getLinearVelocity().x(), y_velocity, Player.rigidbody.getLinearVelocity().z()));
            }
        },

        toggleFlight: () =>
        {
            Player.flight_enabled = !Player.flight_enabled;
        },

        toggleFlashlight: () =>
        {
            Player.flashlight.visible = !Player.flashlight.visible;
        },

        toggleRun: (_value) =>
        {
            Player.running = _value;
        },

        //====================================================================
        //====================================================================
        //  Util Methods
        //====================================================================
        //====================================================================

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

        printState: () =>
        {
            console.log("PrintState is for player debugging");
            console.log("Player");
            console.log(Player);
        },

    }
    return Player;
});
