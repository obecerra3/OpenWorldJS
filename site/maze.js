import * as THREE from './js/three.min.js';
import { PointerLockControls } from './js/PointerLockControls.js';
import { BasisTextureLoader } from './js/BasisTextureLoader.js';
import { Player } from './js/Player.js';
import { MazeBuilder } from './js/MazeBuilder.js';
import { Collider } from './js/Collider.js';
import { MessageBuilder } from './js/MessageBuilder.js';

const PLAYER_HEIGHT = 10;
const PLAYER_SIZE = 5;
const PLAYER_MASS = 0.00005;
const PLAYER_SPEED = 0.0005;
const PLAYER_JUMP = 0.1;
const GRAVITY = 9.8;
const MAZE_INFLATION = 10;
const UPDATE_DELTA = 100.0;
const CHUNK_REQUEST_DELTA = 5000;
const CHUNK_SIZE = 27;

const Y = new THREE.Vector3(0,1,0);

var camera, scene, renderer, controls, theta;

var walls = [];
var chunks = new Set();
var otherPlayers = {};


var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevUpdateTime = -UPDATE_DELTA;
var prevChunkRequestTime = -CHUNK_REQUEST_DELTA;
var prevPosition = new THREE.Vector3();
var prevLookDirection = new THREE.Vector3();
var prevTime = performance.now();
var moveDirection = new THREE.Vector3();

var mazeBuilder = new MazeBuilder();
var messageBuilder = new MessageBuilder();
var collider = new Collider(PLAYER_SIZE);
var player = new Player (makeid(5), new THREE.Vector3(0,0,0));


console.log(player.username); 

var socket = new WebSocket("ws://localhost:8000");

socket.onopen = () => { socket.send(messageBuilder.introduction(player)); }
socket.onmessage = (event) => { 
  receive(event.data);
}


init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.y = PLAYER_HEIGHT;
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9edfa);
  scene.fog = new THREE.Fog(0xd3d3d3, 0, 750);
  
  var axesHelper = new THREE.AxesHelper(10);
  scene.add(axesHelper);

  var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  controls = new PointerLockControls( camera );

  var blocker = document.getElementById( 'blocker' );

  blocker.addEventListener( 'click', function () {
    controls.lock();
  }, false );

  controls.addEventListener( 'lock', function () {
    blocker.style.display = 'none';
  } );

  controls.addEventListener( 'unlock', function () {
    blocker.style.display = 'block';
  } );

  scene.add(controls.getObject());

  document.addEventListener( 'keydown', onKeyDown, false );
  document.addEventListener( 'keyup', onKeyUp, false );

  var floorGeometry = new THREE.PlaneBufferGeometry(2000, 2000, 100, 100);
  floorGeometry.rotateX(-Math.PI/2);
  var floorMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.NoColors } );
  floorMaterial.color = new THREE.Color(0x81a68c);

  var floor = new THREE.Mesh( floorGeometry, floorMaterial );
  scene.add(floor);
  
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
  
  var loader = new BasisTextureLoader();
  loader.setTranscoderPath( '../textures/' );
  loader.detectSupport( renderer );
  
  var geometry1 = new THREE.BoxGeometry( 100, 50, 5 );
  var geometry2 = new THREE.BoxGeometry( 5, 50, 100);
  
  var material = new THREE.MeshBasicMaterial( );
  var wall1 = new THREE.Mesh( geometry1, material );
  var wall2 = new THREE.Mesh( geometry2, material );
  wall1.position.z = -100;
  wall2.position.z = -50;
  wall2.position.x = 25;
  
  walls.push(wall1);
  walls.push(wall2);
  scene.add(wall1);
  scene.add(wall2);
  
  scene.add(player.body);

  
  loader.load( '../textures/PavingStones.basis', function ( texture ) {
    texture.encoding = THREE.sRGBEncoding;
    material.map = texture;
    material.needsUpdate = true;
  }, undefined, function ( error ) {
    console.error( error );
  } );
  window.addEventListener( 'resize', onWindowResize, false );
}


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function onKeyDown( event ) {
    switch ( event.keyCode ) {
      case 16:
        player.isCrouched = true;
        socket.send(messageBuilder.crouch());
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
        if ( canJump === true ) {
          player.velocity.y += PLAYER_JUMP;
          canJump = false;
          socket.send(messageBuilder.jump());
        } 
        break;
    }
}

