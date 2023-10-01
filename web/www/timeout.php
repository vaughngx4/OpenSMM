<?php include(__DIR__ . '/html/header.html') ?>

<body>
  <section class="minimal-section">
    <div class="minimal">
      <div class="details">
        <p>
          <?php if (isset($_GET['err'])) {
            $msg = str_replace("+", " ", $_GET['err']);
            echo $msg;
          } else {
            echo "Session timed out";
          }
          ?>
        </p><br>
        <a href="/login">Return to Login page</a>
      </div>
    </div>
  </section>
</body>
<?php
session_start();
unset($_SESSION['token']);
session_destroy();
?>