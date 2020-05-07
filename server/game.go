package game

import (
  //"fmt"
  "sync"
  "math"
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


type Games struct {
  sync.Mutex
  array []*Game
}

type Game struct {
  sync.Mutex
  Players []*Player
  inProgress bool
}

type Player struct {
  sync.Mutex
  Conn *websocket.Conn
  isHunted byte
  Username string
  ID byte
  Position Vec2
}


func (game *Game) isFull () bool  {
  return len(game.Players) == (NUM_HUNTERS + NUM_HUNTED);
}

func (game *Game) Remove (player *Player) {
  game.Lock()
  for i,p := range game.Players {
    if p == player {
      game.Players[i] = game.Players[len(game.Players)-1]
      game.Players = game.Players[:len(game.Players)-1]
    }
  }
  for _,dstPlayer := range game.Players {
    dstPlayer.SendLeft(player)
  }
  game.Unlock()
}


func (player *Player) JoinGame (games *Games) *Game {
  games.Lock()
  defer games.Unlock()
  for _, game := range games.array {
    game.Lock()
    if !game.isFull() {
      game.add(player)
      game.Unlock()
      return game
    }
    game.Unlock()
  }
  return games.newGame(player)
}


func (game *Game) add (player *Player) {
  player.ID = byte(len(game.Players))
  for _,otherPlayer := range game.Players {
    otherPlayer.Introduce(player)
    player.Introduce(otherPlayer)
  }
  game.Players = append(game.Players, player)
  player.isHunted = 0
}

func (games *Games) newGame (player * Player) *Game {
    players := make([]*Player, 1)
    players[0] = player
    player.ID = 0
    player.isHunted = 1
    game := Game { Players: players }
    games.array = append(games.array, &game)
    return &game
}

func (dstPlayer *Player) Introduce (srcPlayer *Player) {
  dstPlayer.Lock()
  payload := make([]byte, 3 + len(srcPlayer.Username))
  payload[0] = 0
  payload[1] = srcPlayer.ID
  payload[2] = srcPlayer.isHunted 
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
  payload := make([]byte, 2)
  payload[0] = code
  payload[1] = srcPlayer.ID
  dstPlayer.Lock()
  dstPlayer.Conn.WriteMessage(websocket.BinaryMessage, payload)
  dstPlayer.Unlock()
}

  
func (dstPlayer *Player) SendState (srcPlayer *Player, data []byte) {
  payload := make([]byte, 2+len(data))
  payload[0] = 2
  payload[1] = srcPlayer.ID
  copy(payload[2:], data)
  dstPlayer.Lock()
  dstPlayer.Conn.WriteMessage(websocket.BinaryMessage, payload)
  dstPlayer.Unlock()
}

func (dstPlayer *Player) SendLeft (srcPlayer *Player) {
  payload := make([]byte, 2)
  payload[0] = 4
  payload[1] = srcPlayer.ID
  dstPlayer.Lock()
  dstPlayer.Conn.WriteMessage(websocket.BinaryMessage, payload)
  dstPlayer.Unlock()
}


func distance (a Vec2, b Vec2) float32 {
  return float32(math.Sqrt(math.Pow(float64(a.X) - float64(b.X), 2.0) + math.Pow(float64(a.Z) - float64(b.Z), 2.0)))
}



