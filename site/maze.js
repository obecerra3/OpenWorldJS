import * as THREE from './js/THREE.js';
import { PointerLockControls } from './js/PointerLockControls.js';
import { BasisTextureLoader } from './js/BasisTextureLoader.js';
import { Player } from './js/Player.js';

const PLAYER_HEIGHT = 10;
const PLAYER_SIZE = 5;
const PLAYER_MASS = 50.0;
const PLAYER_SPEED = 500.0;
const PLAYER_JUMP = 100;
const GRAVITY = 9.8;

var camera, scene, renderer, controls, theta;

var walls = [];
var intersections = [];

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var updateDelta = 1000; // millisecond update interval

var prevUpdateTime = 0;
var prevPosition = new THREE.Vector3();
var prevLookDirection = new THREE.Vector3();
var prevTime = performance.now();
var moveDirection = new THREE.Vector3();

var Y = new THREE.Vector3(0,1,0);
var XZ = (new THREE.Vector3(1,0,1)).normalize();
var _XZ = (new THREE.Vector3(-1,0,1)).normalize();
var X_Z = (new THREE.Vector3(1,0,-1)).normalize();
var _X_Z = (new THREE.Vector3(-1,0,-1)).normalize();

var raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, PLAYER_SIZE);

var player = new Player ("boris");
var socket = new WebSocket("ws://localhost:8000");
socket.onopen = () => { socket.send(player.username); }

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
  var material = new THREE.MeshBasicMaterial(  );
  var wall1 = new THREE.Mesh( geometry1, material );
  var wall2 = new THREE.Mesh( geometry2, material );
  wall1.position.z = -100;
  wall2.position.z = -50;
  wall2.position.x = 25;
  
  walls.push(wall1);
  walls.push(wall2);
  scene.add(wall1);
  scene.add(wall2);
  
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
        if ( canJump === true ) player.velocity.y += PLAYER_JUMP;
        canJump = false;
        break;
    }
}

function onKeyUp ( event ) {
    switch ( event.keyCode ) {
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
  if ( controls.isLocked === true ) {
    var time = performance.now();
    var delta = (time - prevTime) / 1000;
    
    player.velocity.x -= player.velocity.x * 10.0 * delta;
    player.velocity.z -= player.velocity.z * 10.0 * delta;
    player.velocity.y -= GRAVITY * PLAYER_MASS * delta; 

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
    
    
    raycaster.ray.origin.copy(camera.position);
  
    raycaster.ray.direction.copy(XZ);
    intersections = intersections.concat(raycaster.intersectObjects(walls));
    raycaster.ray.direction.copy(X_Z);
    intersections = intersections.concat(raycaster.intersectObjects(walls));
    raycaster.ray.direction.copy(_XZ);
    intersections = intersections.concat(raycaster.intersectObjects(walls));
    raycaster.ray.direction.copy(_X_Z);
    intersections = intersections.concat(raycaster.intersectObjects(walls));

    if (intersections.length > 0) {
      intersections.forEach((x)=> {
        if (x.face.normal.dot(player.velocity) < 0) {
          player.velocity.projectOnPlane(x.face.normal);
        }
      });
    }  
    
    intersections = [];
  
    camera.position.x += player.velocity.x*delta;
    camera.position.y += player.velocity.y*delta;
    camera.position.z += player.velocity.z*delta;
    
    if (camera.position.y < PLAYER_HEIGHT) {
      player.velocity.y = 0;
      camera.position.y = PLAYER_HEIGHT;
      canJump = true;
    }
    
    prevTime = time;
    
    player.position.copy(camera.position);
    
  
    if (time - prevUpdateTime > updateDelta && (!prevPosition.equals(player.position) || !prevLookDirection.equals(player.lookDirection))) {
      socket.send(player.state);
      prevUpdateTime = time;
    }
    
    prevPosition.copy(player.position);
    prevLookDirection.copy(player.lookDirection);
  }
  renderer.render( scene, camera );
}

