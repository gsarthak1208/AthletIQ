// Shortcut: $('name') means document.getElementById('name')
var $ = function (id) { return document.getElementById(id); };

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// 1. WHO IS SIGNED IN?
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

  // 3. BUILD ONE PERSON CARD
  var ROLE_NAMES = { player: 'Player', coach: 'Coach', agency: 'Sports agency' };

  function makePersonCard(person) {
    var card = document.createElement('div');
    card.className = 'person';

    var avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = person.name.charAt(0).toUpperCase();

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

    var status = (typeof Connections !== 'undefined')
      ? Connections.statusWith(email, person.email)
      : 'none';

    var btn = document.createElement('button');
    btn.className = 'connect-btn';

    if (status === 'connected') {
      btn.className += ' connected';
      btn.textContent = 'Connected ✓';
      btn.title = 'Click to disconnect';
      btn.onclick = function () {
        if (confirm('Disconnect from ' + person.name + '?')) {
          Connections.disconnect(email, person.email);
          refresh();
        }
      };
    } else if (status === 'sent') {
      btn.className += ' requested';
      btn.textContent = 'Pending (Cancel)';
      btn.onclick = function () {
        Connections.cancelRequest(email, person.email);
        refresh();
      };
    } else if (status === 'received') {
      btn.className += ' accept';
      btn.textContent = 'Accept';
      btn.onclick = function () {
        Connections.acceptRequest(email, person.email);
        refresh();
      };
    } else {
      btn.textContent = 'Connect';
      btn.onclick = function () {
        Connections.sendRequest(email, person.email);
        refresh();
      };
    }

    card.appendChild(avatar);
    card.appendChild(info);
    card.appendChild(btn);
    return card;
  }

  // 4. RECOMMENDED PEOPLE
  function getRecommended(people) {
    return people
      .filter(function (p) {
        var status = (typeof Connections !== 'undefined')
          ? Connections.statusWith(email, p.email)
          : 'none';
        return status !== 'connected';
      })
      .sort(function (a, b) {
        var aDifferent = a.role !== me.role ? 0 : 1;
        var bDifferent = b.role !== me.role ? 0 : 1;
        if (aDifferent !== bDifferent) return aDifferent - bDifferent;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }

  // 5. SHOW EVERYTHING ON THE PAGE
  function refresh() {
    var people = getAllPeople();

    // Search results
    var query = $('search').value.trim().toLowerCase();
    $('results-section').hidden = (query === '');
    $('results').innerHTML = '';

    if (query !== '') {
      var found = people.filter(function (p) {
        return p.email.toLowerCase().indexOf(query) !== -1 ||
               p.name.toLowerCase().indexOf(query) !== -1;
      });
      if (found.length === 0) {
        $('results').innerHTML = '<div style="color:#777;padding:10px 0;">No athlete or coach found matching your search.</div>';
      } else {
        found.forEach(function (p) {
          $('results').appendChild(makePersonCard(p));
        });
      }
    }

    // Recommended people
    $('recommended').innerHTML = '';
    var recommended = getRecommended(people);
    if (recommended.length === 0) {
      $('recommended').innerHTML = '<div style="color:#777;padding:10px 0;">' +
        (people.length === 0
          ? 'No other accounts registered yet. Create another account in demo mode to test connections.'
          : 'You are connected with everyone!') +
        '</div>';
    } else {
      recommended.forEach(function (p) {
        $('recommended').appendChild(makePersonCard(p));
      });
    }
  }

  $('search').addEventListener('input', refresh);
  refresh();
}
