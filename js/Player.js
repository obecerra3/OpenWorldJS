var THREE = require('three');
var Utils = require('./Utils.js');
var GLTFLoader =  require('three-gltf-loader');
var Collider = require('./Collider.js');

const Y = new THREE.Vector3(0,1,0);

class Player {
    constructor(worldState, controlState, username, position, velocity= new THREE.Vector3(), lookDirection= new THREE.Vector3()) {
        this.body = {
            position: {x: 0, y: 0, z: 0},
            scale: {x: 0, y: 0, z: 0}
        };

        this.worldState = worldState;
        this.controlState = controlState;
        this.controlState.toggleJump = this.toggleJump.bind(this);
        this.controlState.toggleCrouch = this.toggleCrouch.bind(this);
        this.controlState.toggleFlashlight = this.toggleFlashlight.bind(this);
        this.username = username;
        this.velocity = velocity;
        this.lookDirection = lookDirection;
        this.prevPosition = new THREE.Vector3();
        this.moveDirection = new THREE.Vector3();
        this.collider = new Collider(Utils.PLAYER_SIZE);

        this.flashlight = new THREE.SpotLight(0xffffff, 1, 300, 0.5, 0.1, 10.0);
        this.flashlight.castShadow = true;
        this.flashlight.visible = true;
        this.worldState.scene.add(this.flashlight);

        this.isCrouched = false;

        var loader = new GLTFLoader();
        loader.load('Soldier.glb', (gltf) => {
            this.model = gltf;
            this.body = gltf.scene;
            this.body.position.y = Utils.PLAYER_HEIGHT;

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

    toggleCrouch() {
        this.isCrouched= !this.isCrouched;
        if (this.isCrouched) {
            this.worldState.camera.position.y -= Math.min(0.75, this.worldState.camera.position.y - Utils.PLAYER_HEIGHT / 2);
        } else {
            this.worldState.camera.position.y += Math.min(0.75, Utils.PLAYER_HEIGHT - this.worldState.camera.position.y);
        }
        //if (this.player.body.position.y > Utils.PLAYER_HEIGHT) this.player.velocity.y -= Utils.PLAYER_JUMP;
    }

    toggleJump() {
        if (this.body.position.y <= Utils.PLAYER_HEIGHT && !this.isCrouched) {
            this.velocity.y += Utils.PLAYER_JUMP;
        }
    }

    toggleFlashlight() {
        this.flashlight.visible = !this.flashlight.visible;
    }

    animateUpdate(delta) {
        this.velocity.x -= this.velocity.x * 0.01 * delta;
        this.velocity.z -= this.velocity.z * 0.01 * delta;
        this.velocity.y -= this.velocity.y * 0.01 * delta;
        let camera = this.worldState.camera;
        let theta = 0;

        this.moveDirection.z = Number(this.controlState.moveForward) - Number(this.controlState.moveBackward);
        this.moveDirection.x = Number(this.controlState.moveLeft) - Number(this.controlState.moveRight);
        this.moveDirection.normalize();

        this.controlState.controls.getDirection(this.lookDirection);

        if (this.lookDirection.z > 0) {
            theta = Math.atan(this.lookDirection.x / this.lookDirection.z);
        } else if (this.lookDirection.x > 0) {
            theta = Math.PI/2 + Math.atan(-this.lookDirection.z/this.lookDirection.x);
        } else {
            if (this.lookDirection.x == 0) {
                theta = Math.PI;
            } else {
                theta = -Math.PI/2 - Math.atan(-this.lookDirection.z/-this.lookDirection.x);
            }
        }
        this.moveDirection.applyAxisAngle(Y, theta);

        this.velocity.z += this.moveDirection.z * Utils.PLAYER_SPEED * delta;
        this.velocity.x += this.moveDirection.x * Utils.PLAYER_SPEED * delta;

        if (this.worldState.mazeMesh != undefined) this.collider.collide(this, this.worldState.mazeMesh);

        this.body.position.x += this.velocity.x * delta;
        this.body.position.y += this.velocity.y * delta;
        this.body.position.z += this.velocity.z * delta;

        camera.position.x = this.body.position.x;
        camera.position.z = this.body.position.z;

        this.flashlight.position.copy(camera.position);

        this.flashlight.position.y -= 1;
        this.flashlight.position.x += this.lookDirection.x * 3.0;
        this.flashlight.position.z += this.lookDirection.z * 3.0;

        this.flashlight.target.position.set(this.flashlight.position.x + this.lookDirection.x,
                                            this.flashlight.position.y + this.lookDirection.y,
                                            this.flashlight.position.z + this.lookDirection.z);

        this.flashlight.target.updateMatrixWorld();

        this.worldState.camera.position.y = this.body.position.y;

        //if (this.body.position.y > Utils.PLAYER_HEIGHT) this.velocity.y -= Utils.GRAVITY * Utils.PLAYER_MASS * delta;
    }
}

module.exports = Player;
