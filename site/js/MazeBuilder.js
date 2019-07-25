import * as THREE from './three.js';

import * as Utils from './Utils.js';

const WALL_HEIGHT = 50;
const WALL_WIDTH = 5;

export class MazeBuilder {

  
  buildChunk (center, chunkArray, chunkSize, cellSize) {
  
    var material = new THREE.MeshPhongMaterial( { color: 0x4080ff, dithering: true } );
    material.color = new THREE.Color(0xd3d3d3);
    var walls = [];
    var worldChunkSize = cellSize * chunkSize;
    var worldCenter = {x: center.x * worldChunkSize, z: center.z * worldChunkSize};
    var chunkOrigin = {x: worldCenter.x - (worldChunkSize/2), z: worldCenter.z - (worldChunkSize/2)};
    
    console.log(chunkOrigin);
    
    var i,j;
    

    for (i = 0; i < chunkSize; i++) {
      for (j = 0; j < chunkSize-1; j++) {
        if (!chunkArray[i][j]) continue;
        if (chunkArray[i][j+1] == 1) { 
          var k = j+2;
          while (k <= chunkSize && chunkArray[i][Math.min(k, chunkSize-1)]) {
            k += 1;
          }
          var wallLength = cellSize * (k-j-1) + WALL_WIDTH;
          var wallCenter = new THREE.Vector3(chunkOrigin.x + (j*cellSize) + (wallLength/2) - WALL_WIDTH/2, 0, chunkOrigin.z + (i * cellSize) + (cellSize/2));
          var geometry = new THREE.BoxGeometry(wallLength, WALL_HEIGHT, WALL_WIDTH);
          var wall = new THREE.Mesh(geometry, material);
          wall.position.copy(wallCenter);
          walls.push(wall);
          j = k;
        }
      }
    }
    
    
    for (j = 0; j < chunkSize; j++) {
      for (i = 0; i < chunkSize-1; i++) {
        if (!chunkArray[i][j]) continue;
        if (chunkArray[i+1][j] == 1) { 
          var k = i+2;
          while (k <= chunkSize && chunkArray[Math.min(k, chunkSize-1)][j]) {
            k += 1;
          }
          var wallLength = cellSize * (k-i-1);
          var wallCenter = new THREE.Vector3(chunkOrigin.x + (j*cellSize), 0, chunkOrigin.z + (i * cellSize) + (cellSize/2) + (wallLength/2));
          var geometry = new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, wallLength);
          var wall = new THREE.Mesh(geometry, material);
          wall.position.copy(wallCenter);
          walls.push(wall);
          i = k;
        }
      }
    }
    
    return walls;
  
  }
  
  
  
}


