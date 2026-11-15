(function () {
  // Set to true while testing: the sign-in box then tells you the REAL reason it failed.
  // Set back to false when you finish (so the page only says "Incorrect credentials").
  var DEBUG = true;

  // Shortcut: $('name') means document.getElementById('name')
  var $ = function (id) { return document.getElementById(id); };

  // A simple pattern that checks an email looks like "something@something.xx"
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Make emails lowercase so "Alex@Mail.com" and "alex@mail.com" are the same account
  function keyOf(email) { return email.trim().toLowerCase(); }

  // NOTE: every section below only runs if its elements exist on the page,
  // so this one file is safe to use on the sign-in page AND the create-account page.

  /* ------------------------------------------------------------------
     STORAGE: the only code that saves/loads data.
     Later, replace these with fetch() calls to your real backend.
  ------------------------------------------------------------------- */
  var store = {
    get: async function (key) {
      var raw = localStorage.getItem('athletiq:' + key);
      return raw ? JSON.parse(raw) : null;
    },
    set: async function (key, value) {
      localStorage.setItem('athletiq:' + key, JSON.stringify(value));
    }
  };

  /* ------------------------------------------------------------------
     PASSWORD HASH: we never save the real password, only a scrambled
     version (SHA-256). This is for the DEMO only. A real backend should
     use bcrypt or argon2 on the server.
  ------------------------------------------------------------------- */
  async function hashPassword(email, password) {
    var text = keyOf(email) + ':' + password;
    var bytes = new TextEncoder().encode(text);
    var buffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(buffer))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }

  /* ---------- Tabs ---------- */
  // Works with whichever tabs the page has (sign in / create / check).
  // A tab only counts if both its button and its panel exist on the page.
  var allTabs = ['signin', 'create', 'check'].filter(function (n) {
    return $('tab-' + n) && $('panel-' + n);
  });

  function showTab(which) {
    allTabs.forEach(function (name) {
      var active = name === which;
      $('panel-' + name).hidden = !active;
      $('tab-' + name).setAttribute('aria-selected', active);
    });
  }
  allTabs.forEach(function (name) {
    $('tab-' + name).onclick = function () { showTab(name); };
  });

  function showMsg(el, kind, text) {
    el.className = 'msg ' + kind;   // kind is "ok", "bad" or "info"
    el.textContent = text;
    el.hidden = false;
  }

  /* ---------- SIGN IN ---------- */
  if ($('signin-btn')) {
  $('signin-btn').onclick = async function () {
    $('e-si-email').textContent = '';
    $('e-si-pw').textContent = '';
    $('signin-msg').hidden = true;

    var email = $('si-email').value.trim();
    var password = $('si-pw').value;

    // Empty boxes: ask the person to fill them in
    if (email === '' || password === '') {
      showMsg($('signin-msg'), 'bad', 'Incorrect credentials');
      return;
    }

    var btn = $('signin-btn');
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      var account = await store.get(keyOf(email));
      var hash = await hashPassword(email, password);

      // Correct only if the account exists AND the password matches
      if (account && account.passwordHash === hash) {
        localStorage.setItem('athletiq:session', keyOf(email));  // remember who signed in
        window.location.href = 'home.html';                      // go to the home page
        return;
      }

      // Anything else (no account, or wrong password) = same message
      var reason = 'Incorrect credentials';
      if (DEBUG) {
        if (!account) reason += ' (debug: no account saved for ' + keyOf(email) + ' in this browser)';
        else if (!account.passwordHash) reason += ' (debug: this account has no saved password - create it again)';
        else reason += ' (debug: password does not match)';
      }
      showMsg($('signin-msg'), 'bad', reason);
    } catch (e) {
      showMsg($('signin-msg'), 'info', 'Something went wrong. Please try again.');
    }
    btn.disabled = false; btn.textContent = 'Sign in';
  };

  // Pressing Enter in the password box also signs in
  $('si-pw').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $('signin-btn').click();
  });
  }

  /* ---------- CREATE ACCOUNT ---------- */
  if ($('create-btn')) {
  $('create-btn').onclick = async function () {
    ['e-name', 'e-email', 'e-pw', 'e-pw2'].forEach(function (id) { $(id).textContent = ''; });
    $('create-msg').hidden = true;

    var name = $('name').value.trim();
    var email = $('email').value.trim();
    var pw = $('pw').value;
    var pw2 = $('pw2').value;
    var valid = true;

    if (name.length < 2) { $('e-name').textContent = 'Please enter your name.'; valid = false; }
    if (!EMAIL_RE.test(email)) { $('e-email').textContent = 'Enter a valid email address.'; valid = false; }
    if (pw.length < 8) { $('e-pw').textContent = 'Use at least 8 characters.'; valid = false; }
    if (pw !== pw2) { $('e-pw2').textContent = 'Passwords don’t match.'; valid = false; }
    if (!valid) return;

    var btn = $('create-btn');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      var key = keyOf(email);
      var existing = await store.get(key);

      // An old account with no saved password doesn't count: let it be created again
      if (existing && existing.passwordHash) {
        showMsg($('create-msg'), 'bad', 'An account with this email already exists. Try signing in.');
      } else {
        await store.set(key, {
          name: name,
          role: $('role').value,
          passwordHash: await hashPassword(email, pw),
          createdAt: new Date().toISOString()
        });
        showMsg($('create-msg'), 'ok', 'Account created! You can now sign in with ' + email + '.');
        if ($('si-email')) $('si-email').value = email;   // fill the sign-in form (only if it is on this page)
        $('name').value = $('email').value = $('pw').value = $('pw2').value = '';
      }
    } catch (e) {
      showMsg($('create-msg'), 'info', 'Couldn’t save the account. Please try again.');
    }
    btn.disabled = false; btn.textContent = 'Create account';
  };
  }

  /* ---------- CHECK ACCOUNT ---------- */
  if ($('check-btn')) {
  $('check-btn').onclick = async function () {
    $('e-check').textContent = '';
    $('check-msg').hidden = true;

    var email = $('check-email').value.trim();
    if (!EMAIL_RE.test(email)) { $('e-check').textContent = 'Enter a valid email address.'; return; }

    var btn = $('check-btn');
    btn.disabled = true; btn.textContent = 'Checking…';
    try {
      var account = await store.get(keyOf(email));
      if (account) {
        var roles = { player: 'player', coach: 'coach', agency: 'sports agency' };
        showMsg($('check-msg'), 'ok', 'Yes, an account exists for ' + email + ' (registered as a ' + (roles[account.role] || 'member') + ').');
      } else {
        showMsg($('check-msg'), 'info', 'No account found for ' + email + '.');
      }
    } catch (e) {
      showMsg($('check-msg'), 'bad', 'Couldn’t run the check. Please try again.');
    }
    btn.disabled = false; btn.textContent = 'Check';
  };

  $('check-email').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $('check-btn').click();
  });
  }

  /* ---------- SIGN OUT & SESSION CHECK ---------- */
  if ($('signout-btn')) {
    $('signout-btn').onclick = function () {
      localStorage.removeItem('athletiq:session');
      location.reload();
    };
  }

  var currentSession = localStorage.getItem('athletiq:session');
  if (currentSession && $('panel-welcome') && $('welcome-title')) {
    store.get(currentSession).then(function (acc) {
      if (acc) {
        if ($('panel-signin')) $('panel-signin').hidden = true;
        if ($('panel-create')) $('panel-create').hidden = true;
        if ($('panel-check')) $('panel-check').hidden = true;
        if (document.querySelector('.tabs')) document.querySelector('.tabs').hidden = true;
        $('panel-welcome').hidden = false;
        $('welcome-title').textContent = 'Welcome back, ' + acc.name + '!';
        $('welcome-text').innerHTML = 'You are already signed in as <strong>' + currentSession + '</strong>.<br><br><a href="home.html" class="btn" style="display:inline-block;text-align:center;text-decoration:none;margin-bottom:12px;">Go to Home</a>';
      }
    });
  }

  })();