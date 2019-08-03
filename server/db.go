package db

import (
  "fmt"
  "maze/game"
	"database/sql"
  _"github.com/go-sql-driver/mysql"
)

func Connect() *sql.DB {
	db, err := sql.Open("mysql", "bnwlkr:88ae3cefb3@/Maze")
	if err != nil { 	fmt.Println(err); return nil }
	return db
}

func GetSavedPosition(player * game.Player, dbconn * sql.DB) game.Vec2 {
  var result game.Vec2
  err := dbconn.QueryRow(fmt.Sprint("SELECT x, z FROM Users WHERE username='", player.Username, "'")).Scan(&result.X, &result.Z)
  if (err != nil) { fmt.Println(err) }
  return result
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
