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
      var username = "<?php echo $username;?>"
    </script>
  </head>
  <body>
    <div id="blocker">
     <div id="info"><?php echo $username?><br><br><br><br><br><br>space - jump/fly<br>shift - crouch/descend<br>f - toggle flashlight</div>
    </div>
    <script src="build.js"></script>
  </body>
</html>


