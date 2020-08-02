define(["three", "ammo"], (THREE, Ammo) =>
{
    Ammo().then((AmmoLib) =>
    {
        Ammo = AmmoLib;
    });

    var Utils =
    {
        // PLAYER CONSTANTS
        PLAYER_SIZE : 1.5,
        PLAYER_MASS : 50,
        PLAYER_WALK_SPEED : 600,
        PLAYER_RUN_SPEED : 1000,//450,
        PLAYER_JUMP_FORCE : 150,
        VELOCITY_DAMP : 2.5,
        ORBIT_SPEED : 1,
        ORBIT_SPEED_DELTA : 0.25,

        // WORLD CONSTANTS
        GRAVITY : 9.8,
        WALL_HEIGHT : 100,
        WALL_WIDTH : 15,
        CELL_SIZE : 95,
        UPDATE_DELTA : 100.0,
        MAZE_SIZE : 55,
        WALL_UPDATE_TIME : 5,
        WALL_UPDATE_DISTANCE : 900,
        WALL_QUADRANT_SIZE : 1000,
        PHYSICS_RENDER_DISTANCE : 1000,

        // ANIMATIONS
        //default weight for animation action in animationData
        DEFAULT_WEIGHT : 1.0,
        //duration of animation for determining synchronizeCrossFade or executeCrossFade
        DURATION_THRESHOLD : 4,

        // VECTORS
        X : new THREE.Vector3(1, 0, 0),
        Y : new THREE.Vector3(0, 1, 0),
        Z : new THREE.Vector3(0, 0, 1),
        _X : new THREE.Vector3(-1, 0, 0),
        _Y : new THREE.Vector3(0, -1, 0),
        _Z : new THREE.Vector3(0, 0, -1),
        //collision vectors
        XZ : new THREE.Vector3(1, 0, 1),
        _XZ : new THREE.Vector3(-1, 0, 1),
        X_Z : new THREE.Vector3(1, 0, -1),
        _X_Z : new THREE.Vector3(-1, 0, -1),

        // PROCEDURAL CONTENT GENERATION
        // -----------------------------

        SEED : 8483,
        TERRAIN_SEED : 56,

        random : () =>
        {
            var x = Math.sin(Utils.SEED++) * 10000;
            return x - Math.floor(x);
        },

        terrainRandom : () =>
        {
            var x = Math.sin(Utils.TERRAIN_SEED++) * 10000;
            return x - Math.floor(x);
        },

        // VECTOR HELPERS
        // --------------

        distance2D : (v1, v2) =>
        {
            var v3 = new THREE.Vector2(v1.x, v1.y);
            var v4 = new THREE.Vector2(v2.x, v2.y);
            return v3.distanceTo(v4);
        },

        vector3ToString : (v) =>
        {
            return v.x + "," + v.y + "," + v.z;
        },

        stringToVector3 : (s) =>
        {
            let values = s.split(",");
            return new THREE.Vector3(parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2]));
        },

        vector3FromBt : (v) =>
        {
            return new THREE.Vector3(v.x(), v.y(), v.z());
        },

        // MISC. HELPERS
        // -------------

        pair : (a, b) =>
        {
            /* http ://szudzik.com/ElegantPairing.pdf */
            var A = a >= 0 ? 2 * a : -2 * a - 1;
            var B = b >= 0 ? 2 * b : -2 * b - 1;
            return A >= B ? A * A + A + B : A + B * B;
        },

        getRandomColor : () =>
        {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
              color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        },

        inRange : (c) =>
        {
          return [{x : c.x-1, z : c.z-1},
                  {x : c.x-1, z : c.z},
                  {x : c.x-1, z : c.z+1},
                  {x : c.x, z : c.z-1},
                  {x : c.x, z : c.z},
                  {x : c.x, z : c.z+1},
                  {x : c.x+1, z : c.z-1},
                  {x : c.x+1, z : c.z},
                  {x : c.x+1, z : c.z+1}];
        },
    }
    return Utils;
});
