package db

import (
  "fmt"
  "maze/game"
	"database/sql"
  _"github.com/go-sql-driver/mysql"
)

func Connect() (*sql.DB, error)  {
	dbconn, err := sql.Open("mysql", "bnwlkr:88ae3cefb3@/Maze")
	if err != nil { return nil, err }
  if err = dbconn.Ping(); err != nil { return nil, err }
	return dbconn, nil
}

func GetSavedPosition(player *game.Player, dbconn *sql.DB) game.Vec2 {
  var result game.Vec2
  err := dbconn.QueryRow(`SELECT x, z FROM Users WHERE username=?`, player.Username).Scan(&result.X, &result.Z)
  if (err != nil) { fmt.Println(err) }
  return result
}

func SavePlayerPosition(player *game.Player, dbconn *sql.DB) {
  updates, err := dbconn.Query(`UPDATE Users SET x=?, z=? WHERE username=?`, player.Position.X, player.Position.Z, player.Username)
  if (err != nil) { fmt.Println(err) }
  updates.Close()
}

func VerifyPlayer(player *game.Player, secret uint32, dbconn *sql.DB) bool {
    var exists int
    err := dbconn.QueryRow(`SELECT COUNT(1) FROM Users WHERE username=? AND secret=?`, player.Username, secret).Scan(&exists)
    if err != nil { fmt.Println(err) }
    return exists != 0
}

func Test (db *sql.DB) {
  results, err := db.Query("SELECT email FROM Users")
  if err != nil { fmt.Println(err); return }
  for results.Next() {
      var email string
      err := results.Scan(&email)
      if err != nil { fmt.Println(err) }
      fmt.Println(email)
  }
}
