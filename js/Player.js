var THREE = require('three');
var Utils = require('./Utils.js');
var GLTFLoader =  require('three-gltf-loader');
//import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const PLAYER_HEIGHT = 10;
const PLAYER_SIZE = 5;
const PLAYER_MASS = 0.00005;
const PLAYER_SPEED = 0.0005;
const PLAYER_JUMP = 0.1;
const GRAVITY = 9.8;
const CELL_SIZE = 12;
const UPDATE_DELTA = 100.0;
const CHUNK_REQUEST_DELTA = 3000;
const CHUNK_SIZE = 27;

const Y = new THREE.Vector3(0,1,0);

class Player {
    constructor(username, position, addModelToScene, velocity=new THREE.Vector3(), lookDirection=new THREE.Vector3(), isCrouched=false) {
        console.log("username: ",username);
        console.log("HERE");
        this.username = username;
        this.velocity = velocity;
        this.lookDirection = lookDirection;
        this.body = {
            position: {x: 0, y: 0, z: 0},
            scale: {x: 0, y: 0, z: 0}
        };

        this.isCrouched = isCrouched;

        var loader = new GLTFLoader();
        loader.load('Soldier.glb', (gltf) => {
            this.model = gltf;
            this.body = gltf.scene;

            addModelToScene(this.body);

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

    animateUpdate(delta, theta, camera, controls, canJump, flashLight, mazeBuilder, moveDirection, moveForward, moveBackward, moveLeft, moveRight) {
        this.velocity.x -= this.velocity.x * 0.01 * delta;
        this.velocity.z -= this.velocity.z * 0.01 * delta;
        this.velocity.y -= this.velocity.y * 0.01 * delta;

        moveDirection.z = Number(moveForward) - Number(moveBackward);
        moveDirection.x = Number(moveLeft) - Number(moveRight);
        moveDirection.normalize();

        controls.getDirection(this.lookDirection);

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
        moveDirection.applyAxisAngle(Y, theta);

        this.velocity.z += moveDirection.z * PLAYER_SPEED * delta;
        this.velocity.x += moveDirection.x * PLAYER_SPEED * delta;

        var playerChunk = this.getCurrentChunk(CELL_SIZE, CHUNK_SIZE);
        var currentChunk = mazeBuilder.chunks.get(Utils.pair(playerChunk.x, playerChunk.z));
        if (currentChunk != undefined) collider.collide(this, currentChunk.wallMesh);


        this.body.position.x += this.velocity.x*delta;
        this.body.position.y += this.velocity.y*delta;
        this.body.position.z += this.velocity.z*delta;

        camera.position.x = this.body.position.x;
        camera.position.z = this.body.position.z;


        flashLight.position.copy(camera.position);

        flashLight.position.y -= 1;
        flashLight.position.x += this.lookDirection.x*3.0;
        flashLight.position.z += this.lookDirection.z*3.0;

        flashLight.target.position.set(flashLight.position.x + this.lookDirection.x,
                                     flashLight.position.y + this.lookDirection.y,
                                     flashLight.position.z + this.lookDirection.z);

        flashLight.target.updateMatrixWorld();


        if (this.isCrouched) {
            camera.position.y -= Math.min(0.75, camera.position.y-PLAYER_HEIGHT/2);
        } else {
            camera.position.y += Math.min(0.75, PLAYER_HEIGHT-camera.position.y);
        }


        if (this.body.position.y <= PLAYER_HEIGHT) {
            if (!this.isCrouched) {
                canJump = true;
            }
            this.velocity.y = 0;
        } else {
            //this.velocity.y -= GRAVITY*PLAYER_MASS*delta;
            camera.position.y = this.body.position.y;
        }

    }

    getCurrentChunk (cellSize, chunkSize) {
        var worldChunkSize = cellSize * chunkSize;
        var current = {x:  Math.round(this.body.position.x / (cellSize*chunkSize)), z: Math.round(this.body.position.z / (cellSize*chunkSize)) }
        var rightEdge = current.x * worldChunkSize + worldChunkSize/2;
        if (Math.abs(rightEdge-this.body.position.x) < 8) {
            current.x += 1;
        }

        var leftEdge = current.x * worldChunkSize - worldChunkSize/2;
        if (Math.abs(rightEdge-this.body.position.x) < 8) {
            current.x -= 1;
        }

        return current;

        }
}

module.exports = Player;
