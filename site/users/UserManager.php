<?php

class UserManager {
    var $link;
    public function __construct () {
        $this->link = new mysqli("127.0.0.1", "bnwlkr", "88ae3cefb3", "Maze");
    }
    
    /* verify that the user exists
     * returns true iff user exists and password is correct
     */ 
    public function verify ($username, $password) {
      $query = $this->link->query("SELECT * FROM Users WHERE username='$username'");
      $result = $query->fetch_assoc();
      return password_verify($password, $result["phash"]);
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
