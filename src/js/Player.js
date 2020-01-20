let GLTFLoader = require('../lib/GLTFLoader.js');
let Animator = require('./Animator.js');
let Collider = require('./Collider.js');
let Ray = require('./Ray.js');

class Player {
    constructor(worldState, username, position, controlState = null, physics = null, velocity = new THREE.Vector3(), lookDirection= new THREE.Vector3()) {

        this.worldState = worldState;
        //more bad coupling lol
        this.worldState.player = this;
        Ammo = worldState.Ammo;

        this.controlState = controlState;

        if (this.controlState) {
            this.controlState.toggleJump = this.toggleJump.bind(this);
            this.controlState.toggleCrouch = this.toggleCrouch.bind(this);
            this.controlState.toggleFlashlight = this.toggleFlashlight.bind(this);
            this.controlState.printState = this.printState.bind(this);
            this.controlState.toggleFlight = this.toggleFlight.bind(this);
            this.controlState.toggleRun = this.toggleRun.bind(this);
        }

        let rays = [
            new Ray(this.worldState.scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils.X.multiplyScalar(1.5), 0xff00ff),
            new Ray(this.worldState.scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils._X.multiplyScalar(1.5), 0xff00ff),
            new Ray(this.worldState.scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils.Z.multiplyScalar(1.5), 0xff00ff),
            new Ray(this.worldState.scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils._Z.multiplyScalar(1.5), 0xff00ff)
        ]

        this.collider = new Collider(rays, 4);
        this.collider.toggleShowRays(true);
        this.collider.addMesh("floor", this.worldState.floor);

        this.physics = physics;

        this.username = username;
        this.lookDirection = lookDirection;
        this.prevPosition = new THREE.Vector3();
        this.moveDirection = new THREE.Vector3();

        this.centerOffset = new THREE.Vector3(0, 5, 0);

        this.flightEnabled = false;
        this.running = false;

        this.states = {
            IDLE: "Idle",
            DEAD: "Dead",
            WALK: "Walk",
            RUN: "Run",
            JUMP: "Jump",
            FALL_IDLE: "FallIdle",
            CROUCH_IDLE: "CrouchIdle",
            CROUCH_WALK: "CrouchWalk",
            SLIDE: "Slide"
        };

        this.state = this.states.IDLE;

        this.flashlight = new THREE.SpotLight(0xffffff, 1, 300, 0.5, 0.1, 10.0);
        this.flashlight.castShadow = true;
        this.flashlight.visible = false;
        this.worldState.scene.add(this.flashlight);

        this.isCrouched = false;

        let loader = new THREE.GLTFLoader();
        let dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('../lib/draco/');
        loader.setDRACOLoader(dracoLoader);
        loader.load('./models/fpsCharacter.glb', (gltf) => {
            this.model = gltf;
            this.body = gltf.scene;

            this.body.traverse(function (object) {
                object.castShadow = true;
                object.receiveShadow = true;

                //need to fix the bounding sphere of the model's geometry in order to enable frustum culling
                object.frustumCulled = false;
            });
            console.log(gltf.animations);
            this.setupAnimations(new THREE.AnimationMixer(this.body), gltf.animations);

            this.body.scale.set(6, 6, 6);
            this.worldState.scene.add(this.body);
            this.initPlayerPhysics();

        }, undefined, (error) =>  {
            console.error('gltf loader error: ', error);
        });
    }

    initPlayerPhysics() {
        let colShape = new Ammo.btCapsuleShape(2, 6.5);
        let body = this.physics.createRigidBody(this.body, colShape, Utils.PLAYER_MASS, this.body.position, this.body.quaternion, this.centerOffset);
        body.setAngularFactor(new Ammo.btVector3(0.0, 0.0, 0.0));
        this.physicsBody = body;
    }

    //main update loop

