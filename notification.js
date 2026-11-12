/* ==================================================================
   NOTIFICATION POP-UP.
   Add this file (after connections.js) to any page where you want
   the pop-up, for example home.html and connect.html.
   - Shows a pop-up when someone sends you a request or accepts yours.
   - Fills in a number badge if the page has <span id="notif-count">.
================================================================== */
(function () {
  var me = localStorage.getItem('athletiq:session');     // who is signed in
  if (!me || typeof Connections === 'undefined') return;  // nobody signed in: do nothing

  // Update the little number next to the "Notifications" link
  function updateBadge() {
    var badge = document.getElementById('notif-count');
    if (!badge) return;
    var count = Connections.unreadCount(me);
    badge.textContent = count;
    badge.hidden = (count === 0);
  }

  // The box in the top-right corner that holds pop-ups
  function getBox() {
    var box = document.getElementById('toast-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast-box';
      box.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;' +
        'display:flex;flex-direction:column;gap:10px;max-width:320px;';
      document.body.appendChild(box);
    }
    return box;
  }

  function showToast(note) {
    var name = Connections.nameOf(note.from);

    var toast = document.createElement('div');
    toast.style.cssText = 'background:#14181f;color:#ffffff;padding:12px 14px;border-radius:10px;' +
      'font-family:Arial,sans-serif;font-size:14px;box-shadow:0 4px 14px rgba(0,0,0,0.25);';

    var text = document.createElement('div');
    text.textContent = note.type === 'request'
      ? name + ' wants to connect with you'
      : name + ' accepted your connection request';

    var view = document.createElement('a');
    view.href = 'notifications.html';
    view.textContent = 'View';
    view.style.cssText = 'color:#7fb2ff;margin-right:14px;font-weight:bold;';

    var close = document.createElement('button');
    close.textContent = 'Dismiss';
    close.style.cssText = 'background:none;border:none;color:#bbbbbb;cursor:pointer;padding:0;';
    close.onclick = function () { toast.remove(); };

    var row = document.createElement('div');
    row.style.cssText = 'margin-top:8px;';
    row.appendChild(view);
    row.appendChild(close);

    toast.appendChild(text);
    toast.appendChild(row);
    getBox().appendChild(toast);

    setTimeout(function () { toast.remove(); }, 8000);    // disappears after 8 seconds
  }

  // Look for new notifications, pop each one up once
  function check() {
    Connections.newToasts(me).forEach(function (note) {
      showToast(note);
      Connections.markToasted(note.id);
    });
    updateBadge();
  }

  check();                                   // when the page opens
  window.addEventListener('storage', check); // and when another tab saves something new
})();