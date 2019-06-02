<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

spl_autoload_register(function ($class_name) {
    include $_SERVER['DOCUMENT_ROOT'] . "/" . $class_name . ".php";
});

$userMan = new UserManager();
 
$username = $email = $password = $confirm_password = "";
$username_err = $email_err = $password_err = $confirm_password_err = "";
 
if($_SERVER["REQUEST_METHOD"] == "POST"){
 
    if(empty(trim($_POST["username"]))) {
        $username_err = "Please enter a username.";
    } else {
        $username = trim($_POST["username"]);
        $email = trim($_POST["email"]);
        
        if ($userMan->exists_username($username)) {
          $username_err = "This username is already taken";
        }
        
        if ($userMan->exists_email($email)) {
          $email_err = "There is already an account associated with this email";
        }
    }
    
    if(empty(trim($_POST["password"]))) {
        $password_err = "Please enter a password.";     
    } elseif (strlen(trim($_POST["password"])) < 6) {
        $password_err = "Password must have atleast 6 characters.";
    } else{
        $password = trim($_POST["password"]);
    }
    
    if(empty(trim($_POST["confirm_password"]))) {
        $confirm_password_err = "Please confirm password.";     
    } else{
        $confirm_password = trim($_POST["confirm_password"]);
        if(empty($password_err) && ($password != $confirm_password)){
            $confirm_password_err = "Password did not match.";
        }
    }
    
    if(empty($username_err) && empty($password_err) && empty($confirm_password_err) && empty($email_err)){
       $userMan->register($email, $username, $password);  
       header("location: login.php");
       exit;
    }
}
?>
 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sign Up</title>
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
          <center><h2>Sign Up</h2></center>
          <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post">
              <div class="form-group <?php echo (!empty($username_err)) ? 'has-error' : ''; ?>">
                  <label>Username</label>
                  <input type="text" name="username" class="form-control" value="<?php echo $username; ?>">
                  <span class="help-block"><?php echo $username_err; ?></span>
              </div>    
              <div class="form-group <?php echo (!empty($email_err)) ? 'has-error' : ''; ?>">
                  <label>Email</label>
                  <input type="text" name="email" class="form-control" value="<?php echo $email; ?>">
                  <span class="help-block"><?php echo $email_err; ?></span>
              </div>
              <div class="form-group <?php echo (!empty($password_err)) ? 'has-error' : ''; ?>">
                  <label>Password</label>
                  <input type="password" name="password" class="form-control" value="<?php echo $password; ?>">
                  <span class="help-block"><?php echo $password_err; ?></span>
              </div>
              <div class="form-group <?php echo (!empty($confirm_password_err)) ? 'has-error' : ''; ?>">
                  <label>Confirm Password</label>
                  <input type="password" name="confirm_password" class="form-control" value="<?php echo $confirm_password; ?>">
                  <span class="help-block"><?php echo $confirm_password_err; ?></span>
              </div>
              <br>
              <center>
                <div class="form-group">
                    <input type="submit" class="btn btn-success" value="Submit">
                    <input type="reset" class="btn btn-default" value="Reset">
                </div>
              </center>
              <br>
              <center><a href="login.php">Login</a></center>
          </form>
      </div> 
    </div>   
</body>
</html>
