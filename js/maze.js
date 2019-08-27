var THREE = require('three');
var Utils = require('./Utils.js');
var Player = require('./Player.js');
var Controls = require('./Controls.js');
var WorldState = require('./WorldState.js');
var Stats = require('stats.js');

var player = new Player(username, new THREE.Vector3(0,PLAYER_HEIGHT,0), addModelToScene);

var socket = new WebSocket("wss://themaze.io:8000");

socket.onopen = () => { socket.send(messageBuilder.hello(username)); }
socket.onmessage = (event) => {
    receive(event.data);
}

var stats = new Stats();

init();
animate();

function init() {

    stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = PLAYER_HEIGHT;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1f1e33);
    scene.fog = new THREE.Fog(0xa3a3a3, 0, 1000);

    var axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    var light = new THREE.AmbientLight(0x404040);
    scene.add(light);

    var blocker = document.getElementById('blocker');

    blocker.addEventListener( 'click', function () {
        controls.lock();
    }, false );

    controls.addEventListener( 'lock', function () {
        blocker.style.display = 'none';
    });

    controls.addEventListener( 'unlock', function () {
        blocker.style.display = 'block';
    });

    scene.add(controls.getObject());

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    var floorGeometry = new THREE.PlaneBufferGeometry(1000,1000);
    floorGeometry.rotateX(-Math.PI/2);
    var floorMaterial = new THREE.MeshPhongMaterial( { vertexColors: THREE.NoColors } );
    floorMaterial.color = new THREE.Color(0x81a68c);

    floor = new THREE.Mesh( floorGeometry, floorMaterial );
    scene.add(floor);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.gammaInput = true;
    renderer.gammaOutput = true;


    document.body.appendChild(renderer.domElement);

    flashLight = new THREE.SpotLight(0xffffff, 1, 300, 0.5, 0.1, 10.0);
    flashLight.castShadow = true;
    scene.add(flashLight);
    flashLight.visible = true;

    window.addEventListener('resize', onWindowResize, false);
}

function addModelToScene(model) {
    scene.add(model);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    if (controls.isLocked) {
        switch (event.keyCode) {
            case 70:
                flashLight.visible = !flashLight.visible;
                break;
            case 16:
                player.isCrouched = true;
                if ( player.body.position.y > PLAYER_HEIGHT) player.velocity.y -= PLAYER_JUMP;
                break;
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
            case 37: // left
            case 65: // a
                moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            case 32: // space
                if (canJump === true) {
                    player.velocity.y += PLAYER_JUMP;
                    //canJump = false;
                    socket.send(messageBuilder.jump());
                }
                break;
        }
    }
}

function onKeyUp(event) {
    if (controls.isLocked) {
        switch (event.keyCode) {
            case 16:
                player.isCrouched = false;
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    }
}

function inRange (c) {
  return [{x: c.x-1, z: c.z-1},
          {x: c.x-1, z: c.z},
          {x: c.x-1, z: c.z+1},
          {x: c.x, z: c.z-1},
          {x: c.x, z: c.z},
          {x: c.x, z: c.z+1},
          {x: c.x+1, z: c.z-1},
          {x: c.x+1, z: c.z},
          {x: c.x+1, z: c.z+1}];
}


function animate() {
    requestAnimationFrame(animate);
    stats.begin();
    var time = performance.now();
    var delta = (time - prevTime);

    player.animateUpdate(delta, theta, camera, controls, canJump, flashLight, mazeBuilder, moveDirection, moveForward, moveBackward, moveLeft, moveRight, mazeMesh);

    if (time - prevUpdateTime >= UPDATE_DELTA && socket.readyState == WebSocket.OPEN && controls.isLocked) {
        socket.send(messageBuilder.state(player));
        prevUpdateTime = time;
    }

    prevTime = time;
    renderer.render(scene, camera);
    stats.end();
}


function processMaze (buffer) {
    var byteArray = new Uint8Array(buffer);
    var mazeArray = byteArray.reduce((array, curr, idx) => {
    var i;
    for (i = 0; i < 8; i++) {
        var type = curr >> (7-i) & 1;
        var overall = idx * 8 + i;
        if ((overall % MAZE_SIZE) == 0) {
            array.push([type]);
        } else {
            array[Math.floor(overall / MAZE_SIZE)].push(type);
        }
    }
    return array;
    }, []);
    mazeMesh = mazeBuilder.build(mazeArray, MAZE_SIZE, CELL_SIZE);
    scene.add(mazeMesh);
}

function processAction (buffer, code) {
    var dataView = new DataView(buffer);
    var id = dataView.getUint16(0);
    var player = otherPlayers[id];
    if (player != undefined) {
    switch (code) {
        case 3:
            player.velocity.y += PLAYER_JUMP;
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
    var player = otherPlayers[id];
    var yVelocity = player.velocity.y;
    var newVelocity = new THREE.Vector3(positionX-player.body.position.x, 0, positionZ-player.body.position.z).divideScalar(UPDATE_DELTA);
    player.velocity.copy(newVelocity);
    player.velocity.y = yVelocity;
    player.lookDirection.x = lookDirectionX;
    player.lookDirection.y = lookDirectionY;
    player.lookDirection.z = lookDirectionZ;
    player.isCrouched = isCrouched;
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
