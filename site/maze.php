<?php
session_start();
if(!isset($_SESSION["auth"]) || $_SESSION["auth"] === false){
  header("location: login.php");
  exit;
}


echo "WELCOME TO THE MAZE, " . $_SESSION["username"];



?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login</title>
    <link rel="stylesheet" href="">
</head>
<body>
</body>
</html>

