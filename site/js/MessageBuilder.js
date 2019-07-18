import * as THREE from './three.min.js';

export class MessageBuilder {
  constructor () {
    this.encoder = new TextEncoder ();
  }
  
  introduction(player) {
    return this.encoder.encode(player.username);
  }
  /*
  
  var state = player.state;
        state["currentChunk"] = {x: Math.round(player.position.x / (MAZE_INFLATION*chunkSize)), z: Math.round(player.position.z / (MAZE_INFLATION*chunkSize))};
        socket.send(JSON.stringify(state));
  
  
  */ 
  chunkRequest(player, inflation, chunkSize) {
    var resultBuffer = new ArrayBuffer(3);
    var byteView = new Int8Array(resultBuffer);
    byteView.set([0, Math.round(player.position.x / (inflation*chunkSize)), Math.round(player.position.z / (inflation*chunkSize))]);
    return resultBuffer;
  }
  
  state (player) {
    var resultBuffer = new ArrayBuffer();
  }

  
}

