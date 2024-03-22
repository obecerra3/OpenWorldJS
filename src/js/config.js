// Configure Require.js
var require =
{
    // Default load path for js files
    baseUrl : "js/maze",
    shim :
    {
        "threeCore" : { exports : "THREE" },
        "detector" : { exports : "Detector" },
        "stats" : { exports : "Stats" },
        "ImprovedNoise": { exports: "ImprovedNoise" },
    },
    paths :
    {
        //libraries
        ammo : "../lib/ammo",
        ammoDebugDrawer : "../lib/AmmoDebugDrawer",
        detector : "../lib/Detector",
        dracoLoader : "../lib/draco/DRACOLoader",
        gltfLoader : "../lib/GLTFLoader",
        GPUComputationRenderer : "../lib/GPUComputationRenderer",
        ImprovedNoise : "../lib/ImprovedNoise",
        pointerLockControls : "../lib/PointerLockControls",
        stats : "../lib/stats.min",
        text : "../lib/text",
        three : "../lib/three",
        threeCore : "../lib/three.min",

        //this is how we access the shaders we write
        shader : "../lib/shader",
        shaders : "../shaders",

        //game code
        animator : "./utils/Animator",
        collider : "./physics/Collider",
        colors : "./utils/Colors",
        debug : "./utils/Debug",
        eventQ : "./utils/EventQ",
        game : "./multiplayer/Game",
        infoManager : "./multiplayer/InfoManager",
        light : "./world/Light",
        mazeEngine : "./world/MazeEngine",
        messageBuilder : "./multiplayer/MessageBuilder",
        multiplayer : "./multiplayer/Multiplayer",
        onlinePlayer : "./multiplayer/OnlinePlayer",
        physics : "./physics/Physics",
        player : "./player/Player",
        playerInputHandler : "./player/playerInputHandler",
        ray : "./physics/Ray",
        skybox : "./world/SkyBox",
        states : "./utils/States",
        terrain : "./world/Terrain",
        time : "./utils/Time",
        utils : "./utils/Utils",
        world : "./world/World",
    }
};
