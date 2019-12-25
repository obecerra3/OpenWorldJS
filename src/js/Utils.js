var Utils = {

    //PLAYER CONSTANTS
    PLAYER_HEIGHT: 10,
    PLAYER_SIZE: 5,
    PLAYER_MASS: 50,//0.00005,
    PLAYER_WALKING_SPEED: 1000,//0.0005,
    PLAYER_RUNNING_SPEED: 1500,
    PLAYER_JUMP: 200,//0.1,
    VELOCITY_DAMP: 2.5,//0.01,

    //WORLD CONSTANTS
    GRAVITY: 9.8,
    WALL_HEIGHT: 200,
    WALL_WIDTH: 15,
    CELL_SIZE: 95,
    UPDATE_DELTA: 100.0,
    MAZE_SIZE: 55,

    //ANIMATIONS
    //default weight for animation action in animationData
    DEFAULT_WEIGHT: 1.0,
    //duration of animation for determining synchronizeCrossFade or executeCrossFade
    DURATION_THRESHOLD: 4,

    //VECTORS
    X: new THREE.Vector3(1, 0, 0),
    Y: new THREE.Vector3(0, 1, 0),
    Z: new THREE.Vector3(0, 0, 1),
    _X: new THREE.Vector3(-1, 0, 0),
    _Y: new THREE.Vector3(0, -1, 0),
    _Z: new THREE.Vector3(0, 0, -1),
    //collision vectors
    XZ : new THREE.Vector3(1, 0, 1),
    _XZ : new THREE.Vector3(-1, 0, 1),
    X_Z : new THREE.Vector3(1, 0, -1),
    _X_Z : new THREE.Vector3(-1, 0, -1),


    pair: (a, b) => {
        /* http://szudzik.com/ElegantPairing.pdf */
        var A = a >= 0 ? 2 * a : -2 * a - 1;
        var B = b >= 0 ? 2 * b : -2 * b - 1;
        return A >= B ? A * A + A + B : A + B * B;
    },

    getRandomColor: () => {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },

    inRange: (c) => {
      return [{x: c.x-1, z: c.z-1},
              {x: c.x-1, z: c.z},
              {x: c.x-1, z: c.z+1},
              {x: c.x, z: c.z-1},
              {x: c.x, z: c.z},
              {x: c.x, z: c.z+1},
              {x: c.x+1, z: c.z-1},
              {x: c.x+1, z: c.z},
              {x: c.x+1, z: c.z+1}];
    }
}


//CODE DUMP
//for stuff that we used before, but no longer need but it took time to write so keeping it just in case its
//useful again

