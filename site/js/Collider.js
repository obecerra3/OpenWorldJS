import * as THREE from './three.js';

const XZ = (new THREE.Vector3(1,0,1)).normalize();
const _XZ = (new THREE.Vector3(-1,0,1)).normalize();
const X_Z = (new THREE.Vector3(1,0,-1)).normalize();
const _X_Z = (new THREE.Vector3(-1,0,-1)).normalize();

export class Collider {
  constructor (playerSize) {
    this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, playerSize);
  }
  collide (player, walls) {
    var intersections = [];
    this.raycaster.ray.origin.copy(player.body.position);
  
    this.raycaster.ray.direction.copy(XZ);
    intersections = intersections.concat(this.raycaster.intersectObjects(walls));
    this.raycaster.ray.direction.copy(X_Z);
    intersections = intersections.concat(this.raycaster.intersectObjects(walls));
    this.raycaster.ray.direction.copy(_XZ);
    intersections = intersections.concat(this.raycaster.intersectObjects(walls));
    this.raycaster.ray.direction.copy(_X_Z);
    intersections = intersections.concat(this.raycaster.intersectObjects(walls));
    
    
    if (intersections.length > 0) {
      intersections.forEach((x)=> {
        if (x.face.normal.dot(player.velocity) < 0) {
          player.velocity.projectOnPlane(x.face.normal);
        }
      });
    }  
  }

}


