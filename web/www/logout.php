<?php
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
function deAuth()
{
  $api_scheme = getenv("API_SCHEME");
  $api_domain = getenv("API_DOMAIN");
  $api_port = getenv("API_PORT");
  $data = array(
    'refreshToken' => $_SESSION['token']
  );
  $response = httpPost("$api_scheme://$api_domain:$api_port/logout", $data);
  if (is_int($response)) {
    return false;
  } else {
    $response_array = json_decode($response, true);
    if ($response_array['status'] == 'success') {
      return true;
    } else {
      return false;
    }
  }
}
session_start();
session_regenerate_id();
if (!isset($_SESSION['token'])) {
  header("Location: /login");
} else {
  if (deAuth()) {
    unset($_SESSION['token']);
    session_destroy();
    header("Location: /login");
  } else {
    echo "API ERROR: Access could not be revoked. Please go back and try again.";
  }
}