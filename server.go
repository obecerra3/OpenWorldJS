package main

import (
        "io/ioutil"
        "fmt"
        "log"
        "net/http"
        "encoding/json"
        "sync"
        "github.com/gorilla/websocket"
)

const MAZE_SIZE = 405
const CHUNK_SIZE = 27
const NUM_CHUNKS = (MAZE_SIZE/CHUNK_SIZE)*(MAZE_SIZE/CHUNK_SIZE)


var MAZE []byte
var players Players

type Players struct {
  sync.RWMutex
  array []*Player
}

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
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
  Origin Vec2         `json:"origin"`
  Data string         `json:"chunk"`
}

type Player struct {
  Username string         `json:"username"`
  Position Vec3           `json:"position"`
  CurrentChunk Vec2       `json:"currentChunk"`
  Velocity Vec3           `json:"velocity"`
  LookDirection Vec3      `json:"lookDirection"`
  deliveredChunks map[Vec2]struct{}
}


func (players *Players) add (player *Player) {
  players.Lock();
  players.array = append(players.array, player); 
  players.Unlock();
}


func getChunk(coord Vec2) Chunk {
  col := (MAZE_SIZE / CHUNK_SIZE) / 2 + coord.X;
  row := (MAZE_SIZE / CHUNK_SIZE) / 2 + coord.Z;
  idx := int(row * (MAZE_SIZE / CHUNK_SIZE) + col);
  matrix := make([]byte, CHUNK_SIZE*CHUNK_SIZE)
  start := ((idx % (MAZE_SIZE/CHUNK_SIZE)) * CHUNK_SIZE) + ((idx / (MAZE_SIZE/CHUNK_SIZE)) * (MAZE_SIZE * CHUNK_SIZE));
  for i := start; i < start + (CHUNK_SIZE * CHUNK_SIZE); i++ {
    ix := (i - start) / 27
    jx := (i - start) % 27
    mi := start + (ix * MAZE_SIZE) + jx
    matrix[ix*CHUNK_SIZE + jx] = (MAZE[mi / 8] >> uint(7-(mi%8))) & 1 + 48
  }
  var chunk Chunk
  chunk.Data = string(matrix)
  chunk.Origin.X = coord.X*CHUNK_SIZE - CHUNK_SIZE/2-0.5;
  chunk.Origin.Z = coord.Z*CHUNK_SIZE - CHUNK_SIZE/2-0.5;
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
    chunkSizeData, _ := json.Marshal(struct {ChunkSize int `json:"chunkSize"`}{CHUNK_SIZE})
    conn.WriteMessage(websocket.TextMessage, chunkSizeData)
    player.deliveredChunks = make(map[Vec2]struct{})
    players.add(&player);
    for {
      _, playerStateData, err := conn.ReadMessage()
      if err != nil { log.Println(err); return }
      json.Unmarshal(playerStateData, &player)
      if _, has := player.deliveredChunks[player.CurrentChunk]; !has {
        player.deliveredChunks[player.CurrentChunk] = struct{}{}
        chunkData, _ := json.Marshal(getChunk(player.CurrentChunk))
        conn.WriteMessage(websocket.TextMessage, chunkData)
      }
      
      /* CHECK IF PLAYER COMES OUT OF CONTACT WITH OTHER PLAYERS, set timer to end peer-to-peer
       * CHECK IF PLAYER COMES INTO CONTACT WITH NEW PLAYERS
       * Establish any new webRTC connections between the players
       *
      */
      
      
      
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
