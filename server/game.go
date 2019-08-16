package game

import (
  //"fmt"
  "sync"
  "math"
  "encoding/binary"
  "github.com/gorilla/websocket"
)

const MAZE_SIZE = 55
const NUM_HUNTERS = 3
const NUM_HUNTED = 1

type Vec2 struct {
  X float32         
  Z float32                  
}

type Maze struct {
  Data []byte
}

type IDGenerator struct {
  sync.Mutex
  nextID uint16
}

type Games struct {
  sync.RWMutex
  array []*Game
}

type Game struct {
  sync.RWMutex
  Players []*Player
  inProgress bool
}

type Player struct {
  sync.Mutex
  Conn *websocket.Conn
  Hunted bool
  Connected bool
  Username string
  ID uint16
  Position Vec2
}

func (idGenerator *IDGenerator) GetNextID () uint16 {
  idGenerator.Lock()
  id := idGenerator.nextID
  idGenerator.nextID++
  idGenerator.Unlock()
  return id
}

func (game *Game) add (player *Player) bool {
  game.Lock()
  if game.isFull() { return false }
  for _,otherPlayer := range game.Players {
    otherPlayer.Introduce (player)
  }
  game.Players = append(game.Players, player)
  if len(game.Players) <= NUM_HUNTED {
    player.Hunted = true
  }
  game.Unlock()
  return true
}

func (game *Game) isFull () bool  {
  return len(game.Players) < NUM_HUNTERS + NUM_HUNTED;
}


func (games *Games) newGameWithPlayer (player * Player) *Game {
    games.Lock()
    players := make([]*Player, NUM_HUNTERS+NUM_HUNTED)
    players[0] = player
    game := Game { Players: players }
    games.array = append(games.array, &game)
    games.Unlock()
    return &game
}

func (player *Player) JoinGame (games *Games) *Game {
  games.RLock()
  for _, game := range games.array {
    if !game.isFull() {
      if !game.add(player) { continue }
      games.RUnlock()
      return game
    }
  }
  games.RUnlock()
  return games.newGameWithPlayer(player)
}


func (dstPlayer *Player) Introduce (srcPlayer *Player) {
  dstPlayer.Lock()
  payload := make([]byte, 2 + len(srcPlayer.Username))
  payload[0] = 0
  binary.BigEndian.PutUint16(payload[1:], srcPlayer.ID)
  copy(payload[3:], []byte(srcPlayer.Username))
  dstPlayer.Conn.WriteMessage(websocket.BinaryMessage, payload)
  dstPlayer.Unlock()
}

func (player *Player) SendMaze (maze *Maze) {
  payload := make([]byte, 1 + (MAZE_SIZE*MAZE_SIZE)/8)
  payload[0] = 1
  copy(payload[1:], maze.Data)
  player.Lock()
  player.Conn.WriteMessage(websocket.BinaryMessage, payload)
  player.Unlock()
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
  payload := make([]byte, 3+len(data))
  payload[0] = 2
  binary.BigEndian.PutUint16(payload[1:3], srcPlayer.ID)
  copy(payload[3:], data)
  dstPlayer.Lock()
  dstPlayer.Conn.WriteMessage(websocket.BinaryMessage, payload)
  dstPlayer.Unlock()
}


func distance (a Vec2, b Vec2) float32 {
  return float32(math.Sqrt(math.Pow(float64(a.X) - float64(b.X), 2.0) + math.Pow(float64(a.Z) - float64(b.Z), 2.0)))
}



