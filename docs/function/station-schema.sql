-- The Function / Frequencies: reference schema for the monitoring station's own SQLite database.
-- Planning only: not deployed, not used by the website. This database is the authoritative record;
-- the public archive receives only rows the publication policy clears (see security.md).
-- Facts, automated analysis and identification live in separate tables, as the archive shows them.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_version (
  version     INTEGER PRIMARY KEY,
  applied_at  TEXT NOT NULL                     -- UTC, 2026-01-31T23:59:59Z
);

-- Receivers by alias only. Hardware serials and locations stay out of this database too.
CREATE TABLE IF NOT EXISTS receiver (
  alias       TEXT PRIMARY KEY CHECK (alias GLOB '[A-Z]*' AND length(alias) BETWEEN 2 AND 24),
  description TEXT                              -- e.g. 'CB band, all channels'
);

CREATE TABLE IF NOT EXISTS channel (
  frequency_hz INTEGER NOT NULL,
  receiver     TEXT NOT NULL REFERENCES receiver(alias),
  role         TEXT NOT NULL CHECK (role IN ('priority', 'scan')),
  label        TEXT,                            -- e.g. 'CB 19'
  PRIMARY KEY (frequency_hz, receiver)
);

-- Observed facts: what the receiver measured.
CREATE TABLE IF NOT EXISTS observation (
  id            TEXT PRIMARY KEY,               -- OBS-..., never reused
  observed_at   TEXT NOT NULL,
  frequency_hz  INTEGER NOT NULL CHECK (frequency_hz BETWEEN 3000 AND 30000000000),
  mode          TEXT NOT NULL CHECK (mode IN ('am','fm','nfm','usb','lsb','cw','digital','unknown')),
  duration_s    REAL CHECK (duration_s IS NULL OR duration_s BETWEEN 0 AND 86400),
  receiver      TEXT NOT NULL REFERENCES receiver(alias),
  bandwidth_hz  INTEGER,
  snr_db        REAL,
  peak_dbfs     REAL,
  truncated     INTEGER NOT NULL DEFAULT 0,     -- scanner left before the transmission ended
  audio_path    TEXT,                           -- temporary clip; cleared when the clip is deleted
  created_at    TEXT NOT NULL,
  UNIQUE (receiver, observed_at, frequency_hz)  -- duplicate detection
);
CREATE INDEX IF NOT EXISTS observation_time ON observation (observed_at);
CREATE INDEX IF NOT EXISTS observation_freq ON observation (frequency_hz, observed_at);

-- Automated analysis: decoder and classifier output. Never treated as fact.
CREATE TABLE IF NOT EXISTS decode (
  observation_id TEXT NOT NULL REFERENCES observation(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL CHECK (kind IN ('none','transcript','morse','digital')),
  text           TEXT,                          -- [unintelligible] and [?word?] markers, nothing filled in
  language       TEXT,
  confidence     REAL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  method         TEXT NOT NULL,                 -- decoder name, version and settings
  decoded_at     TEXT NOT NULL,
  PRIMARY KEY (observation_id, method)
);

CREATE TABLE IF NOT EXISTS classification (
  observation_id TEXT PRIMARY KEY REFERENCES observation(id) ON DELETE CASCADE,
  code           TEXT NOT NULL CHECK (code IN ('cb','vhf_voice','uhf_voice','amateur','marine_vhf','shortwave','morse_cw',
                                               'meshtastic_lora','digital_data','numbers_candidate','unknown')),
  summary        TEXT,
  method         TEXT NOT NULL,
  confidence     REAL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1)
);

-- Identification: kept apart from both facts and analysis.
CREATE TABLE IF NOT EXISTS identification (
  observation_id TEXT PRIMARY KEY REFERENCES observation(id) ON DELETE CASCADE,
  status         TEXT NOT NULL CHECK (status IN ('identified','possible','unidentified')),
  label          TEXT,
  basis          TEXT,                          -- the evidence; required when identified
  confidence     REAL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  confirmed_by   TEXT,                          -- person who confirmed, for 'identified'
  CHECK (status != 'identified' OR (label IS NOT NULL AND basis IS NOT NULL)),
  CHECK (status != 'unidentified' OR label IS NULL)
);

