<?php
  session_start();
  session_regenerate_id();
  if( !isset($_SESSION['token']) )
  {
    header("Location: /login");
  }
?>
<?php include(__DIR__ .  '/html/header.html') ?>
<body>
  <section class="body-section">
    <?php include(__DIR__ . '/html/sidebar.html') ?>
    <div class="main">
      <?php include(__DIR__ . '/html/topbar.html') ?>
      <div id="app" class="app">
          <div id="appScreen" class="app-screen">
            <h3 class="info-heading">Themes</h3>
            <div class="theme-option">
                <label for="default-theme">Blue Nova (Default)</label>
                <input type="radio" id="default-theme" name="theme" value="default-theme">
            </div>
            <div class="theme-option">
                <label for="dark-blue-gradient">Blue Nova (Gradient)</label>
                <input type="radio" id="dark-blue-gradient" name="theme" value="dark-blue-gradient">
            </div>

            <button type="button" id="change-theme-submit">Submit</button>
          </div>
      </div>
    </div>
    <?php include(__DIR__ . '/html/modal-popup.html') ?>
    <?php include(__DIR__ . '/html/popup-message.html') ?>
  </section>

  <script src="assets/js/settings.js" type="module" ></script>
</body>
<?php include(__DIR__ . '/html/footer.html') ?>