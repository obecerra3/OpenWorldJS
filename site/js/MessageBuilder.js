import * as THREE from './three.min.js';

export class MessageBuilder {
  constructor () {
    this.encoder = new TextEncoder ();
  }
  
  introduction(player) {
    return this.encoder.encode(player.username);
  }
  
  chunkRequest(chunk) {
    var buffer = new ArrayBuffer(3);
    var dataView = new DataView(buffer);
    dataView.setInt8(0, 0);
    dataView.setInt8(1, chunk.x);
    dataView.setInt8(2, chunk.z);
    return buffer;
  }
  
  state (player) {
    var buffer = new ArrayBuffer(29);
    var dataView = new DataView(buffer);
    dataView.setInt8(0, 1);
    dataView.setFloat32(1, player.position.x);
    dataView.setFloat32(5, player.position.z);
    dataView.setFloat32(9, player.velocity.x);
    dataView.setFloat32(13, player.velocity.z);
    dataView.setFloat32(17, player.lookDirection.x);
    dataView.setFloat32(21, player.lookDirection.y)
    dataView.setFloat32(25, player.lookDirection.z);
    return buffer;
  }

  
}

