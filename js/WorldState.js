var Three = require('three');
var Utils = require('./Utils.js');

//var camera, scene, renderer, theta, mazeMesh;

class WorldState {
    constructor() {

        this.camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.y = Utils.PLAYER_HEIGHT;

        this.mazeMesh = null;

        this.scene = new Three.Scene();
        this.scene.background = new Three.Color(0x1f1e33);
        this.scene.fog = new Three.Fog(0xa3a3a3, 0, 1000);

        var axesHelper = new Three.AxesHelper(10);
        this.scene.add(axesHelper);

        var light = new Three.AmbientLight(0x404040);
        this.scene.add(light);

        this.otherPlayers = {};

        this.prevUpdateTime = -Utils.UPDATE_DELTA;
        this.prevTime = performance.now();

        var floorGeometry = new Three.PlaneBufferGeometry(1000,1000);
        floorGeometry.rotateX(-Math.PI/2);
        var floorMaterial = new Three.MeshPhongMaterial( { vertexColors: Three.NoColors } );
        floorMaterial.color = new Three.Color(0x81a68c);

        this.floor = new Three.Mesh(floorGeometry, floorMaterial);
        this.scene.add(this.floor);

        this.renderer = new Three.WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = Three.PCFSoftShadowMap;

        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        this.renderer.gammaFactor = 2.2;
        document.body.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);
    }
}

module.exports = WorldState;
