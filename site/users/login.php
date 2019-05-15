<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


spl_autoload_register(function ($class_name) {
    include $_SERVER['DOCUMENT_ROOT'] . "/users/" . $class_name . ".php";
});

$username = $_POST["username"];
$password = $_POST["password"];


$user_manager = new UserManager();
$result = $user_manager->verify($username, $password);
echo $result ? 1 : 0;

?>
