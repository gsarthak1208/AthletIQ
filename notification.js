/* ==================================================================
   NOTIFICATION POP-UP & NOTIFICATIONS PAGE MANAGER
================================================================== */
(function () {
  var me = localStorage.getItem('athletiq:session');
  if (!me) {
    var listEl = document.getElementById('list');
    if (listEl) {
      window.location.href = 'signin.html';
      return;
    }
  }

  if (typeof Connections === 'undefined') return;

  // --- 1. POP-UP TOASTS & BADGE ---
  function updateBadge() {
    var badge = document.getElementById('notif-count');
    if (!badge || !me) return;
    var count = Connections.unreadCount(me);
    badge.textContent = count;
    badge.hidden = (count === 0);
  }

  function getToastBox() {
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
    view.href = 'notification.html';
    view.textContent = 'View';
    view.style.cssText = 'color:#f4773d;margin-right:14px;font-weight:bold;text-decoration:none;';

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
    getToastBox().appendChild(toast);

    setTimeout(function () { toast.remove(); }, 8000);
  }

  function checkToasts() {
    if (!me) return;
    Connections.newToasts(me).forEach(function (note) {
      showToast(note);
      Connections.markToasted(note.id);
    });
    updateBadge();
  }

  // --- 2. NOTIFICATIONS PAGE LIST RENDERING ---
  function renderList() {
    var list = document.getElementById('list');
    if (!list || !me) return;

    var notes = Connections.notesFor(me);
    list.innerHTML = '';

    if (notes.length === 0) {
      list.innerHTML = '<div class="empty-state">No notifications yet.</div>';
      return;
    }

    notes.forEach(function (note) {
      var name = Connections.nameOf(note.from);
      var status = Connections.statusWith(me, note.from);

      var item = document.createElement('div');
      item.className = 'notif-item';

      var avatar = document.createElement('div');
      avatar.className = 'notif-avatar';
      avatar.textContent = name.charAt(0).toUpperCase();

      var content = document.createElement('div');
      content.className = 'notif-content';

      var text = document.createElement('div');
      text.className = 'notif-text';

      var time = document.createElement('div');
      time.className = 'notif-time';
      time.textContent = new Date(note.createdAt).toLocaleString();

      if (note.type === 'request') {
        text.innerHTML = '<strong>' + name + '</strong> sent you a connection request.';
        content.appendChild(text);
        content.appendChild(time);

        var actions = document.createElement('div');
        actions.className = 'notif-actions';

        if (status === 'received') {
          var btnAccept = document.createElement('button');
          btnAccept.className = 'btn-accept';
          btnAccept.textContent = 'Accept';
          btnAccept.onclick = function () {
            Connections.acceptRequest(me, note.from);
            renderList();
          };

          var btnDecline = document.createElement('button');
          btnDecline.className = 'btn-decline';
          btnDecline.textContent = 'Decline';
          btnDecline.onclick = function () {
            Connections.declineRequest(me, note.from);
            renderList();
          };

          actions.appendChild(btnAccept);
          actions.appendChild(btnDecline);
        } else if (status === 'connected') {
          var badge = document.createElement('span');
          badge.className = 'btn-accepted-badge';
          badge.textContent = 'Connected ✓';
          actions.appendChild(badge);
        }

        content.appendChild(actions);
      } else {
        text.innerHTML = '<strong>' + name + '</strong> accepted your connection request.';
        content.appendChild(text);
        content.appendChild(time);
      }

      item.appendChild(avatar);
      item.appendChild(content);
      list.appendChild(item);
    });

    // Mark as read once opened
    Connections.markAllRead(me);
    updateBadge();
  }

  // Run when page loads
  checkToasts();
  renderList();
  window.addEventListener('storage', function () {
    checkToasts();
    renderList();
  });
})();
