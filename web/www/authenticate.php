<?php
  function httpPost($url, $data){
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    # curl_setopt ($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.1) Gecko/20061204 Firefox/2.0.0.1');
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
  function auth($_user, $_pass){
    $_user = test($_user);
    $_pass = test($_pass);
    $domain = getenv("DOMAIN");
    $scheme = 'https';
    if( getenv("SSL_KEY") == "" ){
      $scheme = 'http';
    }
    $data = array(
      'username' => $_user,
      'password' => $_pass
    );
    $response = httpPost("$scheme://$domain/api/authenticate", $data);
    if( is_int($response) ){
      return 'FAILED';
    }else{
      $array = json_decode($response, true);
      if( $array['status'] == 'success' ){
        return $array;
      }else{
        return 'FAILED';
      }
    }
  }
  function test($data) {
    $data = trim($data);
    $data = stripslashes($data);
    #$data = htmlspecialchars($data);
    return $data;
  }
  session_start();
  if( isset($_POST['username']) && isset($_POST['password']) )
  {
    $auth = auth($_POST['username'], $_POST['password']);
    if( $auth != 'FAILED' ){
      # runs on successful authentication
      $_SESSION['token'] = $auth['refreshToken'];
      header( "Location: /" );
    }else{
      # runs if authentication fails
      header( "Location: /login" );
    }
  }else{
    # runs if username or password is blank
    header( "Location: /login?err=missing+info" );
  }
?>