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

$redir = str_replace('/callback/facebook','/api?path=/facebook/callback', $_SERVER['REQUEST_URI']);
echo $redir;
redirect($redir);