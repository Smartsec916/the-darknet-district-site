/*
  The Function / Frequencies: pure archive rules shared by the page and the Node tests.
  No DOM here. Codes match frequencies_api.py; labels are the public wording.
*/
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FunctionArchive = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PRODUCTION_API = "https://the-darknet-district-site.onrender.com/api/function/frequencies";
  const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

  const CLASSIFICATIONS = {
    cb: "CB radio",
    vhf_voice: "VHF voice",
    uhf_voice: "UHF voice",
    amateur: "Amateur radio",
    marine_vhf: "Marine VHF",
    shortwave: "Shortwave",
    morse_cw: "Morse / CW",
    meshtastic_lora: "Meshtastic / LoRa",
    digital_data: "Digital data",
    numbers_candidate: "Numbers station candidate",
    unknown: "Unknown signal"
  };
  const MODES = { am: "AM", fm: "FM", nfm: "Narrow FM", usb: "USB", lsb: "LSB", cw: "CW", digital: "Digital", unknown: "Unknown" };
  const ID_STATUSES = { identified: "Identified", possible: "Possible match", unidentified: "Unidentified" };
  const CONTENT_KINDS = { none: "None", transcript: "Speech transcript", morse: "Morse decode", digital: "Digital decode" };
  const RECEIVER_STATES = {
    not_commissioned: "Not commissioned",
    online: "Online",
    degraded: "Degraded",
    offline: "Offline",
    no_contact: "No contact"
  };
  const GAP_REASONS = {
    receiver_offline: "Receiver offline",
    scanning_elsewhere: "Scanner on another channel",
    power: "Power interruption",
    network: "Network outage",
    maintenance: "Maintenance",
    unknown: "Unknown"
  };
  const CASE_STATUSES = { open: "Open", identified: "Identified", closed: "Closed" };
  const ATTEMPT_RESULTS = { failed: "Failed", partial: "Partial", decoded: "Decoded" };
  const PAGE_SIZES = ["10", "25", "50", "100"];
  const SORTS = ["newest", "oldest", "freq_asc", "freq_desc"];
  const FILTER_KEYS = ["q", "id", "from", "to", "fmin", "fmax", "band", "classification", "mode", "status", "decoded", "sort", "per_page", "page"];

  const UTC_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})Z$/;
  const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  const MHZ_PATTERN = /^(\d{1,5})(?:\.(\d{1,6}))?$/;

  function label(map, code) {
    return Object.prototype.hasOwnProperty.call(map, code) ? map[code] : "Unrecorded";
  }

  function apiBase(location) {
    // Local previews talk to an API on their own origin; everyone else uses Render.
    return location && LOCAL_HOSTS.indexOf(location.hostname) !== -1 ? "/api/function/frequencies" : PRODUCTION_API;
  }

  /** "27.185" -> 27185000, exactly; anything else -> null. */
  function mhzToHz(value) {
    const match = MHZ_PATTERN.exec(String(value).trim());
    if (!match) return null;
    const hz = Number(match[1]) * 1e6 + Number((match[2] || "").padEnd(6, "0"));
    return hz >= 3000 && hz <= 30e9 ? hz : null;
  }

  function hzToMhzText(hz) {
    const whole = Math.floor(hz / 1e6);
    let fraction = String(hz % 1e6).padStart(6, "0").replace(/0+$/, "");
    if (fraction.length < 3) fraction = fraction.padEnd(3, "0");
    return whole + "." + fraction;
  }

  function formatFrequency(hz) {
    if (!Number.isInteger(hz) || hz <= 0) return "—";
    if (hz < 1e6) return (hz / 1e3).toFixed(hz % 1000 ? 3 : 0) + " kHz";
    return hzToMhzText(hz) + " MHz";
  }

  function formatUtc(value) {
    const match = typeof value === "string" ? UTC_PATTERN.exec(value) : null;
    return match ? match[1] + " " + match[2] + " UTC" : "—";
  }

  function formatDuration(seconds) {
    if (typeof seconds !== "number" || !isFinite(seconds) || seconds < 0) return "—";
    if (seconds < 60) return (Math.round(seconds * 10) / 10) + " s";
    const whole = Math.round(seconds);
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const rest = String(whole % 60).padStart(2, "0");
    return hours ? hours + " h " + String(minutes).padStart(2, "0") + " m " + rest + " s" : minutes + " m " + rest + " s";
  }

  function formatConfidence(value) {
    return typeof value === "number" && value >= 0 && value <= 1 ? Math.round(value * 100) + "%" : "Not assessed";
  }

  function formatCount(value) {
    return Number.isInteger(value) && value >= 0 ? value.toLocaleString("en-US") : "—";
  }

  /**
   * Turn form values into the API query string, refusing anything the API would.
   * Returns { query, errors, filters } where filters holds only the values in use.
   */
  function buildQuery(input) {
    const errors = [];
    const filters = {};
    const text = function (key) { return typeof input[key] === "string" ? input[key].trim() : ""; };

    const q = text("q");
    if (q.length > 100) errors.push("Search text is limited to 100 characters.");
    else if (q) filters.q = q;

    const id = text("id").toUpperCase();
    if (id && !/^[0-9A-Z-]{1,52}$/.test(id)) errors.push("An observation ID uses only letters, digits and hyphens.");
    else if (id) filters.id = id;

    ["from", "to"].forEach(function (key) {
      const value = text(key);
      if (value && !DAY_PATTERN.test(value)) errors.push("Dates must look like 2026-01-31.");
      else if (value) filters[key] = value;
    });
    if (filters.from && filters.to && filters.from > filters.to) errors.push("The start date is after the end date.");

    ["fmin", "fmax"].forEach(function (key) {
      const value = text(key);
      if (!value) return;
      const hz = mhzToHz(value);
      if (hz === null) errors.push("Frequencies are in MHz between 0.003 and 30000, with up to six decimals.");
      else filters[key] = String(hz);
    });
    if (filters.fmin && filters.fmax && Number(filters.fmin) > Number(filters.fmax)) errors.push("The lowest frequency is above the highest.");

    const choices = {
      band: ["LF", "MF", "HF", "VHF", "UHF", "SHF"],
      classification: Object.keys(CLASSIFICATIONS),
      mode: Object.keys(MODES),
      status: Object.keys(ID_STATUSES),
      decoded: ["yes", "no"]
    };
    Object.keys(choices).forEach(function (key) {
      const value = text(key);
      if (value && choices[key].indexOf(value) === -1) errors.push("Unrecognised " + key + " filter.");
      else if (value) filters[key] = value;
    });

    const sort = text("sort");
    if (sort && sort !== "newest") {
      if (SORTS.indexOf(sort) === -1) errors.push("Unrecognised sort order.");
      else filters.sort = sort;
    }
    const perPage = text("per_page");
    if (perPage && perPage !== "25") {
      if (PAGE_SIZES.indexOf(perPage) === -1) errors.push("Unrecognised page size.");
      else filters.per_page = perPage;
    }
    const page = text("page");
    if (page && page !== "1") {
      if (!/^[1-9]\d{0,4}$/.test(page)) errors.push("Unrecognised page.");
      else filters.page = page;
    }

    const query = FILTER_KEYS.filter(function (key) { return key in filters; })
      .map(function (key) { return encodeURIComponent(key) + "=" + encodeURIComponent(filters[key]); })
      .join("&");
    return { query: query, errors: errors, filters: filters };
  }

  /** Form values from a page URL's query string, so searches can be shared. */
  function filtersFromSearch(search) {
    const values = {};
    String(search || "").replace(/^\?/, "").split("&").forEach(function (pair) {
      if (!pair) return;
      const at = pair.indexOf("=");
      let key, value;
      try {
        key = decodeURIComponent(at === -1 ? pair : pair.slice(0, at));
        value = decodeURIComponent(at === -1 ? "" : pair.slice(at + 1).replace(/\+/g, " "));
      } catch (error) {
        return;
      }
      if (FILTER_KEYS.indexOf(key) === -1) return;
      if (key === "fmin" || key === "fmax") value = /^\d{1,11}$/.test(value) ? hzToMhzText(Number(value)) : "";
      values[key] = value.slice(0, 120);
    });
    return values;
  }

  /** What the page should say about the archive as a whole. */
  function archiveNotice(status) {
    if (!status || !status.totals) {
      return {
        tone: "error",
        title: "Archive unavailable",
        text: "The archive did not respond, so its current state cannot be confirmed. Nothing is shown rather than something unverified.",
        retry: true
      };
    }
    if (status.totals.observations === 0) {
      const awaiting = status.receiver_state === "not_commissioned"
        ? "No monitoring equipment is connected yet. Records will appear here only after real signals have been received."
        : "No observations have been published yet. Records will appear here only after real signals have been received and cleared for publication.";
      return { tone: "waiting", title: "AWAITING FIRST TRANSMISSION", text: awaiting, retry: false };
    }
    return null;
  }

  /** Whether a priority channel is being watched right now, from the station's own report. */
  function channelMonitoring(status, hz) {
    const sources = status && Array.isArray(status.sources) ? status.sources : [];
    const live = sources.filter(function (source) {
      return (source.state === "online" || source.state === "degraded") &&
        Array.isArray(source.channels) && source.channels.some(function (c) { return c.frequency_hz === hz; });
    });
    if (!live.length) return status && status.receiver_state === "no_contact" ? "No contact with station" : "Not yet monitored";
    return live.some(function (s) { return s.state === "online"; }) ? "Monitored (" + live.map(function (s) { return s.alias; }).join(", ") + ")" : "Degraded";
  }

  function debounce(fn, wait, timers) {
    // Wrapped: browsers refuse setTimeout called as a method of another object.
    const clock = timers || { set: function (f, ms) { return setTimeout(f, ms); }, clear: function (h) { clearTimeout(h); } };
    let handle = null;
    return function () {
      const args = arguments;
      const self = this;
      if (handle !== null) clock.clear(handle);
      handle = clock.set(function () { handle = null; fn.apply(self, args); }, wait);
    };
  }

  /** Minimal shape check so an unexpected API response cannot break the page. */
  function isObservation(record) {
    return !!record && typeof record === "object" &&
      typeof record.id === "string" && typeof record.observed_at === "string" &&
      Number.isInteger(record.frequency_hz) && !!record.identification && !!record.content;
  }

  return {
    PRODUCTION_API: PRODUCTION_API,
    CLASSIFICATIONS: CLASSIFICATIONS,
    MODES: MODES,
    ID_STATUSES: ID_STATUSES,
    CONTENT_KINDS: CONTENT_KINDS,
    RECEIVER_STATES: RECEIVER_STATES,
    GAP_REASONS: GAP_REASONS,
    CASE_STATUSES: CASE_STATUSES,
    ATTEMPT_RESULTS: ATTEMPT_RESULTS,
    label: label,
    apiBase: apiBase,
    mhzToHz: mhzToHz,
    formatFrequency: formatFrequency,
    formatUtc: formatUtc,
    formatDuration: formatDuration,
    formatConfidence: formatConfidence,
    formatCount: formatCount,
    buildQuery: buildQuery,
    filtersFromSearch: filtersFromSearch,
    archiveNotice: archiveNotice,
    channelMonitoring: channelMonitoring,
    debounce: debounce,
    isObservation: isObservation
  };
});
