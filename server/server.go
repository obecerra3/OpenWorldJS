package main

import (
        "io/ioutil"
        "fmt"
        "log"
        "net/http"
        "encoding/binary"
        "math"
        "maze/game"
        "time"
        "github.com/gorilla/websocket"
)

var idGenerator game.IDGenerator
var players game.Players
var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}


func bytesToFloat32(bytes []byte) float32 {
    bits := binary.BigEndian.Uint32(bytes)
    float := math.Float32frombits(bits)
    return float
}

func nearbyPlayerUpdateLoop(player * game.Player) {
  for {
    player.UpdateNearbyPlayers(players, 100);
    time.Sleep(5*time.Second);
  }
}

func handler(w http.ResponseWriter, r *http.Request) {
    upgrader.CheckOrigin = func(r *http.Request) bool { return true }
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil { log.Println(err); return }
    _, usernameData, err := conn.ReadMessage()
    if err != nil { log.Println(err); return }
    var player game.Player
    player.Conn = conn
    player.Username = usernameData
    player.NearbyPlayers = make(map[*game.Player]struct{})
    player.KnowsAboutMe = make(map[*game.Player]struct{})
    player.ID = idGenerator.GetNextID()
    fmt.Println(string(player.Username), ": ", player.ID)
    go nearbyPlayerUpdateLoop(&player);
    players.Add(&player)
    defer players.Remove(&player)
    for {
      _, data, err := conn.ReadMessage()
      if err != nil { log.Println(err); return }
      switch (data[0]) {
       case 0:
         conn.WriteMessage(websocket.BinaryMessage, game.GetChunk(data[1], data[2]).Encode())
       case 1:  
         player.Position.X = bytesToFloat32(data[2:6]);
         player.Position.Z = bytesToFloat32(data[6:10]);
         for nearbyPlayer := range player.NearbyPlayers {
           nearbyPlayer.SendState(&player, data[1:]);
         }
       case 3: // JUMP
        for nearbyPlayer := range player.NearbyPlayers {
           nearbyPlayer.SendAction(3, &player);
         }
       default: 
        panic("I got something weird")
      }
    }
}


func main () {
  maze, err := ioutil.ReadFile("maze.bin")
  if err != nil {
    fmt.Print(err)
  }
  game.Maze = maze
  players.Set = make(map[*game.Player]struct{})
    
  http.HandleFunc("/", handler)
  http.ListenAndServe(":8000", nil)

}

