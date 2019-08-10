var THREE = require('three');
var Utils = require('./Utils.js');
var GLTFLoader = require('three-gltf-loader');

class Player {
  constructor(username,position,velocity=new THREE.Vector3(),lookDirection=new THREE.Vector3(), isCrouched=false) {
    this.username = username;
    this.velocity = velocity;
    this.lookDirection = lookDirection;
    this.body = new THREE.Mesh(new THREE.BoxGeometry(5,30,5), new THREE.MeshBasicMaterial({color: Utils.getRandomColor()}));
    this.body.position.copy(position);
    this.isCrouched = isCrouched;

    var loader = new GLTFLoader();

    loader.load('Soldier.glb', function (gltf) {
        console.log(gltf);
        console.log(typeof gltf.scene);
        this.model = gltf.scene;
    }, undefined, function (error) {
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
