<?php
// session access
session_start();
session_regenerate_id();
if (!isset($_SESSION['token'])) {
  header("Location: /login");
}

// http post request
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

// get new short-lived access token
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

// get domain from url
function get_domain($url)
{
  $pieces = parse_url($url);
  $domain = isset($pieces['host']) ? $pieces['host'] : $pieces['path'];
  if (preg_match('/(?P<domain>[a-z0-9][a-z0-9\-]{1,63}\.[a-z\.]{2,6})$/i', $domain, $regs)) {
    return $regs['domain'];
  }
  return false;
}

// custom redirect
function redirect($url, $statusCode = 307)
{
  header('Location: ' . $url, true, $statusCode);
  die();
}

// secure API passthrough
$request = $_SERVER['REQUEST_URI'];
$url = getenv("API_SCHEME") . '://' . getenv("API_DOMAIN") . ':' . getenv("API_PORT") . $request;

// get path from param
$parts = parse_url($url);
parse_str($parts['query'], $query);
$path = $query['path'];

// remove path param from url
$url = preg_replace('~(\?|&)path=[^&]*~', '$1', $url);
if (sizeof($query) > 1) { // if path wasn't the only param, remove extra '&' symbol
  $url = str_replace('?&', '?', $url);
} else if (sizeof($query) == 1) { // else if path was the only param, remove '?' symbol
  $url = str_replace('api?', 'api', $url);
}

// replace "/api" with real path
$url = str_replace('/api', $path, $url);

$ch = curl_init();

// forward other methods (works only for json - form data will fail)
if ($_SERVER['REQUEST_METHOD'] === 'POST') { // forward POST requests
  $post_data = http_build_query(json_decode(file_get_contents('php://input'), true));
  curl_setopt($ch, CURLOPT_POST, TRUE);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
} else if ($_SERVER['REQUEST_METHOD'] === "PUT") { // forward PUT requests
  $put_data = http_build_query(json_decode(file_get_contents('php://input'), true));
  curl_setopt($ch, CURLOPT_PUT, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $put_data);
} else if ($_SERVER['REQUEST_METHOD'] === "DELETE") { // forward DELETE requests
  curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
  $delete_data = http_build_query(json_decode(file_get_contents('php://input'), true));
  curl_setopt($ch, CURLOPT_POSTFIELDS, $delete_data);
}

// other curl settings
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$req_headers = getallheaders();

// forward content-type header, if any
if (isset($req_headers['Content-Type'])) {
  $headers[] = $req_headers['Content-Type'];
}

// add auth header
$headers[] = 'Authorization: Bearer ' . newToken();

// set new headers for curl request
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// forward cookies
if (isset($req_headers['Cookie'])) {
  curl_setopt($ch, CURLOPT_COOKIE, $req_headers['Cookie']);
}

// make request
$response = curl_exec($ch);

// if there is no response, send the curl error instead
if ($response === false) {
  $response = "There was an error accessing the API: " . curl_error($ch);
}

// if the domain from the effective url is not blank (i.e is a valid domain), redirect 
$effective_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
if (get_domain($effective_url) != "") {
  redirect($effective_url);
}

// echo the response
echo $response;
