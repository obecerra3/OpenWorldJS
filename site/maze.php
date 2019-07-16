<?php
session_start();
/* DEBUG */

//$_SESSION["username"] = "developer";
//$_SESSION["x"] = 0;
//$_SESSION["y"] = 0;


/* DEBUG */


//if(!isset($_SESSION["auth"]) || $_SESSION["auth"] === false){
//  header("location: login.php");
//  exit;
//}



?>


<!DOCTYPE html>
<html lang="en">
  <head>
    <title>The Maze</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
    <link type="text/css" rel="stylesheet" href="./css/main.css">
    <style>
      #blocker {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
      }
      #info {
        position: absolute;
        top: 10px;
        width: 100%;
        text-align: center;
        z-index: 100;
        display:block;
      }
  
    </style>
  </head>
  <body>
    <div id="blocker">
     <div id="info"><?php echo $_SESSION["username"]?></div>
    </div>
    
    

    <script type="module" src="maze.js"></script>
  </body>
</html>


