

/* http://szudzik.com/ElegantPairing.pdf */
export function pair (a, b) {
  var A = a >= 0 ? 2 * a : -2 * a - 1;
  var B = b >= 0 ? 2 * b : -2 * b - 1;
  return A >= B ? A * A + A + B : A + B * B;
}



export function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}



export function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