    update(delta) {
        this.updateAnimation();
        if (this.controlState) this.controlState.controls.getDirection(this.lookDirection);
        if (this.body) this.collider.update(this);

        this.updateMoveDirection(); //must be called before updateVelocity()
        this.updateVelocity(delta);
        this.updateRotation(delta);
        this.updateFlashLight();

        if (!this.controlState.debugMode) this.updateCameraPosition();

    }

    updateAnimation() {
        if (this.animator) this.animator.animate();
        if (!this.controlState) return;
        switch (this.state) {
            case this.states.IDLE:
                if (this.controlState.moveForward || this.controlState.moveLeft || this.controlState.moveRight || this.controlState.moveBackward) {
                    this.state = this.states.WALK;
                    this.transitions['idle to walk']();
                }

                if (this.isCrouched) {
                    this.state = this.states.CROUCH_IDLE;
                    this.transitions['idle to crouchIdle']();
                }

                break;
            case this.states.WALK:
                if (!this.controlState.moveForward && !this.controlState.moveLeft && !this.controlState.moveRight && !this.controlState.moveBackward) {
                    this.state = this.states.IDLE;
                    this.transitions['walk to idle']();
                } else if (this.running) {
                    this.state = this.states.RUN;
                    this.transitions['walk to run']();
                } else if (this.isCrouched) {
                    this.state = this.states.CROUCH_WALK;
                    this.transitions['walk to crouchWalk']();
                }
                break;
            case this.states.RUN:
                if (!this.controlState.moveForward && !this.controlState.moveLeft && !this.controlState.moveRight && !this.controlState.moveBackward) {
                    this.state = this.states.IDLE;
                    this.transitions['run to idle']();
                }
                if (!this.running) {
                    this.state = this.states.WALK;
                    this.transitions['run to walk']();
                }
                break;
            case this.states.CROUCH_IDLE:
                if (this.isCrouched) {
                    if (this.controlState.moveForward || this.controlState.moveLeft || this.controlState.moveRight || this.controlState.moveBackward) {
                        this.state = this.states.CROUCH_WALK;
                        this.transitions['crouchIdle to crouchWalk']();
                    }
                } else {
                    if (this.controlState.moveForward || this.controlState.moveLeft || this.controlState.moveRight || this.controlState.moveBackward) {
                        this.state = this.states.WALK;
                        this.transitions['crouchIdle to walk']();
                    } else {
                        this.state = this.states.IDLE;
                        this.transitions['crouchIdle to idle']();
                    }
                }
                break;
            case this.states.CROUCH_WALK:
                if (this.isCrouched) {
                    if (!this.controlState.moveForward && !this.controlState.moveLeft && !this.controlState.moveRight && !this.controlState.moveBackward) {
                        this.state = this.states.CROUCH_IDLE;
                        this.transitions['crouchWalk to crouchIdle']();
                    }
                } else {
                    if (this.controlState.moveForward || this.controlState.moveLeft || this.controlState.moveRight || this.controlState.moveBackward) {
                        this.state = this.states.WALK;
                        this.transitions['crouchWalk to walk']();
                    } else {
                        this.state = this.states.IDLE;
                        this.transitions['crouchWalk to idle']();
                    }
                }
                break;
            case this.states.FALL_IDLE:
                if (this.collider.isGrounded(this)) {
                    this.state = this.states.IDLE;
                    this.transitions['fallIdle to idle']();
                }
                break;
            }

            if (this.jumpPressed) {
                // this.state = this.states.FALL_IDLE;
                this.transitions['any to jumpCharging']();
                this.jumpPressed = false;
            }
    }

