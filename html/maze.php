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
    <link type="text/css" rel="stylesheet" href="style.css">
    <script>var username = "<?php echo $_SESSION["username"]?>" </script>
  </head>
  <body>
    <div id="blocker">
     <div id="info"><?php echo $_SESSION["username"]?></div>
    </div>
    <script src="bundle.js"></script>
  </body>
</html>


