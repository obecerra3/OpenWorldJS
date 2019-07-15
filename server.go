package main

import (
        "io/ioutil"
        "fmt"
        "log"
        "net/http"
        "encoding/json"
        "github.com/gorilla/websocket"
)

const MAZE_SIZE = 405
const CHUNK_SIZE = 27
const NUM_CHUNKS = (MAZE_SIZE/CHUNK_SIZE)*(MAZE_SIZE/CHUNK_SIZE)
var MAZE []byte

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

type Vec3 struct {
  X float32         `json:"x"`
  Y float32         `json:"y"` 
  Z float32         `json:"z"`
}

type Player struct {
  Username string     `json:"username"`
  Position Vec3       `json:"position"`
  Velocity Vec3       `json:"velocity"`
  LookDirection Vec3  `json:"lookDirection"`
}


func chunk(idx int) []byte {
  matrix := make([]byte, CHUNK_SIZE*CHUNK_SIZE)
  start := ((idx % (MAZE_SIZE/CHUNK_SIZE)) * CHUNK_SIZE) + ((idx / (MAZE_SIZE/CHUNK_SIZE)) * (MAZE_SIZE * CHUNK_SIZE));
  for i := start; i < start + (CHUNK_SIZE * CHUNK_SIZE); i++ {
    ix := (i - start) / 27;
    jx := (i - start) % 27;
    mi := start + (ix * MAZE_SIZE) + jx;
    matrix[ix*CHUNK_SIZE + jx] = (MAZE[mi / 8] >> uint(7-(mi%8))) & 1;
  }
  return matrix;
}

func handler(w http.ResponseWriter, r *http.Request) {
    upgrader.CheckOrigin = func(r *http.Request) bool { return true }
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil { log.Println(err); return }
    var player Player
    _, usernameData, err := conn.ReadMessage();
    if err != nil { log.Println(err); return }
    player.Username = string(usernameData);
    for {
      _, playerStateData, err := conn.ReadMessage()
      if err != nil { log.Println(err); return }
      json.Unmarshal(playerStateData, &player);
      fmt.Println(player);
    }
}

func main () {
  maze, err := ioutil.ReadFile("maze.bin")
  if err != nil {
    fmt.Print(err)
  }
  MAZE = maze

  http.HandleFunc("/", handler)
  http.ListenAndServe(":8000", nil)

}
