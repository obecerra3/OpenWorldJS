'use strict'
define(["three", "gltfLoader", "dracoLoader", "animator", "collider", "ray",
        "physics", "scene", "camera", "utils", "states", "playerInputHandler",
        "container", "eventQ", "time", "texture"],
        (THREE, GLTFLoader, dracoLoader, Animator, Collider, Ray, Physics,
        scene, camera, Utils, States, PlayerInputHandler, container, EventQ,
        Time, texture) => {

    var Player =
    {
        username: "",
        input_handler: PlayerInputHandler,
        // collider: {},
        state: States.IDLE,
        running: false,
        crouching: false,
        flashlight: {},
        model: {},
        threeObj: {},
        animator: {},
        anim_transitions: {},
        look_direction: new THREE.Vector3(),
        move_direction: new THREE.Vector3(),
        rigidbody_offset: new THREE.Vector3(0, 0, 0.83),
        rigidbody: {},
        initialized: false,
        init_pos: new THREE.Vector3(0, 0, 200),
        gravity_index: 0,
        debug_count : 0,
        air_time : null,
        walk_speed : Utils.PLAYER_WALK_SPEED,
        run_speed : Utils.PLAYER_RUN_SPEED,
        first_person_enabled : false,
        left_strafe : false,
        right_strafe : false,
        backward : false,
        previous_y_rotation : 0,
        MAX_Z_VELOCITY : 300,

        //====================================================================
        //====================================================================
        //  Init Methods
        //====================================================================
        //====================================================================

        init: function()
        {
            this.initInput();
            this.initGraphics();
            this.initPhysics();

            EventQ.push(
            {
                verify: () =>
                {
                    return Object.keys(this.threeObj).length > 0
                           && Object.keys(this.animator).length > 0
                           && Object.keys(this.rigidbody).length > 0
                           && Object.keys(this.input_handler).length > 0;
                           // && Object.keys(this.collider).length > 0;
                },
                action: () =>
                {
                    this.initialized = true;
                },
                arguments: [],
            });
        },

        initInput: function()
        {
            this.input_handler.init();
            this.input_handler.toggleJump = this.toggleJump.bind(this);
            this.input_handler.toggleCrouch = this.toggleCrouch.bind(this);
            this.input_handler.toggleFlashlight = this.toggleFlashlight.bind(this);
            this.input_handler.printState = this.printState.bind(this);
            this.input_handler.toggleRun = this.toggleRun.bind(this);
            this.input_handler.toggleGravity = this.toggleGravity.bind(this);
            this.input_handler.toggleFast = this.toggleFast.bind(this);
            this.input_handler.toggleZeroVelocity = this.toggleZeroVelocity.bind(this);
            this.input_handler.toggleFirstPerson = this.toggleFirstPerson.bind(this);
        },

        //Collider is used to check if the this is grounded to decide if we can jump when jump is pressed.
        //The rays are all ground rays pointing downwards from the this.
        //The this"s rigidbody will be a capsule
        initPhysics: function()
        {
            // Collider
            // --------
            // var size_mult = 2.5;
            // var rays = [
            //     Ray(scene, Utils._Z, Utils.this_SIZE * size_mult, true, Utils.X.multiplyScalar(0.5), 0xff00ff),
            //     Ray(scene, Utils._Z, Utils.this_SIZE * size_mult, true, Utils._X.multiplyScalar(0.5), 0xff00ff),
            //     Ray(scene, Utils._Z, Utils.this_SIZE * size_mult, true, Utils.Y.multiplyScalar(0.5), 0xff00ff),
            //     Ray(scene, Utils._Z, Utils.this_SIZE * size_mult, true, Utils._Y.multiplyScalar(0.5), 0xff00ff)
            // ];
            //
            // this.collider = Collider(rays, 4);
            //
            // this.input_handler.toggleShowRays = this.collider.toggleShowRays.bind(this.collider);

            // Rigidbody
            // ---------
            EventQ.push(
            {
                verify: () =>
                {
                    return Object.keys(this.threeObj).length > 0;
                },
                action: () =>
                {
                    var capsule_shape = new Physics.ammo.btCapsuleShape(
                                                    Utils.PLAYER_CAPSULE_RADIUS,
                                                    Utils.PLAYER_SIZE);
                    var rigidbody = Physics.createRigidbody(
                        this.threeObj, capsule_shape, Utils.PLAYER_MASS,
                        this.threeObj.position, this.threeObj.quaternion,
                        this.rigidbody_offset, true);

                    rigidbody.setAngularFactor(new Physics.ammo.btVector3(0.0, 0.0, 0.0));
                    this.rigidbody = rigidbody;
                },
                arguments: []
            });
        },

        //init graphical components of the Player/ do file io for the gltf file
        initGraphics: function()
        {
            //flashlight
            // this.flashlight = new THREE.SpotLight(0xffffff, 1, 300, 0.5, 0.1, 10.0);
            // this.flashlight.castShadow = true;
            // this.flashlight.visible = false;
            // scene.add(this.flashlight);

            // ThreeObject from GLTF Loader
            var loader = new THREE.GLTFLoader();
            var dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath("../lib/draco/");
            loader.setDRACOLoader(dracoLoader);
            loader.load("/js/models/michelle.glb", (gltf) =>
            {
                this.model = gltf;
                this.threeObj = gltf.scene;
                this.threeObj.rotateX(Math.PI / 2);
                this.threeObj.position.copy(this.init_pos);
                this.threeObj.userData = { "name" : "Player" };
                this.character = this.threeObj.children[0];
                this.bone = this.character.children[0];
                this.mesh = this.character.children[1];

                this.threeObj.traverse((obj) =>
                {
                    // fixes boundingSphere for frustum culling thanks @github.com/gogiii
                    if (obj.isSkinnedMesh)
                    {
                        // obj.castShadow = true;
                        // obj.receiveShadow = true;
                        // obj.geometry.computeBoundingSphere();
                        // var sphere = new THREE.Sphere();
                        // sphere.copy(obj.geometry.boundingSphere);
                        // sphere.applyMatrix4(obj.skeleton.bones[0].matrix);
                        // obj.geometry.boundingSphere = sphere;

                        obj.frustumCulled = false;
                    }
                });

                this.initAnimations(gltf.animations);
                scene.add(this.threeObj);

            }, undefined, (error) =>
            {
                console.error("Player.js: gltf loader error: ", error);
            });
        },

        initAnimations: function(animations)
        {
            var mixer = new THREE.AnimationMixer(this.threeObj);
            var animation_data = {};
            var current_data = {};

            animations.forEach((clip) =>
            {
                current_data =
                {
                    "action": mixer.clipAction(clip),
                    "weight": Utils.DEFAULT_WEIGHT
                };
                current_data.action.enabled = false;

                animation_data[clip.name] = current_data;
            });

            this.animator = Animator(mixer, animation_data);

            this.anim_transitions =
            {
                // ======================
                //          IDLE
                // ======================
                "idle to walk" : () =>
                {
                    this.idleTurnCheck("Walk", 0.5);
                },
                "idle to crouchIdle" : () =>
                {
                    this.idleTurnCheck("CrouchIdle", 0.25);
                },
                "idle to leftTurn" : () =>
                {
                    if (!this.animator.animation_data["LeftTurn"].action.enabled)
                    {
                        this.animator.prepareCrossFade("Idle", "LeftTurn", 0.5);
                        this.animator.prepareCrossFade("LeftTurn", "Idle", 1.0);
                    }
                },
                "idle to rightTurn" : () =>
                {
                    if (!this.animator.animation_data["RightTurn"].action.enabled)
                    {
                        this.animator.prepareCrossFade("Idle", "RightTurn", 0.5);
                        this.animator.prepareCrossFade("RightTurn", "Idle", 1.0);
                    }
                },

                // ======================
                //          WALK
                // ======================
                "walk to idle" : () =>
                {
                    this.walkAnimTo("Idle");
                },
                "walk to run" : () =>
                {
                    this.walkAnimTo("Run");
                },
                "walk to crouchWalk" : () =>
                {
                    this.walkAnimTo("CrouchWalk");
                },
                "walk to leftStrafe" : () =>
                {
                    this.left_strafe = true;
                    if (this.right_strafe)
                    {
                        this.right_strafe = false;
                        this.animator.prepareCrossFade("RightStrafe", "LeftStrafe", 0.5);
                    }
                    else
                    {
                        this.backwardAnimCheck("Walk");
                        this.animator.prepareCrossFade("Walk", "LeftStrafe", 0.5);
                    }
                },
                "walk to rightStrafe" : () =>
                {
                    this.right_strafe = true;
                    if (this.left_strafe)
                    {
                        this.left_strafe = false;
                        this.animator.prepareCrossFade("LeftStrafe", "RightStrafe", 0.5);
                    }
                    else
                    {
                        this.backwardAnimCheck("Walk");
                        this.animator.prepareCrossFade("Walk", "RightStrafe", 0.5);
                    }
                },
                "strafe to walk" : () =>
                {
                    if (this.left_strafe)
                    {
                        this.left_strafe = false;
                        this.animator.prepareCrossFade("LeftStrafe", "Walk", 0.5);
                    }
                    else
                    {
                        this.right_strafe = false;
                        this.animator.prepareCrossFade("RightStrafe", "Walk", 0.5);
                    }
                },
                "walk to backward" : () =>
                {
                    this.backward = true;
                    this.animator.animation_data["Walk"].action.timeScale = -1;
                },

                // ======================
                //          RUN
                // ======================
                "run to idle" : () =>
                {
                    this.runAnimTo("Idle", 0.25);
                },
                "run to walk" : () =>
                {
                    this.runAnimTo("Walk", 0.25);
                },
                "run to leftStrafe" : () =>
                {
                    this.left_strafe = true;
                    if (this.right_strafe)
                    {
                        this.right_strafe = false;
                        this.animator.prepareCrossFade("RunRightStrafe", "RunLeftStrafe", 0.5);
                    }
                    else if (this.backward)
                    {
                        this.backward = false;
                        this.animator.prepareCrossFade("RunBackward", "RunLeftStrafe", 0.5);
                    }
                    else
                    {
                        this.backwardAnimCheck("Run");
                        this.animator.prepareCrossFade("Run", "RunLeftStrafe", 0.5);
                    }
                },
                "run to rightStrafe" : () =>
                {
                    this.right_strafe = true;
                    if (this.left_strafe)
                    {
                        this.left_strafe = false;
                        this.animator.prepareCrossFade("RunLeftStrafe", "RunRightStrafe", 0.5);
                    }
                    else if (this.backward)
                    {
                        this.backward = false;
                        this.animator.prepareCrossFade("RunBackward", "RunRightStrafe", 0.5);
                    }
                    else
                    {
                        this.animator.prepareCrossFade("Run", "RunRightStrafe", 0.5);
                    }
                },
                "strafe to run" : () =>
                {
                    if (this.left_strafe)
                    {
                        this.left_strafe = false;
                        this.animator.prepareCrossFade("RunLeftStrafe", "Run", 0.5);
                    }
                    else
                    {
                        this.right_strafe = false;
                        this.animator.prepareCrossFade("RunRightStrafe", "Run", 0.5);
                    }
                },
                "run to backward" : () =>
                {
                    this.backward = true;
                    this.animator.prepareCrossFade("Run", "RunBackward", 0.5);
                },
                "backward to run" : () =>
                {
                    this.backward = false;
                    this.animator.prepareCrossFade("RunBackward", "Run", 0.5);
                },

                // ======================
                //       CROUCH IDLE
                // ======================
                "crouchIdle to idle" : () =>
                {
                    this.animator.prepareCrossFade("CrouchIdle", "Idle", 0.25);
                },
                "crouchIdle to crouchWalk" : () =>
                {
                    this.animator.prepareCrossFade("CrouchIdle", "CrouchWalk", 0.5);
                },
                "crouchIdle to walk" : () =>
                {
                    this.animator.prepareCrossFade("CrouchIdle", "Walk", 0.5);
                },

                // ======================
                //       CROUCH WALK
                // ======================
                "crouchWalk to crouchIdle" : () =>
                {
                    this.backwardAnimCheck("CrouchWalk");
                    this.animator.prepareCrossFade("CrouchWalk", "CrouchIdle", 0.5);
                },
                "crouchWalk to walk" : () =>
                {
                    this.backwardAnimCheck("CrouchWalk");
                    this.animator.prepareCrossFade("CrouchWalk", "Walk", 0.5);
                },
                "crouchWalk to idle" : () =>
                {
                    this.backwardAnimCheck("CrouchWalk");
                    this.animator.prepareCrossFade("CrouchWalk", "Idle", 0.5);
                },
                "crouchWalk to backward" : () =>
                {
                    this.backward = true;
                    this.animator.animation_data["CrouchWalk"].action.timeScale = -1;
                },

                // ======================
                //       FALL IDLE
                // ======================
                "fallIdle to idle" : () =>
                {
                    this.animator.prepareCrossFade("FallIdle", "FallToLand", 0.75);
                    this.animator.prepareCrossFade("FallToLand", "Idle", 1.0);
                },
                "any to fallIdle" : () =>
                {
                    switch (this.state)
                    {
                        case States.IDLE:
                            this.idleTurnCheck("FallIdle", 0.25);
                            break;
                        case States.WALK:
                            this.walkAnimTo("FallIdle", 0.25);
                            break;
                        case States.RUN:
                            this.runAnimTo("FallIdle", 0.25);
                            break;
                        default:
                            this.animator.prepareCrossFade(this.state, "FallIdle", 0.25);
                            break;
                    }
                },
            }
        },

        idleTurnCheck : function(anim, duration = 0.5)
        {
            if (this.animator.animation_data["LeftTurn"].action.enabled)
            {
                this.animator.prepareCrossFade("LeftTurn", "Idle", 1.0);
            }
            else if (this.animator.animation_data["RightTurn"].action.enabled)
            {
                this.animator.prepareCrossFade("RightTurn", "Idle", 1.0);
            }
            this.animator.prepareCrossFade("Idle", anim, duration);
        },

        backwardAnimCheck : function(anim)
        {
            if (this.backward)
            {
                this.backward = false;
                this.animator.animation_data[anim].action.timeScale = 1;
            }
        },

        walkAnimTo : function(next_anim, duration = 0.5)
        {
            if (this.left_strafe)
            {
                this.animator.prepareCrossFade("LeftStrafe", next_anim, duration);
                this.left_strafe = false;
            } else if (this.right_strafe)
            {
                this.animator.prepareCrossFade("RightStrafe", next_anim, duration);
                this.right_strafe = false;
            } else
            {
                this.backwardAnimCheck("Walk");
                this.animator.prepareCrossFade("Walk", next_anim, duration);
            }
        },

        runAnimTo : function(next_anim, duration = 0.5)
        {
            if (this.left_strafe)
            {
                this.animator.prepareCrossFade("RunLeftStrafe", next_anim, duration);
                this.left_strafe = false;
            } else if (this.right_strafe)
            {
                this.animator.prepareCrossFade("RunRightStrafe", next_anim, duration);
                this.right_strafe = false;
            } else if (this.backward)
            {
                this.backward = false;
                this.animator.prepareCrossFade("RunBackward", next_anim, duration);
            } else
            {
                this.animator.prepareCrossFade("Run", next_anim, duration);
            }
        },


        //====================================================================
        //====================================================================
        //  Update Methods
        //====================================================================
        //====================================================================

        update: function(delta)
        {
            if (this.initialized)
            {
                if (!this.input_handler.orbit_enabled)
                {
                    camera.getWorldDirection(this.look_direction);
                    this.updateRotation();
                    this.updateAnimation();
                    if (!this.input_handler.orbit_enabled) this.updateCameraPosition();
                }

                // this.collider.update(this);

                this.updateMoveDirection();
                this.updateVelocity(delta);
                this.updateFlashlight();
            };
        },

        // This is going to change to use a thisState Class which will contain different
        // definitions for this states and handle animation switching/ state switching there
        // (hierarchical and concurrent FSMs)
        // https://gameprogrammingpatterns.com/state.html
        updateAnimation: function()
        {
            this.animator.update();

            switch (this.state)
            {
                case States.IDLE:
                    if (this.input_handler.move_mask > 0)
                    {
                        this.state = States.WALK;
                        this.anim_transitions["idle to walk"]();
                    } else if (this.crouching)
                    {
                        this.state = States.CROUCH_IDLE;
                        this.anim_transitions["idle to crouchIdle"]();
                    }

                    var y_rotation = this.threeObj.rotation.y + Utils.PI;
                    if (Math.abs(y_rotation - this.previous_y_rotation) >= Utils.PI8)
                    {
                        var c = y_rotation;
                        var p = this.previous_y_rotation;
                        if (c > p)
                        {
                            if (c >= Utils.PI * 1.5 && p < Utils.PI2)
                            {
                                this.anim_transitions["idle to rightTurn"]();
                            } else
                            {
                                this.anim_transitions["idle to leftTurn"]();
                            }
                        } else
                        {
                            if (c < Utils.PI2 && p >= Utils.PI * 1.5)
                            {
                                this.anim_transitions["idle to leftTurn"]();
                            } else
                            {
                                this.anim_transitions["idle to rightTurn"]();
                            }
                        }

                        this.previous_y_rotation = y_rotation;
                    }

                    break;
                case States.WALK:
                    if (this.input_handler.move_mask == 0)
                    {
                        this.state = States.IDLE;
                        this.anim_transitions["walk to idle"]();
                        this.previous_y_rotation = this.threeObj.rotation.y + Utils.PI;
                    } else if (this.running)
                    {
                        this.state = States.RUN;
                        this.anim_transitions["walk to run"]();
                    } else if (this.crouching)
                    {
                        this.state = States.CROUCH_WALK;
                        this.anim_transitions["walk to crouchWalk"]();
                    } else if (this.input_handler.move_mask == 1 && !this.left_strafe)
                    {
                        this.anim_transitions["walk to leftStrafe"]();
                    } else if (this.input_handler.move_mask == 2 && !this.right_strafe)
                    {
                        this.anim_transitions["walk to rightStrafe"]();
                    } else if ((this.left_strafe || this.right_strafe) && this.input_handler.move_mask > 3)
                    {
                        this.anim_transitions["strafe to walk"]();
                    } else if (!this.backward && this.input_handler.move_mask >= 8)
                    {
                        this.anim_transitions["walk to backward"]();
                    } else if (this.backward && this.input_handler.move_mask < 8)
                    {
                        this.backwardAnimCheck("Walk");
                    }

                    break;
                case States.RUN:
                    if (this.input_handler.move_mask == 0)
                    {
                        this.previous_y_rotation = this.threeObj.rotation.y + Utils.PI;
                        this.state = States.IDLE;
                        this.anim_transitions["run to idle"]();
                    } else if (!this.running)
                    {
                        this.state = States.WALK;
                        this.anim_transitions["run to walk"]();
                    }  else if (this.input_handler.move_mask == 1 && !this.left_strafe)
                    {
                        this.anim_transitions["run to leftStrafe"]();
                    } else if (this.input_handler.move_mask == 2 && !this.right_strafe)
                    {
                        this.anim_transitions["run to rightStrafe"]();
                    } else if ((this.left_strafe || this.right_strafe) && this.input_handler.move_mask > 3)
                    {
                        this.anim_transitions["strafe to run"]();
                    } else if (!this.backward && this.input_handler.move_mask >= 8)
                    {
                        this.anim_transitions["run to backward"]();
                    } else if (this.backward && this.input_handler.move_mask < 8)
                    {
                        this.anim_transitions["backward to run"]();
                    }

                    break;
                case States.CROUCH_IDLE:
                    if (this.crouching)
                    {
                        if (this.input_handler.move_mask > 0)
                        {
                            this.state = States.CROUCH_WALK;
                            this.anim_transitions["crouchIdle to crouchWalk"]();
                        }
                    } else
                    {
                        if (this.input_handler.move_mask > 0)
                        {
                            this.state = States.WALK;
                            this.anim_transitions["crouchIdle to walk"]();
                        } else
                        {
                            this.previous_y_rotation = this.threeObj.rotation.y + Utils.PI;
                            this.state = States.IDLE;
                            this.anim_transitions["crouchIdle to idle"]();
                        }
                    }
                    break;
                case States.CROUCH_WALK:
                    if (this.crouching)
                    {
                        if (this.input_handler.move_mask == 0)
                        {
                            this.state = States.CROUCH_IDLE;
                            this.anim_transitions["crouchWalk to crouchIdle"]();
                        } else if (!this.backward && this.input_handler.move_mask >= 8)
                        {
                            this.anim_transitions["crouchWalk to backward"]();
                        }  else if (this.backward && this.input_handler.move_mask < 8)
                        {
                            this.backwardAnimCheck("CrouchWalk");
                        }
                    } else
                    {
                        if (this.input_handler.move_mask > 0)
                        {
                            this.state = States.WALK;
                            this.anim_transitions["crouchWalk to walk"]();
                        } else
                        {
                            this.previous_y_rotation = this.threeObj.rotation.y + Utils.PI;
                            this.state = States.IDLE;
                            this.anim_transitions["crouchWalk to idle"]();
                        }
                    }
                    break;
                case States.FALL_IDLE:
                    if (this.isGrounded())
                    {
                        this.air_time = null;
                        this.previous_y_rotation = this.threeObj.rotation.y + Utils.PI;
                        this.state = States.IDLE;
                        this.anim_transitions["fallIdle to idle"]();
                    }
                    break;
                }

                if (!(this.state == States.FALL_IDLE) && !this.isGrounded())
                {
                    if (this.air_time == null)
                    {
                        this.air_time = Time.clock.elapsedTime;
                    }

                    if (Time.clock.elapsedTime - this.air_time >= Utils.TIME_TO_FALL)
                    {
                        this.anim_transitions["any to fallIdle"]();
                        this.state = States.FALL_IDLE;
                    }
                }
        },

        updateMoveDirection: function()
        {
            this.move_direction.y = Number(this.input_handler.move_backward) - Number(this.input_handler.move_forward);
            this.move_direction.x = Number(this.input_handler.move_left) - Number(this.input_handler.move_right);
            this.move_direction.normalize();
            let theta = Math.atan2(this.look_direction.x, -this.look_direction.y);
            this.move_direction.applyAxisAngle(Utils.Z, theta);
        },

        updateVelocity: function(delta)
        {
            var z_velocity = this.rigidbody.getLinearVelocity().z();

            if (Math.abs(z_velocity) >= this.MAX_Z_VELOCITY)
            {
                z_velocity *= 0.75;
            }

            if (this.running)
            {
                var new_velocity =
                this.rigidbody.setLinearVelocity(
                    new Physics.ammo.btVector3(
                        this.move_direction.x * this.run_speed * delta,
                        this.move_direction.y * this.run_speed * delta,
                        z_velocity));
            } else
            {
                this.rigidbody.setLinearVelocity(
                    new Physics.ammo.btVector3(
                        this.move_direction.x * this.walk_speed * delta,
                        this.move_direction.y * this.walk_speed * delta,
                        z_velocity));
            }
        },

        updateRotation: function()
        {
            this.threeObj.rotation.y = Math.atan2(this.look_direction.x, -this.look_direction.y);
        },

        updateCameraPosition: function()
        {
            if (this.first_person_enabled)
            {
                var offset = new THREE.Vector3(this.look_direction.x, this.look_direction.y, 0);
                offset.normalize();
                offset.multiplyScalar(1);
                camera.position.x = this.threeObj.position.x + offset.x;
                camera.position.y = this.threeObj.position.y + offset.y;
                camera.position.z = this.threeObj.position.z + 2;
            } else
            {
                var offset = new THREE.Vector3(this.look_direction.x, this.look_direction.y);
                offset.normalize();
                offset.multiplyScalar(-2.5);

                var t_xy = Math.abs(this.look_direction.z);
                if (this.look_direction.z >= 0)
                {
                    camera.position.x = this.threeObj.position.x + THREE.MathUtils.lerp(offset.x, offset.x * 0.5, t_xy);
                    camera.position.y = this.threeObj.position.y + THREE.MathUtils.lerp(offset.y, offset.y * 0.5, t_xy)
                } else
                {
                    camera.position.x = this.threeObj.position.x + THREE.MathUtils.lerp(offset.x, offset.x * 0.05, t_xy);
                    camera.position.y = this.threeObj.position.y + THREE.MathUtils.lerp(offset.y, offset.y * 0.05, t_xy)
                }
                var t_z = (this.look_direction.z + 1) / 2;
                camera.position.z = this.threeObj.position.z + THREE.MathUtils.lerp(4, 0, t_z);

                if (t_z < 0.2)
                {
                    camera.position.z -= THREE.MathUtils.lerp(1.0, 0.1, t_z * 5);
                }
            }

            // naive camera shake, need to slow this down so that it isnt every frame/
            // add to its own class for camera shake according to a rate, min, max
            // if (this.running && this.state == States.RUN)
            // {
            //     let max = 0.01;
            //     let min = -0.01;
            //     camera.position.x += Math.random() * (max - min) + min;
            //     camera.position.z += Math.random() * (max - min) + min;
            //     camera.position.y += Math.random() * (max - min) + min;
            // }
        },

        updateFlashlight: function()
        {
            // this.flashlight.position.copy(camera.position);
            //
            // this.flashlight.position.y -= 1;
            // this.flashlight.position.x += this.look_direction.x * 1.5;
            // this.flashlight.position.z += this.look_direction.z * 1.5;
            //
            // this.flashlight.target.position.set(this.flashlight.position.x + this.look_direction.x,
            //                                     this.flashlight.position.y + this.look_direction.y,
            //                                     this.flashlight.position.z + this.look_direction.z);
            //
            // this.flashlight.target.updateMatrixWorld();
        },

        //====================================================================
        //====================================================================
        //  Input Handler Method Callbacks
        //====================================================================
        //====================================================================

        toggleCrouch: function()
        {
            this.crouching = !this.crouching;
        },

        toggleJump: function()
        {
            if (this.isGrounded() && !this.crouching)
            {
                this.anim_transitions["any to fallIdle"]();
                this.state = States.FALL_IDLE;
                var x_vel = this.rigidbody.getLinearVelocity().x();
                var y_vel = this.rigidbody.getLinearVelocity().y();
                var z_vel = Utils.PLAYER_JUMP_FORCE;
                this.rigidbody.setLinearVelocity(new Physics.ammo.btVector3(x_vel, y_vel, z_vel));
            }
        },

        toggleFlashlight: function()
        {
            this.flashlight.visible = !this.flashlight.visible;
        },

        toggleRun: function(value)
        {
            this.running = value;
        },

        toggleGravity : function(index = null)
        {
            if (index == null)
            {
                this.gravity_index = (this.gravity_index + 1) % 3;
                index = this.gravity_index;
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

        toggleFast : function(value)
        {
            this.walk_speed = (value) ? Utils.PLAYER_WALK_SPEED_FAST : Utils.PLAYER_WALK_SPEED;
            this.run_speed = (value) ? Utils.PLAYER_RUN_SPEED_FAST : Utils.PLAYER_RUN_SPEED;
        },

        toggleZeroVelocity : function()
        {
            this.rigidbody.setLinearVelocity(new Physics.ammo.btVector3(0, 0, 0));
        },

        toggleFirstPerson : function()
        {
            this.first_person_enabled = !this.first_person_enabled;
        },

        //====================================================================
        //====================================================================
        //  Util Methods
        //====================================================================
        //====================================================================

        printState: function()
        {
            console.log(this.threeObj.position);
            console.log(this.isGrounded());
        },

    }
    return Player;
});