// let rays = [new Ray(this.worldState.scene, Utils.XZ, Utils.PLAYER_SIZE),
//     new Ray(this.worldState.scene, Utils._XZ, Utils.PLAYER_SIZE),
//     new Ray(this.worldState.scene, Utils.X_Z, Utils.PLAYER_SIZE),
//     new Ray(this.worldState.scene, Utils._X_Z, Utils.PLAYER_SIZE),
//     new Ray(this.worldState.scene, Utils.X, Utils.PLAYER_SIZE * 0.75),
//     new Ray(this.worldState.scene, Utils._X, Utils.PLAYER_SIZE * 0.75),
//     new Ray(this.worldState.scene, Utils.Z, Utils.PLAYER_SIZE * 0.75),
//     new Ray(this.worldState.scene, Utils._Z, Utils.PLAYER_SIZE * 0.75),
//     new Ray(this.worldState.scene, Utils.Y, Utils.PLAYER_SIZE * 0.75, false, new THREE.Vector3(0, 0, 0), 0x00ff00),
//     new Ray(this.worldState.scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils.X.multiplyScalar(1.5), 0xff0000),
//     new Ray(this.worldState.scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils._X.multiplyScalar(1.5), 0xff0000),
//     new Ray(this.worldState.scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils.Z.multiplyScalar(1.5), 0xff0000),
//     new Ray(this.worldState.scene, Utils._Y, Utils.PLAYER_SIZE * 1.7, true, Utils._Z.multiplyScalar(1.5), 0xff0000)]
//
// let animationData = {
//     TPose: {
//         action: mixer.clipAction(animations[0]),
//         weight: 1.0,
//         duration: animations[0].duration,
//     },
//     Idle: {
//         action: mixer.clipAction(animations[1]),
//         weight: 1.0,
//         duration: animations[1].duration,
//     },
//     Jump: {
//         action: mixer.clipAction(animations[2]),
//         weight: 1.0,
//         duration: animations[2].duration,
//     },
//     LeftStrafeWalk: {
//         action: mixer.clipAction(animations[3]),
//         weight: 1.0,
//         duration: animations[3].duration,
//     },
//     LeftTurn: {
//         action: mixer.clipAction(animations[4]),
//         weight: 1.0,
//         duration: animations[4].duration,
//     },
//     RightStrafeWalk: {
//         action: mixer.clipAction(animations[5]),
//         weight: 1.0,
//         duration: animations[5].duration,
//     },
//     RightTurn: {
//         action: mixer.clipAction(animations[6]),
//         weight: 1.0,
//         duration: animations[6].duration,
//     },
//     Run: {
//         action: mixer.clipAction(animations[7]),
//         weight: 1.0,
//         duration: animations[7].duration,
//     },
//     CrouchIdle: {
//         action: mixer.clipAction(animations[8]),
//         weight: 1.0,
//         duration: animations[8].duration,
//     },
//     CrouchWalk: {
//         action: mixer.clipAction(animations[9]),
//         weight: 1.0,
//         duration: animations[9].duration,
//     },
//     Slide: {
//         action: mixer.clipAction(animations[10]),
//         weight: 1.0,
//         duration: animations[10].duration,
//     },
//     Death: {
//         action: mixer.clipAction(animations[11]),
//         weight: 1.0,
//         duration: animations[11].duration,
//     },
//     FallIdle: {
//         action: mixer.clipAction(animations[12]),
//         weight: 1.0,
//         duration: animations[12].duration,
//     },
//     Walk: {
//         action: mixer.clipAction(animations[13]),
//         weight: 1.0,
//         duration: animations[13].duration,
//     }
// }

// /* http://szudzik.com/ElegantPairing.pdf */
// exports.pair = function pair (a, b) {
//   var A = a >= 0 ? 2 * a : -2 * a - 1;
//   var B = b >= 0 ? 2 * b : -2 * b - 1;
//   return A >= B ? A * A + A + B : A + B * B;
// }
//
//
// exports.getRandomColor = function getRandomColor() {
// var letters = '0123456789ABCDEF';
// var color = '#';
// for (var i = 0; i < 6; i++) {
// color += letters[Math.floor(Math.random() * 16)];
// }
// return color;
// }


// this.TPoseAnim = this.mixer.clipAction(animations[0]);
// this.IdleAnim = this.mixer.clipAction(animations[1]);
// this.JumpAnim = this.mixer.clipAction(animations[2]);
// this.LeftStrafeWalkAnim = this.mixer.clipAction(animations[3]);
// this.LeftTurnAnim = this.mixer.clipAction(animations[4]);
// this.RightStrafeWalkAnim = this.mixer.clipAction(animations[5]);
// this.RightTurnAnim = this.mixer.clipAction(animations[6]);
// this.RunAnim = this.mixer.clipAction(animations[7]);
// this.CrouchIdleAnim = this.mixer.clipAction(animations[8]);
// this.CrouchWalkAnim = this.mixer.clipAction(animations[9]);
// this.SlideAnim = this.mixer.clipAction(animations[10]);
// this.DeathAnim = this.mixer.clipAction(animations[11]);
// this.FallIdleAnim = this.mixer.clipAction(animations[12]);
// this.WalkAnim = this.mixer.clipAction(animations[13]);

// this.animations = [this.TPoseAnim, this.IdleAnim, this.JumpAnim,
//                    this.LeftStrafeWalkAnim, this.LeftTurnAnim,
//                    this.RightStrafeWalkAnim, this.RightTurnAnim,
//                    this.RunAnim, this.CrouchIdleAnim,
//                    this.CrouchWalkAnim, this.SlideAnim, this.DeathAnim,
//                    this.FallIdleAnim, this.WalkAnim];
