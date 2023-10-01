<?php
session_start();
session_regenerate_id();
if (!isset($_SESSION['token'])) {
  header("Location: /login");
}
?>
<?php include(__DIR__ . '/html/header.html') ?>

<body>
  <section class="body-section">
    <?php include(__DIR__ . '/html/sidebar.html') ?>
    <div class="main">
      <div id="app" class="app">
        <div id="appScreen" class="app-screen"></div>
      </div>
    </div>
    <?php include(__DIR__ . '/html/modal-popup.html') ?>
    <?php include(__DIR__ . '/html/popup-message.html') ?>
    <?php include(__DIR__ . '/html/prompt.html') ?>
  </section>

  <script src="assets/js/modules/masonry/masonry.pkgd.min.js"></script>
  <script src="assets/js/modules/masonry/imagesloaded.pkgd.js"></script>
  <script src="assets/js/index.js" type="module"></script>
</body>