function onKeyUp ( event ) {
    switch ( event.keyCode ) {
      case 16:
        player.isCrouched = false;
        socket.send(messageBuilder.unCrouch());
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

function animate() {
  requestAnimationFrame(animate);
  var time = performance.now();
  var delta = (time - prevTime);
  if ( controls.isLocked === true ) {
    player.velocity.x -= player.velocity.x * 0.01 * delta;
    player.velocity.z -= player.velocity.z * 0.01 * delta;

    moveDirection.z = Number(moveForward) - Number(moveBackward);
    moveDirection.x = Number(moveLeft) - Number(moveRight);
    moveDirection.normalize(); 
    
    controls.getDirection(player.lookDirection);
    
    if (player.lookDirection.z > 0) {
      theta = Math.atan(player.lookDirection.x / player.lookDirection.z);
    } else if (player.lookDirection.x > 0) {
      theta = Math.PI/2 + Math.atan(-player.lookDirection.z/player.lookDirection.x);
    } else {
      if (player.lookDirection.x == 0) {
        theta = Math.PI;
      } else {
        theta = -Math.PI/2 - Math.atan(-player.lookDirection.z/-player.lookDirection.x);
      }
    }
    moveDirection.applyAxisAngle(Y, theta);
  
    player.velocity.z += moveDirection.z * PLAYER_SPEED * delta;
    player.velocity.x += moveDirection.x * PLAYER_SPEED * delta;
    
    collider.collide(player, walls);  
  
    camera.position.x += player.velocity.x*delta;
    camera.position.y += player.velocity.y*delta;
    camera.position.z += player.velocity.z*delta;
  
    
    if (camera.position.y <= (player.isCrouched ? PLAYER_HEIGHT / 2 : PLAYER_HEIGHT)) {
      player.velocity.y = 0;
      if (!player.isCrouched) {
        canJump = true;
      }
    } else {
      player.velocity.y -= GRAVITY * PLAYER_MASS*delta;
    }
    
    
    if (!player.isCrouched && camera.position.y < PLAYER_HEIGHT) { 
      camera.position.y += Math.min(0.75, PLAYER_HEIGHT-camera.position.y);
    }
    
    player.body.position.copy(camera.position);
    
    if (time - prevChunkRequestTime >= CHUNK_REQUEST_DELTA && CHUNK_SIZE) {
        var chunkX = Math.round(player.body.position.x / (MAZE_INFLATION*CHUNK_SIZE));
        var chunkZ = Math.round(player.body.position.z / (MAZE_INFLATION*CHUNK_SIZE));
        if (!chunks.has(pair(chunkX, chunkZ))) {
          prevChunkRequestTime = time;
          socket.send(messageBuilder.chunkRequest({x: chunkX, z: chunkZ}, player, MAZE_INFLATION, CHUNK_SIZE));
        }
    } 
    
    if (time - prevUpdateTime >= UPDATE_DELTA) {
      socket.send(messageBuilder.state(player));
      prevUpdateTime = time;
    }
  
  }
  Object.values(otherPlayers).forEach((p) => {
    p.body.position.x += p.velocity.x*delta;
    p.body.position.z += p.velocity.z*delta;
    p.body.position.y += p.velocity.y*delta;
  
    if (p.isCrouched) {
      p.body.scale.y = 0.5;
    } else {
      p.body.scale.y = 1.0;
    }
    
    if (p.body.position.y <= PLAYER_HEIGHT) {
      p.velocity.y = 0;
      p.body.position.y = PLAYER_HEIGHT;
    } else {
      p.velocity.y -= GRAVITY * PLAYER_MASS * delta;
    }
    
//    if (!p.isCrouched && p.body.position.y < PLAYER_HEIGHT) { 
//      p.body.position.y += Math.min(0.75, PLAYER_HEIGHT-p.body.position.y);
//    }
    
    
    
    
  });
  prevTime = time;
  renderer.render( scene, camera );
}

function processChunk (buffer) {
  var byteArray = new Uint8Array(buffer);
  var chunkX = byteArray[0];
  var chunkZ = byteArray[1];
  chunks.add(pair(chunkX, chunkZ));
  var chunkArray = byteArray.slice(2).reduce((array, curr, idx) => { 
    if (idx % CHUNK_SIZE == 0) {
      array.push([parseInt(curr)]);
      return array;
    } else {
      array[Math.floor(idx / CHUNK_SIZE)].push(parseInt(curr));
      return array; 
    }
  }, []);
  mazeBuilder.buildChunk({x: chunkX, z: chunkZ}, chunkArray, CHUNK_SIZE, MAZE_INFLATION);
}

function updatePlayer (player, positionX, positionZ, lookDirectionX, lookDirectionY, lookDirectionZ) {
  var yVelocity = player.velocity.y;
  var newVelocity = new THREE.Vector3(positionX-player.body.position.x, 0, positionZ-player.body.position.z).divideScalar(UPDATE_DELTA);
  player.velocity.copy(newVelocity);
  player.velocity.y = yVelocity;
  player.lookDirection.x = lookDirectionX;
  player.lookDirection.y = lookDirectionY;
  player.lookDirection.z = lookDirectionZ;
}

function processPlayerState (buffer) {
  var decoder = new TextDecoder("utf-8");
  var dataView = new DataView(buffer);
  var usernameLength = dataView.getUint8(0);
  var username = decoder.decode(buffer.slice(1, usernameLength+1));
  var positionX = dataView.getFloat32(usernameLength+1);
  var positionZ = dataView.getFloat32(usernameLength+5);
  var lookDirectionX = dataView.getFloat32(usernameLength+9);
  var lookDirectionY = dataView.getFloat32(usernameLength+13);
  var lookDirectionZ = dataView.getFloat32(usernameLength+17);
  var player;
  if ((player = otherPlayers[username]) != undefined) {
    updatePlayer(player, positionX, positionZ, lookDirectionX, lookDirectionY, lookDirectionZ);
  } else {
    otherPlayers[username] = new Player(username, new THREE.Vector3(positionX, PLAYER_HEIGHT, positionZ), new THREE.Vector3(0, 0, 0), new THREE.Vector3(lookDirectionX, lookDirectionY, lookDirectionZ));
    scene.add(otherPlayers[username].body);
  }
}


function processJump(buffer) {
  var decoder = new TextDecoder("utf-8");
  var dataView = new DataView(buffer);
  var usernameLength = dataView.getUint8(0);
  var username = decoder.decode(buffer.slice(1, usernameLength+1));
  var player;
  if ((player = otherPlayers[username]) != undefined) {
    player.velocity.y += PLAYER_JUMP;
  }
}

function processCrouch (buffer) {
  var decoder = new TextDecoder("utf-8");
  var dataView = new DataView(buffer);
  var usernameLength = dataView.getUint8(0);
  var username = decoder.decode(buffer.slice(1, usernameLength+1));
  var player;
  if ((player = otherPlayers[username]) != undefined) {
    player.isCrouched = true;
  }
}


function processUnCrouch(buffer) {
  var decoder = new TextDecoder("utf-8");
  var dataView = new DataView(buffer);
  var usernameLength = dataView.getUint8(0);
  var username = decoder.decode(buffer.slice(1, usernameLength+1));
  var player;
  if ((player = otherPlayers[username]) != undefined) {
    player.isCrouched = false;
  }  
}


async function receive (blob) {
  var arrayBuffer = await new Response(blob).arrayBuffer();
  var dataView = new DataView(arrayBuffer);
  switch (dataView.getUint8(0)) {
    case 0:
      processChunk(arrayBuffer.slice(1));
      break;
    case 1:
      processPlayerState(arrayBuffer.slice(1));
      break;
    case 2:
      processJump(arrayBuffer.slice(1));
      break;
    case 3:
      processCrouch(arrayBuffer.slice(1));
      break;
    case 4:
      processUnCrouch(arrayBuffer.slice(1));
      break;
    default: 
      console.log("I got something weird");
  }
}


/* http://szudzik.com/ElegantPairing.pdf */
function pair (a, b) {
  var A = a >= 0 ? 2 * a : -2 * a - 1;
  var B = b >= 0 ? 2 * b : -2 * b - 1;
  return A >= B ? A * A + A + B : A + B * B;
}

function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
