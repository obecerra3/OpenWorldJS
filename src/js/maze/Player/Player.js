define(['three', 'gltfLoader', 'dracoLoader', 'animator', 'collider', 'ray', 'physics', 'scene', 'camera', 'utils', 'states', 'playerInputHandler', 'container'],
(THREE, GLTFLoader, dracoLoader, Animator, Collider, Ray, Physics, scene, camera, Utils, States, PlayerInputHandler, container) => {

    var Player =
    {
        username: '',
        input_handler: PlayerInputHandler,
        collider: {},
        state: States.IDLE,
        running: false,
        crouching: false,
        flashlight: {},
        model: {},
        threeObj: {},
        animator: {},
        transitions: {},
        look_direction: new THREE.Vector3(),
        move_direction: new THREE.Vector3(),
        rigidbody_offset: new THREE.Vector3(0, 0, 0.83),
        rigidbody: {},
        event_queue: [],
        initialized: false,
        init_pos: new THREE.Vector3(0, 0, 10),
        gravity_index: 0,
        debug_count : 0,
        clock : {},
        air_time : null,
        walk_speed : Utils.PLAYER_WALK_SPEED,
        run_speed : Utils.PLAYER_RUN_SPEED,
        first_person_enabled : false,
        left_strafe : false,
        right_strafe : false,
        backward : false,

        //====================================================================
        //====================================================================
        //  Init Methods
        //====================================================================
        //====================================================================

        init: (_clock, _username = 'empty_username', _position = new THREE.Vector3()) =>
        {
            Player.clock = _clock;
            Player.initInput(_clock);
            Player.initGraphics();
            Player.initPhysics();

            Player.event_queue.push(
            {
                verify: () =>
                {
                    return Object.keys(Player.threeObj).length > 0
                           && Object.keys(Player.animator).length > 0
                           && Object.keys(Player.rigidbody).length > 0
                           && Object.keys(Player.input_handler).length > 0
                           && Object.keys(Player.collider).length > 0;
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
            Player.input_handler.toggleRun = Player.toggleRun.bind(Player);
            Player.input_handler.toggleGravity = Player.toggleGravity.bind(Player);
            Player.input_handler.toggleFast = Player.toggleFast.bind(Player);
            Player.input_handler.toggleZeroVelocity = Player.toggleZeroVelocity.bind(Player);
            Player.input_handler.toggleFirstPerson = Player.toggleFirstPerson.bind(Player);
        },

        //Collider is used to check if the player is grounded to decide if we can jump when jump is pressed.
        //The rays are all ground rays pointing downwards from the player.
        //The player's rigidbody will be a capsule
        initPhysics: () =>
        {
            // Collider
            // --------
            var size_mult = 2.5;
            var rays = [
                Ray(scene, Utils._Z, Utils.PLAYER_SIZE * size_mult, true, Utils.X.multiplyScalar(0.5), 0xff00ff),
                Ray(scene, Utils._Z, Utils.PLAYER_SIZE * size_mult, true, Utils._X.multiplyScalar(0.5), 0xff00ff),
                Ray(scene, Utils._Z, Utils.PLAYER_SIZE * size_mult, true, Utils.Y.multiplyScalar(0.5), 0xff00ff),
                Ray(scene, Utils._Z, Utils.PLAYER_SIZE * size_mult, true, Utils._Y.multiplyScalar(0.5), 0xff00ff)
            ];

            Player.collider = Collider(rays, 4);

            Player.input_handler.toggleShowRays = Player.collider.toggleShowRays.bind(Player.collider);

            // Rigidbody
            // ---------
            Player.event_queue.push(
            {
                verify: () =>
                {
                    return Object.keys(Player.threeObj).length > 0;
                },
                action: () =>
                {
                    var capsule_shape = new Physics.ammo.btCapsuleShape(
                                                    Utils.PLAYER_CAPSULE_RADIUS,
                                                    Utils.PLAYER_SIZE);
                    var rigidbody = Physics.createRigidbody(
                        Player.threeObj, capsule_shape, Utils.PLAYER_MASS,
                        Player.threeObj.position, Player.threeObj.quaternion,
                        Player.rigidbody_offset, true);

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

            // ThreeObject from GLTF Loader
            var loader = new THREE.GLTFLoader();
            var dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath('../lib/draco/');
            loader.setDRACOLoader(dracoLoader);
            loader.load('./js/models/michelle.glb', (gltf) =>
            {
                Player.model = gltf;
                Player.threeObj = gltf.scene;
                Player.threeObj.rotateX(Math.PI / 2);
                Player.threeObj.position.copy(Player.init_pos);
                Player.threeObj.userData = { 'name' : 'player' };
                Player.character = Player.threeObj.children[0];
                Player.bone = Player.character.children[0];
                Player.mesh = Player.character.children[1];

                Player.threeObj.traverse((obj) =>
                {
                    obj.castShadow = true;
                    obj.receiveShadow = true;

                    // fixes boundingSphere for frustum culling thanks @github.com/gogiii
                    if (obj.isSkinnedMesh)
                    {
                        obj.geometry.computeBoundingSphere();
                        var sphere = new THREE.Sphere();
                        sphere.copy(obj.geometry.boundingSphere);
                        sphere.applyMatrix4(obj.skeleton.bones[0].matrix);
                        obj.geometry.boundingSphere = sphere;
                    }
                });

                Player.initAnimations(gltf.animations);
                scene.add(Player.threeObj);
            }, undefined, (error) =>
            {
                console.error('Player.js: gltf loader error: ', error);
            });
        },

        initAnimations: (_animations) =>
        {
            mixer = new THREE.AnimationMixer(Player.threeObj);

            let animation_data = {};

            _animations.forEach((clip) =>
            {
                animation_data[clip.name] =
                {
                    'action': mixer.clipAction(clip),
                    'duration': clip.duration,
                    'weight': Utils.DEFAULT_WEIGHT
                };
            });

            Player.animator = Animator(mixer, animation_data);

            Player.transitions = {
                // idle
                'idle to walk' : () => {
                    Player.animator.prepareCrossFade('Idle', 'Walk', 0.5);
                },
                'idle to crouchIdle' : () => {
                    Player.animator.prepareCrossFade('Idle', 'CrouchIdle', 0.25);
                },

                // walk
                'walk to idle' : () => {
                    Player.walkAnimTo('Idle');
                },
                'walk to run' : () => {
                    Player.walkAnimTo('Run');
                },
                'walk to crouchWalk' : () => {
                    Player.walkAnimTo('CrouchWalk');
                },
                'walk to leftStrafe' : () => {
                    Player.left_strafe = true;
                    if (Player.right_strafe) {
                        Player.right_strafe = false;
                        Player.animator.prepareCrossFade('RightStrafe', 'LeftStrafe', 0.5);
                    } else {
                        Player.backwardAnimCheck('Walk');
                        Player.animator.prepareCrossFade('Walk', 'LeftStrafe', 0.5);
                    }
                },
                'walk to rightStrafe' : () => {
                    Player.right_strafe = true;
                    if (Player.left_strafe) {
                        Player.left_strafe = false;
                        Player.animator.prepareCrossFade('LeftStrafe', 'RightStrafe', 0.5);
                    } else {
                        Player.backwardAnimCheck('Walk');
                        Player.animator.prepareCrossFade('Walk', 'RightStrafe', 0.5);
                    }
                },
                'strafe to walk' : () => {
                    if (Player.left_strafe) {
                        Player.left_strafe = false;
                        Player.animator.prepareCrossFade('LeftStrafe', 'Walk', 0.5);
                    } else {
                        Player.right_strafe = false;
                        Player.animator.prepareCrossFade('RightStrafe', 'Walk', 0.5);
                    }
                },
                'walk to backward' : () => {
                    Player.backward = true;
                    Player.animator.animation_data['Walk'].action.timeScale = -1;
                },

                // run
                'run to idle' : () => {
                    Player.runAnimTo('Idle', 0.1);
                },
                'run to walk' : () => {
                    Player.runAnimTo('Walk', 0.25);
                },
                'run to leftStrafe' : () => {
                    Player.left_strafe = true;
                    if (Player.right_strafe) {
                        Player.right_strafe = false;
                        Player.animator.prepareCrossFade('RunRightStrafe', 'RunLeftStrafe', 0.5);
                    } else if (Player.backward) {
                        Player.backward = false;
                        Player.animator.prepareCrossFade('RunBackward', 'RunLeftStrafe', 0.1);
                    } else {
                        Player.backwardAnimCheck('Run');
                        Player.animator.prepareCrossFade('Run', 'RunLeftStrafe', 0.5);
                    }
                },
                'run to rightStrafe' : () => {
                    Player.right_strafe = true;
                    if (Player.left_strafe) {
                        Player.left_strafe = false;
                        Player.animator.prepareCrossFade('RunLeftStrafe', 'RunRightStrafe', 0.5);
                    } else if (Player.backward) {
                        Player.backward = false;
                        Player.animator.prepareCrossFade('RunBackward', 'RunRightStrafe', 0.1);
                    } else {
                        Player.animator.prepareCrossFade('Run', 'RunRightStrafe', 0.5);
                    }
                },
                'strafe to run' : () => {
                    if (Player.left_strafe) {
                        Player.left_strafe = false;
                        Player.animator.prepareCrossFade('RunLeftStrafe', 'Run', 0.5);
                    } else {
                        Player.right_strafe = false;
                        Player.animator.prepareCrossFade('RunRightStrafe', 'Run', 0.5);
                    }
                },
                'run to backward' : () => {
                    Player.backward = true;
                    Player.animator.prepareCrossFade('Run', 'RunBackward', 0.1);
                },
                'backward to run' : () => {
                    Player.backward = false;
                    Player.animator.prepareCrossFade('RunBackward', 'Run', 0.1);
                },

                // crouchIdle
                'crouchIdle to idle' : () => {
                    Player.animator.prepareCrossFade('CrouchIdle', 'Idle', 0.25);
                },
                'crouchIdle to crouchWalk' : () => {
                    Player.animator.prepareCrossFade('CrouchIdle', 'CrouchWalk', 0.5);
                },
                'crouchIdle to walk' : () => {
                    Player.animator.prepareCrossFade('CrouchIdle', 'Walk', 0.5);
                },

                // crouchWalk
                'crouchWalk to crouchIdle' : () => {
                    Player.backwardAnimCheck('CrouchWalk');
                    Player.animator.prepareCrossFade('CrouchWalk', 'CrouchIdle', 0.5);
                },
                'crouchWalk to walk' : () => {
                    Player.backwardAnimCheck('CrouchWalk');
                    Player.animator.prepareCrossFade('CrouchWalk', 'Walk', 0.5);
                },
                'crouchWalk to idle' : () => {
                    Player.backwardAnimCheck('CrouchWalk');
                    Player.animator.prepareCrossFade('CrouchWalk', 'Idle', 0.5);
                },
                'crouchWalk to backward' : () => {
                    Player.backward = true;
                    Player.animator.animation_data['CrouchWalk'].action.timeScale = -1;
                },

                // fallIdle
                'fallIdle to idle' : () => {
                    Player.animator.prepareCrossFade('FallIdle', 'FallToLand', 0.75);
                    Player.animator.prepareCrossFade('FallToLand', 'Idle', 1.0);
                },
                'any to fallIdle' : () => {
                    Player.animator.prepareCrossFade(Player.state, 'FallIdle', 0.25);
                },
            }
        },

        backwardAnimCheck : (anim) =>
        {
            if (Player.backward) {
                Player.backward = false;
                Player.animator.animation_data[anim].action.timeScale = 1;
            }
        },

        walkAnimTo : (next_anim, duration = 0.5) =>
        {
            if (Player.left_strafe) {
                Player.animator.prepareCrossFade('LeftStrafe', next_anim, duration);
                Player.left_strafe = false;
            } else if (Player.right_strafe) {
                Player.animator.prepareCrossFade('RightStrafe', next_anim, duration);
                Player.right_strafe = false;
            } else {
                Player.backwardAnimCheck('Walk');
                Player.animator.prepareCrossFade('Walk', next_anim, duration);
            }
        },

        runAnimTo : (next_anim, duration = 0.5) =>
        {
            if (Player.left_strafe) {
                Player.animator.prepareCrossFade('RunLeftStrafe', next_anim, duration);
                Player.left_strafe = false;
            } else if (Player.right_strafe) {
                Player.animator.prepareCrossFade('RunRightStrafe', next_anim, duration);
                Player.right_strafe = false;
            } else if (Player.backward) {
                Player.backward = false;
                Player.animator.prepareCrossFade('RunBackward', next_anim, duration);
            } else {
                Player.animator.prepareCrossFade('Run', next_anim, duration);
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
                if (!Player.input_handler.orbit_enabled)
                {
                    Player.updateAnimation();
                    camera.getWorldDirection(Player.look_direction);
                    if (!Player.input_handler.orbit_enabled) Player.updateCameraPosition();
                }

                Player.collider.update(Player);

                Player.updateMoveDirection();
                Player.updateVelocity(delta);
                Player.updateRotation();
                Player.updateFlashlight();
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

            switch (Player.state)
            {
                case States.IDLE:
                    if (Player.input_handler.move_mask > 0)
                    {
                        Player.state = States.WALK;
                        Player.transitions['idle to walk']();
                    } else if (Player.crouching)
                    {
                        Player.state = States.CROUCH_IDLE;
                        Player.transitions['idle to crouchIdle']();
                    }
                    break;
                case States.WALK:
                    if (Player.input_handler.move_mask == 0)
                    {
                        Player.state = States.IDLE;
                        Player.transitions['walk to idle']();
                    } else if (Player.running)
                    {
                        Player.state = States.RUN;
                        Player.transitions['walk to run']();
                    } else if (Player.crouching)
                    {
                        Player.state = States.CROUCH_WALK;
                        Player.transitions['walk to crouchWalk']();
                    } else if (Player.input_handler.move_mask == 1 && !Player.left_strafe)
                    {
                        Player.transitions['walk to leftStrafe']();
                    } else if (Player.input_handler.move_mask == 2 && !Player.right_strafe)
                    {
                        Player.transitions['walk to rightStrafe']();
                    } else if ((Player.left_strafe || Player.right_strafe) && Player.input_handler.move_mask > 3)
                    {
                        Player.transitions['strafe to walk']();
                    } else if (!Player.backward && Player.input_handler.move_mask >= 8)
                    {
                        Player.transitions['walk to backward']();
                    } else if (Player.backward && Player.input_handler.move_mask < 8)
                    {
                        Player.backwardAnimCheck('Walk');
                    }

                    break;
                case States.RUN:
                    if (Player.input_handler.move_mask == 0)
                    {
                        Player.state = States.IDLE;
                        Player.transitions['run to idle']();
                    } else if (!Player.running)
                    {
                        Player.state = States.WALK;
                        Player.transitions['run to walk']();
                    }  else if (Player.input_handler.move_mask == 1 && !Player.left_strafe)
                    {
                        Player.transitions['run to leftStrafe']();
                    } else if (Player.input_handler.move_mask == 2 && !Player.right_strafe)
                    {
                        Player.transitions['run to rightStrafe']();
                    } else if ((Player.left_strafe || Player.right_strafe) && Player.input_handler.move_mask > 3)
                    {
                        Player.transitions['strafe to run']();
                    } else if (!Player.backward && Player.input_handler.move_mask >= 8)
                    {
                        Player.transitions['run to backward']();
                    } else if (Player.backward && Player.input_handler.move_mask < 8)
                    {
                        Player.transitions['backward to run']();
                    }

                    break;
                case States.CROUCH_IDLE:
                    if (Player.crouching)
                    {
                        if (Player.input_handler.move_mask > 0)
                        {
                            Player.state = States.CROUCH_WALK;
                            Player.transitions['crouchIdle to crouchWalk']();
                        }
                    } else
                    {
                        if (Player.input_handler.move_mask > 0)
                        {
                            Player.state = States.WALK;
                            Player.transitions['crouchIdle to walk']();
                        } else
                        {
                            Player.state = States.IDLE;
                            Player.transitions['crouchIdle to idle']();
                        }
                    }
                    break;
                case States.CROUCH_WALK:
                    if (Player.crouching)
                    {
                        if (Player.input_handler.move_mask == 0)
                        {
                            Player.state = States.CROUCH_IDLE;
                            Player.transitions['crouchWalk to crouchIdle']();
                        } else if (!Player.backward && Player.input_handler.move_mask >= 8)
                        {
                            Player.transitions['crouchWalk to backward']();
                        }  else if (Player.backward && Player.input_handler.move_mask < 8)
                        {
                            Player.backwardAnimCheck('CrouchWalk');
                        }
                    } else
                    {
                        if (Player.input_handler.move_mask > 0)
                        {
                            Player.state = States.WALK;
                            Player.transitions['crouchWalk to walk']();
                        } else
                        {
                            Player.state = States.IDLE;
                            Player.transitions['crouchWalk to idle']();
                        }
                    }
                    break;
                case States.FALL_IDLE:
                    if (Player.collider.isGrounded(Player))
                    {
                        Player.air_time = null;
                        Player.state = States.IDLE;
                        Player.transitions['fallIdle to idle']();
                    }
                    break;
                }

                if (!(Player.state == States.FALL_IDLE) && !Player.collider.isGrounded(Player))
                {
                    if (Player.air_time == null)
                    {
                        Player.air_time = Player.clock.elapsedTime;
                    }

                    if (Player.clock.elapsedTime - Player.air_time >= Utils.TIME_TO_FALL)
                    {
                        Player.transitions['any to fallIdle']();
                        Player.state = States.FALL_IDLE;
                    }
                }
        },

        updateMoveDirection: () =>
        {
            Player.move_direction.y = Number(Player.input_handler.move_backward) - Number(Player.input_handler.move_forward);
            Player.move_direction.x = Number(Player.input_handler.move_left) - Number(Player.input_handler.move_right);
            Player.move_direction.normalize();
            let theta = Math.atan2(Player.look_direction.x, -Player.look_direction.y);
            Player.move_direction.applyAxisAngle(Utils.Z, theta);
        },

        updateVelocity: (delta) =>
        {
            var z_velocity = Player.rigidbody.getLinearVelocity().z();

            if (Player.running)
            {
                Player.rigidbody.setLinearVelocity(
                    new Physics.ammo.btVector3(
                        Player.move_direction.x * Player.run_speed * delta,
                        Player.move_direction.y * Player.run_speed * delta,
                        z_velocity));
            }
            else
            {
                Player.rigidbody.setLinearVelocity(
                    new Physics.ammo.btVector3(
                        Player.move_direction.x * Player.walk_speed * delta,
                        Player.move_direction.y * Player.walk_speed * delta,
                        z_velocity));
            }
        },

        updateRotation: () =>
        {
            Player.threeObj.rotation.y = Math.atan2(Player.look_direction.x, -Player.look_direction.y);
        },

        updateCameraPosition: () =>
        {
            if (Player.first_person_enabled)
            {
                var offset = new THREE.Vector3(Player.look_direction.x, Player.look_direction.y, 0);
                offset.normalize();
                offset.multiplyScalar(1);
                camera.position.x = Player.threeObj.position.x + offset.x;
                camera.position.y = Player.threeObj.position.y + offset.y;
                camera.position.z = Player.threeObj.position.z + 2;
            }
            else
            {
                var offset = new THREE.Vector3(Player.look_direction.x, Player.look_direction.y);
                offset.normalize();
                offset.multiplyScalar(-2.5);

                var t_xy = Math.abs(Player.look_direction.z);
                if (Player.look_direction.z >= 0)
                {
                    camera.position.x = Player.threeObj.position.x + THREE.MathUtils.lerp(offset.x, offset.x * 0.5, t_xy);
                    camera.position.y = Player.threeObj.position.y + THREE.MathUtils.lerp(offset.y, offset.y * 0.5, t_xy)
                }
                else
                {
                    camera.position.x = Player.threeObj.position.x + THREE.MathUtils.lerp(offset.x, offset.x * 0.05, t_xy);
                    camera.position.y = Player.threeObj.position.y + THREE.MathUtils.lerp(offset.y, offset.y * 0.05, t_xy)
                }
                var t_z = (Player.look_direction.z + 1) / 2;
                camera.position.z = Player.threeObj.position.z + THREE.MathUtils.lerp(4, 0, t_z);

                if (t_z < 0.2)
                {
                    camera.position.z -= THREE.MathUtils.lerp(1.0, 0.1, t_z * 5);
                }
            }

            // naive camera shake, need to slow this down so that it isnt every frame/
            // add to its own class for camera shake according to a rate, min, max
            // if (Player.running && Player.state == States.RUN)
            // {
            //     let max = 0.01;
            //     let min = -0.01;
            //     camera.position.x += Math.random() * (max - min) + min;
            //     camera.position.z += Math.random() * (max - min) + min;
            //     camera.position.y += Math.random() * (max - min) + min;
            // }
        },

        updateFlashlight: () =>
        {
            // Player.flashlight.position.copy(camera.position);
            //
            // Player.flashlight.position.y -= 1;
            // Player.flashlight.position.x += Player.look_direction.x * 1.5;
            // Player.flashlight.position.z += Player.look_direction.z * 1.5;
            //
            // Player.flashlight.target.position.set(Player.flashlight.position.x + Player.look_direction.x,
            //                                     Player.flashlight.position.y + Player.look_direction.y,
            //                                     Player.flashlight.position.z + Player.look_direction.z);
            //
            // Player.flashlight.target.updateMatrixWorld();
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

        toggleJump: () =>
        {
            if (Player.collider.isGrounded(Player) && !Player.crouching)
            {
                Player.transitions['any to fallIdle']();
                Player.state = States.FALL_IDLE;
                var x_vel = Player.rigidbody.getLinearVelocity().x();
                var y_vel = Player.rigidbody.getLinearVelocity().y();
                var z_vel = Utils.PLAYER_JUMP_FORCE;
                Player.rigidbody.setLinearVelocity(new Physics.ammo.btVector3(x_vel, y_vel, z_vel));
            }
        },

        toggleFlashlight: () =>
        {
            Player.flashlight.visible = !Player.flashlight.visible;
        },

        toggleRun: (_value) =>
        {
            Player.running = _value;
        },

        toggleGravity : (index = null) =>
        {
            if (index == null)
            {
                Player.gravity_index = (Player.gravity_index + 1) % 3;
                index = Player.gravity_index;
            }

            switch (index)
            {
                case (0):
                    Physics.physicsWorld.setGravity(new Physics.ammo.btVector3(0, 0, Utils.GRAVITY_ZERO));
                    break;
                case (1):
                    Physics.physicsWorld.setGravity(new Physics.ammo.btVector3(0, 0, Utils.GRAVITY_LOW));
                    break;
                case (2):
                    Physics.physicsWorld.setGravity(new Physics.ammo.btVector3(0, 0, Utils.GRAVITY_NORMAL));
                    break;
            }
        },

        toggleFast : (value) =>
        {
            Player.walk_speed = (value) ? Utils.PLAYER_WALK_SPEED_FAST : Utils.PLAYER_WALK_SPEED;
            Player.run_speed = (value) ? Utils.PLAYER_RUN_SPEED_FAST : Utils.PLAYER_RUN_SPEED;
        },

        toggleZeroVelocity : () =>
        {
            Player.rigidbody.setLinearVelocity(new Physics.ammo.btVector3(0, 0, 0));
        },

        toggleFirstPerson : () =>
        {
            Player.first_person_enabled = !Player.first_person_enabled;
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
        },

    }
    return Player;
});
