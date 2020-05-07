<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

if (!isset($_SESSION["username"])) {
  header("location: index.php");
} else {
  $username = $_SESSION["username"];
}


?>


<!DOCTYPE html>
<html lang="en">
  <head>
    <title>The Maze</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
    <link type="text/css" rel="stylesheet" href="style.css">
    <script>
      var username = "life is hard";
    </script>
    <script src="./lib/three.min.js"></script>
    <script src="./lib/stats.min.js"></script>
    <script src="./lib/ammo.js"></script>
    <script src="./lib/AmmoDebugDrawer.js"></script>
    <script src="./js/Utils/Utils.js"></script>
    <script src="./lib/draco/DRACOLoader.js"></script>
  </head>
  <body>
    <div id="blocker">
     <div id="info">
     </div>
    </div>
    <script src="build.js"></script>
  </body>
</html>
