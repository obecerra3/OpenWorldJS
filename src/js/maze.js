let Player = require('./Player.js');
let ControlState = require('./ControlState.js');
let WorldState = require('./WorldState.js');
let MessageBuilder = require('./MessageBuilder.js');
let MazeBuilder = require('./MazeBuilder.js');
let InfoManager = require('./InfoManager.js');
let Physics = require('./Physics.js');
let ResourceManager = require('./ResourceManager.js');

let messageBuilder = new MessageBuilder();

let socket = new WebSocket("wss://themaze.io:8000");

let clock = new THREE.Clock();

let eventQueue = [];

socket.onopen = () => { socket.send(messageBuilder.hello(username)); }
socket.onmessage = (event) => {
    receive(event.data);
}

let otherPlayers = {};
let worldState = new WorldState();
let controlState = new ControlState(worldState);
let infoManager = new InfoManager();
let myPlayer;
let physics;
let statsFps = new Stats();
let statsMs = new Stats();
let mazeBuilder = new MazeBuilder();
let resourceManager = new ResourceManager();

//bad bad coupling but everything will look prettier one day
worldState.resourceManager = resourceManager;
resourceManager.worldState = worldState;

Ammo().then((AmmoLib) => {
    Ammo = AmmoLib;
    worldState.Ammo = Ammo;
    init();
});

function init() {
    initStats();
    initPhysics();
    initDebug();

    myPlayer = new Player(worldState, username, new THREE.Vector3(0, Utils.PLAYER_HEIGHT, 0), controlState, physics);

    infoManager.addPlayerInfo(myPlayer, false);

    animate();
}

function initStats() {
    statsFps.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    statsMs.showPanel(1);
    statsFps.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
    statsMs.domElement.style.cssText = 'position:absolute;top:0px;left:80px;';
    document.body.appendChild(statsFps.dom);
    document.body.appendChild(statsMs.dom);
}

function initPhysics() {
    physics = new Physics(worldState);

    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache = new Ammo.btDbvtBroadphase(),
        solver = new Ammo.btSequentialImpulseConstraintSolver();

    worldState.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    worldState.physicsWorld.setGravity(new Ammo.btVector3(0, -Utils.GRAVITY * 100, 0));
    worldState.tempBtTransform = new Ammo.btTransform();

    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(worldState.floor.geometry.parameters.width * 0.5, 1, worldState.floor.geometry.parameters.height * 0.5));
    let body = physics.createRigidBody(worldState.floor, colShape, 0, worldState.floor.position, worldState.floor.quaternion);
    worldState.floor.userData.physicsBody = body;
}

function initDebug() {
    worldState.debugDrawer = new THREE.AmmoDebugDrawer(worldState.scene, worldState.physicsWorld);
    worldState.debugDrawer.enable();
}

function animate() {
    requestAnimationFrame(animate);
    statsFps.begin();
    statsMs.begin();
    let time = performance.now();
    let delta = clock.getDelta();

    worldState.physicsWorld.stepSimulation(delta, 10);
    if (worldState.debugDrawer) worldState.debugDrawer.update();
    physics.update(delta, myPlayer);
    myPlayer.update(delta);

    if (myPlayer.body && time - worldState.prevUpdateTime >= Utils.UPDATE_DELTA && socket.readyState == WebSocket.OPEN && controlState.controls.isLocked) {
        socket.send(messageBuilder.state(myPlayer));
        worldState.prevUpdateTime = time;
    }

    // Object.values(otherPlayers).forEach((p) => {
    //switch this to the physics update from ammo
    //     p.body.position.x += p.velocity.x * delta;
    //     p.body.position.z += p.velocity.z * delta;
    //     p.body.position.y += p.velocity.y * delta;
    // });

    worldState.prevTime = time;
    // console.log(worldState.renderer.info.render.calls);
    worldState.renderer.render(worldState.scene, worldState.camera);

    if (eventQueue.length > 0) {
        let eventObj = eventQueue[0];
        if (eventObj.verify()) {
            eventObj.action.apply(this, eventObj.arguments);
            eventQueue.shift();
        }
    }

    statsFps.end();
    statsMs.end();
}

