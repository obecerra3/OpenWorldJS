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
    var buffer = new ArrayBuffer(21);
    var dataView = new DataView(buffer);
    dataView.setInt8(0, 1);
    dataView.setFloat32(1, player.body.position.x);
    dataView.setFloat32(5, player.body.position.z);
    dataView.setFloat32(9, player.lookDirection.x);
    dataView.setFloat32(13, player.lookDirection.y)
    dataView.setFloat32(17, player.lookDirection.z);
    return buffer;
  }
  
  
  crouch () {
    var buffer = new ArrayBuffer(1);
    var dataView = new DataView(buffer);
    dataView.setInt8(0, 3);
    return buffer;
  }
  
  unCrouch () {
    var buffer = new ArrayBuffer(1);
    var dataView = new DataView(buffer);
    dataView.setInt8(0, 4);
    return buffer;
  }
  
  
  
  jump () {
    var buffer = new ArrayBuffer(1);
    var dataView = new DataView(buffer);
    dataView.setInt8(0, 2);
    return buffer;
  }

  
}

