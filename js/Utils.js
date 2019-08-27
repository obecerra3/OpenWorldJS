var THREE = require('three');

module.exports = {
    PLAYER_HEIGHT: 10,
    PLAYER_SIZE: 5,
    PLAYER_MASS: 0.00005,
    PLAYER_SPEED: 0.0005,
    PLAYER_JUMP: 0.1,
    GRAVITY: 9.8,
    CELL_SIZE: 12,
    UPDATE_DELTA: 100.0,
    MAZE_SIZE: 55,
    Y: new THREE.Vector3(0,1,0),

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
    }
}

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
