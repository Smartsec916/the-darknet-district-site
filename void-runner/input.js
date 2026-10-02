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
  const controllerDefaults = {fire:7,aim:6,jump:0,interact:2,reload:3,draw:4,crouch:1,sprint:10,pause:9,missile:5,nearest:12,next:15,previous:14,lock:13,throttleUp:6,throttleDown:4};
  const controller = {bindings:{...controllerDefaults},sensitivity:1,leftDeadZone:.16,rightDeadZone:.18,invertY:false};
  try {
    const raw = JSON.parse(root.localStorage?.getItem(key) || 'null');
    if (raw && Object.keys(defaults).every(id => typeof raw[id] === 'string') && new Set(Object.keys(defaults).map(id=>raw[id]))
      .size === Object.keys(defaults).length) bindings = Object.fromEntries(Object.keys(defaults).map(
      id => [id, raw[id]]));
    if(raw?.__gamepad){const saved=raw.__gamepad;for(const id of Object.keys(controllerDefaults))if(Number.isInteger(saved.bindings?.[id])&&saved.bindings[id]>=0&&saved.bindings[id]<=16)controller.bindings[id]=saved.bindings[id];for(const [id,min,max] of [['sensitivity',.25,2.5],['leftDeadZone',.05,.4],['rightDeadZone',.05,.4]])if(Number.isFinite(saved[id]))controller[id]=Math.max(min,Math.min(max,saved[id]));controller.invertY=!!saved.invertY;}
  } catch {}
  const held = new Set();
  // Non-keyboard sources resolve to the same gameplay actions as physical keys.
  const virtual = new Set();
  const axes = {moveX:0,moveZ:0,lookX:0,lookY:0,flightX:0,flightY:0,roll:0,throttle:0};
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
      root.localStorage?.setItem(key, JSON.stringify({...bindings,__gamepad:controller}));
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
  function bindController(id,index){if(!Object.hasOwn(controllerDefaults,id)||!Number.isInteger(index)||index<0||index>16)return {error:'Unsupported controller button.'};const flight=new Set(['fire','missile','nearest','next','previous','lock','throttleUp','throttleDown','pause']),fps=new Set(['fire','aim','jump','interact','reload','draw','crouch','sprint','pause']);const duplicate=Object.keys(controller.bindings).find(other=>other!==id&&controller.bindings[other]===index&&((flight.has(id)&&flight.has(other))||(fps.has(id)&&fps.has(other))));if(duplicate)return {error:duplicate+' already uses this button in the same mode.'};controller.bindings[id]=index;return {saved:persist()};}
  function resetController(){controller.bindings={...controllerDefaults};controller.sensitivity=1;controller.leftDeadZone=.16;controller.rightDeadZone=.18;controller.invertY=false;return persist();}
  const api = {
    actions,
    defaults,
    aliases,
    held,
    virtual,
    axes,
    controller,
    controllerDefaults,
    bindController,
    resetController,
    persist,
    bind,
    reset,
    label,
    get bindings() {
      return {
        ...bindings
      };
    },
    down: id => virtual.has(id) || held.has(bindings[id]) || bindings[id] === defaults[id] && (aliases[id] || []).some(
      code => held.has(code)),
    action
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidInput = api;
})(globalThis);
