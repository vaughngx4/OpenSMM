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
function newToken()
{
  $api_scheme = getenv("API_SCHEME");
  $api_domain = getenv("API_DOMAIN");
  $api_port = getenv("API_PORT");
  $data = array(
    'refreshToken' => $_SESSION['token']
  );
  $response = httpPost("$api_scheme://$api_domain:$api_port/refresh-token", $data);
  if (is_int($response)) {
    return 'FAILED';
  } else {
    $array = json_decode($response, true);
    if ($array['status'] == 'success') {
      return $array['accessToken'];
    } else {
      return 'FAILED';
    }
  }
}
session_start();
session_regenerate_id();
if (!isset($_SESSION['token'])) {
  header("Location: /login");
} else {
  header('Content-Type: application/json');
  $data = array(
    'token' => newToken()
  );
  echo json_encode($data);
}