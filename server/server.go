package main

import (
        "io/ioutil"
        "fmt"
        "log"
        "database/sql"
        "net/http"
        "encoding/binary"
        "math"
        "maze/game"
        "maze/db"
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

func nearbyPlayerUpdateLoop(player *game.Player) {
  for player.Connected {
    player.UpdateNearbyPlayers(players, 100);
    time.Sleep(10*time.Second)
  }
}

func chunkSendLoop (player *game.Player) {
  for player.Connected {
    for _,neighbour := range player.ComputeChunk().GetNeighbours() {
      if _, has := player.DeliveredChunks[neighbour]; !has {
        player.Conn.WriteMessage(websocket.BinaryMessage, game.GetChunk(neighbour).Encode())
        player.DeliveredChunks[neighbour] = struct{}{}
        time.Sleep(500*time.Millisecond)
      }
    }
    time.Sleep(5*time.Second)
  }
}

func SavePlayerPositionLoop (player *game.Player, dbconn *sql.DB) {
  for player.Connected {
    db.SavePlayerPosition(player, dbconn)
    time.Sleep(10*time.Second)
  }
}

func handler(w http.ResponseWriter, r *http.Request) {
    upgrader.CheckOrigin = func(r *http.Request) bool { return true }
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil { log.Println(err); return }
    _, helloData, err := conn.ReadMessage()
    if err != nil { log.Println(err); return }
    dbconn, err := db.Connect()
    if err != nil {log.Println(err); return }
    var player game.Player
    player.Username = string(helloData[4:])
    secret := binary.BigEndian.Uint32(helloData[:4])
    if !db.VerifyPlayer(&player, secret, dbconn) { fmt.Println("failed to verify player"); return }
    player.Conn = conn
    player.Connected = true
    defer func () { player.Connected = false } ()
    player.Position = db.GetSavedPosition(&player, dbconn)
    player.NearbyPlayers = make(map[*game.Player]struct{})
    player.KnowsAboutMe = make(map[*game.Player]struct{})
    player.DeliveredChunks = make(map[game.ChunkCoord]struct{})
    player.ID = idGenerator.GetNextID()
    go nearbyPlayerUpdateLoop(&player)
    go chunkSendLoop(&player)
    go SavePlayerPositionLoop(&player, dbconn)
    players.Add(&player)
    defer players.Remove(&player)
    for {
      _, data, err := conn.ReadMessage()
      if err != nil { log.Println(err); return }
      switch (data[0]) {
       case 0:  
         player.Position.X = bytesToFloat32(data[2:6])
         player.Position.Z = bytesToFloat32(data[6:10])
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
  http.ListenAndServeTLS(":8000", "certs/cert.pem", "certs/privkey.pem", nil)

}
