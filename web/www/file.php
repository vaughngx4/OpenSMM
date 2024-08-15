<?php
// session access
session_start();
session_regenerate_id();
if (!isset($_SESSION['token'])) {
  header("Location: /login");
}

// custom redirect
function redirect($url, $statusCode = 307)
{
  header('Location: ' . $url, true, $statusCode);
  die();
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
$request = $_SERVER['REQUEST_URI'];

// get necessary params
$parts = parse_url($request);
parse_str($parts['query'], $query);
$type = $query['type'];
$fn = $query['filename'];
$index = $query['index'];

// redirect to download if type is download
if ($type === 'download') {
  redirect('/files/download/' . newToken() . "/" . $fn);
}

// redirect to upload if type is upload
if ($type === 'upload') {
  redirect('/files/upload/' . newToken());
}

// redirect to thumbnail if type is thumbnail
if ($type === 'thumbnail') {
  redirect('/files/thumbnail/' . newToken() . '/' . $fn . '/' . $index);
}