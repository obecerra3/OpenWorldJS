$('#login').click(function () {
  var data = {}
  $('#login-form').serializeArray().forEach((x)=>data[x["name"]] = x["value"]);
  $.post("https://themaze.io/users/login.php", data, function (data) {
    var response = $.parseJSON(data);
    if (response["success"]) {
      // logged in
      window.location.href = "maze.html";
    } else {
      console.log("login failed");
      // failed to log in
    }
  });
  return false;
});


$('#create').click(function () {
  var data = {}
  $('#register-form').serializeArray().forEach((x)=>data[x["name"]] = x["value"]);
  $.post("https://themaze.io/users/register.php", data, function (data) {
    console.log(data);
    var response = $.parseJSON(data);
    if (response["success"]) {
        // user created
      console.log("user created");
      window.location.href = "maze.html"
    } else {
        // failed to login
      console.log("failed to create user");
    } 
  });
  return false;
});
