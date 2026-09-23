/* Action names, rather than physical keys, are the public flight input API. */
(function(root) {
  const actions = {
    pitchUp: ['Pitch up', 'KeyW'],
    pitchDown: ['Pitch down', 'KeyS'],
    yawLeft: ['Yaw left', 'KeyA'],
    yawRight: ['Yaw right', 'KeyD'],
    rollLeft: ['Roll left', 'KeyQ'],
    rollRight: ['Roll right', 'KeyR'],
    throttleUp: ['Increase thrust', 'ShiftLeft'],
    throttleDown: ['Decrease thrust / brake', 'KeyX'],
    boost: ['Equipment drive', 'KeyE'],
    fire: ['Primary fire', 'Space'],
    missile: ['Fire missile (requires lock)', 'KeyF'],
    nearest: ['Target nearest hostile', 'KeyT'],
    next: ['Next hostile', 'Tab'],
    previous: ['Previous hostile', 'KeyG'],
    clear: ['Clear target', 'KeyC'],
    lock: ['Acquire target lock', 'KeyL'],
    pause: ['Pause / menu', 'Escape']
  };
  const defaults = Object.fromEntries(Object.entries(actions).map(([id, a]) => [id, a[1]])),
    key = 'void-runner-controls-v1';
  let bindings = {
    ...defaults
  };
  try {
    const raw = JSON.parse(root.localStorage?.getItem(key) || 'null');
    if (raw && Object.keys(defaults).every(id => typeof raw[id] === 'string') && new Set(Object.values(raw))
      .size === Object.keys(defaults).length) bindings = Object.fromEntries(Object.keys(defaults).map(
      id => [id, raw[id]]));
  } catch {}
  const held = new Set();
  const aliases = {
    pitchUp: ['ArrowUp'],
    pitchDown: ['ArrowDown'],
    yawLeft: ['ArrowLeft'],
    yawRight: ['ArrowRight'],
    throttleUp: ['ShiftRight']
  };

  function action(code) {
    return Object.keys(bindings).find(id => bindings[id] === code) || Object.keys(aliases).find(id =>
      bindings[id] === defaults[id] && aliases[id].includes(code));
  }

  function persist() {
    try {
      root.localStorage?.setItem(key, JSON.stringify(bindings));
      return true;
    } catch {
      return false;
    }
  }

  function bind(id, code) {
    if (!actions[id] || !(
        /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Space|Tab|Escape|Enter|Backspace|BracketLeft|BracketRight|Comma|Period|Slash|Semicolon|Quote|Minus|Equal)$/
        .test(code))) return {
      error: 'Choose a letter, number, arrow, modifier or navigation key.'
    };
    const duplicate = action(code);
    if (duplicate && duplicate !== id) return {
      error: actions[duplicate][0] + ' already uses ' + label(code) + '. Choose another key.'
    };
    bindings[id] = code;
    held.clear();
    return {
      saved: persist()
    };
  }

  function label(code) {
    return code.replace('Key', '').replace('Digit', '').replace('Left', ' (left)').replace('Right',
      ' (right)');
  }

  function reset() {
    bindings = {
      ...defaults
    };
    held.clear();
    return persist();
  }
  const api = {
    actions,
    defaults,
    aliases,
    held,
    bind,
    reset,
    label,
    get bindings() {
      return {
        ...bindings
      };
    },
    down: id => held.has(bindings[id]) || bindings[id] === defaults[id] && (aliases[id] || []).some(
      code => held.has(code)),
    action
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidInput = api;
})(globalThis);
