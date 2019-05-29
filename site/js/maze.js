var webSocket = new WebSocket("wss://themaze.io:8000");

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

webSocket.onopen = function (event) {
  console.log("websocket connected");
  webSocket.send("10");
}
