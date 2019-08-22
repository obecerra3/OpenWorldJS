<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

$username = "";
$username_err = "";
if($_SERVER["REQUEST_METHOD"] == "POST"){
    $username = trim($_POST["username"]);
    if(empty($username)){
      $username_err = "Please enter username.";
    } else if (strlen($username) > 40) {
      $username_err = "Please enter a username that is less than 40 characters";
    } else {
      $_SESSION["username"] = $username;
      header("location: maze.php");
    }
  
}
?>
 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>The Maze</title>
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
          <center><h2>The Maze</h2></center><br>
          <form action="" method="post">
              <div class="form-group <?php echo (!empty($username_err)) ? 'has-error' : ''; ?>">
                  <label>Username</label>
                  <input type="text" name="username" class="form-control" value="<?php echo $username; ?>">
                  <span class="help-block"><?php echo $username_err; ?></span>
              </div>    
              <br>
              <div class="form-group">
                  <center><input type="submit" class="btn btn-success" value="Play"></center>
              </div>
              <br>
          </form>
      </div>
    </div>  
</body>
</html>
