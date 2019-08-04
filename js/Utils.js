

/* http://szudzik.com/ElegantPairing.pdf */
exports.pair = function pair (a, b) {
  var A = a >= 0 ? 2 * a : -2 * a - 1;
  var B = b >= 0 ? 2 * b : -2 * b - 1;
  return A >= B ? A * A + A + B : A + B * B;
}


exports.getRandomColor = function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