function processIntroduction (buffer) {
    // console.log("processIntroduction");
    let dataView = new DataView(buffer);
    let id = dataView.getUint8(0);
    // let isHunted = dataView.getUint8(1) != 0;
    let decoder = new TextDecoder("utf-8");
    let username = decoder.decode(buffer.slice(2));
    let player = new Player (worldState, username, new THREE.Vector3());
    otherPlayers[id] = player;
    infoManager.addPlayerInfo(player, false);
    // if (Object.keys(otherPlayers).length == NUM_HUNTERS) {
    //     infoManager.showPlayerClass(myPlayer, otherPlayers);
    // }
    worldState.scene.add(player.body);
}

function processLeft (buffer) {
    // console.log("processLeft");
    let dataView = new DataView(buffer);
    let id = dataView.getUint8(0);
    worldState.scene.remove(otherPlayers[id].body);
    delete otherPlayers[id];
    infoManager.playerLeft(myPlayer, Object.values(otherPlayers));
}


function processMaze (buffer) {
    // console.log("processMaze");
    let byteArray = new Uint8Array(buffer);

    let mazeArray = byteArray.reduce((array, curr, idx) => {
        let i;
        for (i = 0; i < 8; i++) {
            let type = curr >> (7-i) & 1;
            let overall = idx * 8 + i;
            if ((overall % Utils.MAZE_SIZE) == 0) {
                array.push([type]);
            } else {
                array[Math.floor(overall / Utils.MAZE_SIZE)].push(type);
            }
        }
        return array;
    }, []);

    // worldState.mazeMesh =
    mazeBuilder.build(mazeArray, Utils.MAZE_SIZE, Utils.CELL_SIZE, worldState, physics, myPlayer);
    // worldState.scene.add(worldState.mazeMesh);
}

function processAction (buffer, code) {
    // console.log("processAction");
    let dataView = new DataView(buffer);
    let id = dataView.getUint16(0);
    let player = otherPlayers[id];
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
    // console.log("processPlayerState");
    let dataView = new DataView(buffer);
    let id = dataView.getUint16(0);
    let isCrouched = dataView.getUint8(2);
    let positionX = dataView.getFloat32(3);
    let positionZ = dataView.getFloat32(7);
    let lookDirectionX = dataView.getFloat32(11);
    let lookDirectionY = dataView.getFloat32(15);
    let lookDirectionZ = dataView.getFloat32(19);
    let otherPlayer = otherPlayers[id];
    let yVelocity = otherPlayer.velocity.y;
    let newVelocity = new THREE.Vector3(positionX - otherPlayer.body.position.x, 0, positionZ - otherPlayer.body.position.z).divideScalar(Utils.UPDATE_DELTA);
    otherPlayer.velocity.copy(newVelocity);
    otherPlayer.velocity.y = yVelocity;
    otherPlayer.lookDirection.x = lookDirectionX;
    otherPlayer.lookDirection.y = lookDirectionY;
    otherPlayer.lookDirection.z = lookDirectionZ;
    otherPlayer.isCrouched = isCrouched;
}


async function receive (blob) {
    // console.log("receive");
    let arrayBuffer = await new Response(blob).arrayBuffer();
    let dataView = new DataView(arrayBuffer);
    switch (dataView.getUint8(0)) {
        case 0:
            processIntroduction(arrayBuffer.slice(1));
            break;
        case 1:
            if (myPlayer.body) {
                processMaze(arrayBuffer.slice(1));
            } else {
                eventQueue.push({
                    verify: () => { return myPlayer.body; },
                    action: processMaze,
                    arguments: [arrayBuffer.slice(1)]
                });
            }
            break;
        case 2:
            processPlayerState(arrayBuffer.slice(1));
            break;
        case 3:
            processAction(arrayBuffer.slice(1), 3);
            break;
        case 4:
            processLeft(arrayBuffer.slice(1));
            break;
    }
}
