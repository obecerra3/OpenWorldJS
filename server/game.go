package game

import (
  "fmt"
  "sync"
  "math"
  "encoding/binary"
  "github.com/gorilla/websocket"
)

const MAZE_SIZE = 405
const CHUNK_SIZE = 27
const NUM_CHUNKS = (MAZE_SIZE/CHUNK_SIZE)*(MAZE_SIZE/CHUNK_SIZE)
var Maze []byte

type IDGenerator struct {
  sync.Mutex
  nextID uint16
}

func (idGenerator *IDGenerator) GetNextID () uint16 {
  idGenerator.Lock()
  id := idGenerator.nextID
  idGenerator.nextID++
  idGenerator.Unlock()
  return id
}

type Players struct {
  sync.RWMutex
  Set map[*Player]struct{}
}

type Player struct {
  sync.Mutex
  Conn *websocket.Conn
  Username []byte
  ID uint16
  Position Vec2
  KnowsAboutMe map[*Player]struct{}
  NearbyPlayers map[*Player]struct{}
}

func (players Players) Add (player *Player) {
  players.Lock()
  players.Set[player] = struct{}{}
  players.Unlock()
}

func (players Players) Remove (player *Player) {
  players.Lock()
  delete(players.Set, player)
  players.Unlock()  
}

func distance (a Vec2, b Vec2) float32 {
  return float32(math.Sqrt(math.Pow(float64(a.X) - float64(b.X), 2.0) + math.Pow(float64(a.Z) - float64(b.Z), 2.0)))
}

func (player *Player) UpdateNearbyPlayers (players Players, delta float32) {
  players.RLock()
  for p := range players.Set {
    distance := distance(player.Position, p.Position)
    if (distance > 0 && distance <= delta) {
      if _,has := player.NearbyPlayers[p]; !has {
        player.NearbyPlayers[p] = struct{}{}
      }
    } else {
      if _,has := player.NearbyPlayers[p]; has {
        delete(player.NearbyPlayers, p)
      }
    } 
  }
  players.RUnlock()
}

func (dstPlayer *Player) SendAction (code byte, srcPlayer *Player) {
  payload := make([]byte, 3)
  payload[0] = code
  binary.BigEndian.PutUint16(payload[1:], srcPlayer.ID)
  dstPlayer.Lock()
  dstPlayer.Conn.WriteMessage(websocket.BinaryMessage, payload)
  dstPlayer.Unlock()
}

    
func (dstPlayer *Player) SendState (srcPlayer *Player, data []byte) {
  if _, has := srcPlayer.KnowsAboutMe[dstPlayer]; !has {
    payload := make([]byte, 4+len(srcPlayer.Username)+len(data))
    payload[0] = 1
    binary.BigEndian.PutUint16(payload[1:3], srcPlayer.ID)
    payload[3] = byte(len(srcPlayer.Username))
    copy(payload[4:], srcPlayer.Username)
    copy(payload[4+len(srcPlayer.Username):], data)
    srcPlayer.KnowsAboutMe[dstPlayer] = struct{}{}
    dstPlayer.Lock()
    dstPlayer.Conn.WriteMessage(websocket.BinaryMessage, payload)
  } else {
    payload := make([]byte, 3+len(data))
    payload[0] = 2
    binary.BigEndian.PutUint16(payload[1:3], srcPlayer.ID)
    copy(payload[3:], data)
    dstPlayer.Lock()
    dstPlayer.Conn.WriteMessage(websocket.BinaryMessage, payload)
  } 
  dstPlayer.Unlock()
}


type Vec2 struct {
  X float32         
  Z float32                  
}

type Chunk struct {
  X byte
  Z byte
  Data []byte         
}

func (chunk Chunk) Encode () []byte {
  buf := make([]byte, CHUNK_SIZE*CHUNK_SIZE+3)
  buf[0] = 0
  buf[1] = chunk.X
  buf[2] = chunk.Z
  copy(buf[3:], chunk.Data)
  return buf
}


func GetChunk(x byte, z byte) Chunk {
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
    chunk.Data[ix*CHUNK_SIZE + jx] = (Maze[mi / 8] >> uint(7-(mi%8))) & 1
  }
  fmt.Println(chunk.Data)
  chunk.X = x
  chunk.Z = z
  return chunk
}




