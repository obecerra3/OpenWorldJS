var THREE = require('three');

class MessageBuilder {
  constructor () {
    this.encoder = new TextEncoder ();
  }
  
  introduction(player) {
    return this.encoder.encode(player.username);
  }
  
  state (player) {
    var buffer = new ArrayBuffer(22);
    var dataView = new DataView(buffer);
    dataView.setInt8(0, 0);
    dataView.setInt8(1, player.isCrouched);
    dataView.setFloat32(2, player.body.position.x);
    dataView.setFloat32(6, player.body.position.z);
    dataView.setFloat32(10, player.lookDirection.x);
    dataView.setFloat32(14, player.lookDirection.y)
    dataView.setFloat32(18, player.lookDirection.z);
    return buffer;
  }

  jump () {
    var buffer = new ArrayBuffer(1);
    var dataView = new DataView(buffer);
    dataView.setInt8(0, 3);
    return buffer;
  }
}

module.exports = MessageBuilder;

