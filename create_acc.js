(function () {
  var $ = function (id) { return document.getElementById(id); };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Normalise an email so "Alex@Mail.com " and "alex@mail.com" are the same account.
  function keyOf(email) { return email.trim().toLowerCase(); }

  /* ---------- Theme: same saved choice as the other pages ---------- */
  (function applyTheme() {
    var saved = localStorage.getItem('darkMode');
    document.body.classList.toggle('dark-mode', saved === null ? true : saved === 'true');
  })();

  /* ------------------------------------------------------------------
     STORAGE LAYER
     Only these two functions touch localStorage.
  ------------------------------------------------------------------- */
  var store = {
    get: async function (k) {
      var raw = localStorage.getItem('athletiq:' + k);
      return raw ? JSON.parse(raw) : null;
    },
    set: async function (k, value) {
      localStorage.setItem('athletiq:' + k, JSON.stringify(value));
    }
  };

  /* ------------------------------------------------------------------
     PASSWORD HASH: Demo SHA-256 (matches signin.js)
  ------------------------------------------------------------------- */
  async function hashPassword(email, password) {
    var text = keyOf(email) + ':' + password;
    var bytes = new TextEncoder().encode(text);
    var buffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(buffer))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }

  /* ---------- tabs ---------- */
  function showTab(which) {
    var create = which === 'create';
    $('panel-create').hidden = !create;
    $('panel-check').hidden = create;
    $('tab-create').setAttribute('aria-selected', create);
    $('tab-check').setAttribute('aria-selected', !create);
  }
  $('tab-create').onclick = function () { showTab('create'); };
  $('tab-check').onclick = function () { showTab('check'); };

  function showMsg(el, kind, text) {
    el.className = 'msg ' + kind;
    el.textContent = text;
    el.hidden = false;
  }

  /* ---------- show / hide password (eye buttons) ---------- */
  document.querySelectorAll('.toggle-pw').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = $(btn.getAttribute('data-target'));
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      var icon = btn.querySelector('i');
      if (icon) icon.className = show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  });

  /* ---------- create account ---------- */
  $('create-btn').onclick = async function () {
    ['e-name', 'e-email', 'e-pw', 'e-pw2'].forEach(function (i) { $(i).textContent = ''; });
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
      if (existing) {
        showMsg($('create-msg'), 'bad', 'An account with this email already exists.');
      } else {
        var passwordHash = await hashPassword(email, pw);

        // Sync with backend database if running
        if (window.AthletIQ_API) {
          try {
            await window.AthletIQ_API.register(name, email, $('role').value, pw);
          } catch (apiErr) {
            if (apiErr.message && apiErr.message.toLowerCase().includes('already exists')) {
              showMsg($('create-msg'), 'bad', apiErr.message);
              btn.disabled = false; btn.textContent = 'Create account';
              return;
            }
          }
        }

        await store.set(key, {
          name: name,
          role: $('role').value,
          passwordHash: passwordHash,
          createdAt: new Date().toISOString()
        });
        showMsg($('create-msg'), 'ok', 'Account created! Welcome, ' + name.split(' ')[0] + '! You can now sign in.');
        $('name').value = $('email').value = $('pw').value = $('pw2').value = '';
        setTimeout(function () {
          window.location.href = 'signin.html';
        }, 1500);
      }
    } catch (e) {
      showMsg($('create-msg'), 'info', 'Couldn’t save the account. Please try again.');
    }
    btn.disabled = false; btn.textContent = 'Create account';
  };

  /* ---------- check account ---------- */
  $('check-btn').onclick = async function () {
    $('e-check').textContent = '';
    $('check-msg').hidden = true;
    var email = $('check-email').value.trim();
    if (!EMAIL_RE.test(email)) { $('e-check').textContent = 'Enter a valid email address.'; return; }

    var btn = $('check-btn');
    btn.disabled = true; btn.textContent = 'Checking…';
    try {
      var acct = await store.get(keyOf(email));
      if (acct) {
        var roles = { player: 'player', coach: 'coach', agency: 'sports agency' };
        showMsg($('check-msg'), 'ok', 'Yes, an account exists for ' + email + ' (registered as a ' + (roles[acct.role] || 'member') + ').');
      } else {
        showMsg($('check-msg'), 'info', 'No account found for ' + email + '. You can create one in the first tab.');
      }
    } catch (e) {
      showMsg($('check-msg'), 'bad', 'Couldn’t run the check. Please try again.');
    }
    btn.disabled = false; btn.textContent = 'Check';
  };
  $('check-email').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $('check-btn').click();
  });
})();
