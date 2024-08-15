<?php include(__DIR__ . '/html/header.html') ?>

<body>
  <section class="login-section">
    <div class="login-form-box">
      <div class="login-form-value">
        <form action="authenticate" method="post">
          <h2>Login</h2>
          <div class="inputbox">
            <ion-icon name="mail-outline"></ion-icon>
            <input id="userEmail" name="user-email" type="text" placeholder="" required></input>
            <label for="">Username/Email</label>
          </div>
          <div class="inputbox">
            <ion-icon name="lock-closed-outline"></ion-icon>
            <input name="password" type="password" placeholder="" required></input>
            <label for="">Password</label>
          </div>
          <div class="login-options">
            <div class="checkbox-wrapper-65">
              <label for="rememberMeCheck">
                <input type="checkbox" id="rememberMeCheck">
                <span class="cbx">
                  <svg width="12px" height="11px" viewBox="0 0 12 11">
                    <polyline points="1 6.29411765 4.5 10 11 1"></polyline>
                  </svg>
                </span>
                <span>Remember Me &nbsp <a href="#">Forgot Password</a></span>
              </label>
            </div>
          </div>
          <input id="loginBtn" type="submit" class="login-button" value="Sign In"></input>
          <div class="login-register">
            <p>Don't have an account? <a href="#">Register now</a></p>
          </div>
        </form>
      </div>
    </div>
  </section>
  <script type="module" src="assets/js/login.js"></script>
</body>