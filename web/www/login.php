<?php include(__DIR__ .  '/html/header.html') ?>
<body>
  <section class="minimal-section">
    <div class="minimal">
        <h3>OpenSMM</h3>
        <div class="details">
          <form action="authenticate" method="post">
            <div>
              <input class="login-input" id="username" name="username" type="text" placeholder="Username"></input>
              <input class="login-input" id="password" name="password" type="password" placeholder="Password"></input>
            </div>
            <input id="loginBtn" type="submit" class="login-button" value="Sign In"></input>
          </form>
        </div>
    </div>
  </section>
</body>
<?php include(__DIR__ . '/html/footer.html') ?>