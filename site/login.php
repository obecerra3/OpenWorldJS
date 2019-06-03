<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

spl_autoload_register(function ($class_name) {
    include $_SERVER['DOCUMENT_ROOT'] . "/" . $class_name . ".php";
});

session_start();

if(isset($_SESSION["auth"]) && $_SESSION["auth"] === true){
  header("location: maze.php");
  exit;
}
 
$user_man = new UserManager();
 
$username = $password = "";
$username_err = $password_err = "";
 
if($_SERVER["REQUEST_METHOD"] == "POST"){
    
    if(empty(trim($_POST["username"]))){
        $username_err = "Please enter username.";
    } else{
        $username = trim($_POST["username"]);
    }
  
    if(empty(trim($_POST["password"]))){
        $password_err = "Please enter your password.";
    } else{
        $password = trim($_POST["password"]);
    }
    
    $verification = $user_man->verify($username, $password);
    
    if ($verification->success) {
      session_start();
      $_SESSION["auth"] = true;
      $_SESSION["username"] = $username;                            
      header("location: maze.php");
    } else {
        $password_err = "Login failed, please try again.";
    }
}
?>
 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login</title>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
    <style type="text/css">
        body{ font: 14px sans-serif; }
        .wrapper{ width: 350px; padding: 20px; }
    </style>
</head>
<body>
    <div class="row" style="padding-top:50px">
      <div class="center-block">
        <center><img src="logo.png"></img></center>
      </div> 
    </div>
    <div class="row">
      <div class="wrapper center-block">
          <center><h2>Login</h2></center>
          <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post">
              <div class="form-group <?php echo (!empty($username_err)) ? 'has-error' : ''; ?>">
                  <label>Username</label>
                  <input type="text" name="username" class="form-control" value="<?php echo $username; ?>">
                  <span class="help-block"><?php echo $username_err; ?></span>
              </div>    
              <div class="form-group <?php echo (!empty($password_err)) ? 'has-error' : ''; ?>">
                  <label>Password</label>
                  <input type="password" name="password" class="form-control">
                  <span class="help-block"><?php echo $password_err; ?></span>
              </div>
              <br>
              <div class="form-group">
                  <center><input type="submit" class="btn btn-success" value="Login"></center>
              </div>
              <br>
              <center><a href="register.php">Sign up</a></center>
          </form>
      </div>
    </div>  
</body>
</html>
