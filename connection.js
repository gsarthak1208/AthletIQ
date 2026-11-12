/* ==================================================================
   SHARED HELPER: connection requests and notifications.
   Other pages load this file first, then use the Connections.xxx()
   functions below. It only saves and reads data; it draws nothing.

   What gets saved (in localStorage):
   - athletiq_requests       : every request   { from, to, status }
                               status is "pending" or "accepted"
   - athletiq_notifications  : messages shown to a user { to, from, type }
                               type is "request" or "accepted"
================================================================== */
var Connections = (function () {
  var REQUESTS_KEY = 'athletiq_requests';
  var NOTES_KEY = 'athletiq_notifications';

  function read(key) {
    var saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  }
  function write(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }
  function newId() {
    return Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  // Look up a person's name from their email (falls back to the email)
  function nameOf(email) {
    try {
      var account = JSON.parse(localStorage.getItem('athletiq:' + email));
      if (account && account.name) return account.name;
    } catch (e) {}
    return email;
  }

  // Find a request between two people, whoever sent it
  function between(a, b) {
    var found = read(REQUESTS_KEY).filter(function (r) {
      return (r.from === a && r.to === b) || (r.from === b && r.to === a);
    });
    return found[0] || null;
  }

  // How "me" and "other" are related, from my point of view:
  // "none" | "sent" (I asked them) | "received" (they asked me) | "connected"
  function statusWith(me, other) {
    var request = between(me, other);
    if (!request) return 'none';
    if (request.status === 'accepted') return 'connected';
    return request.from === me ? 'sent' : 'received';
  }

  /* ----- notifications ----- */
  function addNote(to, type, from) {
    var notes = read(NOTES_KEY);
    notes.push({
      id: newId(), to: to, from: from, type: type,
      createdAt: new Date().toISOString(),
      read: false,       // has the user opened the notifications page?
      toasted: false     // has the pop-up already been shown?
    });
    write(NOTES_KEY, notes);
  }
  function removeNotes(to, type, from) {
    write(NOTES_KEY, read(NOTES_KEY).filter(function (n) {
      return !(n.to === to && n.type === type && n.from === from);
    }));
  }

  /* ----- requests ----- */
  function removeRequest(from, to) {
    write(REQUESTS_KEY, read(REQUESTS_KEY).filter(function (r) {
      return !(r.from === from && r.to === to);
    }));
  }

  // "me" asks "other" to connect -> other gets a notification
  function sendRequest(me, other) {
    if (between(me, other)) return;           // already asked, or already connected
    var requests = read(REQUESTS_KEY);
    requests.push({ id: newId(), from: me, to: other, status: 'pending', createdAt: new Date().toISOString() });
    write(REQUESTS_KEY, requests);
    addNote(other, 'request', me);
  }

  // I change my mind: remove my request (and the other person's notification)
  function cancelRequest(me, other) {
    removeRequest(me, other);
    removeNotes(other, 'request', me);
  }

  // I accept a request that "other" sent me -> they get an "accepted" notification
  function acceptRequest(me, other) {
    var requests = read(REQUESTS_KEY);
    requests.forEach(function (r) {
      if (r.from === other && r.to === me && r.status === 'pending') r.status = 'accepted';
    });
    write(REQUESTS_KEY, requests);
    addNote(other, 'accepted', me);
  }

  // I decline a request that "other" sent me
  function declineRequest(me, other) {
    removeRequest(other, me);
    removeNotes(me, 'request', other);
  }

  // Remove an existing connection
  function disconnect(me, other) {
    var request = between(me, other);
    if (request && request.status === 'accepted') {
      write(REQUESTS_KEY, read(REQUESTS_KEY).filter(function (r) { return r.id !== request.id; }));
    }
  }

  /* ----- reading notifications ----- */
  function notesFor(me) {
    return read(NOTES_KEY)
      .filter(function (n) { return n.to === me; })
      .sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });   // newest first
  }
  function unreadCount(me) {
    return notesFor(me).filter(function (n) { return !n.read; }).length;
  }
  // Notifications that need a pop-up (not read, pop-up not shown yet)
  function newToasts(me) {
    return notesFor(me).filter(function (n) { return !n.read && !n.toasted; });
  }
  function markToasted(id) {
    var notes = read(NOTES_KEY);
    notes.forEach(function (n) { if (n.id === id) n.toasted = true; });
    write(NOTES_KEY, notes);
  }
  function markAllRead(me) {
    var notes = read(NOTES_KEY);
    notes.forEach(function (n) { if (n.to === me) { n.read = true; n.toasted = true; } });
    write(NOTES_KEY, notes);
  }

  return {
    nameOf: nameOf, statusWith: statusWith,
    sendRequest: sendRequest, cancelRequest: cancelRequest,
    acceptRequest: acceptRequest, declineRequest: declineRequest, disconnect: disconnect,
    notesFor: notesFor, unreadCount: unreadCount,
    newToasts: newToasts, markToasted: markToasted, markAllRead: markAllRead
  };
})();