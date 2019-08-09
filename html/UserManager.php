<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

class UserManager {
    var $link;
    public function __construct () {
        $this->link = new mysqli("themaze.io", "bnwlkr", "88ae3cefb3", "Maze");
    }
    
    function random_str() {
      return sha1(rand());
    }
    
    /* verify a user
     */ 
    public function verify ($username, $password) {
      $query = $this->link->prepare("SELECT phash FROM Users WHERE username=?");
      $query->bind_param("s", $username);
      $query->execute();
      $result = $query->get_result();
      if ($result->num_rows == 0) { return False; }
      $row = $result->fetch_assoc();
      return password_verify($password, $row["phash"]);
    }
    
    public function getPosition ($username) {
      $query = $this->link->prepare("SELECT x, z FROM Users WHERE username=?");
      $query->bind_param("s", $username);
      $query->execute();
      $result = $query->get_result();
      if ($result->num_rows == 0) { return False; }
      $row = $result->fetch_assoc();
      return  (object) array('x' => $row["x"], 'z' => $row["z"]);
    }
    
    public function setsecret ($username) {
      $query = $this->link->prepare("UPDATE Users SET secret=? WHERE username=?");
      $secret = $this->random_str();
      $query->bind_param("ss", $secret, $username);
      $query->execute();
      return $secret;
    }
    
    /* create a new user
     */ 
    public function register ($email, $username, $password) {
      $phash = password_hash($password, PASSWORD_DEFAULT);
      $query = $this->link->prepare("INSERT INTO Users (email, username, phash) VALUES (?, ?, ?)");
      $query->bind_param("sss", $email, $username, $phash);
      $query->execute();
      return $query->get_result();
    }
    
    /* check if username or email already exists
    */
    public function exists_username($username) {
      $query = $this->link->prepare("SELECT * FROM Users WHERE username=?");
      $query->bind_param("s", $username);
      $query->execute();
      return $query->get_result()->num_rows > 0;
    }
    
    public function exists_email($email) {
      $query = $this->link->prepare("SELECT * FROM Users WHERE email=?");
      $query->bind_param("s", $email);
      $query->execute();
      return $query->get_result()->num_rows > 0;
    }
    
    
}
