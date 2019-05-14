/*
Currently directly taken from: https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html
*/

var camera, scenex, renderer, controls;

var objects = [];

var raycaster;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();

var mazeBlocks = {};
var maze;
var COL_LEN = 6;
var ROW_LEN = 6;
var WALL_SIZE = 10;
var SPACE_SIZE = 40;


init();
animate();

function init() {

    THREE.Cache.enabled = true;
    loadMaze();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xcce0ff );
    scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );

    var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
    light.position.set( 0.5, 1, 0.75 );
    scene.add( light );

    controls = new THREE.PointerLockControls( camera );

    document.addEventListener( 'click', function () {
        controls.lock();
        drawMaze();
    }, false );

    scene.add( controls.getObject() );

    var onKeyDown = function ( event ) {
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
                if ( canJump === true ) velocity.y += 250;
                canJump = false;
                break;
        }
    };

    var onKeyUp = function ( event ) {
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

    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);

    //cube

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ffff } );
    var cube = new THREE.Mesh( geometry, material );
    scene.add (cube);

    // ground

    var mesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 5000, 5000 ),
        new THREE.MeshPhongMaterial( { color: 0xffffff, depthWrite: false } )
    );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );


    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

}

function loadMaze(data) {
    if (data == null) {
        var loader = new THREE.FileLoader();
        loader.load('assets/maze.txt', loadMaze,
            function (xhr) { console.log((xhr.loaded / xhr.total * 100) + '% loaded'); },
            function (err) { console.error( 'An error happened' ); }
        );
    } else {
        maze = data;
    }

}

function drawMaze() {

    var walls = [];
    key = '0,0';
    mazeBlocks[ key ] = [];

    for ( var i = 0; i < maze.length; i++ ) {
        if ( maze[i] == 1 ) {
            walls = createWalls( i );
            walls.forEach( function ( wall ) {
                scene.add( wall );
                mazeBlocks[ key ].push( wall );
            });
        }
    }

}

function createWalls( i ) {

    var xScale = WALL_SIZE;
    var zScale = WALL_SIZE;
    var DEFAULT_X = (Math.floor(i / COL_LEN) % COL_LEN) * SPACE_SIZE;
    var DEFAULT_Z = (i % COL_LEN) * SPACE_SIZE;
    var xPosition = DEFAULT_X;
    var zPosition = DEFAULT_Z;
    var wallColor = 0x000000;
    var walls = [];

    var checkRight = (i + 1 < maze.length && maze[i + 1] == 1 && Math.floor((i + 1)/ ROW_LEN) == Math.floor(i / ROW_LEN));
    var checkLeft = (i - 1 >= 0 && maze[i - 1] == 1 && Math.floor((i - 1)/ ROW_LEN) == Math.floor(i / ROW_LEN));
    var checkUp = (i + ROW_LEN < maze.length && maze[i + ROW_LEN] == 1);
    var checkDown = (i - ROW_LEN >= 0 && maze[i - ROW_LEN] == 1);

    //set zScale and zPosition for wall1

    if ( checkRight && checkLeft) {
        zScale = SPACE_SIZE;
    } else if ( checkRight ) {
        zScale = (WALL_SIZE / 2) + (SPACE_SIZE / 2);
        zPosition -= (zScale / 2) - (SPACE_SIZE / 2);
    } else if ( checkLeft ) {
        zScale = (WALL_SIZE / 2) + (SPACE_SIZE / 2);
        zPosition += (zScale / 2) - (SPACE_SIZE / 2);
    }

    //set xScale and xPosition for wall2

    if ( checkUp && checkDown ) {
        xScale = SPACE_SIZE;
    } else if ( checkUp ) {
        xScale = (WALL_SIZE / 2) + (SPACE_SIZE / 2);
        xPosition -= (xScale / 2) - (SPACE_SIZE / 2);
    } else if ( checkDown ) {
        xScale = (WALL_SIZE / 2) + (SPACE_SIZE / 2);
        xPosition += (xScale / 2) - (SPACE_SIZE / 2);
    }

    if ( ( checkRight || checkLeft ) && ( checkUp || checkDown ) ) {

        wall1 = new THREE.Mesh(
            new THREE.BoxGeometry( WALL_SIZE, 80, zScale ),
            new THREE.MeshBasicMaterial( { color: wallColor } )
        );
        wall1.position.set( DEFAULT_X, 0, zPosition );
        walls.push(wall1);

        wall2 = new THREE.Mesh(
            new THREE.BoxGeometry( xScale, 80, WALL_SIZE ),
            new THREE.MeshBasicMaterial( { color: wallColor } )
        );
        wall2.position.set( xPosition, 0, DEFAULT_Z );
        walls.push(wall2);

    } else {

        wall = new THREE.Mesh(
            new THREE.BoxGeometry( xScale, 80, zScale ),
            new THREE.MeshBasicMaterial( { color: wallColor } )
        );
        wall.position.set( xPosition, 0, zPosition );
        walls.push(wall);

    }

    return walls;

}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    if ( controls.isLocked === true ) {

        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;

        var intersections = raycaster.intersectObjects( objects );

        var onObject = intersections.length > 0;

        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number(moveForward) - Number( moveBackward);
        direction.x = Number(moveLeft) - Number( moveRight);
        direction.normalize(); // this ensures consistent movements in all directions

        if ( moveForward || moveBackward ) velocity.z -= direction.z * 1000.0 * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 1000.0 * delta;

        if ( onObject === true ) {
            velocity.y = Math.max( 0, velocity.y );
            canJump = true;

        }
        controls.getObject().translateX( velocity.x * delta );
        controls.getObject().position.y += ( velocity.y * delta ); // new behavior
        controls.getObject().translateZ( velocity.z * delta );

        if ( controls.getObject().position.y < 5 ) {
            velocity.y = 0;
            controls.getObject().position.y = 5;
            canJump = true;
        }

        prevTime = time;
    }

    renderer.render( scene, camera );
}