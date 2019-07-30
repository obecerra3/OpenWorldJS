import * as THREE from './three.js';
import { PointerLockControls } from './pointerlock.js';

import * as Utils from './Utils.js'
import { Player } from './Player.js';
import { MazeBuilder } from './MazeBuilder.js';
import { Collider } from './Collider.js';
import { MessageBuilder } from './MessageBuilder.js';


const PLAYER_HEIGHT = 10;
const PLAYER_SIZE = 5;
const PLAYER_MASS = 0.00005;
const PLAYER_SPEED = 0.0005;
const PLAYER_JUMP = 0.1;
const GRAVITY = 9.8;
const CELL_SIZE = 12;
const UPDATE_DELTA = 100.0;
const CHUNK_REQUEST_DELTA = 3000;
const CHUNK_SIZE = 27;

const Y = new THREE.Vector3(0,1,0);

var camera, scene, renderer, controls, theta;

var currentChunk = new THREE.Object3D();
var onDisplay = new Set();

var otherPlayers = {};

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevUpdateTime = -UPDATE_DELTA;
var prevChunkRequestTime = 0;
var prevPosition = new THREE.Vector3();
var prevLookDirection = new THREE.Vector3();
var prevTime = performance.now();
var moveDirection = new THREE.Vector3();

var mazeBuilder = new MazeBuilder();
var messageBuilder = new MessageBuilder();
var collider = new Collider(PLAYER_SIZE);
var player = new Player (Utils.makeid(5), new THREE.Vector3(0,PLAYER_HEIGHT,0));

var spotLight;

console.log(player.username); 

var socket = new WebSocket("ws://localhost:8000");

socket.onopen = () => { socket.send(messageBuilder.introduction(player)); }
socket.onmessage = (event) => { 
  receive(event.data);
}

var stats = new Stats();

init();
animate();

function init() {
  
  stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild( stats.dom );


  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.y = PLAYER_HEIGHT;
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9edfa);
  scene.fog = new THREE.Fog(0xd3d3d3, 0, 750);
  
  var axesHelper = new THREE.AxesHelper(10);
  scene.add(axesHelper);

  var light = new THREE.AmbientLight( 0x404040 );
  scene.add( light );

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.gammaInput = true;
  renderer.gammaOutput = true;


  document.body.appendChild( renderer.domElement );
  
  spotLight = new THREE.SpotLight( 0xffffff, 1 );
  spotLight.position.set( 0, 100, 0 );
  spotLight.penumbra = 0.05;
  spotLight.decay = 1;
  spotLight.distance = 500;

  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  spotLight.shadow.camera.near = 10;
  spotLight.shadow.camera.far = 200;
  scene.add( spotLight );
  
//  var geometry1 = new THREE.BoxGeometry( 1, 80, 1 );
//  var material = new THREE.MeshPhongMaterial( { color: 0x4080ff, dithering: true } );
//  var wall1 = new THREE.Mesh( geometry1, material );
//  wall1.position.x = -120;
//  wall1.position.z = -120;

//  scene.add(wall1);
  
  scene.add(player.body);
  

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
        player.velocity.y -= PLAYER_JUMP;
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
          //canJump = false;
          socket.send(messageBuilder.jump());
        } 
        break;
    }
}

