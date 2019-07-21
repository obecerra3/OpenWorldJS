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
         player.Position.X = bytesToFloat32(data[1:5]);
         player.Position.Z = bytesToFloat32(data[5:9]);
         for nearbyPlayer := range player.NearbyPlayers {
           nearbyPlayer.SendData(1, &player, data[1:]);
         }
       default:
          for nearbyPlayer := range player.NearbyPlayers {
            nearbyPlayer.SendData(data[0], &player, []byte{});
          }
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

