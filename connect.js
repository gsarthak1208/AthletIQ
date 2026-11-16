(function () {
  var $ = function (id) { return document.getElementById(id); };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var email = localStorage.getItem('athletiq:session');
  if (!email) {
    email = 'alex@athletiq.com';
    localStorage.setItem('athletiq:session', email);
  }

  if (!localStorage.getItem('athletiq:' + email)) {
    localStorage.setItem('athletiq:' + email, JSON.stringify({
      name: 'Alex Morgan',
      role: 'player',
      sport: 'Football',
      createdAt: new Date().toISOString()
    }));
  }

  var raw = localStorage.getItem('athletiq:' + email);
  var me = raw ? JSON.parse(raw) : { name: 'Alex Morgan', role: 'player' };

  startPage();

  function startPage() {
    var selectedRole = 'all';
    var selectedSport = 'all';

    // Check URL parameters (e.g. ?role=coach)
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('role')) {
      selectedRole = urlParams.get('role');
    }

    // Role filter pills
    var rolePills = document.querySelectorAll('.role-pill');
    rolePills.forEach(function (pill) {
      if (pill.getAttribute('data-role') === selectedRole) {
        rolePills.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
      }
      pill.addEventListener('click', function () {
        rolePills.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        selectedRole = pill.getAttribute('data-role');
        refresh();
      });
    });

    // Sport select dropdown
    var sportSelect = $('filterSportSelect');
    if (sportSelect) {
      sportSelect.addEventListener('change', function () {
        selectedSport = sportSelect.value;
        refresh();
      });
    }

    // Settings Dropdown & Dark Mode
    var settingsBtn = $('settingsBtn');
    var dropdown = $('settingsDropdown');
    var darkToggle = $('darkModeToggle');
    var signOut = $('signOut');

    if (settingsBtn && dropdown) {
      settingsBtn.onclick = function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      };
      document.addEventListener('click', function (e) {
        if (!e.target.closest('.settings-container')) {
          dropdown.classList.remove('active');
        }
      });
    }

    function setDarkMode(enabled) {
      document.body.classList.toggle('dark-mode', enabled);
      localStorage.setItem('darkMode', enabled);
      if (darkToggle) darkToggle.checked = enabled;
    }
    var savedTheme = localStorage.getItem('darkMode');
    setDarkMode(savedTheme === null ? true : savedTheme === 'true');

    if (darkToggle) {
      darkToggle.onchange = function () { setDarkMode(darkToggle.checked); };
    }

    if (signOut) {
      signOut.onclick = function () {
        if (confirm('Sign out of AthletIQ?')) {
          localStorage.removeItem('athletiq:session');
          window.location.href = 'signin.html';
        }
      };
    }

    // Get all accounts
    function getAllPeople() {
      var people = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.indexOf('athletiq:') !== 0) continue;

        var address = key.slice('athletiq:'.length);
        if (!EMAIL_RE.test(address) || address === email) continue;

        var account;
        try { account = JSON.parse(localStorage.getItem(key)); } catch (e) { continue; }
        if (account && account.name) {
          people.push({
            email: address,
            name: account.name,
            role: account.role || 'player',
            sport: account.sport || 'General Athletics',
            team: account.team || 'Independent',
            location: account.location || 'Worldwide',
            bio: account.bio || 'Active sports professional on AthletIQ.'
          });
        }
      }
      return people;
    }

    function makePersonCard(person) {
      var card = document.createElement('div');
      card.className = 'person-card';

      var top = document.createElement('div');
      top.className = 'person-card-top';

      var avatar = document.createElement('div');
      avatar.className = 'person-avatar';
      avatar.textContent = person.name.charAt(0).toUpperCase();

      var info = document.createElement('div');
      info.className = 'person-info';

      var name = document.createElement('div');
      name.className = 'person-name';
      name.innerHTML = `${person.name} <i class="fa-solid fa-circle-check text-green" style="font-size:12px;"></i>`;

      var meta = document.createElement('div');
      meta.className = 'person-meta';
      meta.innerHTML = `
        <span class="badge-role ${person.role}">${person.role}</span>
        <span class="badge-sport">${person.sport}</span>
      `;

      info.appendChild(name);
      info.appendChild(meta);
      top.appendChild(avatar);
      top.appendChild(info);
      card.appendChild(top);

      var bio = document.createElement('p');
      bio.className = 'person-bio';
      bio.textContent = person.bio || (person.team + ' · ' + person.location);
      card.appendChild(bio);

      var status = (typeof Connections !== 'undefined')
        ? Connections.statusWith(email, person.email)
        : 'none';

      var actions = document.createElement('div');
      actions.className = 'person-card-actions';

      var btn = document.createElement('button');
      btn.className = 'btn-connect-action';

      if (status === 'connected') {
        btn.className += ' connected';
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Connected';
        btn.title = 'Click to disconnect';
        btn.onclick = function () {
          if (confirm('Disconnect from ' + person.name + '?')) {
            Connections.disconnect(email, person.email);
            refresh();
          }
        };
      } else if (status === 'sent') {
        btn.className += ' requested';
        btn.innerHTML = '<i class="fa-solid fa-clock"></i> Requested';
        btn.title = 'Click to cancel request';
        btn.onclick = function () {
          Connections.cancelRequest(email, person.email);
          refresh();
        };
      } else if (status === 'received') {
        btn.className += ' accept';
        btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Accept';
        btn.onclick = function () {
          Connections.acceptRequest(email, person.email);
          refresh();
        };
      } else {
        btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Connect';
        btn.onclick = function () {
          Connections.sendRequest(email, person.email);
          refresh();
        };
      }

      var chatBtn = document.createElement('a');
      chatBtn.href = 'messages.html?to=' + encodeURIComponent(person.email);
      chatBtn.className = 'btn-chat-shortcut';
      chatBtn.title = 'Send Direct Message';
      chatBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';

      actions.appendChild(btn);
      actions.appendChild(chatBtn);
      card.appendChild(actions);

      return card;
    }

    function refresh() {
      var people = getAllPeople();
      var query = $('search').value.trim().toLowerCase();

      // Filter by role
      if (selectedRole !== 'all') {
        people = people.filter(function (p) { return p.role === selectedRole; });
      }

      // Filter by sport
      if (selectedSport !== 'all') {
        people = people.filter(function (p) {
          return (p.sport || '').toLowerCase().includes(selectedSport.toLowerCase());
        });
      }

      var isSearching = query !== '';
      $('results-section').hidden = !isSearching;
      $('results').innerHTML = '';

      if (isSearching) {
        var found = people.filter(function (p) {
          return p.name.toLowerCase().includes(query) ||
                 p.email.toLowerCase().includes(query) ||
                 p.sport.toLowerCase().includes(query) ||
                 p.location.toLowerCase().includes(query) ||
                 p.team.toLowerCase().includes(query);
        });

        $('resultsCount').textContent = found.length + ' found';
        if (found.length === 0) {
          $('results').innerHTML = '<div style="color:var(--text-muted); padding:20px; font-size:14px; grid-column: 1/-1;">No athletes or coaches match "' + query + '". Try another keyword.</div>';
        } else {
          found.forEach(function (p) {
            $('results').appendChild(makePersonCard(p));
          });
        }
      }

      // Recommended
      $('recommended').innerHTML = '';
      if (people.length === 0) {
        $('recommended').innerHTML = '<div style="color:var(--text-muted); padding:20px; font-size:14px; grid-column: 1/-1;">No other accounts found for this filter. Create another account or adjust your sport filter!</div>';
      } else {
        people.forEach(function (p) {
          $('recommended').appendChild(makePersonCard(p));
        });
      }
    }

    $('search').addEventListener('input', refresh);
    refresh();
  }
})();
