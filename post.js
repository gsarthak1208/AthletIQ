// Shortcut: $('name') means document.getElementById('name')
var $ = function (id) { return document.getElementById(id); };

// Biggest file sizes we allow (in megabytes)
var MAX_IMAGE_MB = 10;
var MAX_VIDEO_MB = 50;

// 1. WHO IS SIGNED IN?
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
var account = raw ? JSON.parse(raw) : { name: 'Alex Morgan', role: 'player' };

startPage();

/* ------------------------------------------------------------------
   2. SAVING PHOTOS AND VIDEOS
   localStorage is too small for videos (about 5 MB total), so the files
   go in IndexedDB, a bigger storage built into the browser.
   The post itself only remembers the file's id.
------------------------------------------------------------------- */
function openDb() {
  return new Promise(function (resolve, reject) {
    var request = indexedDB.open('athletiq-media', 1);
    request.onupgradeneeded = function () { request.result.createObjectStore('files'); };
    request.onsuccess = function () { resolve(request.result); };
    request.onerror = function () { reject(request.error); };
  });
}

function saveMedia(id, file) {
  return openDb().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put(file, id);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
      tx.onabort = function () { reject(tx.error); };
    });
  });
}

function getMedia(id) {
  return openDb().then(function (db) {
    return new Promise(function (resolve, reject) {
      var request = db.transaction('files', 'readonly').objectStore('files').get(id);
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  });
}

function deleteMedia(id) {
  return openDb().then(function (db) {
    return new Promise(function (resolve) {
      var tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').delete(id);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { resolve(); };
    });
  });
}

// Checks a chosen file. Returns '' if it is fine, or a message if it is not.
function checkFile(file) {
  var isImage = file.type.indexOf('image/') === 0;
  var isVideo = file.type.indexOf('video/') === 0;
  var mb = file.size / (1024 * 1024);
  if (!isImage && !isVideo) return 'Please choose a photo or a video.';
  if (isImage && mb > MAX_IMAGE_MB) return 'Photo is too big. Maximum is ' + MAX_IMAGE_MB + ' MB.';
  if (isVideo && mb > MAX_VIDEO_MB) return 'Video is too big. Maximum is ' + MAX_VIDEO_MB + ' MB.';
  return '';
}

function startPage() {

  // Temporary links to files shown on the page. We clean them up when the list is redrawn.
  var activeUrls = [];

  // 3. LOAD AND SAVE POSTS
  // All posts are kept in one list under the name "athletiq:posts"
  function loadPosts() {
    var saved = localStorage.getItem('athletiq:posts');
    return saved ? JSON.parse(saved) : [];
  }
  function savePosts(posts) {
    localStorage.setItem('athletiq:posts', JSON.stringify(posts));
  }

  // Makes an <img> or <video> from a saved file
  function makeMediaElement(blob, type) {
    var url = URL.createObjectURL(blob);
    activeUrls.push(url);
    var el = document.createElement(type === 'video' ? 'video' : 'img');
    el.src = url;
    if (type === 'video') {
      el.controls = true;            // play / pause buttons
      el.preload = 'metadata';
    } else {
      el.alt = 'Photo in post';
    }
    return el;
  }

  // 4. SHOW THE POSTS ON THE PAGE
  function showPosts() {
    var feed = $('feed');
    feed.innerHTML = '';                      // clear the old list first
    activeUrls.forEach(function (u) { URL.revokeObjectURL(u); });
    activeUrls = [];

    var posts = loadPosts();
    if (posts.length === 0) {
      feed.textContent = 'No posts yet. Be the first to post!';
      return;
    }

    // newest post first
    posts.slice().reverse().forEach(function (post) {
      var box = document.createElement('div');
      box.className = 'post';

      var top = document.createElement('div');
      top.className = 'post-top';
      top.textContent = post.author + ' (' + post.role + ')' + (post.sport ? ' · ' + post.sport : '');
      box.appendChild(top);

      if (post.text) {
        var body = document.createElement('p');
        body.className = 'post-text';
        body.textContent = post.text;         // textContent is safe: it never runs HTML
        box.appendChild(body);
      }

      // Photo or video: leave a spot, then fill it when the file is loaded
      if (post.mediaType) {
        var spot = document.createElement('div');
        spot.className = 'post-media';
        box.appendChild(spot);
        getMedia(post.id).then(function (blob) {
          if (blob) spot.appendChild(makeMediaElement(blob, post.mediaType));
          else spot.textContent = '(file not found on this browser)';
        }).catch(function () {
          spot.textContent = '(could not load file)';
        });
      }

      var time = document.createElement('div');
      time.className = 'post-time';
      time.textContent = new Date(post.createdAt).toLocaleString();
      box.appendChild(time);

      // Only the person who wrote the post sees a Delete button
      if (post.email === email) {
        var del = document.createElement('button');
        del.className = 'delete-btn';
        del.textContent = 'Delete';
        del.onclick = async function () {
          if (post.mediaType) await deleteMedia(post.id);   // remove the file too
          savePosts(loadPosts().filter(function (p) { return p.id !== post.id; }));
          showPosts();
        };
        box.appendChild(del);
      }

      feed.appendChild(box);
    });
  }

  // 5. PREVIEW: when the user picks a file, show it before posting
  var previewUrl = '';
  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
    $('preview').innerHTML = '';
  }

  $('media').onchange = function () {
    $('e-media').textContent = '';
    clearPreview();
    var file = $('media').files[0];
    if (!file) return;

    var problem = checkFile(file);
    if (problem) {
      $('e-media').textContent = problem;
      $('media').value = '';                  // forget the bad file
      return;
    }
    previewUrl = URL.createObjectURL(file);
    var type = file.type.indexOf('video/') === 0 ? 'video' : 'image';
    var el = document.createElement(type === 'video' ? 'video' : 'img');
    el.src = previewUrl;
    if (type === 'video') el.controls = true;
    $('preview').appendChild(el);
  };

  // 6. WHEN THE USER CLICKS "POST"
  $('post-btn').onclick = async function () {
    $('e-text').textContent = '';
    $('e-media').textContent = '';
    $('post-msg').hidden = true;

    var text = $('text').value.trim();
    var sport = $('sport').value.trim();
    var file = $('media').files[0];

    // A post needs some text or a photo/video (or both)
    if (text === '' && !file) {
      $('e-text').textContent = 'Write something or add a photo or video.';
      return;
    }
    if (file) {
      var problem = checkFile(file);
      if (problem) { $('e-media').textContent = problem; return; }
    }

    var btn = $('post-btn');
    btn.disabled = true; btn.textContent = 'Posting…';

    try {
      var id = Date.now();                    // a unique number for this post
      var mediaType = '';
      if (file) {
        await saveMedia(id, file);            // save the file first
        mediaType = file.type.indexOf('video/') === 0 ? 'video' : 'image';
      }

      var posts = loadPosts();
      posts.push({
        id: id,
        email: email,
        author: account.name,
        role: account.role,
        sport: sport,
        text: text,
        mediaType: mediaType,                 // '' (none), 'image' or 'video'
        createdAt: new Date().toISOString()
      });
      savePosts(posts);

      $('text').value = '';
      $('sport').value = '';
      $('media').value = '';
      clearPreview();
      $('post-msg').className = 'msg ok';
      $('post-msg').textContent = 'Your post was added!';
      $('post-msg').hidden = false;
      showPosts();
    } catch (e) {
      $('post-msg').className = 'msg bad';
      $('post-msg').textContent = 'Could not save the post. The file may be too big for this browser.';
      $('post-msg').hidden = false;
    }
    btn.disabled = false; btn.textContent = 'Post';
  };

  showPosts();   // show existing posts when the page opens
}