function onKeyUp ( event ) {
    switch ( event.keyCode ) {
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

function inRange (c) {
  return [{x: c.x-1, z: c.z-1},
          {x: c.x-1, z: c.z},
          {x: c.x-1, z: c.z+1},
          {x: c.x,   z: c.z-1},
          {x: c.x,   z: c.z},
          {x: c.x,   z: c.z+1},
          {x: c.x+1, z: c.z-1},
          {x: c.x+1, z: c.z},
          {x: c.x+1, z: c.z+1}];
}


function animate() {

  requestAnimationFrame(animate);
  stats.begin();
  var time = performance.now();
  var delta = (time - prevTime);
  player.velocity.x -= player.velocity.x * 0.01 * delta;
  player.velocity.z -= player.velocity.z * 0.01 * delta;
  player.velocity.y -= player.velocity.y * 0.01 * delta;
  
  
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
  
  var playerChunk = player.getCurrentChunk(CELL_SIZE, CHUNK_SIZE);
  var currentChunk = mazeBuilder.chunks.get(Utils.pair(playerChunk.x, playerChunk.z));
  if (currentChunk != undefined) collider.collide(player, currentChunk.wallMesh);  
  

  player.body.position.x += player.velocity.x*delta;
  player.body.position.y += player.velocity.y*delta;
  player.body.position.z += player.velocity.z*delta;
  
  camera.position.x = player.body.position.x;
  camera.position.z = player.body.position.z;
  
  
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
  
  
  if (time - prevChunkRequestTime >= CHUNK_REQUEST_DELTA) {

//      var ir = inRange(playerChunk);
//      var inRangeKeys = new Set(ir.map((coord)=>Utils.pair(coord.x, coord.z)));
//      var toRemove = [...onDisplay].filter((key)=>!inRangeKeys.has(key));
//      toRemove.forEach((key)=>{
//        var child = mazeBuilder.chunks.get(key).wallMesh;
//        scene.remove(child);
//        onDisplay.delete(key); 
//      })
//      
//      ir.forEach((coord)=>{
//        var key = Utils.pair(coord.x, coord.z);
//        var chunkObj = mazeBuilder.chunks.get(key);
//        if (chunkObj) {
//          if (!onDisplay.has(key)) {
//            scene.add(chunkObj.wallMesh);
//            onDisplay.add(key);
//          }
//        }
//      });
      prevChunkRequestTime = time;
  } 

  
  
  if (time - prevUpdateTime >= UPDATE_DELTA && socket.readyState == WebSocket.OPEN && controls.isLocked) {
    socket.send(messageBuilder.state(player));
    prevUpdateTime = time;
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
  });
  prevTime = time;
  renderer.render( scene, camera );
  stats.end();
}


function processChunk (buffer) {
  var byteArray = new Int8Array(buffer);
  var chunkX = byteArray[0];
  var chunkZ = byteArray[1];
  var chunkArray = byteArray.slice(2).reduce((array, curr, idx) => { 
    if (idx % CHUNK_SIZE == 0) {
      array.push([parseInt(curr)]);
      return array;
    } else {
      array[Math.floor(idx / CHUNK_SIZE)].push(parseInt(curr));
      return array; 
    }
  }, []);
  var newWallMesh = mazeBuilder.buildChunk({x: chunkX, z: chunkZ}, chunkArray, CHUNK_SIZE, CELL_SIZE);
  onDisplay.add(Utils.pair(chunkX, chunkZ));
  scene.add(newWallMesh);
}

function processAction (buffer, code) {
  var dataView = new DataView(buffer);
  var id = dataView.getUint16(0);
  var player = otherPlayers[id];
  switch (code) {
    case 3:
      player.velocity.y += PLAYER_JUMP;
      break;
    default:
      console.log("unrecognized action");
  }
}

function processPlayerState (buffer, isNew) {
  if (isNew) {
    var decoder = new TextDecoder("utf-8");
    var dataView = new DataView(buffer);
    var id = dataView.getUint16(0);
    var usernameLength = dataView.getUint8(2);
    var username = decoder.decode(buffer.slice(3, usernameLength+3));
    var isCrouched = dataView.getUint8(usernameLength+3);
    var positionX = dataView.getFloat32(usernameLength+4);
    var positionZ = dataView.getFloat32(usernameLength+8);
    var lookDirectionX = dataView.getFloat32(usernameLength+12);
    var lookDirectionY = dataView.getFloat32(usernameLength+16);
    var lookDirectionZ = dataView.getFloat32(usernameLength+20);
    var player = new Player(username, new THREE.Vector3(positionX, PLAYER_HEIGHT, positionZ), new THREE.Vector3(0, 0, 0), new THREE.Vector3(lookDirectionX, lookDirectionY, lookDirectionZ), isCrouched);
    otherPlayers[id] = player;
    scene.add(player.body);
  } else {
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
}


async function receive (blob) {
  var arrayBuffer = await new Response(blob).arrayBuffer();
  var dataView = new DataView(arrayBuffer);
  switch (dataView.getUint8(0)) {
    case 0:
      processChunk(arrayBuffer.slice(1));
      break;
    case 1:
      processPlayerState(arrayBuffer.slice(1), true);
      break;
    case 2:
      processPlayerState(arrayBuffer.slice(1), false);
      break;
    case 3:
      processAction(arrayBuffer.slice(1), 3);
      break;
  }
}



