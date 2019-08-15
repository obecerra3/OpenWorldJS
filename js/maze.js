var THREE = require('three');
var Utils = require('./Utils.js');
var Player = require('./Player.js');
var MazeBuilder = require('./MazeBuilder.js');
var Collider = require('./Collider.js');
var MessageBuilder = require('./MessageBuilder.js');
var Stats = require('stats.js');
var PointerLockControls = require('pointerlockcontrols');

const PLAYER_HEIGHT = 10;
const PLAYER_SIZE = 5;
const PLAYER_MASS = 0.00005;
const PLAYER_SPEED = 0.0005;
const PLAYER_JUMP = 0.1;
const GRAVITY = 9.8;
const CELL_SIZE = 12;
const UPDATE_DELTA = 100.0;
const MAZE_SIZE = 55;

const Y = new THREE.Vector3(0,1,0);

var camera, scene, renderer, controls, theta, mazeMesh;

var otherPlayers = {};

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevUpdateTime = -UPDATE_DELTA;
var prevPosition = new THREE.Vector3();
var prevLookDirection = new THREE.Vector3();
var prevTime = performance.now();
var moveDirection = new THREE.Vector3();

var mazeBuilder = new MazeBuilder();
var messageBuilder = new MessageBuilder();
var collider = new Collider(PLAYER_SIZE);

var player = new Player(username, new THREE.Vector3(0,PLAYER_HEIGHT,0), addModelToScene);

var flashLight, floor;

console.log(player.username);

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

    controls = new PointerLockControls(camera);

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

    player.animateUpdate(delta, theta, camera, controls, canJump, flashLight, mazeBuilder, moveDirection, moveForward, moveBackward, moveLeft, moveRight);

    if (time - prevChunkRequestTime >= CHUNK_REQUEST_DELTA) {
        var playerChunk = player.getCurrentChunk(CELL_SIZE, CHUNK_SIZE);
        var ir = inRange(playerChunk);
        var inRangeKeys = new Set(ir.map((coord)=>Utils.pair(coord.x, coord.z)));
        var toRemove = [...onDisplay].filter((key)=>!inRangeKeys.has(key));
        toRemove.forEach((key) => {
            var child = mazeBuilder.chunks.get(key);
            child.wallMesh.visible = false;
            onDisplay.delete(key);
        });

        ir.forEach((coord) => {
            var key = Utils.pair(coord.x, coord.z);
            var chunkObj = mazeBuilder.chunks.get(key);
            if (chunkObj) {
                if (!onDisplay.has(key)) {
                    chunkObj.wallMesh.visible = true;
                    onDisplay.add(key);
                }
            }
        });
        floor.position.x =  player.body.position.x;
        floor.position.z =  player.body.position.z;
        prevChunkRequestTime = time;
    }
  }
  moveDirection.applyAxisAngle(Y, theta);

  player.velocity.z += moveDirection.z * PLAYER_SPEED * delta;
  player.velocity.x += moveDirection.x * PLAYER_SPEED * delta;

  if (mazeMesh != undefined) { collider.collide(player, mazeMesh); }

  player.body.position.x += player.velocity.x*delta;
  player.body.position.y += player.velocity.y*delta;
  player.body.position.z += player.velocity.z*delta;

  camera.position.x = player.body.position.x;
  camera.position.z = player.body.position.z;

  flashLight.position.copy(camera.position);

  flashLight.position.y -= 1;
  flashLight.position.x += player.lookDirection.x*3.0;
  flashLight.position.z += player.lookDirection.z*3.0;

  flashLight.target.position.set(flashLight.position.x + player.lookDirection.x,
                                 flashLight.position.y + player.lookDirection.y,
                                 flashLight.position.z + player.lookDirection.z);

  flashLight.target.updateMatrixWorld();


  if (player.isCrouched) {
    camera.position.y -= Math.min(0.75, camera.position.y-PLAYER_HEIGHT/2);
  } else {
    camera.position.y += Math.min(0.75, PLAYER_HEIGHT-camera.position.y);
  }


  if (player.body.position.y <= PLAYER_HEIGHT) {
    if (!player.isCrouched) {
      canJump = true;
    }
    player.velocity.y = 0;
  } else {
//    player.velocity.y -= GRAVITY*PLAYER_MASS*delta;
    camera.position.y = player.body.position.y;
  }



  if (time - prevUpdateTime >= UPDATE_DELTA && socket.readyState == WebSocket.OPEN && controls.isLocked) {
    socket.send(messageBuilder.state(player));
    prevUpdateTime = time;
  }

  prevTime = time;
  renderer.render( scene, camera );
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
