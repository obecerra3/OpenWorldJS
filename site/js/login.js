$('#login').click(function () {
  var data = {}
  $('#login-form').serializeArray().forEach((x)=>data[x["name"]] = x["value"]);
  $.post("https://themaze.io/users/login.php", data, function (response) {
    if (response["success"]) {
      // logged in
    } else {
      // failed to log in
    }
  });
  return false;
});
