package main

import (
        "io/ioutil"
        "fmt"
        "log"
        "net/http"
        "encoding/binary"
        "math"
        "maze/game"
        "github.com/gorilla/websocket"
)

var games game.Games
var maze game.Maze
var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}


func bytesToFloat32(bytes []byte) float32 {
    bits := binary.BigEndian.Uint32(bytes)
    float := math.Float32frombits(bits)
    return float
}


func handler(w http.ResponseWriter, r *http.Request) {
    upgrader.CheckOrigin = func(r *http.Request) bool { return true }
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil { log.Println(err); return }
    _, usernameData, err := conn.ReadMessage()
    if err != nil { log.Println(err); return }
    if err != nil {log.Println(err); return }
    var player game.Player
    player.Username = string(usernameData)
    player.Conn = conn
    game := player.JoinGame(&games)
    defer game.Remove(&player)
    fmt.Println(player.Username, " joined ", game)
    player.SendMaze(&maze)
    for {
      _, data, err := conn.ReadMessage()
      if err != nil { log.Println(err); return }
      switch (data[0]) {
       case 0:  
         player.Position.X = bytesToFloat32(data[2:6])
         player.Position.Z = bytesToFloat32(data[6:10])
         for _,dstPlayer := range game.Players {
            if dstPlayer != &player {
              dstPlayer.SendState(&player, data[1:])
            }
         }
       case 3: // JUMP
         for _,dstPlayer := range game.Players {
            if dstPlayer != &player {
              dstPlayer.SendAction(3, &player)
            }
         }
       default: 
        panic("I got something weird")
      }
    }
}


func main () {
  mazedata, err := ioutil.ReadFile("maze.bin")
  if err != nil {
    fmt.Print(err)
  }
  
  maze = game.Maze {mazedata}
  
  http.HandleFunc("/", handler)
  http.ListenAndServeTLS(":8000", "certs/cert.pem", "certs/privkey.pem", nil)

}
