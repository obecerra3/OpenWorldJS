import * as THREE from './three.min.js';

export class Player {
  constructor(username,position,velocity=new THREE.Vector3(),lookDirection=new THREE.Vector3()) {
    this.username = username; 
    this.velocity = velocity;
    this.lookDirection = lookDirection;
    this.body = new THREE.Mesh(new THREE.BoxGeometry(5,30,5), new THREE.MeshBasicMaterial({color: 0x00ff00}));
    this.body.position.copy(position);
  }
  
  get state() {
    return {position: this.body.position, velocity: this.velocity, lookDirection: this.lookDirection};
  }
}


