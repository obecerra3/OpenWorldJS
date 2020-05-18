// Configure Require.js
var require = {
    // Default load path for js files
    baseUrl: "js/maze",
    shim: {
        "threeCore": { exports: "THREE" },
        "detector": { exports: "Detector" },
        "stats": { exports: "Stats" }
    },
    paths: {
        //libraries
        ammo: "../lib/ammo",
        ammoDebugDrawer: "../lib/AmmoDebugDrawer",
        detector: "../lib/Detector",
        gltfLoader: "../lib/GLTFLoader",
        pointerLockControls: "../lib/PointerLockControls",
        shader: "../lib/shader",
        shaders: "../shaders",
        stats: "../lib/stats.min",
        text: "../lib/text",
        three: "../lib/three",
        threeCore: "../lib/three.min",
        //game code
        animator: "./animation/Animator",
        collider: "./physics/Collider",
        playerControlState: "./controls/PlayerControlState",
        physics: "./physics/Physics",
        ray: "./physics/Ray",
        firstPersonControls: "./controls/FirstPersonControls",
        thirdPersonControls: "./controls/ThirdPersonControls",
        utils: "./utils/Utils",
    }
};
