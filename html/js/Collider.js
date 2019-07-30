import * as THREE from './three.js';

const XZ = (new THREE.Vector3(1,0,1)).normalize();
const _XZ = (new THREE.Vector3(-1,0,1)).normalize();
const X_Z = (new THREE.Vector3(1,0,-1)).normalize();
const _X_Z = (new THREE.Vector3(-1,0,-1)).normalize();

const EDGE_EPSILON = 25;

export class Collider {
  constructor (playerSize) {
    this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, playerSize);
  }
  
  getCollidableChunkCoords (player, cellSize, chunkSize) {
    var worldChunkSize = cellSize * chunkSize;
    var centerCurr = {x:  Math.round(player.body.position.x / worldChunkSize), z: Math.round(player.body.position.z / worldChunkSize) }
    var result = [centerCurr];
    var rightEdge = (centerCurr.x*worldChunkSize) + (worldChunkSize / 2);
    var leftEdge = (centerCurr.x*worldChunkSize) - (worldChunkSize / 2);
    var topEdge = (centerCurr.z*worldChunkSize) - (worldChunkSize / 2);
    var bottomEdge = (centerCurr.z*worldChunkSize) + (worldChunkSize / 2);
    
    var right, left = false;
    
    if (Math.abs(rightEdge - player.body.position.x) < EDGE_EPSILON) {
      right = true;
      result.push({x: centerCurr.x+1, z: centerCurr.z});
    } else if (Math.abs(leftEdge - player.body.position.x) < EDGE_EPSILON) {
      left = true;
      result.push({x: centerCurr.x-1, z: centerCurr.z});
    }
    
    if (Math.abs(topEdge - player.body.position.z) < EDGE_EPSILON) {
      result.push({x: centerCurr.x, z: centerCurr.z-1});
      if (left) {
        result.push({x: centerCurr.x-1, z: centerCurr.z-1}); 
      } else if (right) {
        result.push({x: centerCurr.x+1, z: centerCurr.z-1}); 
      }
    } else if (Math.abs(bottomEdge - player.body.position.z) < EDGE_EPSILON) {
      result.push({x: centerCurr.x, z: centerCurr.z+1});
      if (left) {
        result.push({x: centerCurr.x-1, z: centerCurr.z+1}); 
      } else if (right) {
        result.push({x: centerCurr.x+1, z: centerCurr.z+1}); 
      }
    }
    
    return result;
    
  }
  
  
  collide (player, wallMeshes) {
    var intersections = [];
    this.raycaster.ray.origin.copy(player.body.position);
    
    this.raycaster.ray.direction.copy(XZ);
    intersections = intersections.concat(this.raycaster.intersectObjects(wallMeshes));
    this.raycaster.ray.direction.copy(X_Z);
    intersections = intersections.concat(this.raycaster.intersectObjects(wallMeshes));
    this.raycaster.ray.direction.copy(_XZ);
    intersections = intersections.concat(this.raycaster.intersectObjects(wallMeshes));
    this.raycaster.ray.direction.copy(_X_Z);
    intersections = intersections.concat(this.raycaster.intersectObjects(wallMeshes));
    
    
    if (intersections.length > 0) {
      intersections.sort((x,y)=>x.distance > y.distance);
      intersections.slice(0,2).forEach((x)=> {
        if (x.face.normal.dot(player.velocity) < 0) {
          player.velocity.projectOnPlane(x.face.normal);
        }
      });
    }  
  }

}


