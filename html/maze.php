<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

spl_autoload_register(function ($class_name) {
    include $_SERVER['DOCUMENT_ROOT'] . "/" . $class_name . ".php";
});


session_start();

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
  </head>
  <body>
    <div id="blocker">
     <div id="info"><?php echo $_SESSION["username"]?><br><br><br><br><br><br>space - jump/fly<br>shift - crouch/descend<br>f - toggle flashlight</div>
    </div>
    <script src="build.js"></script>
  </body>
</html>
