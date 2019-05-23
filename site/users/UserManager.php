<?php

class UserManager {
    var $link;
    public function __construct () {
        $this->link = new mysqli("127.0.0.1", "bnwlkr", "88ae3cefb3", "Maze");
    }
    
    /* verify that the user exists
     * returns response object accordingly
     */ 
    public function verify ($username, $password) {
      $query = $this->link->query("SELECT * FROM Users WHERE username='$username'");
      $result = $query->fetch_assoc();
      if (password_verify($password, $result["phash"])) {
        return (object) array('success' => True, 'x' => $result["x"], 'y' => $result["y"]);
      } else {
        return (object) array('success' => False);
      }
    }
    
    /* create a new user
     * return true if successful
     */ 
    public function register ($email, $username, $password) {
      $phash = password_hash($password, PASSWORD_DEFAULT);
      $query = $this->link->query("INSERT INTO Users (email, username, phash) VALUES ('$email', '$username', '$phash')");
      return $query;
    }
    
    
}
