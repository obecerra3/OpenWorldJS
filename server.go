package main

import (
        "io/ioutil"
        "fmt"
        "log"
        "net/http"
        "encoding/binary"
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
  set map[*Player]struct{}
}

type Vec2 struct {
  x float32         
  z float32                  
}

type Chunk struct {
  x byte
  z byte
  Data []byte         
}

type Player struct {
  sync.Mutex
  conn *websocket.Conn
  username []byte
  position Vec2
}

func (chunk Chunk) encode () []byte {
  buf := make([]byte, CHUNK_SIZE*CHUNK_SIZE+3)
  buf[0] = 0
  buf[1] = chunk.x
  buf[2] = chunk.z
  copy(buf[2:], chunk.Data)
  return buf
}

func (player *Player) findNearbyPlayers (players Players, delta float32) []*Player {
  var result []*Player
  players.RLock();
  for p := range players.set {
    distance := distance(player.position, p.position)
    if (distance > 0 && distance <= delta) {
      result = append(result, p)  
    } 
  }
  players.RUnlock() 
  return result
}

func (dstPlayer *Player) sendState(srcPlayer *Player, data []byte) {
  dstPlayer.Lock();
  dstPlayer.conn.WriteMessage(websocket.BinaryMessage, append([]byte{1, byte(len(srcPlayer.username))}, append(srcPlayer.username, data...)...))
  dstPlayer.Unlock();
}


func (players *Players) add (player *Player) {
  players.Lock()
  players.set[player] = struct{}{}
  players.Unlock()
}

func (players *Players) remove (player * Player) {
  players.Lock()
  delete(players.set, player)
  players.Unlock()  
}

func bytesToFloat32(bytes []byte) float32 {
    bits := binary.BigEndian.Uint32(bytes)
    float := math.Float32frombits(bits)
    return float
}

func distance (a Vec2, b Vec2) float32 {
  return float32(math.Sqrt(math.Pow(float64(a.x) - float64(b.x), 2.0) + math.Pow(float64(a.z) - float64(b.z), 2.0)))
}

func processPlayerState(stateData []byte, player *Player) {
  player.position.x = bytesToFloat32(stateData[0:4]);
  player.position.z = bytesToFloat32(stateData[4:8]);
  nearbyPlayers := player.findNearbyPlayers(players, 100.0);
  for _, nearbyPlayer := range nearbyPlayers {
    nearbyPlayer.sendState(player, stateData);
  }
}


func getChunk(x byte, z byte) Chunk {
  var chunk Chunk
  col := (MAZE_SIZE / CHUNK_SIZE) / 2 + x
  row := (MAZE_SIZE / CHUNK_SIZE) / 2 + z
  idx := int(row * (MAZE_SIZE / CHUNK_SIZE) + col)
  chunk.Data = make([]byte, CHUNK_SIZE*CHUNK_SIZE)
  start := ((idx % (MAZE_SIZE/CHUNK_SIZE)) * CHUNK_SIZE) + ((idx / (MAZE_SIZE/CHUNK_SIZE)) * (MAZE_SIZE * CHUNK_SIZE))
  for i := start; i < start + (CHUNK_SIZE * CHUNK_SIZE); i++ {
    ix := (i - start) / 27
    jx := (i - start) % 27
    mi := start + (ix * MAZE_SIZE) + jx
    chunk.Data[ix*CHUNK_SIZE + jx] = (MAZE[mi / 8] >> uint(7-(mi%8))) & 1
  }
  chunk.x = x
  chunk.z = z
  return chunk
}


func handler(w http.ResponseWriter, r *http.Request) {
    upgrader.CheckOrigin = func(r *http.Request) bool { return true }
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil { log.Println(err); return }
    _, usernameData, err := conn.ReadMessage()
    if err != nil { log.Println(err); return }
    var player Player
    player.conn = conn
    player.username = usernameData
    players.add(&player)
    defer players.remove(&player)
    for {
      _, data, err := conn.ReadMessage()
      if err != nil { log.Println(err); return }
      switch (data[0]) {
       case 0:
         conn.WriteMessage(websocket.BinaryMessage, getChunk(data[1], data[2]).encode())
       case 1:  
         processPlayerState(data[1:], &player)
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
  players.set = make(map[*Player]struct{})

  http.HandleFunc("/", handler)
  http.ListenAndServe(":8000", nil)

}

