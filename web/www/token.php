<?php
  function httpPost($url, $data){
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
    $response = curl_exec($curl);
    $info = curl_getinfo($curl);
    $response_code = $info["http_code"];
    if( $e = curl_error($curl) || $response_code != 200 ){
      curl_close($curl);
      return $response_code;
    }else{
      curl_close($curl);
      return $response;
    }
  }
  function newToken(){
    $domain = getenv("DOMAIN");
    $scheme = 'https';
    if( getenv("SSL_KEY") == "" ){
      $scheme = 'http';
    }
    $data = array(
      'refreshToken' => $_SESSION['token']
    );
    $response = httpPost("$scheme://$domain/api/re-toke", $data);
    if( is_int($response) ){
      return 'FAILED';
    }else{
      $array = json_decode($response, true);
      if( $array['status'] == 'success' ){
        return $array['accessToken'];
      }else{
        return 'FAILED';
      }
    }
  }
  session_start();
  session_regenerate_id();
  if( !isset($_SESSION['token']) )
  {
    header("Location: /login");
  }else {
    header('Content-Type: application/json');
    $data = array(
      'token' => newToken()
    );
    echo json_encode($data);
  }
?>