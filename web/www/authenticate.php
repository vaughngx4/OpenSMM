<?php
function encodeURIComponent($str) {
  $revert = array('%21'=>'!', '%2A'=>'*', '%27'=>"'", '%28'=>'(', '%29'=>')');
  return strtr(rawurlencode($str), $revert);
}
function httpPost($url, $data)
{
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
  $response = curl_exec($ch);
  $info = curl_getinfo($ch);
  $response_code = $info["http_code"];
  if ($e = curl_error($ch) || $response_code != 200) {
    curl_close($ch);
    return $response_code;
  } else {
    curl_close($ch);
    return $response;
  }
}
function auth($_user, $_pass)
{
  $_user = test($_user);
  $_pass = test($_pass);
  $api_scheme = getenv("API_SCHEME");
  $api_domain = getenv("API_DOMAIN");
  $api_port = getenv("API_PORT");
  $data = [
    'username' => $_user,
    'password' => $_pass
  ];
  $response = httpPost("$api_scheme://$api_domain:$api_port/authenticate", $data);
  if (is_int($response)) {
    return 'FAILED';
  } else {
    $array = json_decode($response, true);
    if ($array['status'] == 'success') {
      return $array;
    } else {
      return 'FAILED';
    }
  }
}
function test($data)
{
  $data = trim($data);
  $data = stripslashes($data);
  #$data = htmlspecialchars($data);
  return $data;
}
session_start();
if (isset($_POST['user-email']) && isset($_POST['password'])) {
  $auth = auth($_POST['user-email'], $_POST['password']);
  if ($auth != 'FAILED') {
    # runs on successful authentication
    $_SESSION['token'] = $auth['refreshToken'];
    header("Location: /");
  } else {
    # runs if authentication fails
    header("Location: /login");
  }
} else {
  # runs if username or password is blank
  header("Location: /login?status=error&message=" . encodeURIComponent("Username or password is blank"));
}