
var webSocket = new WebSocket("ws://127.0.0.1:8080");

webSocket.onmessage = function (event) {
  var blob = event.data;
  printBuf(blob);
}


async function printBuf(blob) {
  var arrayBuffer = await new Response(blob).arrayBuffer();
  var array = new Int8Array(arrayBuffer);
  var i = 0;
  var str = ""
  for (;i<729;i++) {
    str += array[i];
    if ((i % 27) == 26) {
      console.log(str);
      str = "" 
    }
  }
}
