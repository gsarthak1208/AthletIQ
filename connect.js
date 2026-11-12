// Shortcut: $('name') means document.getElementById('name')
var $ = function (id) { return document.getElementById(id); };

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// 1. WHO IS SIGNED IN?  (sign-in saved this in localStorage)
var email = localStorage.getItem('athletiq:session');
var raw = email ? localStorage.getItem('athletiq:' + email) : null;
var me = raw ? JSON.parse(raw) : null;

// Nobody signed in -> go to the sign-in page
if (!me) {
  window.location.href = 'signin.html';
} else {
  startPage();
}

function startPage() {

  // 2. GET EVERYONE WHO HAS AN ACCOUNT
  // Accounts are saved as "athletiq:<email>". We look through the saved items,
  // keep the ones that look like an email, and skip the signed-in user.
  // We only copy name, role and email. We never copy the password.
  function getAllPeople() {
    var people = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key.indexOf('athletiq:') !== 0) continue;

      var address = key.slice('athletiq:'.length);
      if (!EMAIL_RE.test(address) || address === email) continue;

      var account;
      try { account = JSON.parse(localStorage.getItem(key)); } catch (e) { continue; }
      if (account && account.name && account.role) {
        people.push({ email: address, name: account.name, role: account.role });
      }
    }
    return people;
  }

  // 3. CONNECTIONS: who the signed-in user has connected with
  // Saved as one object: { "me@mail.com": ["friend1@mail.com", ...], ... }
  function loadAllConnections() {
    var saved = localStorage.getItem('athletiq_connections');
    return saved ? JSON.parse(saved) : {};
  }
  function loadConnections() {
    return loadAllConnections()[email] || [];
  }
  function saveConnections(list) {
    var all = loadAllConnections();
    all[email] = list;
    localStorage.setItem('athletiq_connections', JSON.stringify(all));
  }

  function toggleConnection(otherEmail) {
    var list = loadConnections();
    var at = list.indexOf(otherEmail);
    if (at === -1) list.push(otherEmail);   // not connected yet -> connect
    else list.splice(at, 1);                // already connected -> disconnect
    saveConnections(list);
    refresh();
  }

  // 4. BUILD ONE PERSON CARD
  var ROLE_NAMES = { player: 'Player', coach: 'Coach', agency: 'Sports agency' };

  function makePersonCard(person, connected) {
    var card = document.createElement('div');
    card.className = 'person';

    var avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = person.name.charAt(0).toUpperCase();   // first letter of the name

    var info = document.createElement('div');
    info.className = 'person-info';

    var name = document.createElement('div');
    name.className = 'person-name';
    name.textContent = person.name;

    var role = document.createElement('div');
    role.className = 'person-role';
    role.textContent = ROLE_NAMES[person.role] || person.role;

    var mail = document.createElement('div');
    mail.className = 'person-email';
    mail.textContent = person.email;

    info.appendChild(name);
    info.appendChild(role);
    info.appendChild(mail);

    var btn = document.createElement('button');
    btn.className = connected ? 'connect-btn connected' : 'connect-btn';
    btn.textContent = connected ? 'Connected ✓' : 'Connect';
    btn.onclick = function () { toggleConnection(person.email); };

    card.appendChild(avatar);
    card.appendChild(info);
    card.appendChild(btn);
    return card;
  }

  // 5. RECOMMENDED PEOPLE
  // Rule: people you are NOT connected with yet. People with a different role
  // come first (a player sees coaches and agencies first), because AthletIQ
  // connects players, coaches and agencies. Then the rest, A to Z. Show 5.
  function getRecommended(people, connections) {
    return people
      .filter(function (p) { return connections.indexOf(p.email) === -1; })
      .sort(function (a, b) {
        var aDifferent = a.role !== me.role ? 0 : 1;
        var bDifferent = b.role !== me.role ? 0 : 1;
        if (aDifferent !== bDifferent) return aDifferent - bDifferent;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5);
  }

  // 6. SHOW EVERYTHING ON THE PAGE
  function refresh() {
    var people = getAllPeople();
    var connections = loadConnections();

    // Search results: only when something is typed in the search box
    var query = $('search').value.trim().toLowerCase();
    $('results-section').hidden = (query === '');
    $('results').innerHTML = '';

    if (query !== '') {
      var found = people.filter(function (p) {
        return p.email.toLowerCase().indexOf(query) !== -1;   // email contains the typed text
      });
      if (found.length === 0) {
        $('results').textContent = 'No one found with that email.';
      } else {
        found.forEach(function (p) {
          $('results').appendChild(makePersonCard(p, connections.indexOf(p.email) !== -1));
        });
      }
    }

    // Recommended people
    $('recommended').innerHTML = '';
    var recommended = getRecommended(people, connections);
    if (recommended.length === 0) {
      $('recommended').textContent = people.length === 0
        ? 'No other accounts yet. Create another account to see people here.'
        : 'You are connected with everyone for now!';
    } else {
      recommended.forEach(function (p) {
        $('recommended').appendChild(makePersonCard(p, false));
      });
    }
  }

  // Search as the user types
  $('search').addEventListener('input', refresh);

  refresh();   // show people when the page opens
}