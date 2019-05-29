package main

import (
        "io/ioutil"
        "fmt"
        "log"
        "net/http"
        "github.com/gorilla/websocket"
)

const MAZE_SIZE = 405
const CHUNK_SIZE = 27
var MAZE []byte

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}


func chunk(idx int) []byte {
  matrix := make([]byte, CHUNK_SIZE*CHUNK_SIZE)
  var start = ((idx % (MAZE_SIZE/CHUNK_SIZE)) * CHUNK_SIZE) + ((idx / (MAZE_SIZE/CHUNK_SIZE)) * (MAZE_SIZE * CHUNK_SIZE));
  for i := start; i < start + (CHUNK_SIZE * CHUNK_SIZE); i++ {
    var ix = (i - start) / 27;
    var jx = (i - start) % 27;
    var mi = start + (ix * MAZE_SIZE) + jx;
    matrix[ix*CHUNK_SIZE + jx] = (MAZE[mi / 8] >> uint(7-(mi%8))) & 1;
  }
  return matrix;
}

func handler(w http.ResponseWriter, r *http.Request) {
    upgrader.CheckOrigin = func(r *http.Request) bool { return true }
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println(err)
        return
    } 
    
    if err := conn.WriteMessage(websocket.BinaryMessage, chunk(0)); err != nil {
      log.Println(err)
      return
    }
}


func main () {
  maze, err := ioutil.ReadFile("maze.bin")
  if err != nil {
    fmt.Print(err)
  }
  MAZE = maze

  http.HandleFunc("/", handler)
  http.ListenAndServe(":8080", nil)
}
