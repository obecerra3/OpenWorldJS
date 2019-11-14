var THREE = require('three');
var Utils = require('./Utils.js');
var GLTFLoader =  require('three-gltf-loader');
var Collider = require('./Collider.js');

const Y = new THREE.Vector3(0,1,0);

class Player {
    constructor(worldState, controlState, username, position, velocity= new THREE.Vector3(), lookDirection= new THREE.Vector3()) {
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
        this.username = username;
        this.velocity = velocity;
        this.lookDirection = lookDirection;
        this.prevPosition = new THREE.Vector3();
        this.moveDirection = new THREE.Vector3();
        this.collider = new Collider(Utils.PLAYER_SIZE);
        this.flightEnabled = false;

        this.flashlight = new THREE.SpotLight(0xffffff, 1, 300, 0.5, 0.1, 10.0);
        this.flashlight.castShadow = true;
        this.flashlight.visible = true;
        this.worldState.scene.add(this.flashlight);

        this.isCrouched = false;

        var loader = new GLTFLoader();
        loader.load('Soldier.glb', (gltf) => {
            this.model = gltf;
            this.body = gltf.scene;
            this.body.position.y = Utils.PLAYER_HEIGHT / 2;

            this.worldState.scene.add(this.body);

            this.body.traverse(function (object) {
                if (object.isMesh) object.castShadow = true;
            });

            var animations = gltf.animations;

            this.mixer = new THREE.AnimationMixer(this.model);
            this.idleAction = this.mixer.clipAction(animations[0]);
            this.walkAction = this.mixer.clipAction(animations[3]);
            this.runAction = this.mixer.clipAction(animations[1]);
            this.actions = [this.idleAction, this.walkAction, this.runAction];

            this.body.scale.set(6,6,6);

            this.loaded = true;
        }, undefined, (error) =>  {
            console.error('gltf loader error: ', error);
        });
    }

    //main update loop

    updatePlayer(delta) {
        this.controlState.controls.getDirection(this.lookDirection);

        this.updateMoveDirection(); //must be called before updateVelocity()
        this.updateVelocity(delta);

        if (this.worldState.mazeMesh != undefined) this.collider.collide(this, this.worldState.mazeMesh);

        this.updatePosition(delta);
        this.updateRotation(delta);
        this.updateFlashLight();
        this.updateCameraPosition();

        if (!this.flightEnabled && this.body.position.y >= Utils.PLAYER_HEIGHT) this.velocity.y -= Utils.GRAVITY * Utils.PLAYER_MASS * delta;
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
        this.moveDirection.applyAxisAngle(Y, theta);
    }

    updateVelocity(delta) {
        this.velocity.x -= this.velocity.x * 0.01 * delta;
        this.velocity.z -= this.velocity.z * 0.01 * delta;
        this.velocity.y -= this.velocity.y * 0.01 * delta;
        this.velocity.z += this.moveDirection.z * Utils.PLAYER_SPEED * delta;
        this.velocity.x += this.moveDirection.x * Utils.PLAYER_SPEED * delta;
    }

    updatePosition(delta) {
        this.body.position.x += this.velocity.x * delta;
        this.body.position.y += this.velocity.y * delta;
        this.body.position.z += this.velocity.z * delta;
    }

    updateRotation() {
        if (this.lookDirection.y > -0.99) this.body.rotation.y = Math.PI + Math.atan2(this.lookDirection.x, this.lookDirection.z);
    }

    updateCameraPosition() {
        if (this.lookDirection.y > -0.97) {
            let offset = new THREE.Vector3(this.lookDirection.x * 1.75, 0, this.lookDirection.z * 1.75);
            offset.normalize();
            offset.multiplyScalar(2);
            this.worldState.camera.position.x = this.body.position.x + offset.x;
            this.worldState.camera.position.z = this.body.position.z + offset.z;
        }
        this.worldState.camera.position.y = this.body.position.y + 10;
    }

    updateFlashLight() {
        this.flashlight.position.copy(this.worldState.camera.position);

        this.flashlight.position.y -= 1;
        this.flashlight.position.x += this.lookDirection.x * 3.0;
        this.flashlight.position.z += this.lookDirection.z * 3.0;

        this.flashlight.target.position.set(this.flashlight.position.x + this.lookDirection.x,
                                            this.flashlight.position.y + this.lookDirection.y,
                                            this.flashlight.position.z + this.lookDirection.z);

        this.flashlight.target.updateMatrixWorld();
    }

    //press p to printState for debugging

    printState() {
        console.log("\n");
        // console.log("camera position: ", this.worldState.camera.position);
        // console.log("player position: ", this.body.position);
        // console.log("player velocity: ", this.velocity);
        console.log("look direction: ", this.lookDirection);
        console.log("look direction angle: ", Math.atan2(this.lookDirection.x, this.lookDirection.z));
        // console.log("move direction: ", this.moveDirection);
        // console.log("player flightEnabled: ", this.flightEnabled);
        // console.log("player crouched: ", this.isCrouched);
        console.log("body - camera position: (x,z) ", this.body.position.x - this.worldState.camera.position.x, ",", this.body.position.z - this.worldState.camera.position.z);
    }

    //ControlState Callbacks

    toggleCrouch() {
        this.isCrouched= !this.isCrouched;
        if (this.flightEnabled) {
            this.velocity.y -= Utils.PLAYER_JUMP;
        } else if (this.isCrouched) {
            this.body.position.y -= 5;
            //this.worldState.camera.position.y -= Math.max(0.75, this.worldState.camera.position.y - Utils.PLAYER_HEIGHT / 2);
        } else {
            this.body.position.y += 5;
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
}

module.exports = Player;
