define(["three", "infoManager", "scene", "onlinePlayer", "player", "mazeEngine", "utils", "messageBuilder", "physics"],
(THREE, InfoManager, scene, onlinePlayer, Player, MazeEngine, Utils, MessageBuilder, Physics) =>
{
    var Multiplayer =
    {
        // online_players: {},
        // socket: new WebSocket("wss://themaze.io:8000"),
        // previous_update_time: -Utils.UPDATE_DELTA,
        //
        // init: () =>
        // {
        //     Multiplayer.socket.onopen = () =>
        //     {
        //         Multiplayer.socket.send(MessageBuilder.hello(username));
        //     };
        //
        //     Multiplayer.socket.onmessage = (event) =>
        //     {
        //         Multiplayer.eceive(event.data);
        //     };
        // },
        //
        // update: (_time) =>
        // {
        //     if (Player.body && _time - Multiplayer.previous_update_time >= Utils.UPDATE_DELTA
        //         && Multiplayer.socket.readyState == WebSocket.OPEN)
        //     {
        //         Multiplayer.socket.send(MessageBuilder.state(Player));
        //         Multiplayer.previous_update_time = _time;
        //     }
        // },
        //
        // processIntroduction: (buffer) =>
        // {
        //     var dataView = new DataView(buffer);
        //     var id = dataView.getUint8(0);
        //     // var isHunted = dataView.getUint8(1) != 0;
        //     var decoder = new TextDecoder("utf-8");
        //     var username = decoder.decode(buffer.slice(2));
        //     var online_player = OnlinePlayer (username, new THREE.Vector3());
        //     Multiplayer.online_players[id] = online_player;
        //     InfoManager.addPlayerInfo(online_player, false);
        //     // if (Object.keys(Multiplayer.online_players).length == NUM_HUNTERS) {
        //     //     InfoManager.showPlayerClass(Player, Multiplayer.online_players);
        //     // }
        //     scene.add(online_player.body);
        // },
        //
        // processLeft: (buffer) =>
        // {
        //     var dataView = new DataView(buffer);
        //     var id = dataView.getUint8(0);
        //     scene.remove(Multiplayer.online_players[id].body);
        //     delete Multiplayer.online_players[id];
        //     InfoManager.playerLeft(Player, Object.values(Multiplayer.online_players));
        // },
        //
        // processMaze: (buffer) =>
        // {
        //     var byteArray = new Uint8Array(buffer);
        //
        //     var mazeArray = byteArray.reduce((array, curr, idx) =>
        //     {
        //         var i;
        //         for (i = 0; i < 8; i++)
        //         {
        //             var type = curr >> (7-i) & 1;
        //             var overall = idx * 8 + i;
        //             if ((overall % Utils.MAZE_SIZE) == 0)
        //             {
        //                 array.push([type]);
        //             } else
        //             {
        //                 array[Math.floor(overall / Utils.MAZE_SIZE)].push(type);
        //             }
        //         }
        //         return array;
        //     }, []);
        //
        //     MazeEngine.build(mazeArray, Utils.MAZE_SIZE, Utils.CELL_SIZE);
        // },
        //
        // processAction: (buffer, code) =>
        // {
        //     var dataView = new DataView(buffer);
        //     var id = dataView.getUint16(0);
        //     var player = Multiplayer.online_players[id];
        //     if (player != undefined) {
        //         switch (code) {
        //             case 3:
        //                 player.toggleJump();
        //                 break;
        //             default:
        //                 console.log("unrecognized action");
        //         }
        //     }
        // },
        //
        // processPlayerState: (buffer) =>
        // {
        //     var dataView = new DataView(buffer);
        //     var id = dataView.getUint16(0);
        //     var isCrouched = dataView.getUint8(2);
        //     var positionX = dataView.getFloat32(3);
        //     var positionZ = dataView.getFloat32(7);
        //     var lookDirectionX = dataView.getFloat32(11);
        //     var lookDirectionY = dataView.getFloat32(15);
        //     var lookDirectionZ = dataView.getFloat32(19);
        //     var otherPlayer = Multiplayer.online_players[id];
        //     var y_velocity = otherPlayer.rigidbody.getLinearVelocity().y();
        //     var newVelocity = new THREE.Vector3(positionX - otherPlayer.body.position.x, 0, positionZ - otherPlayer.body.position.z).divideScalar(Utils.UPDATE_DELTA);
        //     otherPlayer.rigidbody.setLinearVelocity(Utils.btVector3(newVelocity));
        //     var current_velocity = otherPlayer.rigidbody.getLinearVelocity();
        //     otherPlayer.setLinearVelocity(new Physics.ammo.btVector3(current_velocity.x(), y_velocity, current_velocity.z()));
        //     otherPlayer.lookDirection.x = lookDirectionX;
        //     otherPlayer.lookDirection.y = lookDirectionY;
        //     otherPlayer.lookDirection.z = lookDirectionZ;
        //     otherPlayer.crouching = isCrouched;
        // },
        //
        // receive: async function (blob)
        // {
        //     var arrayBuffer = await new Response(blob).arrayBuffer();
        //     var dataView = new DataView(arrayBuffer);
        //     switch (dataView.getUint8(0)) {
        //         case 0:
        //             Multiplayer.processIntroduction(arrayBuffer.slice(1));
        //             break;
        //         case 1:
        //             //will probs just procedurally create a maze locally
        //             // Multiplayer.processMaze(arrayBuffer.slice(1));
        //             break;
        //         case 2:
        //             Multiplayer.processPlayerState(arrayBuffer.slice(1));
        //             break;
        //         case 3:
        //             Multiplayer.processAction(arrayBuffer.slice(1), 3);
        //             break;
        //         case 4:
        //             Multiplayer.processLeft(arrayBuffer.slice(1));
        //             break;
        //     }
        // },
    };

    return Multiplayer;
});
