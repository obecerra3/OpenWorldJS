import * as THREE from './three.js';



function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export class Player {
  constructor(username,position,velocity=new THREE.Vector3(),lookDirection=new THREE.Vector3(), isCrouched=false) {
    this.username = username; 
    this.velocity = velocity;
    this.lookDirection = lookDirection;
    this.body = new THREE.Mesh(new THREE.BoxGeometry(5,30,5), new THREE.MeshBasicMaterial({color: getRandomColor()}));
    this.body.position.copy(position);
    this.isCrouched = isCrouched;
  }
}


