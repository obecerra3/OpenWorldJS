import * as THREE from './three.js';

import * as Utils from './Utils.js';

export class Player {
  constructor(username,position,velocity=new THREE.Vector3(),lookDirection=new THREE.Vector3(), isCrouched=false) {
    this.username = username; 
    this.velocity = velocity;
    this.lookDirection = lookDirection;
    this.body = new THREE.Mesh(new THREE.BoxGeometry(5,30,5), new THREE.MeshBasicMaterial({color: Utils.getRandomColor()}));
    this.body.position.copy(position);
    this.isCrouched = isCrouched;
  }
}

