/*
  The Function / Frequencies: page wiring.
  Everything from the archive is radio content and is drawn with textContent only;
  the page's Trusted Types policy rejects any raw-HTML assignment outright.
*/
(function () {
  "use strict";

  const A = window.FunctionArchive;
  if (!A) return;

  const API = A.apiBase(window.location);
  const OBS_HASH = /^#(OBS-[0-9A-Z][0-9A-Z-]{3,47})$/;
  const byId = function (id) { return document.getElementById(id); };
  const form = byId("filters");
  let lastStatus = null;
  let resultsToken = 0;
  let currentQuery = "";

  function el(tag, options, children) {
    const node = document.createElement(tag);
    const o = options || {};
    if (o.className) node.className = o.className;
    if (o.text !== undefined && o.text !== null) node.textContent = String(o.text);
    if (o.attrs) Object.keys(o.attrs).forEach(function (key) { node.setAttribute(key, o.attrs[key]); });
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function getJson(path, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, timeoutMs || 60000);
    return fetch(API + path, { signal: controller.signal, credentials: "omit", headers: { Accept: "application/json" } })
      .then(function (response) {
        return response.json().catch(function () { return null; }).then(function (body) {
          if (!response.ok) {
            const message = body && typeof body.error === "string" ? body.error : "The archive returned an error.";
            const error = new Error(message);
            error.status = response.status;
            throw error;
          }
          return body;
        });
      })
      .finally(function () { clearTimeout(timer); });
  }

  // ---------------------------------------------------------------------------
  // Status board
  // ---------------------------------------------------------------------------
  function setStatus(key, value) {
    const node = document.querySelector('[data-status="' + key + '"]');
    if (node) node.textContent = value;
  }

  function showNotice(notice) {
    const box = byId("archive-notice");
    if (!notice) { box.hidden = true; return; }
    box.hidden = false;
    box.setAttribute("data-tone", notice.tone);
    byId("notice-title").textContent = notice.title;
    byId("notice-text").textContent = notice.text;
    byId("notice-retry").hidden = !notice.retry;
  }

  function renderStatus(status) {
    lastStatus = status;
    const totals = status.totals;
    setStatus("receiver", A.label(A.RECEIVER_STATES, status.receiver_state));
    setStatus("last_observation", status.last_observation_at ? A.formatUtc(status.last_observation_at) : "None yet");
    setStatus("last_sync", status.last_sync_at ? A.formatUtc(status.last_sync_at) : "Never");
    setStatus("observations", A.formatCount(totals.observations));
    setStatus("identified", A.formatCount(totals.identified));
    setStatus("unidentified", A.formatCount(totals.unidentified + totals.possible) +
      (totals.possible ? " (includes " + A.formatCount(totals.possible) + (totals.possible === 1 ? " possible match)" : " possible matches)") : ""));
    setStatus("decoded", A.formatCount(totals.decoded));
    const sources = Array.isArray(status.sources) ? status.sources : [];
    setStatus("sources", sources.length ? A.formatCount(status.active_sources) + " of " + A.formatCount(sources.length) : "None");
    showNotice(A.archiveNotice(status));

    document.querySelectorAll("[data-priority]").forEach(function (cell) {
      cell.textContent = A.channelMonitoring(status, Number(cell.getAttribute("data-priority")));
    });

    const gaps = Array.isArray(status.coverage_gaps) ? status.coverage_gaps : [];
    const rows = byId("gap-rows");
    clear(rows);
    gaps.slice().reverse().forEach(function (gap) {
      rows.appendChild(el("tr", {}, [
        el("td", { className: "fn-mono", text: A.formatUtc(gap.started_at), attrs: { "data-label": "From" } }),
        el("td", { className: "fn-mono", text: gap.ended_at ? A.formatUtc(gap.ended_at) : "Ongoing", attrs: { "data-label": "To" } }),
        el("td", { className: "fn-mono", text: gap.frequency_hz ? A.formatFrequency(gap.frequency_hz) : "All channels", attrs: { "data-label": "Frequency" } }),
        el("td", { text: A.label(A.GAP_REASONS, gap.reason), attrs: { "data-label": "Reason" } })
      ]));
    });
    byId("gaps").hidden = gaps.length === 0;
  }

  function loadStatus() {
    showNotice({ tone: "waiting", title: "Contacting archive", text: "Requesting the archive's current status. The archive service can take up to a minute to wake.", retry: false });
    setStatus("receiver", "Checking");
    return getJson("/status").then(function (status) {
      if (!status || !status.totals) throw new Error("Unexpected archive response.");
      renderStatus(status);
      return true;
    }).catch(function () {
      lastStatus = null;
      ["receiver", "last_observation", "last_sync", "observations", "identified", "unidentified", "decoded", "sources"].forEach(function (key) {
        setStatus(key, key === "receiver" ? "Unknown" : "—");
      });
      showNotice(A.archiveNotice(null));
      return false;
    });
  }

  // ---------------------------------------------------------------------------
  // Records
  // ---------------------------------------------------------------------------
  function statusTag(status) {
    const tone = status === "identified" ? "fn-tag fn-tag--olive" : status === "possible" ? "fn-tag fn-tag--amber" : "fn-tag";
    return el("span", { className: tone, text: A.label(A.ID_STATUSES, status) });
  }

  function cell(label, text, mono) {
    return el("td", { className: mono ? "fn-mono" : "", text: text, attrs: { "data-label": label } });
  }

  function renderResults(page, filtered) {
    const rows = byId("results-rows");
    const table = byId("results-table");
    const empty = byId("results-empty");
    clear(rows);
    const records = Array.isArray(page.observations) ? page.observations.filter(A.isObservation) : [];
    records.forEach(function (record) {
      const open = el("button", { className: "fn-linkbutton fn-mono", text: record.id, attrs: { type: "button" } });
      open.addEventListener("click", function () { openRecord(record.id, true); });
      const idCell = el("td", { attrs: { "data-label": "Observation" } }, [open]);
      const statusCell = el("td", { attrs: { "data-label": "Identification" } }, [statusTag(record.identification.status)]);
      rows.appendChild(el("tr", {}, [
        idCell,
        cell("UTC time", A.formatUtc(record.observed_at), true),
        cell("Frequency", A.formatFrequency(record.frequency_hz), true),
        cell("Band", record.band || "—", true),
        cell("Classification", A.label(A.CLASSIFICATIONS, record.classification)),
        cell("Signal type", A.label(A.MODES, record.mode)),
        cell("Duration", A.formatDuration(record.duration_s), true),
        statusCell
      ]));
    });
    table.hidden = records.length === 0;
    empty.hidden = records.length !== 0;
    if (!records.length) {
      empty.textContent = filtered ? "No published observations match these filters." :
        "No observations have been published. The archive is awaiting its first transmission.";
    }
    const total = Number.isInteger(page.total) ? page.total : records.length;
    const first = total ? (page.page - 1) * page.per_page + 1 : 0;
    byId("results-summary").textContent = total
      ? "Showing " + A.formatCount(first) + "–" + A.formatCount(first + records.length - 1) + " of " + A.formatCount(total) + (total === 1 ? " record" : " records")
      : "0 records";
    const pager = byId("pager");
    pager.hidden = !(page.pages > 1);
    byId("page-label").textContent = "Page " + A.formatCount(page.page) + " of " + A.formatCount(page.pages);
    byId("page-prev").disabled = page.page <= 1;
    byId("page-next").disabled = page.page >= page.pages;
  }

  function formValues() {
    const values = {};
    new FormData(form).forEach(function (value, key) { values[key] = String(value); });
    return values;
  }

  function search(page) {
    const values = formValues();
    values.page = String(page || 1);
    const built = A.buildQuery(values);
    const errorBox = byId("filter-error");
    errorBox.textContent = built.errors.join(" ");
    ["fmin", "fmax", "from", "to", "id"].forEach(function (name) {
      const input = form.elements[name];
      if (input) input.setAttribute("aria-invalid", built.errors.length && values[name] && !(name in built.filters) ? "true" : "false");
    });
    if (built.errors.length) return;

    currentQuery = built.query;
    const hash = OBS_HASH.test(window.location.hash) ? window.location.hash : "";
    history.replaceState(null, "", window.location.pathname + (built.query ? "?" + built.query : "") + hash);
    const filtered = Object.keys(built.filters).some(function (key) { return ["sort", "per_page", "page"].indexOf(key) === -1; });
    const token = ++resultsToken;
    byId("results-summary").textContent = "Searching…";
    getJson("/observations" + (built.query ? "?" + built.query : "")).then(function (page) {
      if (token === resultsToken) renderResults(page, filtered);
    }).catch(function (error) {
      if (token !== resultsToken) return;
      clear(byId("results-rows"));
      byId("results-table").hidden = true;
      byId("pager").hidden = true;
      byId("results-empty").hidden = false;
      byId("results-empty").textContent = "Records could not be loaded: " + error.message;
      byId("results-summary").textContent = "Archive unavailable";
    });
  }

  function currentPage() {
    const match = /(?:^|&)page=(\d+)/.exec(currentQuery);
    return match ? Number(match[1]) : 1;
  }

  // ---------------------------------------------------------------------------
  // Record view: observed facts, automated analysis, identification
  // ---------------------------------------------------------------------------
  function facts(pairs) {
    const list = el("dl", { className: "fn-facts" });
    pairs.forEach(function (pair) {
      list.appendChild(el("dt", { text: pair[0] }));
      list.appendChild(el("dd", { text: pair[1] === null || pair[1] === undefined || pair[1] === "" ? "—" : pair[1] }));
    });
    return list;
  }

  function part(kind, title, note, body) {
    return el("section", { className: "fn-record-part", attrs: { "data-part": kind } }, [
      el("h4", { text: title }), el("p", { text: note }), body
    ]);
  }

  function renderRecord(record) {
    const view = byId("record");
    clear(view);
    const signal = record.signal || {};
    const content = record.content || {};
    const analysis = record.analysis || {};
    const ident = record.identification || {};

    const close = el("button", { className: "fn-button fn-button--quiet", text: "Close record", attrs: { type: "button" } });
    close.addEventListener("click", closeRecord);
    view.appendChild(el("header", { className: "fn-record-head" }, [
      el("div", {}, [
        el("p", { className: "fn-kicker", text: "Observation record" }),
        el("h3", { text: record.id, attrs: { id: "record-title" } })
      ]),
      close
    ]));

    const idTitle = ident.status === "identified" ? "Identification" : "Unconfirmed identification";
    const idNote = ident.status === "identified" ? "Confirmed against the evidence given."
      : ident.status === "possible" ? "Not confirmed. A possible match only." : "The signal has not been identified.";

    view.appendChild(el("div", { className: "fn-record-grid" }, [
      part("facts", "Observed facts", "Measured by the receiver.", facts([
        ["Observation ID", record.id],
        ["Time", A.formatUtc(record.observed_at)],
        ["Frequency", A.formatFrequency(record.frequency_hz)],
        ["Band", record.band],
        ["Signal type", A.label(A.MODES, record.mode)],
        ["Duration", A.formatDuration(record.duration_s)],
        ["Receiver", record.receiver],
        ["Bandwidth", Number.isInteger(signal.bandwidth_hz) ? A.formatCount(signal.bandwidth_hz) + " Hz" : null],
        ["Signal-to-noise", typeof signal.snr_db === "number" ? signal.snr_db + " dB" : null],
        ["Peak level", typeof signal.peak_dbfs === "number" ? signal.peak_dbfs + " dBFS" : null],
        ["Publication", record.publication === "metadata_only" ? "Metadata only" : "Full record"]
      ])),
      part("analysis", "Automated analysis", "Produced by software. It can be wrong.", facts([
        ["Classification", A.label(A.CLASSIFICATIONS, record.classification)],
        ["Decoder output", A.label(A.CONTENT_KINDS, content.kind)],
        ["Language", content.language],
        ["Decode confidence", content.kind === "none" ? null : A.formatConfidence(content.confidence)],
        ["Summary", analysis.summary],
        ["Method", analysis.method],
        ["Analysis confidence", record.analysis ? A.formatConfidence(analysis.confidence) : null]
      ])),
      part("identification", idTitle, idNote, facts([
        ["Status", A.label(A.ID_STATUSES, ident.status)],
        ["Identified as", ident.label],
        ["Basis", ident.basis],
        ["Confidence", ident.label ? A.formatConfidence(ident.confidence) : null],
        ["Case file", record.case_id]
      ]))
    ]));

    const body = el("section", { className: "fn-record-content" }, [el("h4", { className: "fn-kicker", text: "Decoded content" })]);
    if (content.kind === "none") {
      body.appendChild(el("p", { text: "Nothing was decoded from this signal." }));
    } else if (content.withheld || content.text === null) {
      body.appendChild(el("p", { text: "Content withheld under the publication policy. Only metadata is published for this signal." }));
    } else {
      body.appendChild(el("p", { className: "fn-lede", text: "Automated decoding, shown exactly as received and not verified. [unintelligible] marks a passage that could not be made out; [?word?] marks an uncertain word." }));
      body.appendChild(el("pre", { className: "fn-transcript", text: content.text, attrs: { lang: content.language || "und" } }));
    }
    view.appendChild(body);
    view.hidden = false;
  }

  function openRecord(id, focus) {
    if (window.location.hash !== "#" + id) history.replaceState(null, "", window.location.pathname + window.location.search + "#" + id);
    const view = byId("record");
    clear(view);
    view.appendChild(el("p", { className: "fn-empty", text: "Retrieving " + id + "…" }));
    view.hidden = false;
    getJson("/observations/" + encodeURIComponent(id)).then(function (body) {
      if (!body || !A.isObservation(body.observation)) throw new Error("Unexpected archive response.");
      renderRecord(body.observation);
    }).catch(function (error) {
      clear(view);
      view.appendChild(el("p", { className: "fn-empty", text: error.status === 404 ? "No published observation has the ID " + id + "." : "The record could not be loaded: " + error.message }));
    }).finally(function () {
      if (focus) view.focus();
    });
  }

  function closeRecord() {
    byId("record").hidden = true;
    clear(byId("record"));
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  // ---------------------------------------------------------------------------
  // Case files
  // ---------------------------------------------------------------------------
  function caseSection(title, child) {
    return el("div", {}, [el("h4", { text: title }), child]);
  }

  function list(items, render, emptyText) {
    if (!items.length) return el("p", { className: "fn-lede", text: emptyText });
    const node = el("ul", { className: "fn-case-list" });
    items.forEach(function (item) { node.appendChild(render(item)); });
    return node;
  }

  function renderCases(cases) {
    const box = byId("cases");
    const empty = byId("cases-empty");
    box.querySelectorAll(".fn-case").forEach(function (node) { node.remove(); });
    empty.hidden = cases.length !== 0;
    if (!cases.length) {
      empty.textContent = "No case files are open. A case file is opened only for a signal that has been observed more than once and remains unidentified.";
    }
    cases.forEach(function (file) {
      const summary = el("summary", {}, [
        el("strong", { text: file.id }),
        el("span", { text: file.designation }),
        el("span", { className: "fn-tag", text: A.label(A.CASE_STATUSES, file.status) }),
        el("span", { className: "fn-mono", text: "Last detected " + A.formatUtc(file.last_detected_at) })
      ]);
      const observed = list(file.observations || [], function (obs) {
        const open = el("button", { className: "fn-linkbutton fn-mono", text: obs.id, attrs: { type: "button" } });
        open.addEventListener("click", function () { openRecord(obs.id, true); });
        return el("li", {}, [open, el("span", { text: " · " + A.formatUtc(obs.observed_at) + " · " + A.formatFrequency(obs.frequency_hz) })]);
      }, "No linked observations are in the public archive.");
      const body = el("div", { className: "fn-case-body" }, [
        el("div", { className: "fn-record-grid" }, [
          facts([
            ["First detected", A.formatUtc(file.first_detected_at)],
            ["Last detected", A.formatUtc(file.last_detected_at)],
            ["Frequencies", (file.frequencies_hz || []).map(A.formatFrequency).join(", ")],
            ["Published observations", A.formatCount(file.observation_count)]
          ])
        ]),
        caseSection("Signal characteristics", el("p", { text: file.characteristics || "None recorded." })),
        caseSection("Decoding attempts", list(file.decoding_attempts || [], function (attempt) {
          return el("li", { text: A.formatUtc(attempt.at) + " · " + attempt.method + " · " + A.label(A.ATTEMPT_RESULTS, attempt.result) + (attempt.notes ? " · " + attempt.notes : "") });
        }, "None recorded.")),
        caseSection("Possible identifications (unconfirmed)", list(file.possible_identifications || [], function (candidate) {
          return el("li", { text: candidate.label + " · confidence " + A.formatConfidence(candidate.confidence) + " · " + candidate.basis });
        }, "None proposed.")),
        caseSection("Observation history", observed)
      ]);
      box.appendChild(el("details", { className: "fn-case" }, [summary, body]));
    });
  }

  function loadCases() {
    return getJson("/cases").then(function (body) {
      renderCases(body && Array.isArray(body.cases) ? body.cases : []);
    }).catch(function () {
      byId("cases-empty").hidden = false;
      byId("cases-empty").textContent = "Case files could not be loaded.";
    });
  }

  // ---------------------------------------------------------------------------
  // Start-up
  // ---------------------------------------------------------------------------
  function fillSelect(id, map) {
    const select = byId(id);
    Object.keys(map).forEach(function (code) { select.appendChild(el("option", { text: map[code], attrs: { value: code } })); });
  }

  function fillForm(values) {
    Object.keys(values).forEach(function (key) {
      const input = form.elements[key];
      if (!input || key === "page") return;
      if (input.tagName === "SELECT" && !Array.prototype.some.call(input.options, function (o) { return o.value === values[key]; })) return;
      input.value = values[key];
    });
  }

  function loadAll() {
    const fromUrl = A.filtersFromSearch(window.location.search);
    loadStatus().then(function () {
      search(Number(fromUrl.page) || 1);
      loadCases();
      const match = OBS_HASH.exec(window.location.hash);
      if (match) openRecord(match[1], false);
    });
  }

  fillSelect("f-classification", A.CLASSIFICATIONS);
  fillSelect("f-mode", A.MODES);
  fillSelect("f-status", A.ID_STATUSES);
  fillForm(A.filtersFromSearch(window.location.search));

  form.addEventListener("submit", function (event) { event.preventDefault(); search(1); });
  form.addEventListener("reset", function () { setTimeout(function () { search(1); }, 0); });
  form.addEventListener("change", function (event) { if (event.target.tagName === "SELECT") search(1); });
  const typed = A.debounce(function () { search(1); }, 450);
  byId("f-q").addEventListener("input", typed);
  byId("page-prev").addEventListener("click", function () { search(Math.max(1, currentPage() - 1)); });
  byId("page-next").addEventListener("click", function () { search(currentPage() + 1); });
  byId("notice-retry").addEventListener("click", loadAll);
  window.addEventListener("hashchange", function () {
    const match = OBS_HASH.exec(window.location.hash);
    if (match) openRecord(match[1], true);
  });

  loadAll();
})();
