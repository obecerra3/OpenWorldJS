<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

class UserManager {
    var $link;
    public function __construct () {
        $this->link = new mysqli("127.0.0.1", "bnwlkr", "88ae3cefb3", "Maze");
    }
    
    /* verify a user
     */ 
    public function verify ($username, $password) {
      $query = $this->link->query("SELECT * FROM Users WHERE username='$username'");
      if ($query->num_rows == 0) { return (object) array('success' => False); }
      $result = $query->fetch_assoc();
      if (password_verify($password, $result["phash"])) {
        return (object) array('success' => True, 'x' => $result["x"], 'y' => $result["y"]);
      } else {
        return (object) array('success' => False);
      }
    }
    
    /* create a new user
     */ 
    public function register ($email, $username, $password) {
      $phash = password_hash($password, PASSWORD_DEFAULT);
      $query = $this->link->query("INSERT INTO Users (email, username, phash) VALUES ('$email', '$username', '$phash')");
      return (object) array('success' => $query ? True : False);
    }
    
    /* check if username or email already exists
    */
    public function exists_username($username) {
      $query = $this->link->query("SELECT * FROM Users WHERE username='$username'");
      return $query->num_rows > 0;
    }
    
    public function exists_email($email) {
      $query = $this->link->query("SELECT * FROM Users WHERE email='$email'");
      return $query->num_rows > 0;
    }
    
    
}
