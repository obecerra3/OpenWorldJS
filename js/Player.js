var THREE = require('three');
var Utils = require('./Utils.js');


class Player {
  constructor(username,position,isHunted=false,velocity=new THREE.Vector3(),lookDirection=new THREE.Vector3(), isCrouched=false) {
    this.username = username; 
    this.velocity = velocity;
    this.lookDirection = lookDirection;
    this.body = new THREE.Mesh(new THREE.BoxGeometry(5,30,5), new THREE.MeshBasicMaterial({color: Utils.getRandomColor()}));
    this.body.position.copy(position);
    this.isCrouched = isCrouched;
    this.isHunted = isHunted;
  }
  
  update (delta, moveDirection, moveForward, moveBackward, moveLeft, moveRight, Y, playerSpeed, controls) {
    var theta;
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

    this.velocity.z += moveDirection.z * playerSpeed * delta;
    this.velocity.x += moveDirection.x * playerSpeed * delta;
    
  }
  
  move (delta) {
    this.body.position.x += this.velocity.x*delta;
    this.body.position.y += this.velocity.y*delta;
    this.body.position.z += this.velocity.z*delta;
  }
   
  
  
}

module.exports = Player;


