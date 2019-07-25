import * as THREE from './three.js';

import * as Utils from './Utils.js';

const WALL_HEIGHT = 50;
const WALL_WIDTH = 5;

export class MazeBuilder {

  
  buildChunk (center, chunkArray, chunkSize, cellSize) {
    console.log(chunkArray);
    
    var material = new THREE.MeshPhongMaterial( { color: 0x4080ff, dithering: true } );
    material.color = new THREE.Color(0xd3d3d3);
    var walls = [];
    var built = new Set();
    var worldChunkSize = cellSize * chunkSize;
    var worldCenter = {x: center.x * worldChunkSize, z: center.z * worldChunkSize};
    var chunkOrigin = {x: worldCenter.x - worldChunkSize/2, z: worldCenter.z - worldChunkSize/2};
    
    
    var i,j;
    for (i = 0; i < chunkSize; i++) {
      for (j = 0; j < chunkSize; j++) {
        if (!chunkArray[i][j] || built.has(Utils.pair(i, j))) continue;
        built.add(Utils.pair(i,j));
        if (chunkArray[i][j+1]) { 
          built.add(Utils.pair(i, j+1));
          var k = j+2;
          while (k < chunkSize && chunkArray[i][k]) {
            built.add(Utils.pair(i, k));
            k += 1;
          }
          var wallLength = cellSize * (k - j);
          if ((i == 1 && j == 1)) console.log(chunkOrigin.z, (i * cellSize) + (cellSize/2));
          var wallCenter = new THREE.Vector3(chunkOrigin.x + (j*cellSize) + (wallLength/2) + (cellSize/2), 0, chunkOrigin.z + (i * cellSize) + (cellSize/2) - WALL_WIDTH);
          var geometry = new THREE.BoxGeometry(wallLength, WALL_HEIGHT, WALL_WIDTH);
          var wall = new THREE.Mesh(geometry, material);
          wall.position.copy(wallCenter);
          walls.push(wall);
        } else {
//          var k = i+1;
//          while (k < chunkSize && chunkArray[k][j]) {
//            built.add(Utils.pair(k, j));
//            k += 1;
//          }
//          var wallLength = cellSize * (k - i);
//          var wallCenter = new THREE.Vector3(chunkOrigin.x + (j*cellSize) + (cellSize/2), 0, chunkOrigin.z + (i*cellSize) + (wallLength/2) + (cellSize/2));
//           var geometry = new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, wallLength);
//          var wall = new THREE.Mesh(geometry, material);
//          wall.position.copy(wallCenter);
//          walls.push(wall);
        }
      }
    }
    return walls;
  
  }
  
  
  
}


