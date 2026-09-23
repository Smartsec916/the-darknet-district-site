/* Local files only by default. An empty station is explicitly off-air, never a fake stream. */
(function(root) {
  const stations = root.VoidExplorationData.radio,
    music = {
      flight: [],
      combat: [],
      earth: [],
      mars: [],
      district: [],
      bar: [],
      station: [],
      industrial: [],
      sleepingPod: [],
      story: []
    };
  const failed = new Set();
  let current = null,
    retiring = null,
    selection = null,
    context = {
      region: 'frontier',
      state: null
    },
    status = 'RADIO OFF',
    generation = 0,
    lastSignal = '',
    pendingTrack = null;

  function available(region = context.region) {
    return Object.entries(stations).filter(([, s]) => s.regions.includes(region) || s.regions.includes('sol') && ['earth', 'mars'].includes(region));
  }

  function candidates(tracks) {
    return tracks.filter(t => !t.when || context.state && VoidStory.matches(context.state, t.when));
  }

  function localURL(path) {
    const u = new URL(path, location.href);
    if (u.origin !== location.origin || !['http:', 'https:'].includes(u.protocol)) throw Error('Radio assets must be hosted with the game.');
    return u.href;
  }

  function dispose(channel) {
    if (!channel) return;
    channel.audio.pause();
    channel.audio.removeAttribute('src');
    channel.audio.load();
    channel.connection?.dispose();
  }

  function stop() {
    generation++;
    dispose(current);
    dispose(retiring);
    current = retiring = null;
    pendingTrack = null;
    VoidAudio.mediaActive(false);
    status = 'RADIO OFF';
  }
  async function play(track, label) {
    if (failed.has(track)) return false;
    if (pendingTrack === track || current?.track === track) return true;
    let url;
    try {
      url = localURL(track.src);
    } catch {
      failed.add(track);
      status = 'INVALID LOCAL AUDIO PATH';
      return false;
    }
    pendingTrack = track;
    const token = ++generation;
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.loop = track.loop !== false;
    VoidAudio.unlock();
    const connection = VoidAudio.connectMedia(audio);
    if (!connection) {
      dispose({
        audio
      });
      pendingTrack = null;
      status = 'INTERACT TO ENABLE AUDIO';
      return false;
    }
    connection.gain.gain.value = 0;
    try {
      await audio.play();
      if (token !== generation) {
        dispose({
          audio,
          connection
        });
        return false;
      }
      dispose(retiring);
      retiring = current;
      if (retiring) retiring.connection.gain.gain.setTargetAtTime(0, retiring.connection.context.currentTime, .4);
      current = {
        audio,
        connection,
        track
      };
      pendingTrack = null;
      VoidAudio.mediaActive(true);
      connection.gain.gain.setTargetAtTime(1, connection.context.currentTime, .4);
      status = label + ' / ' + (track.title || 'LOCAL TRACK');
      audio.addEventListener('ended', () => {
        if (current?.audio === audio) {
          dispose(current);
          current = null;
          VoidAudio.mediaActive(false);
          status = 'PROGRAM ENDED';
        }
      }, {
        once: true
      });
      const old = retiring;
      setTimeout(() => {
        dispose(old);
        if (retiring === old) retiring = null;
      }, 2000);
      return true;
    } catch {
      dispose({
        audio,
        connection
      });
      pendingTrack = null;
      failed.add(track);
      status = 'AUDIO FILE UNAVAILABLE';
      return false;
    }
  }

  function tune(id) {
    selection = id;
    if (!id) {
      stop();
      return;
    }
    const station = stations[id];
    if (!available().some(([key]) => key === id)) {
      stop();
      status = 'SIGNAL UNAVAILABLE';
      return;
    }
    const track = candidates(station.tracks)[0];
    if (!track) {
      stop();
      status = station.name + ' / NO LOCAL TRACKS INSTALLED';
      return;
    }
    return play(track, station.name);
  }

  function setContext(region, state) {
    context = {
      region,
      state
    };
    const signature = region + '|' + selection + '|' + (selection ? candidates(stations[selection]?.tracks || [])[0]?.src || 'off' : '');
    if (signature !== lastSignal) {
      lastSignal = signature;
      if (selection) tune(selection);
    }
  }

  function category(name) {
    if (selection || !VoidAudio.ready) return;
    const track = candidates(music[name] || [])[0];
    if (track && current?.track !== track) play(track, name.toUpperCase());
    else if (!track && current) stop();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      current?.audio.pause();
      retiring?.audio.pause();
    } else if (current) current.audio.play().catch(() => {});
  });
  addEventListener('pagehide', stop);
  root.VoidRadio = {
    stations,
    music,
    available,
    tune,
    setContext,
    category,
    stop,
    get status() {
      return status;
    },
    get selection() {
      return selection;
    }
  };
})(globalThis);
