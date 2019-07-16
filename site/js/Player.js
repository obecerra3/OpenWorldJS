import * as THREE from './THREE.js';

export class Player {
  constructor(username,position=new THREE.Vector3(),velocity=new THREE.Vector3(),lookDirection=new THREE.Vector3()) {
    this.username = username;
    this.position = position; 
    this.velocity = velocity;
    this.lookDirection = lookDirection;
  }
  
  get state() {
    return {position: this.position, velocity: this.velocity, lookDirection: this.lookDirection};
  }
}


