package main

import (
        "io/ioutil"
        "fmt"
        "log"
        "net/http"
        //"encoding/binary"
        //"encoding/json"
        "sync"
        "math"
        "github.com/gorilla/websocket"
)

const MAZE_SIZE = 405
const CHUNK_SIZE = 27
const NUM_CHUNKS = (MAZE_SIZE/CHUNK_SIZE)*(MAZE_SIZE/CHUNK_SIZE)

var MAZE []byte
var players Players
var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

type Players struct {
  sync.RWMutex
  array []*Player
}



type Vec2 struct {
  X float64          `json:"x"`
  Z float64          `json:"z"`
}

type Vec3 struct {
  X float64         `json:"x"`
  Y float64         `json:"y"` 
  Z float64         `json:"z"`
}

type Chunk struct {
  X byte
  Z byte
  Data []byte         `json:"chunk"`
}

type Player struct {
  Username string         `json:"username"`
  Position Vec3           `json:"position"`
  Velocity Vec3           `json:"velocity"`
  LookDirection Vec3      `json:"lookDirection"`
  deliveredChunks map[Vec2]struct{}
}

func (chunk *Chunk) encode () []byte {
  resultBuf := make([]byte, CHUNK_SIZE*CHUNK_SIZE+3)
  resultBuf[0] = 0
  resultBuf[1] = chunk.X
  resultBuf[2] = chunk.Z
  copy(resultBuf[2:], chunk.Data)
  return resultBuf
}

func (player *Player) findNearbyPlayers (players Players, delta float64) []*Player {
  var result []*Player
  players.RLock();
  for _, p := range players.array {
    distance := flatDistance(player.Position, p.Position)
    if (distance > 0 && distance <= delta) {
      result = append(result, p)  
    } 
  }
  players.RUnlock() 
  return result
}


func flatDistance (a Vec3, b Vec3) float64 {
  return math.Sqrt(math.Pow(a.X - b.X, 2.0) + math.Pow(a.Z - b.Z, 2.0))
}

func (players *Players) add (player *Player) {
  players.Lock();
  players.array = append(players.array, player); 
  players.Unlock();
}

func getChunk(X byte, Z byte) Chunk {
  var chunk Chunk
  col := (MAZE_SIZE / CHUNK_SIZE) / 2 + X
  row := (MAZE_SIZE / CHUNK_SIZE) / 2 + Z
  idx := int(row * (MAZE_SIZE / CHUNK_SIZE) + col)
  chunk.Data = make([]byte, CHUNK_SIZE*CHUNK_SIZE)
  start := ((idx % (MAZE_SIZE/CHUNK_SIZE)) * CHUNK_SIZE) + ((idx / (MAZE_SIZE/CHUNK_SIZE)) * (MAZE_SIZE * CHUNK_SIZE))
  for i := start; i < start + (CHUNK_SIZE * CHUNK_SIZE); i++ {
    ix := (i - start) / 27
    jx := (i - start) % 27
    mi := start + (ix * MAZE_SIZE) + jx
    chunk.Data[ix*CHUNK_SIZE + jx] = (MAZE[mi / 8] >> uint(7-(mi%8))) & 1
  }
  chunk.X = X
  chunk.Z = Z
  return chunk
}

func handler(w http.ResponseWriter, r *http.Request) {
    upgrader.CheckOrigin = func(r *http.Request) bool { return true }
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil { log.Println(err); return }
    var player Player
    _, usernameData, err := conn.ReadMessage()
    if err != nil { log.Println(err); return }
    player.Username = string(usernameData)
    player.deliveredChunks = make(map[Vec2]struct{})
    players.add(&player)
    for {
      _, data, err := conn.ReadMessage()
      if err != nil { log.Println(err); return }
      switch (data[0]) {
       case 0:
         chunk := getChunk(data[1], data[2])
         conn.WriteMessage(websocket.BinaryMessage, chunk.encode())
        default:
          panic("invalid message")
      }
    
    
    
      
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