CREATE TABLE IF NOT EXISTS case_file (
  id                TEXT PRIMARY KEY,           -- CASE-...
  designation       TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('open','identified','closed')),
  first_detected_at TEXT NOT NULL,
  last_detected_at  TEXT NOT NULL,
  characteristics   TEXT,
  CHECK (first_detected_at <= last_detected_at)
);

CREATE TABLE IF NOT EXISTS case_observation (
  case_id        TEXT NOT NULL REFERENCES case_file(id) ON DELETE CASCADE,
  observation_id TEXT NOT NULL REFERENCES observation(id) ON DELETE CASCADE,
  PRIMARY KEY (case_id, observation_id)
);

CREATE TABLE IF NOT EXISTS case_attempt (
  case_id TEXT NOT NULL REFERENCES case_file(id) ON DELETE CASCADE,
  at      TEXT NOT NULL,
  method  TEXT NOT NULL,
  result  TEXT NOT NULL CHECK (result IN ('failed','partial','decoded')),
  notes   TEXT
);

CREATE TABLE IF NOT EXISTS case_candidate (
  case_id    TEXT NOT NULL REFERENCES case_file(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  basis      TEXT NOT NULL,
  confidence REAL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1)
);

-- Publication decision, made before anything is queued.
CREATE TABLE IF NOT EXISTS publication (
  observation_id TEXT PRIMARY KEY REFERENCES observation(id) ON DELETE CASCADE,
  class          TEXT NOT NULL CHECK (class IN ('full','metadata_only','withhold','quarantine')),
  rule           TEXT NOT NULL,                 -- which policy rule decided it
  reviewed_by    TEXT,                          -- set when a person releases a quarantined record
  decided_at     TEXT NOT NULL
);

-- Outbound queue. Only 'full' and 'metadata_only' rows may enter it.
CREATE TABLE IF NOT EXISTS sync_queue (
  item_type    TEXT NOT NULL CHECK (item_type IN ('observation','case','retraction')),
  item_id      TEXT NOT NULL,
  batch_id     TEXT,
  state        TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','sent','rejected')),
  attempts     INTEGER NOT NULL DEFAULT 0,
  last_error   TEXT,
  queued_at    TEXT NOT NULL,
  synced_at    TEXT,
  PRIMARY KEY (item_type, item_id)
);
CREATE INDEX IF NOT EXISTS sync_pending ON sync_queue (state, queued_at);

-- When each channel was actually being listened to. Gaps are derived from this.
CREATE TABLE IF NOT EXISTS coverage (
  frequency_hz INTEGER NOT NULL,
  receiver     TEXT NOT NULL REFERENCES receiver(alias),
  started_at   TEXT NOT NULL,
  ended_at     TEXT,
  PRIMARY KEY (frequency_hz, receiver, started_at)
);

CREATE TABLE IF NOT EXISTS coverage_gap (
  started_at   TEXT NOT NULL,
  ended_at     TEXT,
  frequency_hz INTEGER,                         -- NULL means every channel
  reason       TEXT NOT NULL CHECK (reason IN ('receiver_offline','scanning_elsewhere','power','network','maintenance','unknown'))
);

CREATE TABLE IF NOT EXISTS retention_policy (
  item         TEXT PRIMARY KEY,                -- 'audio_processed', 'audio_failed', 'observation', ...
  keep_hours   INTEGER,                         -- NULL keeps forever
  max_bytes    INTEGER
);

INSERT OR IGNORE INTO retention_policy (item, keep_hours, max_bytes) VALUES
  ('audio_processed', 0, NULL),
  ('audio_failed', 72, 2147483648),
  ('observation', NULL, NULL);

INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (1, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'));
