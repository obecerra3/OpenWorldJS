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
            var username = "Abujindad";
        </script>
        <script src="js/config.js"></script>
        <script data-main="../main" src="js/require.js"></script>
    </head>
    <body>
        <div id="threejs-container">Loading...</div>
    </body>
</html>
