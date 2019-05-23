package main

import (
        "math"
        "io/ioutil"
        "fmt"
        "log"
        "net/http"
        "github.com/gorilla/websocket"
)

const MAZE_SIZE = 405
const NUM_CHUNKS = 15
const CHUNK_SIZE = MAZE_SIZE / NUM_CHUNKS
var MAZE []byte

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

func chunk(x float64, y float64) [][]byte {
  var xchunk = math.Floor(x * NUM_CHUNKS);
  var ychunk = math.Floor(y * NUM_CHUNKS);
  var ret = make([][]byte, CHUNK_SIZE * CHUNK_SIZE)
  
  for i:=0; i<CHUNK_SIZE; i++ {
    for j := 0; j < CHUNK_SIZE; j++ {
      ret[i][j] = MAZE[MAZE_SIZE*i + CHUNK_SIZE*ychunk]
    }
  }
  
  
  
  
  
  
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
  
  http.HandleFunc("/", handler)
  http.ListenAndServe(":8080", nil)
}
