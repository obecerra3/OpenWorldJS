import * as THREE from './three.min.js';



function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export class Player {
  constructor(username,position,velocity=new THREE.Vector3(),lookDirection=new THREE.Vector3()) {
    this.username = username; 
    this.velocity = velocity;
    this.lookDirection = lookDirection;
    this.body = new THREE.Mesh(new THREE.BoxGeometry(5,30,5), new THREE.MeshBasicMaterial({color: getRandomColor()}));
    this.body.position.copy(position);
    this.isCrouched = false;
  }

  
  get state() {
    return {position: this.body.position, velocity: this.velocity, lookDirection: this.lookDirection};
  }
  
  
  
  
}