    updateMoveDirection() {
        this.moveDirection.z = Number(this.controlState.moveForward) - Number(this.controlState.moveBackward);
        this.moveDirection.x = Number(this.controlState.moveLeft) - Number(this.controlState.moveRight);
        this.moveDirection.normalize();
        let theta = 0;

        if (this.lookDirection.z > 0) {
            theta = Math.atan(this.lookDirection.x / this.lookDirection.z);
        } else if (this.lookDirection.x > 0) {
            theta = Math.PI/2 + Math.atan(-this.lookDirection.z/ this.lookDirection.x);
        } else {
            if (this.lookDirection.x == 0) {
                theta = Math.PI;
            } else {
                theta = -Math.PI/2 - Math.atan(-this.lookDirection.z/ -this.lookDirection.x);
            }
        }
        this.moveDirection.applyAxisAngle(Utils.Y, theta);
    }

    updateVelocity(delta) {
        if (this.physicsBody) {
            let yVelocity = this.physicsBody.getLinearVelocity().y();
            // if (yVelocity)
            if (this.running) {
                this.physicsBody.setLinearVelocity(new Ammo.btVector3(this.moveDirection.x * Utils.PLAYER_RUNNING_SPEED * delta, yVelocity, this.moveDirection.z * Utils.PLAYER_RUNNING_SPEED * delta));
            } else {
                this.physicsBody.setLinearVelocity(new Ammo.btVector3(this.moveDirection.x * Utils.PLAYER_WALKING_SPEED * delta, yVelocity, this.moveDirection.z * Utils.PLAYER_WALKING_SPEED * delta));
            }
        }
    }

    updateRotation() {
        if (this.body && this.lookDirection.y > -0.97) {
            this.body.rotation.y = Math.atan2(this.lookDirection.x, this.lookDirection.z);
        }
    }

    updateCameraPosition() {
        if (this.body) {
            if (this.lookDirection.y > -0.97) {
                let offset = new THREE.Vector3(this.lookDirection.x, 0, this.lookDirection.z); //used to be * 1.75
                offset.normalize();
                offset.multiplyScalar(-15); //2 for fps -10 for 3rd person
                this.worldState.camera.position.x = this.body.position.x + offset.x;
                this.worldState.camera.position.z = this.body.position.z + offset.z;
            }
            this.worldState.camera.position.y = this.body.position.y + 10;

            if (this.running && this.state == this.states.RUN) {
                let max = 0.07;
                let min = -0.07;
                this.worldState.camera.position.x += Math.random() * (max - min) + min;
                this.worldState.camera.position.z += Math.random() * (max - min) + min;
                this.worldState.camera.position.y += Math.random() * (max - min) + min;
            }
        }
    }

    updateFlashLight() {
        this.flashlight.position.copy(this.worldState.camera.position);

        this.flashlight.position.y -= 1;
        this.flashlight.position.x += this.lookDirection.x * 1.5;
        this.flashlight.position.z += this.lookDirection.z * 1.5;

        this.flashlight.target.position.set(this.flashlight.position.x + this.lookDirection.x,
                                            this.flashlight.position.y + this.lookDirection.y,
                                            this.flashlight.position.z + this.lookDirection.z);

        this.flashlight.target.updateMatrixWorld();
    }

    //ControlState Callbacks

    toggleCrouch() {
        this.isCrouched= !this.isCrouched;
    }

    toggleJump(timePressed) {
        if (timePressed == 0) {
            this.jumpPressed = true;
            return;
        }

        timePressed = timePressed % 5;
        let yVelocity = 300 + (timePressed * 50);
        if ((this.collider.isGrounded(this) && !this.isCrouched) || this.flightEnabled) {
            this.physicsBody.setLinearVelocity(new Ammo.btVector3(this.physicsBody.getLinearVelocity().x(), yVelocity, this.physicsBody.getLinearVelocity().z()));
            this.transitions['crouchIdle to fallIdle']();
            this.state = this.states.FALL_IDLE;
        }

    }

    toggleFlight() {
        this.flightEnabled = !this.flightEnabled;
    }

    toggleFlashlight() {
        this.flashlight.visible = !this.flashlight.visible;
    }

    toggleRun(value) {
        this.running = value;
    }

