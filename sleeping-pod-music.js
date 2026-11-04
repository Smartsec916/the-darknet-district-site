/* Sleeping Pod: "My Music", the player's own songs.
   The songs play in this browser only. A song is a File the player picked; it is played through an object URL (a private address that exists only in
   this tab) on the same <audio> element as the website playlist, so the spectrum analyzer and volume keep working for both. Nothing is uploaded, no
   request is made, and no audio is copied anywhere unless the player switches on "Keep my songs in this browser" (browser storage on this device only).
   The rules for what plays next are in sleeping-pod-playlist.js (pure, unit tested); this file is the part that touches the page. */
(function (root) {
  'use strict';

  var PL = root.PodPlaylist;
  var DB_NAME = 'darknet-pod-music', STORE = 'songs', KEEP_FLAG = 'darknet-pod-music-keep';
  var KEEP_LIMIT = 500 * 1024 * 1024; // bytes of songs this page will keep in browser storage

  function byId(id) { return document.getElementById(id); }

  // ── Browser-local storage (opt-in): the song files themselves, in IndexedDB on this device. Never sent anywhere. ──
  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!root.indexedDB) return reject(new Error('IndexedDB is not available'));
      var req = root.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE, { keyPath: 'key' }); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function tx(mode, fn) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(STORE, mode), store = t.objectStore(STORE), result = fn(store);
        t.oncomplete = function () { db.close(); resolve(result && result.result !== undefined ? result.result : result); };
        t.onerror = t.onabort = function () { db.close(); reject(t.error); };
      });
    });
  }
  var storage = {
    all: function () { return tx('readonly', function (s) { return s.getAll(); }).then(function (rows) { return (rows || []).sort(function (a, b) { return a.order - b.order; }); }); },
    put: function (row) { return tx('readwrite', function (s) { s.put(row); }); },
    del: function (key) { return tx('readwrite', function (s) { s.delete(key); }); },
    clear: function () { return tx('readwrite', function (s) { s.clear(); }); }
  };
  function keepFlag(value) {
    try { if (value === undefined) return root.localStorage.getItem(KEEP_FLAG) === '1'; if (value) root.localStorage.setItem(KEEP_FLAG, '1'); else root.localStorage.removeItem(KEEP_FLAG); } catch (e) { /* storage blocked: nothing is kept */ }
    return !!value;
  }

  /** options: { audio, playUrl(url), pause(), onSwitch(source), setTitle(text) } */
  function createPodMusic(options) {
    var audio = options.audio;
    var list = PL.createPlaylist();
    var isActive = false, objectUrl = null, failures = 0, keeping = false, keptBytes = 0, order = 0;
    var el = {
      website: byId('podSourceWebsite'), mine: byId('podSourceMine'), panel: byId('myMusicPanel'), input: byId('myMusicInput'), add: byId('myMusicAdd'),
      shuffle: byId('myMusicShuffle'), repeat: byId('myMusicRepeat'), clear: byId('myMusicClear'), list: byId('myMusicList'), status: byId('myMusicStatus'),
      count: byId('myMusicCount'), keep: byId('myMusicKeep'), keepRow: byId('myMusicKeepRow'), empty: byId('myMusicEmpty')
    };

    function say(text) { if (el.status) el.status.textContent = text || ''; }
    function revoke() { if (objectUrl) { try { root.URL.revokeObjectURL(objectUrl); } catch (e) { /* already gone */ } objectUrl = null; } }

    // ── Drawing the list ──
    function render() {
      var tracks = list.tracks, current = list.currentId;
      el.list.textContent = '';
      tracks.forEach(function (t, i) {
        var li = document.createElement('li');
        li.className = 'pod-list__item' + (t.id === current ? ' is-current' : '') + (t.failed ? ' is-failed' : '');
        li.dataset.id = t.id;
        var play = document.createElement('button');
        play.type = 'button'; play.className = 'pod-list__play'; play.dataset.act = 'play';
        play.setAttribute('aria-label', 'Play ' + t.label);
        if (t.id === current) play.setAttribute('aria-current', 'true');
        var num = document.createElement('span'); num.className = 'pod-list__num'; num.textContent = String(i + 1).padStart(2, '0');
        var name = document.createElement('span'); name.className = 'pod-list__name'; name.textContent = t.label; name.title = t.label;
        play.appendChild(num); play.appendChild(name);
        var rm = document.createElement('button');
        rm.type = 'button'; rm.className = 'pod-list__remove'; rm.dataset.act = 'remove';
        rm.setAttribute('aria-label', 'Remove ' + t.label); rm.textContent = '×';
        li.appendChild(play); li.appendChild(rm); el.list.appendChild(li);
      });
      el.empty.hidden = tracks.length > 0;
      el.count.textContent = tracks.length + (tracks.length === 1 ? ' song' : ' songs');
      el.clear.disabled = !tracks.length;
      el.shuffle.setAttribute('aria-pressed', String(list.shuffle));
      el.repeat.setAttribute('aria-pressed', String(list.repeat !== 'off'));
      el.repeat.textContent = 'Repeat: ' + list.repeat;
    }
    function showSource() {
      el.website.setAttribute('aria-pressed', String(!isActive));
      el.mine.setAttribute('aria-pressed', String(isActive));
      el.panel.hidden = !isActive;
    }

    // ── Playing ──
    function start() {
      var t = list.find(list.currentId);
      if (!t) return false;
      revoke();
      objectUrl = root.URL.createObjectURL(t.file);
      options.setTitle(t.label);
      options.playUrl(objectUrl);
      render();
      return true;
    }
    function playId(id) { if (list.select(id)) start(); }
    function stopQuiet() { options.pause(); render(); }

    function canPlay(file) {
      var type = PL.MIME_BY_EXTENSION[PL.extensionOf(file.name)] || file.type || '';
      try { return !type || audio.canPlayType(type) !== ''; } catch (e) { return true; }
    }

    function addFiles(files) {
      var picked = Array.prototype.slice.call(files || []), notAudio = [], cannot = [], usable = [];
      picked.forEach(function (f) {
        if (!PL.isAudioFile(f)) notAudio.push(f.name);
        else if (!canPlay(f)) cannot.push(f.name);
        else usable.push({ name: f.name, size: f.size, lastModified: f.lastModified, file: f });
      });
      var wasIdle = list.currentId === null || audio.paused;
      var result = list.add(usable);
      var parts = [];
      if (result.added.length) parts.push('Added ' + result.added.length + (result.added.length === 1 ? ' song.' : ' songs.'));
      if (result.skipped) parts.push(result.skipped + ' already in the list.');
      if (notAudio.length) parts.push('Skipped ' + notAudio.length + ' that ' + (notAudio.length === 1 ? 'is' : 'are') + ' not audio: ' + notAudio.slice(0, 3).join(', ') + (notAudio.length > 3 ? '…' : '') + '.');
      if (cannot.length) parts.push('This browser cannot play: ' + cannot.slice(0, 3).join(', ') + (cannot.length > 3 ? '…' : '') + '.');
      if (!picked.length) parts.push('No files chosen.');
      say(parts.join(' '));
      render();
      if (keeping) result.added.forEach(keepTrack);
      // Nothing was playing: start with the first song just added (the player chose it a moment ago).
      if (isActive && result.added.length && wasIdle) { list.select(result.added[0].id); start(); }
    }

    // ── Keeping songs in this browser (opt-in) ──
    function keepTrack(track) {
      if (track.kept || !track.file) return;
      if (keptBytes + track.file.size > KEEP_LIMIT) { say('Not kept: "' + track.label + '" would go over the ' + Math.round(KEEP_LIMIT / 1048576) + ' MB limit for saved songs. It still plays this session.'); return; }
      storage.put({ key: track.key, name: track.name, size: track.size, lastModified: track.lastModified, order: order++, file: track.file })
        .then(function () { track.kept = true; keptBytes += track.file.size; })
        .catch(function () { say('Could not keep "' + track.label + '" in this browser (storage is full or blocked). It still plays this session.'); });
    }
    function setKeeping(on) {
      keeping = on; keepFlag(on); el.keep.checked = on;
      if (on) {
        if (root.navigator && root.navigator.storage && root.navigator.storage.persist) root.navigator.storage.persist().catch(function () {});
        list.tracks.forEach(keepTrack);
        say(list.size ? 'Your songs are kept in this browser on this device. They are never uploaded.' : 'New songs will be kept in this browser on this device. They are never uploaded.');
      } else {
        storage.clear().catch(function () {});
        list.tracks.forEach(function (t) { t.kept = false; }); keptBytes = 0;
        say('Saved copies removed from this browser. Your list stays until you leave the page.');
      }
    }
    function restoreKept() {
      if (!keepFlag()) return Promise.resolve();
      keeping = true; el.keep.checked = true;
      return storage.all().then(function (rows) {
        var result = list.add(rows.map(function (r) { return { name: r.name, size: r.size, lastModified: r.lastModified, file: r.file, kept: true }; }));
        rows.forEach(function (r) { keptBytes += r.size; order = Math.max(order, r.order + 1); });
        render();
        if (result.added.length) say('Restored ' + result.added.length + (result.added.length === 1 ? ' song' : ' songs') + ' kept in this browser.');
      }).catch(function () { keeping = false; el.keep.checked = false; });
    }

    // ── The page's controls ──
    el.website.addEventListener('click', function () { if (isActive) controller.deactivate(); });
    el.mine.addEventListener('click', function () { if (!isActive) controller.activate(); });
    el.add.addEventListener('click', function () { el.input.click(); });
    el.input.addEventListener('change', function () { addFiles(el.input.files); el.input.value = ''; });
    el.shuffle.addEventListener('click', function () { list.setShuffle(!list.shuffle); render(); say('Shuffle ' + (list.shuffle ? 'on.' : 'off.')); });
    el.repeat.addEventListener('click', function () {
      var mode = list.cycleRepeat(); render();
      say(mode === 'off' ? 'Repeat off: the list stops after the last song.' : mode === 'all' ? 'Repeat all: the list starts again after the last song.' : 'Repeat one: the current song plays again when it ends.');
    });
    el.clear.addEventListener('click', function () {
      var had = list.size; if (!had) return;
      var wasCurrent = list.currentId !== null; list.clear(); revoke(); if (wasCurrent && isActive) stopQuiet();
      if (keeping) { storage.clear().catch(function () {}); keptBytes = 0; }
      options.setTitle(''); render(); say('Playlist cleared (' + had + (had === 1 ? ' song' : ' songs') + ').');
    });
    el.list.addEventListener('click', function (e) {
      var button = e.target.closest && e.target.closest('button[data-act]'); if (!button) return;
      var id = button.parentNode.dataset.id;
      if (button.dataset.act === 'play') { playId(id); return; }
      var track = list.find(id), wasPlaying = id === list.currentId && !audio.paused, outcome = list.remove(id);
      if (!outcome.removed) return;
      if (keeping && track && track.kept) { storage.del(track.key).catch(function () {}); keptBytes -= track.file.size; }
      if (outcome.wasCurrent) { revoke(); if (outcome.replacement && wasPlaying) start(); else { if (!outcome.replacement) { stopQuiet(); options.setTitle(''); } render(); } } else render();
      say('Removed "' + (track ? track.label : 'song') + '".');
    });
    if (el.keep) el.keep.addEventListener('change', function () { setKeeping(el.keep.checked); });
    audio.addEventListener('playing', function () { failures = 0; });
    root.addEventListener('pagehide', revoke);

    // Keeping songs needs IndexedDB. Without it the option is hidden and the playlist lasts until the tab is closed.
    if (!root.indexedDB) el.keepRow.hidden = true;

    var controller = {
      get active() { return isActive; },
      get hasCurrent() { return list.currentId !== null; },
      get size() { return list.size; },
      get playlist() { return list; },
      ready: Promise.resolve(),
      activate: function () {
        isActive = true; showSource(); options.onSwitch('mine');
        if (list.currentId !== null) start(); else if (list.size) { list.next(false); start(); } else options.setTitle('');
      },
      deactivate: function () {
        // The song keeps sounding for the half second the website song takes to fade in, so its private address is released a little later
        var stale = objectUrl; objectUrl = null; isActive = false;
        if (stale) setTimeout(function () { try { root.URL.revokeObjectURL(stale); } catch (e) { /* already gone */ } }, 2500);
        showSource(); options.onSwitch('website');
      },
      next: function (auto) {
        var id = list.next(!!auto);
        if (id === null) { if (auto) { stopQuiet(); say('End of the list.'); } return; }
        start();
      },
      previous: function () {
        if (audio.currentTime > 3) { audio.currentTime = 0; return; }
        if (list.previous() !== null) start();
      },
      ended: function () { controller.next(true); },
      /** The browser could not play the current file: say so, mark it, and move on (stopping if nothing in the list will play). */
      error: function () {
        var t = list.find(list.currentId); if (!t) return;
        t.failed = true; failures++;
        if (failures >= list.size) { stopQuiet(); say('None of these files could be played in this browser.'); return; }
        say('Could not play "' + t.label + '". Skipping it.');
        controller.next(true);
      }
    };
    showSource(); render();
    controller.ready = restoreKept();
    return controller;
  }

  root.createPodMusic = createPodMusic;
})(window);
