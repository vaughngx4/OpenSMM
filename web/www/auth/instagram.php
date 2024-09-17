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

$redir = str_replace('/auth/instagram', '/api?path=/instagram/auth', $_SERVER['REQUEST_URI']);
echo $redir;
redirect($redir);