import * as THREE from './three.module.js';
import { PointerLockControls } from './PointerLockControls.js';
import { BasisTextureLoader } from './BasisTextureLoader.js';


var PLAYER_HEIGHT = 10;
var JUMP_SIZE = 100;


var camera, scene, renderer, controls;

var walls = [];

var theta;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var keyDirection = new THREE.Vector3();
var lookDirection = new THREE.Vector3();
var X = new THREE.Vector3(1,0,0);
var Y = new THREE.Vector3(0,1,0);
var Z = new THREE.Vector3(0,0,1);
var XZ = (new THREE.Vector3(1,0,1)).normalize();
var ZX = (new THREE.Vector3(-1,0,1)).normalize();

var rayXPosition = new THREE.Vector3();

var rayX = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 10);
var rayZ = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 10);
var rayXZ = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 10);
var rayZX = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 10);

console.log(X);

init();
animate();

function init() {
  
  
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.y = 10;
  

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xd9edfa );
  scene.fog = new THREE.Fog( 0xd3d3d3, 0, 750 );
  
  var axesHelper = new THREE.AxesHelper( 5 );
  scene.add( axesHelper );

  var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
  light.position.set( 0.5, 1, 0.75 );
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



  var floorGeometry = new THREE.PlaneBufferGeometry( 2000, 2000, 100, 100 );
  floorGeometry.rotateX( - Math.PI / 2 );
  var floorMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.NoColors } );
  floorMaterial.color = new THREE.Color(0x81a68c);

  var floor = new THREE.Mesh( floorGeometry, floorMaterial );
  scene.add( floor );
  

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
        if ( canJump === true ) velocity.y += JUMP_SIZE;
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

  requestAnimationFrame( animate );

  if ( controls.isLocked === true ) {
    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;
    
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 50.0 * delta; // 100.0 = mass

    keyDirection.z = Number(moveForward) - Number(moveBackward);
    keyDirection.x = Number(moveLeft) - Number(moveRight);
    keyDirection.normalize(); 
    
    controls.getDirection(lookDirection);
    lookDirection.projectOnPlane(Y);

    
    if (lookDirection.z > 0) {
      theta = Math.atan(lookDirection.x / lookDirection.z);
    } else if (lookDirection.x > 0) {
      theta = Math.PI/2 + Math.atan(-lookDirection.z/lookDirection.x);
    } else {
      if (lookDirection.x == 0) {
        theta = Math.PI;
      } else {
        theta = -Math.PI/2 - Math.atan(-lookDirection.z/-lookDirection.x);
      }
    }
    
    keyDirection.applyAxisAngle(Y, theta);
    
    velocity.z += keyDirection.z * 500 * delta;
    velocity.x += keyDirection.x * 500 * delta;
  

    
    rayXPosition.copy(camera.position).x -= 5;
    rayX.set(rayXPosition, X);

    
    if (rayX.intersectObjects(walls).length > 0) {
      velocity.x = 0;
    }
    
    
    
    
    camera.position.x += velocity.x*delta;
    camera.position.y += velocity.y*delta;
    camera.position.z += velocity.z*delta;
    

    
    if ( camera.position.y < PLAYER_HEIGHT ) {
      velocity.y = 0;
      camera.position.y = PLAYER_HEIGHT;
      canJump = true;
    }
    prevTime = time;
  }
  renderer.render( scene, camera );
}
