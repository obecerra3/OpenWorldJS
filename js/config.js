// Configure Require.js
var require =
{
    // Default load path for js files
    baseUrl : "js/game",
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
        animator : "./utils/animator",
        collider : "./physics/collider",
        colors : "./utils/colors",
        debug : "./utils/debug",
        eventQ : "./utils/eventQ",
        infoManager : "./multiplayer/infoManager",
        light : "./world/light",
        game : "./game",
        mazeEngine : "./world/mazeEngine",
        messageBuilder : "./multiplayer/messageBuilder",
        multiplayer : "./multiplayer/multiplayer",
        onlinePlayer : "./multiplayer/onlinePlayer",
        physics : "./physics/physics",
        player : "./player",
        playerInputHandler : "./playerInputHandler",
        ray : "./physics/ray",
        states : "./utils/states",
        terrain : "./world/terrain",
        time : "./utils/time",
        utils : "./utils/utils",
        world : "./world/world",
    }
};
