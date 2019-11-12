var THREE = require('three');
var Utils = require('./Utils.js');
var MazeBuilder = require('./MazeBuilder.js');
var MessageBuilder = require('./MessageBuilder.js');

//var camera, scene, renderer, theta, mazeMesh;

class WorldState {
    constructor() {

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.y = Utils.PLAYER_HEIGHT;

        this.mazeMesh = null;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1f1e33);
        this.scene.fog = new THREE.Fog(0xa3a3a3, 0, 1000);

        var axesHelper = new THREE.AxesHelper(10);
        this.scene.add(axesHelper);

        var light = new THREE.AmbientLight(0x404040);
        this.scene.add(light);

        this.otherPlayers = {};

        this.mazeBuilder = new MazeBuilder();
        this.messageBuilder = new MessageBuilder();

        this.prevUpdateTime = -Utils.UPDATE_DELTA;
        this.prevTime = performance.now();

        var floorGeometry = new THREE.PlaneBufferGeometry(1000,1000);
        floorGeometry.rotateX(-Math.PI/2);
        var floorMaterial = new THREE.MeshPhongMaterial( { vertexColors: THREE.NoColors } );
        floorMaterial.color = new THREE.Color(0x81a68c);

        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.scene.add(this.floor);

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        document.body.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);
    }
}

module.exports = WorldState;
