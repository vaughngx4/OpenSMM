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
        <div class="theme-settings">
          <div id="appScreen" class="app-screen">
            <h3 class="settings-heading">Themes</h3>
            <div class="theme-option">
              <label for="default-theme">Dots (Default)</label>
              <input type="radio" id="default-theme" name="theme" value="default-theme">
            </div>
            <div class="theme-option">
              <label for="blue-nova-gradient">Blue Nova (Gradient)</label>
              <input type="radio" id="blue-nova-gradient" name="theme" value="blue-nova-gradient">
            </div>
            <div class="theme-option">
              <label for="cosmic-black">Cosmic Black</label>
              <input type="radio" id="cosmic-black" name="theme" value="cosmic-black">
            </div>
            <div class="theme-option">
              <label for="pearl-white">Pearl White</label>
              <input type="radio" id="pearl-white" name="theme" value="pearl-white">
            </div>
            <div class="theme-option">
              <label for="space-grey">Space Grey</label>
              <input type="radio" id="space-grey" name="theme" value="space-grey">
            </div>

            <button type="button" id="change-theme-submit">Change Theme</button>
          </div>
        </div>
      </div>
    </div>
    <?php include(__DIR__ . '/html/modal-popup.html') ?>
    <?php include(__DIR__ . '/html/popup-message.html') ?>
  </section>

  <script src="assets/js/settings.js" type="module"></script>
</body>