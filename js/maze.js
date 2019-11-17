var THREE = require('three');
var Utils = require('./Utils.js');
var Player = require('./Player.js');
var ControlState = require('./ControlState.js');
var WorldState = require('./WorldState.js');
var Stats = require('stats.js');
var MessageBuilder = require('./MessageBuilder.js');
var MazeBuilder = require('./MazeBuilder.js');

var messageBuilder = new MessageBuilder();

var mazeBuilder = new MazeBuilder();

var socket = new WebSocket("wss://themaze.io:8000");

var clock = new THREE.Clock();

socket.onopen = () => { socket.send(messageBuilder.hello(username)); }
socket.onmessage = (event) => {
    receive(event.data);
}

var worldState = new WorldState();
var controlState = new ControlState(worldState);
var player = new Player(worldState, controlState, username, new THREE.Vector3(0, Utils.PLAYER_HEIGHT, 0));
var stats = new Stats();

init();
animate();

function init() {
    stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
}

function animate() {
    requestAnimationFrame(animate);
    stats.begin();
    var time = performance.now();
    var delta = clock.getDelta();
    //(time - worldState.prevTime);
    console.log("previousDelta: ", time - worldState.prevTime);
    player.updatePlayer(delta);

    if (time - worldState.prevUpdateTime >= Utils.UPDATE_DELTA && socket.readyState == WebSocket.OPEN && controlState.controls.isLocked) {
        socket.send(messageBuilder.state(player));
        worldState.prevUpdateTime = time;
    }

    worldState.prevTime = time;
    worldState.renderer.render(worldState.scene, worldState.camera);
    stats.end();
}


function processMaze (buffer) {
    var byteArray = new Uint8Array(buffer);
    var mazeArray = byteArray.reduce((array, curr, idx) => {
    var i;
    for (i = 0; i < 8; i++) {
        var type = curr >> (7-i) & 1;
        var overall = idx * 8 + i;
        if ((overall % Utils.MAZE_SIZE) == 0) {
            array.push([type]);
        } else {
            array[Math.floor(overall / Utils.MAZE_SIZE)].push(type);
        }
    }
    return array;
    }, []);
    worldState.mazeMesh = mazeBuilder.build(mazeArray, Utils.MAZE_SIZE, Utils.CELL_SIZE);
    worldState.scene.add(worldState.mazeMesh);
}

function processAction (buffer, code) {
    var dataView = new DataView(buffer);
    var id = dataView.getUint16(0);
    var player = otherPlayers[id];
    if (player != undefined) {
    switch (code) {
        case 3:
            player.velocity.y += Utils.PLAYER_JUMP;
            break;
        default:
            console.log("unrecognized action");
    }
    }
}

function processPlayerState (buffer) {
    var dataView = new DataView(buffer);
    var id = dataView.getUint16(0);
    var isCrouched = dataView.getUint8(2);
    var positionX = dataView.getFloat32(3);
    var positionZ = dataView.getFloat32(7);
    var lookDirectionX = dataView.getFloat32(11);
    var lookDirectionY = dataView.getFloat32(15);
    var lookDirectionZ = dataView.getFloat32(19);
    var otherPlayer = otherPlayers[id];
    var yVelocity = otherPlayer.velocity.y;
    var newVelocity = new THREE.Vector3(positionX - otherPlayer.body.position.x, 0, positionZ-otherPlayer.body.position.z).divideScalar(Utils.UPDATE_DELTA);
    otherPlayer.velocity.copy(newVelocity);
    otherPlayer.velocity.y = yVelocity;
    otherPlayer.lookDirection.x = lookDirectionX;
    otherPlayer.lookDirection.y = lookDirectionY;
    otherPlayer.lookDirection.z = lookDirectionZ;
    otherPlayer.isCrouched = isCrouched;
}


async function receive (blob) {
    var arrayBuffer = await new Response(blob).arrayBuffer();
    var dataView = new DataView(arrayBuffer);
    switch (dataView.getUint8(0)) {
        case 0:
            processIntroduction(arrayBuffer.slice(1));
            break;
        case 1:
            processMaze(arrayBuffer.slice(1));
            break;
        case 2:
            processPlayerState(arrayBuffer.slice(1));
            break;
        case 3:
            processAction(arrayBuffer.slice(1), 3);
            break;
    }
}
