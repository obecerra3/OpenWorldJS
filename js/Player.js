var THREE = require('three');
var Utils = require('./Utils.js');
var GLTFLoader =  require('three-gltf-loader');
//import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

class Player {
  constructor(username, position, addModelToScene, velocity=new THREE.Vector3(), lookDirection=new THREE.Vector3(), isCrouched=false) {
    this.username = username;
    this.velocity = velocity;
    this.lookDirection = lookDirection;
    this.body = new THREE.Mesh(new THREE.BoxGeometry(5,30,5), new THREE.MeshBasicMaterial({color: Utils.getRandomColor()}));
    this.body.position.copy(position);
    this.isCrouched = isCrouched;

    var loader = new GLTFLoader();
    loader.load('Soldier.glb', (gltf) => {
        this.model = gltf;

        addModelToScene(gltf.scene);

        this.model.scene.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
        });

        var animations = gltf.animations;

        this.mixer = new THREE.AnimationMixer(this.model);
        this.idleAction = this.mixer.clipAction(animations[0]);
        this.walkAction = this.mixer.clipAction(animations[3]);
        this.runAction = this.mixer.clipAction(animations[1]);
        this.actions = [this.idleAction, this.walkAction, this.runAction];

        this.model.scene.scale.set(6,6,6);

        this.loaded = true;
    }, undefined, (error) =>  {
        console.error('gltf loader error: ', error);
    });
  }

  getCurrentChunk (cellSize, chunkSize) {
    var worldChunkSize = cellSize * chunkSize;
    var current = {x:  Math.round(this.body.position.x / (cellSize*chunkSize)), z: Math.round(this.body.position.z / (cellSize*chunkSize)) }
    var rightEdge = current.x * worldChunkSize + worldChunkSize/2;
    if (Math.abs(rightEdge-this.body.position.x) < 8) {
      current.x += 1;
    }

    return current;

  }
}

module.exports = Player;
