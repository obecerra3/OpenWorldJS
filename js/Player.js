var Three = require('three');
var Utils = require('./Utils.js');
var GLTFLoader =  require('three-gltf-loader');
var Collider = require('./Collider.js');
var Animator = require('./Animator.js');

class Player {
    constructor(worldState, controlState, username, position, velocity= new Three.Vector3(), lookDirection= new Three.Vector3()) {

        this.body = {
            position: {x: 0, y: 0, z: 0},
            scale: {x: 0, y: 0, z: 0},
            rotation: {x: 0, y: 0, z: 0}
        };

        this.worldState = worldState;

        this.controlState = controlState;
        this.controlState.toggleJump = this.toggleJump.bind(this);
        this.controlState.toggleCrouch = this.toggleCrouch.bind(this);
        this.controlState.toggleFlashlight = this.toggleFlashlight.bind(this);
        this.controlState.printState = this.printState.bind(this);
        this.controlState.toggleFlight = this.toggleFlight.bind(this);
        this.controlState.toggleRun = this.toggleRun.bind(this);

        this.username = username;
        this.velocity = velocity;
        this.lookDirection = lookDirection;
        this.prevPosition = new Three.Vector3();
        this.moveDirection = new Three.Vector3();

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

        let stateRayData = {}

        for (var key of Object.keys(this.states)) {
            stateRayData[this.states[key]] = [Utils.XZ.normalize(), Utils._XZ.normalize(), Utils.X_Z.normalize(), Utils._X_Z.normalize()];
        }

        this.collider = new Collider(this, Utils.PLAYER_SIZE, stateRayData);
        this.collider.addMesh("floor", this.worldState.floor);

        this.flashlight = new Three.SpotLight(0xffffff, 1, 300, 0.5, 0.1, 10.0);
        this.flashlight.castShadow = true;
        this.flashlight.visible = true;
        this.worldState.scene.add(this.flashlight);

        this.isCrouched = false;

        var loader = new GLTFLoader();
        loader.load('fpsCharacter.glb', (gltf) => {
            this.model = gltf;
            this.body = gltf.scene;
            this.body.position.y = 3;

            this.body.traverse(function (object) {
                object.castShadow = true;
                object.receiveShadow = true;

                //can fix the bounding sphere of the model's geometry in order to enable frustum culling
                object.frustumCulled = false;
            });

            this.setupAnimations(new Three.AnimationMixer(this.body), gltf.animations);

            this.body.scale.set(6, 6, 6);
            // this.IdleAnim.play();
            this.worldState.scene.add(this.body);

        }, undefined, (error) =>  {
            console.error('gltf loader error: ', error);
        });
    }

    //main update loop

    updatePlayer(delta) {
        //if (this.mixer) this.mixer.update(delta);
        this.updateAnimation();
        this.controlState.controls.getDirection(this.lookDirection);

        this.updateMoveDirection(); //must be called before updateVelocity()
        this.updateVelocity(delta);

        //have some class decide what meshes r near the player and feed that into the collider.js
        //for now thats just here
        // if (this.worldState.mazeMesh) this.collider.collide(this, this.worldState.mazeMesh);
        // if (this.worldState.floor) this.collider.collide(this, this.worldState.floor);
        this.collider.update();

        this.updatePosition(delta);
        this.updateRotation(delta);
        this.updateFlashLight();
        this.updateCameraPosition();

        if (!this.flightEnabled && this.body.position.y >= Utils.PLAYER_HEIGHT) this.velocity.y -= Utils.GRAVITY * Utils.PLAYER_MASS * delta;
    }

    updateAnimation() {
        if (this.animator) this.animator.animate();
        switch (this.state) {
            case this.states.IDLE:
                if (this.controlState.moveForward || this.controlState.moveLeft || this.controlState.moveRight || this.controlState.moveBackward) {
                    this.state = this.states.WALK;
                    this.transitions['idle to walk']();
                }
                break;
            case this.states.WALK:
                if (!this.controlState.moveForward && !this.controlState.moveLeft && !this.controlState.moveRight && !this.controlState.moveBackward) {
                    this.state = this.states.IDLE;
                    this.transitions['walk to idle']();
                } else if (this.running) {
                    this.state = this.states.RUN;
                    this.transitions['walk to run']();
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
            // default:
            //     if ()
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
        this.velocity.x -= this.velocity.x * Utils.VELOCITY_DAMP * delta;
        this.velocity.z -= this.velocity.z * Utils.VELOCITY_DAMP * delta;
        this.velocity.y -= this.velocity.y * Utils.VELOCITY_DAMP * delta;
        if (this.running) {
            this.velocity.z += this.moveDirection.z * Utils.PLAYER_RUNNING_SPEED * delta;
            this.velocity.x += this.moveDirection.x * Utils.PLAYER_RUNNING_SPEED * delta;
        } else {
            this.velocity.z += this.moveDirection.z * Utils.PLAYER_WALKING_SPEED * delta;
            this.velocity.x += this.moveDirection.x * Utils.PLAYER_WALKING_SPEED * delta;
        }
    }

    updatePosition(delta) {
        this.body.position.x += this.velocity.x * delta;
        this.body.position.y += this.velocity.y * delta;
        this.body.position.z += this.velocity.z * delta;
    }

    updateRotation() {
        if (this.lookDirection.y > -0.97) {
            this.body.rotation.y = Math.atan2(this.lookDirection.x, this.lookDirection.z);
        }
    }

    updateCameraPosition() {
        if (this.lookDirection.y > -0.97) {
            let offset = new Three.Vector3(this.lookDirection.x * 1.75, 0, this.lookDirection.z * 1.75);
            offset.normalize();
            offset.multiplyScalar(-10); //2 for fps -10 for 3rd person
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

    toggleCrouch(value) {
        this.isCrouched= value;
        if (this.flightEnabled) {
            this.velocity.y -= Utils.PLAYER_JUMP;
        } else if (this.isCrouched) {
            this.worldState.camera.position.y -= 5;
            //this.worldState.camera.position.y -= Math.max(0.75, this.worldState.camera.position.y - Utils.PLAYER_HEIGHT / 2);
        } else {
            this.worldState.camera.y += 5;
            //this.worldState.camera.position.y += Math.max(0.75, Utils.PLAYER_HEIGHT - this.worldState.camera.position.y);
        }
        //if (this.flightEnabled && this.player.body.position.y > Utils.PLAYER_HEIGHT) this.player.velocity.y -= Utils.PLAYER_JUMP;
    }

    toggleJump() {
        if ((this.body.position.y <= Utils.PLAYER_HEIGHT && !this.isCrouched) || this.flightEnabled) {
            this.velocity.y += Utils.PLAYER_JUMP;

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
                this.animator.prepareCrossFade('Run', 'Walk', 1.0);
            },
            "walk to run" : () => {
                this.animator.prepareCrossFade('Walk', 'Run', 0.5);
            },
            "run to idle" : () => {
                this.animator.prepareCrossFade('Run', 'Idle', 0.5);
            }
        }
    }

    //press p to printState for debugging

    printState() {
        console.log("\n");
        // console.log("camera position: ", this.worldState.camera.position);
        // console.log(this.body)
        // console.log(this.animator);
        console.log(this.state);
        // console.log("player position: ", this.body.position);
        console.log("move Direction: ", this.moveDirection);
        console.log("player velocity: ", this.velocity);
        console.log("controlstate: ", this.controlState.moveForward, this.controlState.moveLeft, this.controlState.moveBackward, this.controlState.moveRight);
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
