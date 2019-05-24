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


func chunk(idx int) [][]byte {
  matrix := make([][]byte, CHUNK_SIZE)
  rows := make([]byte, CHUNK_SIZE*CHUNK_SIZE)
  for i := 0; i < CHUNK_SIZE; i++ {
    matrix[i] = rows[i*CHUNK_SIZE : (i+1)*CHUNK_SIZE]
  }
  var start = ((idx % (MAZE_SIZE/CHUNK_SIZE)) * CHUNK_SIZE) + ((idx / (MAZE_SIZE/CHUNK_SIZE)) * (MAZE_SIZE * CHUNK_SIZE));
  fmt.Println(start);
  for i := start; i < start + (CHUNK_SIZE * CHUNK_SIZE); i++ {
    var ix = (i - start) / 27;
    var jx = (i - start) % 27;
    var mi = start + (ix * MAZE_SIZE) + jx;
    fmt.Println(mi/8);
    matrix[ix][jx] = (MAZE[mi / 8] >> uint(7-(mi%8))) & 1;
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
    _,p,_ := conn.ReadMessage()
    fmt.Printf("%s", p)
}


func main () {
  maze, err := ioutil.ReadFile("maze.bin")
  if err != nil {
    fmt.Print(err)
  }
  MAZE = maze
  
  fmt.Print(chunk(224));
  
  
  http.HandleFunc("/", handler)
  http.ListenAndServe(":8080", nil)
}