    setupAnimations(mixer, animations) {
        let animationData = {};

        animations.forEach((clip) => {
            animationData[clip.name] = {
                "action": mixer.clipAction(clip),
                "duration": clip.duration,
                "weight": Utils.DEFAULT_WEIGHT
            };
        });

        this.animator = new Animator(mixer, animationData);

        this.transitions = {
            "idle to walk" : () => {
                this.animator.prepareCrossFade('Idle', 'Walk', 0.5);
            },
            "walk to idle" : () => {
                this.animator.prepareCrossFade('Walk', 'Idle', 0.5);
            },
            "run to walk" : () => {
                this.animator.prepareCrossFade('Run', 'Walk', 0.25);
            },
            "walk to run" : () => {
                this.animator.prepareCrossFade('Walk', 'Run', 0.5);
            },
            "run to idle" : () => {
                this.animator.prepareCrossFade('Run', 'Idle', 0.1);
            },
            "idle to crouchIdle" : () => {
                this.animator.prepareCrossFade('Idle', 'CrouchIdle', 0.25);
            },
            "walk to crouchWalk" : () => {
                this.animator.prepareCrossFade('Walk', 'CrouchWalk', 0.5);
            },
            "run to slide" : () => {
                this.animator.prepareCrossFade('Run', 'Slide', 0.5);
            },
            "crouchIdle to idle" : () => {
                this.animator.prepareCrossFade('CrouchIdle', 'Idle', 0.25, 0.25);
            },
            "crouchIdle to crouchWalk" : () => {
                this.animator.prepareCrossFade('CrouchIdle', 'CrouchWalk', 0.5);
            },
            "crouchWalk to crouchIdle" : () => {
                this.animator.prepareCrossFade('CrouchWalk', 'CrouchIdle', 0.5);
            },
            "crouchWalk to walk" : () => {
                this.animator.prepareCrossFade('CrouchWalk', 'Walk', 0.5);
            },
            "crouchWalk to idle" : () => {
                this.animator.prepareCrossFade('CrouchWalk', 'Idle', 0.5);
            },
            "crouchIdle to walk" : () => {
                this.animator.prepareCrossFade('CrouchIdle', 'Walk', 0.5);
            },
            "any to crouchIdle" : () => {
                this.animator.prepareCrossFade(this.state, 'CrouchIdle', 0.5);
            },
            "crouchIdle to fallIdle" : () => {
                this.animator.prepareCrossFade('CrouchIdle', 'FallIdle', 0.1);
            },
            "fallIdle to idle" : () => {
                this.animator.prepareCrossFade('FallIdle', 'CrouchIdle', 0.1);
                this.animator.prepareCrossFade('CrouchIdle', 'Idle', 0.3, 0.2);
            },
            "any to jumpCharging" : () => {
                this.animator.playAnimation('CrouchIdle', 0.25);
            }
        }
    }

    //press p to printState for debugging

    printState() {
        console.log("\n");
        // console.log("camera position: ", this.worldState.camera.position);
        // console.log(this.body)
        console.log("animator");
        console.log(this.animator);
        console.log("state:");
        console.log(this.state);
        console.log("player position: ", this.body.position);
        // console.log("move Direction: ", this.moveDirection);
        // console.log("player velocity: ", this.velocity);
        // console.log("controlstate: ", this.controlState.moveForward, this.controlState.moveLeft, this.controlState.moveBackward, this.controlState.moveRight);
        // console.log("look direction: ", this.lookDirection);
        // console.log("look direction angle: ", Math.atan2(this.lookDirection.x, this.lookDirection.z));
        // console.log("move direction: ", this.moveDirection);
        // console.log("player flightEnabled: ", this.flightEnabled);
        // console.log("player crouched: ", this.isCrouched);
        //console.log("body - camera position: (x,z) ", this.body.position.x - this.worldState.camera.position.x, ",", this.body.position.z - this.worldState.camera.position.z);
        //console.log("this.body.rotation.y: ", this.body.rotation.y);

    }
}

module.exports = Player;
