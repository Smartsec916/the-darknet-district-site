/* Sleeping Pod: the rules of the player's own playlist ("My Music"). Pure logic, no DOM, no audio: it only decides which song is next, previous or
   current, so it runs in the browser and in Node (tests/pod-playlist.test.cjs). The pod music player (pod-music.js) plays what it chooses.
   Nothing here reads, copies or sends audio: a track is a name plus whatever the player attaches to it (a File the player picked). */
(function (root) {
  'use strict';

  // Formats a browser can normally play. The page still asks the browser (canPlayType) before accepting a file, and handles a file that fails to play.
  var EXTENSIONS = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'weba'];
  var MIME_BY_EXTENSION = {
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', m4a: 'audio/mp4', aac: 'audio/aac',
    flac: 'audio/flac', opus: 'audio/ogg; codecs="opus"', weba: 'audio/webm'
  };
  var HISTORY_LIMIT = 200;

  function extensionOf(name) {
    var m = /\.([A-Za-z0-9]+)$/.exec(String(name || ''));
    return m ? m[1].toLowerCase() : '';
  }

  /** True for a file that looks like audio: an audio/* type from the browser, or a known audio extension. */
  function isAudioFile(file) {
    if (!file) return false;
    var type = String(file.type || '').toLowerCase();
    if (type.indexOf('audio/') === 0) return true;
    return EXTENSIONS.indexOf(extensionOf(file.name)) !== -1;
  }

  /** The label a player sees: the file name without its extension. */
  function trackName(fileName) {
    var base = String(fileName || '').replace(/^.*[\\/]/, '');
    var ext = extensionOf(base);
    if (ext && EXTENSIONS.indexOf(ext) !== -1) base = base.slice(0, base.length - ext.length - 1);
    base = base.replace(/\s+/g, ' ').trim();
    return base || 'Untitled';
  }

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    var s = Math.floor(seconds), m = Math.floor(s / 60);
    return m + ':' + String(s % 60).padStart(2, '0');
  }

  /** A playlist. `random` is injectable so tests can fix the shuffle. repeat is 'off' | 'all' | 'one'. */
  function createPlaylist(options) {
    var random = (options && options.random) || Math.random;
    var tracks = [], currentId = null, shuffle = false, repeat = 'off', nextNumber = 1;
    var queue = [];   // shuffle: ids still to play in this round
    var history = []; // shuffle: ids played before the current one, for Previous

    function indexOf(id) { for (var i = 0; i < tracks.length; i++) if (tracks[i].id === id) return i; return -1; }
    function find(id) { var i = indexOf(id); return i === -1 ? null : tracks[i]; }
    function shuffled(ids) {
      var a = ids.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }
    // A new shuffle starts without the song already playing (it counts as played). A new round after the end holds every song, but never starts with the one that just played.
    function refill(newRound) {
      var ids = tracks.map(function (t) { return t.id; });
      queue = shuffled(newRound ? ids : ids.filter(function (id) { return id !== currentId; }));
      if (newRound && queue.length > 1 && queue[0] === currentId) { var t = queue[0]; queue[0] = queue[queue.length - 1]; queue[queue.length - 1] = t; }
    }
    function pushHistory(id) {
      if (id === null || id === undefined) return;
      history.push(id);
      if (history.length > HISTORY_LIMIT) history.shift();
    }
    function moveTo(id) {
      if (id !== currentId) pushHistory(currentId);
      currentId = id;
      if (shuffle) { var q = queue.indexOf(id); if (q !== -1) queue.splice(q, 1); }
      return id;
    }

    return {
      get currentId() { return currentId; },
      get shuffle() { return shuffle; },
      get repeat() { return repeat; },
      get size() { return tracks.length; },
      get tracks() { return tracks.slice(); },
      find: find,

      /** items: [{name, size, lastModified, ...anything the player attaches}]. The same name + size + date is never added twice. */
      add: function (items) {
        var added = [], skipped = 0;
        (items || []).forEach(function (item) {
          var key = [item.name, item.size, item.lastModified].join('|');
          if (tracks.some(function (t) { return t.key === key; })) { skipped++; return; }
          var track = Object.assign({}, item, { id: 't' + nextNumber++, key: key, label: trackName(item.name) });
          tracks.push(track); added.push(track);
          if (shuffle && currentId !== null) queue.splice(Math.floor(random() * (queue.length + 1)), 0, track.id);
        });
        return { added: added, skipped: skipped };
      },

      /** Make a track current (the player clicked it, or pressed play on an empty selection). */
      select: function (id) { return find(id) ? moveTo(id) : null; },
      /** Leave this pod without a selected track while retaining the shared catalog. */
      deselect: function () { currentId = null; queue = []; history = []; },

      /** Removes a track. If it was the one playing, `replacement` is the track that now sits in its place (or null when the list is empty). */
      remove: function (id) {
        var i = indexOf(id);
        if (i === -1) return { removed: false, wasCurrent: false, replacement: null };
        tracks.splice(i, 1);
        queue = queue.filter(function (x) { return x !== id; });
        history = history.filter(function (x) { return x !== id; });
        var wasCurrent = id === currentId, replacement = null;
        if (wasCurrent) {
          replacement = tracks.length ? tracks[Math.min(i, tracks.length - 1)].id : null;
          currentId = replacement;
          if (shuffle) { queue = queue.filter(function (x) { return x !== replacement; }); }
        }
        return { removed: true, wasCurrent: wasCurrent, replacement: replacement };
      },

      clear: function () { tracks = []; queue = []; history = []; currentId = null; },

      setShuffle: function (on) {
        shuffle = !!on;
        history = [];
        if (shuffle) refill(); else queue = [];
        return shuffle;
      },
      setRepeat: function (mode) { repeat = mode === 'all' || mode === 'one' ? mode : 'off'; return repeat; },
      cycleRepeat: function () { return this.setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off'); },

      /** The track after this one, and makes it current. `auto` is true when the song ended by itself (Repeat One and "stop at the end" only apply then).
          Returns the new id, or null when playback should stop (the end of the list with Repeat Off). */
      next: function (auto) {
        if (!tracks.length) return null;
        if (currentId === null) return moveTo(shuffle ? (refill(), queue.shift()) : tracks[0].id);
        if (auto && repeat === 'one') return currentId;
        if (shuffle) {
          if (!queue.length) {
            if (auto && repeat !== 'all') return null;
            refill(true);
            if (!queue.length) return null;
          }
          return moveTo(queue.shift());
        }
        var i = indexOf(currentId) + 1;
        if (i >= tracks.length) { if (auto && repeat !== 'all') return null; i = 0; }
        return moveTo(tracks[i].id);
      },

      /** The track before this one (the order played, when shuffled). At the start of the list it wraps to the end. */
      previous: function () {
        if (!tracks.length) return null;
        if (currentId === null) return moveTo(tracks[tracks.length - 1].id);
        if (shuffle) {
          while (history.length) {
            var id = history.pop();
            if (find(id)) { if (id !== currentId) { var q = queue.indexOf(currentId); if (q === -1 && currentId !== null) queue.unshift(currentId); currentId = id; var r = queue.indexOf(id); if (r !== -1) queue.splice(r, 1); return id; } }
          }
          return currentId;
        }
        var i = indexOf(currentId) - 1;
        if (i < 0) i = tracks.length - 1;
        return moveTo(tracks[i].id);
      }
    };
  }

  var api = { EXTENSIONS: EXTENSIONS, MIME_BY_EXTENSION: MIME_BY_EXTENSION, extensionOf: extensionOf, isAudioFile: isAudioFile, trackName: trackName, formatTime: formatTime, createPlaylist: createPlaylist };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PodPlaylist = api;
})(typeof window !== 'undefined' ? window : globalThis);
