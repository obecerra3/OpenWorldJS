import * as THREE from './three.js';

import * as Utils from './Utils.js';

const WALL_HEIGHT = 50;
const WALL_WIDTH = 5;

export class MazeBuilder {
  
  constructor () {
    this.chunks = new Map();
    this.geometries = new Map();
    this.wallMaterial = new THREE.MeshPhongMaterial( { color: 0xd3d3d3, dithering: true } );
  }
  
  
  buildChunk (center, chunkArray, chunkSize, cellSize) {
    var wallGeometry = new THREE.Geometry();
    var wallGroup = new THREE.Group(); 
    var worldChunkSize = cellSize * chunkSize;
    var worldCenter = {x: center.x * worldChunkSize, z: center.z * worldChunkSize};
    var chunkOrigin = {x: worldCenter.x - (worldChunkSize/2), z: worldCenter.z - (worldChunkSize/2)};
    
    var i,j;
    
    for (i = 0; i < chunkSize; i++) {
      for (j = 0; j < chunkSize-1; j++) {
        if (!chunkArray[i][j]) continue;
        if (chunkArray[i][j+1] == 1) { 
          var k = j+2;
          while (k < chunkSize && chunkArray[i][k]) {
            k += 1;
          }
          var wallLength = cellSize * (k-j-1) + WALL_WIDTH;
          var wallCenter = new THREE.Vector3(chunkOrigin.x + (j*cellSize) + (wallLength/2) - WALL_WIDTH/2, 0, chunkOrigin.z + (i * cellSize) + (cellSize/2));
          var wall = new THREE.Mesh(this.getGeometry(wallLength, WALL_WIDTH));
          wall.position.copy(wallCenter);
          wallGeometry.mergeMesh(wall);
          j = k;
        }
      }
    }
    
    
    for (j = 0; j < chunkSize; j++) {
      for (i = 0; i < chunkSize-1; i++) {
        if (!chunkArray[i][j]) continue;
        if (chunkArray[i+1][j] == 1) { 
          var k = i+2;
          while (k < chunkSize && chunkArray[k][j]) {
            k += 1;
          }
          var wallLength = cellSize * (k-i-1);
          var wallCenter = new THREE.Vector3(chunkOrigin.x + (j*cellSize), 0, chunkOrigin.z + (i * cellSize) + (cellSize/2) + (wallLength/2));
          var wall = new THREE.Mesh(this.getGeometry(WALL_WIDTH, wallLength));
          wall.position.copy(wallCenter);
          wallGeometry.mergeMesh(wall);
          i = k;
        }
      }
    }
  
    this.addGlue(center, chunkArray, chunkSize, cellSize, worldChunkSize, chunkOrigin, wallGeometry);
    var bufGeometry = new THREE.BufferGeometry().fromGeometry(wallGeometry);
    var wallMesh = new THREE.Mesh (bufGeometry, this.wallMaterial);
    wallMesh.matrixAutoUpdate = false;
    this.chunks.set(Utils.pair(center.x, center.z), {array: chunkArray, wallMesh: wallMesh});
    
    return wallMesh;
  
  }
  
  getGeometry(xLength, zLength) {
    var geoLookup = this.geometries.get(Utils.pair(xLength, zLength));
    if (geoLookup == undefined) {
      var geometry = new THREE.BoxGeometry(xLength, WALL_HEIGHT, zLength);
      this.geometries.set(Utils.pair(xLength, zLength), geometry);
      return geometry;
    } else {
      return geoLookup;
    }
  }
  
  addGlue (center, chunkArray, chunkSize, cellSize, worldChunkSize, chunkOrigin, wallGeometry) {
    
    var below = this.chunks.get(Utils.pair(center.x, center.z+1));
    if (below != undefined) {
      var j;
      for (j = 0; j < chunkSize; j++) {
        if (below.array[0][j] == 1 && chunkArray[chunkSize-1][j] == 1) {
          var wallCenter = new THREE.Vector3(chunkOrigin.x + (j*cellSize), 0, chunkOrigin.z + worldChunkSize);
          var wall = new THREE.Mesh(this.getGeometry(WALL_WIDTH, cellSize));
          wall.position.copy(wallCenter);
          wallGeometry.mergeMesh(wall);
          var geo = new THREE.Geometry().fromBufferGeometry(below.wallMesh.geometry);
          geo.mergeMesh(wall);
          below.wallMesh.geometry.fromGeometry(geo);
        }
      }
    }
    
    
    var above = this.chunks.get(Utils.pair(center.x, center.z-1));
    if (above != undefined) {
      var j;
      for (j = 0; j < chunkSize; j++) {
        if (above.array[chunkSize-1][j] == 1 && chunkArray[0][j] == 1) {
          var wallCenter = new THREE.Vector3(chunkOrigin.x + (j*cellSize), 0, chunkOrigin.z);
          var wall = new THREE.Mesh(this.getGeometry(WALL_WIDTH, cellSize));
          wall.position.copy(wallCenter);
          wallGeometry.mergeMesh(wall);
          var geo = new THREE.Geometry().fromBufferGeometry(above.wallMesh.geometry);
          geo.mergeMesh(wall);
          above.wallMesh.geometry.fromGeometry(geo);
        }
      }
    }
    
    var left = this.chunks.get(Utils.pair(center.x-1, center.z));
    if (left != undefined) {
      var i;
      for (i = 0; i < chunkSize; i++) {
        if (left.array[i][chunkSize-1] == 1 && chunkArray[i][0] == 1) {
          var wallCenter = new THREE.Vector3(chunkOrigin.x - cellSize/2, 0, chunkOrigin.z + (i*cellSize) + cellSize/2);
          var wall = new THREE.Mesh(this.getGeometry(cellSize+WALL_WIDTH, WALL_WIDTH));
          wall.position.copy(wallCenter);
          wallGeometry.mergeMesh(wall);
          var geo = new THREE.Geometry().fromBufferGeometry(left.wallMesh.geometry);
          geo.mergeMesh(wall);
          left.wallMesh.geometry.fromGeometry(geo);
        }
      }
    }
    
    
    var right = this.chunks.get(Utils.pair(center.x+1, center.z));
    if (right != undefined) {
      var i;
      for (i = 0; i < chunkSize; i++) {
        if (right.array[i][0] == 1 && chunkArray[i][chunkSize-1] == 1) {
          var wallCenter = new THREE.Vector3(chunkOrigin.x + worldChunkSize - cellSize/2, 0, chunkOrigin.z + (i*cellSize) + cellSize/2);
          var wall = new THREE.Mesh(this.getGeometry(cellSize+WALL_WIDTH, WALL_WIDTH));
          wall.position.copy(wallCenter);
          wallGeometry.mergeMesh(wall);
          var geo = new THREE.Geometry().fromBufferGeometry(right.wallMesh.geometry);
          geo.mergeMesh(wall);
          right.wallMesh.geometry.fromGeometry(geo);
        }
      }
    }
  }
  
  
}


