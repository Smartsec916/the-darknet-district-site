# Monitoring station: architecture (Phase 2, planning only)

Nothing in this document is built or bought. It is the plan the station should follow so that it fits
the archive already built (see [api-contract.md](api-contract.md)) and the security model
(see [security.md](security.md)). Prices are rough figures to check before buying, not quotes.

## Goals

- Listen to **CB channel 19 (27.185 MHz)** and **CB channel 9 (27.065 MHz)** continuously, 24 hours a day.
- Watch other bands as receivers allow, and say honestly when a frequency was not being watched.
- Keep the authoritative archive on the station, in SQLite.
- Publish only what the publication policy allows, over outbound HTTPS, with no inbound access to the home.
- Recover by itself from power cuts, internet outages and crashes.

## The key fact for CB

The 40 CB channels run from 26.965 to 27.405 MHz, a span of 440 kHz. Channels 9 and 19 are 120 kHz apart.
A single RTL-SDR captures about 2 MHz at once, so **one receiver tuned near 27.2 MHz hears every CB channel
at the same time**. A channelizer then demodulates each channel in parallel. Channels 9 and 19 are therefore
never abandoned for scanning: the CB receiver never scans. Other bands get their own receivers.

## Receivers

| Receiver | Job | Suggested hardware | Rough price |
|---|---|---|---|
| **RX-A, CB (always on)** | All 40 CB channels in parallel, 9 and 19 marked priority | RTL-SDR Blog V4 (covers about 0.5–1766 MHz, HF without an upconverter) | $40 |
| **RX-B, VHF/UHF scanner** | Marine VHF (156–162 MHz), 2 m and 70 cm amateur, others; adaptive scanning | Second RTL-SDR Blog V4 | $40 |
| **RX-C, HF (later)** | Shortwave broadcasts, Morse, numbers stations | Airspy HF+ Discovery or SDRplay RSPdx-class receiver | $170–250 |
| **RX-M, Meshtastic (later)** | Counts LoRa packets on the 915 MHz US band | A Meshtastic-compatible node (Heltec V3, RAK4631 or similar) on USB | $20–40 |

The station only receives. Receiving needs no licence in the US. Never connect a transmitter.

Software candidates, all free and open source:

- **RTLSDR-Airband** in multichannel mode for RX-A: many AM channels from one dongle, squelch-triggered recordings,
  light enough for a Raspberry Pi. It handles AM and narrow FM, which covers CB channels in AM. It does not demodulate
  SSB, so SSB traffic on channels 36–40 would be logged as activity only.
- **SoapySDR / rtl_fm / GNU Radio** for RX-B's scanner, driven by the controller described below.
- **faster-whisper** or **whisper.cpp** for speech, **multimon-ng** or **fldigi** for Morse, **multimon-ng**,
  **AIS-catcher** and **dsd-fme** for digital modes, the **meshtastic** Python library for RX-M.

## Computer

| Option | Good for | Rough price | Power |
|---|---|---|---|
| Raspberry Pi 5, 8 GB, with an NVMe SSD (not an SD card) | RX-A and RX-B, Morse, light transcription with small models | $130–170 complete | 5–8 W |
| Intel N100-class mini PC, 16 GB, SSD | Everything, including faster speech transcription | $150–220 | 6–12 W |

Recommendation: the **N100 mini PC** if speech transcription matters, since Whisper models are far quicker on it;
the Pi 5 if only CB activity logging and Morse are needed at first. Use a powered USB hub when running
more than two SDRs from a Pi.

## Antennas

| For | Suggestion | Notes |
|---|---|---|
| CB | An outdoor 11-metre vertical (quarter-wave ground plane or a commercial base antenna such as the A-99 type), as high and clear as practical | About $60–120. Use 50 Ω coax (RG-8X or LMR-240/400). |
| VHF/UHF | A discone covering roughly 25–1300 MHz, outdoors | About $60–110. An FM broadcast (88–108 MHz) band-stop filter (~$20) stops RTL-SDR overload. |
| HF | An outdoor long wire with a 9:1 unun, or an active magnetic loop | Indoors, household electronics drown out shortwave; outdoors is far better. |
| Meshtastic | A 915 MHz antenna on the node | Antenna supplied with most nodes is enough to start. |

Any outdoor antenna needs a coax lightning arrestor and proper grounding to the home's electrical ground (US National
Electrical Code Article 810). If unsure, have an electrician do the grounding.

## Signal path

```
SDR ─▶ demodulator/channelizer ─▶ squelch-triggered clip (temporary WAV)
      ─▶ detector (time, frequency, duration, level, SNR)  ──▶ SQLite: observation (facts)
      ─▶ decoders (speech, Morse, digital)                  ──▶ SQLite: decode (automated analysis)
      ─▶ classifier and identification rules                ──▶ SQLite: identification (status, basis)
      ─▶ publication policy                                 ──▶ full / metadata only / withhold / quarantine
      ─▶ uploader queue ─▶ signed HTTPS ─▶ archive
      ─▶ temporary audio deleted per retention rules
```

Each stage writes its own rows, so observed facts, automated analysis and identification stay separate, as the archive shows them.

## Adaptive scanning (RX-B)

The scanner never covers CB priority channels; RX-A does that. For the channels it does scan:

1. Visit each channel in a list for a short dwell (around 150–250 ms) and measure the level.
2. If the squelch opens, stay until the transmission ends plus a hang time of 2–3 seconds.
3. **Never stay longer than a maximum dwell** (for example 60 seconds) before moving on, even mid-transmission, and log that the transmission was cut short.
4. Keep an activity score per channel (an exponentially weighted average of recent busy time). Busy channels are visited more often.
5. Give every channel a **maximum revisit interval** so quiet channels are still checked regularly.
6. When the capture window can hold several channels at once (for example a 2 MHz slice of marine VHF), demodulate all of them together and treat the slice as one stop.
7. Record coverage: for every channel, the intervals it was actually being listened to. Times it was not are coverage gaps (`scanning_elsewhere`).

Publish coverage honestly: the archive shows gaps, and nothing claims that every transmission was heard.

## Decoding

**Speech.** Run a voice activity detector first and drop clips with no speech; Whisper-family models are known to
invent text from noise or silence. Transcribe without prompts and without conditioning on earlier text. Use word
probabilities: words below a threshold become `[?word?]`, and stretches with no confident words become
`[unintelligible]`. Record the language only when detected with high confidence. Keep the model's average confidence
as the record's confidence. Never fill gaps from context.

**Morse.** Decode with multimon-ng or fldigi. Characters the decoder is unsure of become `[?]`. Record decoder and settings in `method`.

**Digital.** Only decode protocols with a supported, open decoder. Encrypted or unsupported data is recorded as
`digital_data` with `content.kind = none`. Pager, cellular and cordless-telephone traffic is withheld by policy even when decodable.

**Numbers stations.** Keep a local reference table of published schedules (community sources such as Priyom and the
ENIGMA 2000 lists), with the source and date of each entry. A match on frequency, time and format makes a **possible**
identification. **Identified** needs the schedule, the format and the call-up to match and a person to confirm it.
Number groups are recorded as heard; they are one-time-pad traffic and are never "decrypted".

**Unknown signals.** Keep the technical measurements (frequency, bandwidth, duration, level, SNR, mode estimate)
and no content. Recurring unknowns open a case file.

**AI-assisted classification, if ever added.** The model receives the transcript as quoted data, may answer only with a
fixed classification code and a confidence, has no tools, and its answer is stored as analysis, never as fact.

## Local storage (SQLite)

Reference schema: [station-schema.sql](station-schema.sql).

- WAL journal mode, `synchronous=NORMAL`, foreign keys on.
- `schema_version` table; migrations are numbered SQL files applied in a transaction at start-up.
- Unique keys on observation id and on (receiver, start time, frequency) prevent duplicates.
- Daily `PRAGMA integrity_check`; a failure stops uploads and is reported as `degraded`.
- Nightly online backup (SQLite backup API) to a second drive or USB stick; keep 14 daily and 8 weekly copies; test a restore monthly.
- Retention is configurable per table. Text and metadata are kept indefinitely by default.

**Temporary audio.** Clips live in a spool folder only until decoding finishes. Delete after successful processing
(default immediately, configurable up to 24 hours). Failed clips move to a failure folder capped by size (for example 2 GB)
and age (for example 72 hours), oldest deleted first. If free disk space drops below 10 %, stop saving new clips,
keep logging metadata, and report a coverage gap. Raw audio is never uploaded.

## Synchronisation

- The uploader is a separate service that reads the `sync_queue` table, sends batches of up to 200 records
  with a fresh signature each attempt, and marks them synced only after a `200`.
- Without internet, records wait in the queue; nothing is lost. Retry with exponential backoff and jitter, capped at 15 minutes.
- A heartbeat goes with every upload, and on its own every 5 minutes, so the site can show the receiver state and gaps.
- The clock must be right (signatures allow ±5 minutes): run `systemd-timesyncd` or `chrony`.
- Retractions go through the same queue.

## Power

- A small line-interactive UPS (600–850 VA, about $60–100). Plug in the station, the SDR hub, **the T-Mobile gateway and the switch**, so uploads continue during short outages.
- Network UPS Tools (NUT) over USB shuts the station down cleanly when the battery runs low.
- The Pi restarts on its own when power returns; on a mini PC set "Restore on AC power loss: Power On" in the BIOS.
- Outages appear as `power` coverage gaps.

## Network

Initial wiring, with no changes to the gateway:

```
T-Mobile gateway ── unmanaged switch ── station (Ethernet, DHCP from the gateway)
```

- No port forwarding, no gateway app, no VLANs, no custom routes.
- Wi-Fi and Bluetooth off on the station (on a Pi: `dtoverlay=disable-wifi` and `dtoverlay=disable-bt`).
- No web interfaces. If a tool such as OpenWebRX is ever tried, bind it to `127.0.0.1` only.

### Host firewall (nftables)

Refuse everything inbound, allow only the outbound traffic the station needs, and refuse outbound connections to
the household's private addresses. `192.168.12.1` is the usual T-Mobile gateway address; confirm it with `ip route`.

```
#!/usr/sbin/nft -f
flush ruleset
define GATEWAY = 192.168.12.1

table inet station {
  chain input {
    type filter hook input priority 0; policy drop;
    iif lo accept
    ct state established,related accept
    ct state invalid drop
    udp sport 67 udp dport 68 accept                      # DHCP replies
    icmp type { echo-reply, destination-unreachable, time-exceeded } accept
    icmpv6 type { nd-neighbor-solicit, nd-neighbor-advert, nd-router-advert,
                  destination-unreachable, packet-too-big, time-exceeded } accept
    limit rate 6/minute log prefix "station-in-drop: "
  }
  chain forward { type filter hook forward priority 0; policy drop; }
  chain output {
    type filter hook output priority 0; policy drop;
    oif lo accept
    ct state established,related accept
    udp dport 67 accept                                   # DHCP requests
    icmpv6 type { nd-neighbor-solicit, nd-neighbor-advert, nd-router-solicit } accept
    ip daddr $GATEWAY udp dport 53 accept                 # DNS via the gateway
    ip daddr $GATEWAY tcp dport 53 accept
    ip daddr { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, 100.64.0.0/10 } drop
    ip6 daddr { fc00::/7, fe80::/10 } drop
    udp dport 123 accept                                  # time
    tcp dport 443 accept                                  # archive uploads and HTTPS updates
    limit rate 6/minute log prefix "station-out-drop: "
  }
}
```

Switch the package sources to HTTPS mirrors so updates work with port 80 closed. The 100.64.0.0/10 block
covers the carrier-grade NAT range; if DNS or time ever fails, check those rules first.

### SSH

Off by default (`systemctl disable --now ssh`); maintain the station with a keyboard and screen.
If remote maintenance becomes necessary: key-only login (`PasswordAuthentication no`, `PermitRootLogin no`,
`AllowUsers <one user>`), and allow TCP 22 inbound only from one admin computer's address in nftables.
Without changing the gateway, that computer's address can change, so this is a convenience-versus-safety trade-off.
Third-party remote-access services are possible but are another account and another party to trust; not recommended at first.

### Optional isolated monitoring network

The switch cannot separate the station from the rest of the house, and a host firewall stops working if the host
itself is compromised. For real separation, add a small router running OpenWrt (or a similar firewall) between
the switch and the monitoring equipment. Rough price: $30–90. Nothing to buy now.

```
T-Mobile gateway ── switch ── firewall router (WAN) ── (LAN, e.g. 10.42.0.0/24) ── station
```

Router policy:

- Monitoring LAN to the internet: allow TCP 443, UDP 123 and DNS to the router only. Drop everything else.
- Monitoring LAN to the household subnet (for example `192.168.12.0/24`): **reject**.
- Household or internet to the monitoring LAN: drop (the router's default for its WAN side). No port forwards.
- The router's admin page reachable from the monitoring LAN only, with a strong password.
- Double NAT is fine because every connection is outbound.

This needs no change to the T-Mobile gateway or the switch.

## Keeping it healthy

- **Security updates:** `unattended-upgrades` for the operating system; Python dependencies pinned in a virtual environment and reviewed monthly.
- **Services:** each stage is a systemd unit with `Restart=always`; long-running ones use `WatchdogSec` and notify systemd while healthy.
- **Hardware watchdog:** `RuntimeWatchdogSec=15s` in systemd so a hung system reboots itself.
- **Health checks:** SDRs present on USB, recent activity from each demodulator, uploader success, queue depth, disk space, database integrity. Any failure sets the receiver to `degraded` or `offline` and opens a coverage gap.
- **Logs:** persistent journald with a size cap. Firewall drops are logged at a limited rate. Watch for unexpected SSH or sudo use.
- **Recovery:** keep a written rebuild guide and a known-good OS image. Restoring means flashing the image, restoring the latest database backup, and putting a **new** upload key in place (rotate on every rebuild).

## Shopping list, in order

Rough prices, to check before buying. Nothing should be bought until the plan is approved.

| Stage | Items | Rough total |
|---|---|---|
| 1. CB priority monitoring | Mini PC or Pi 5 kit with SSD; RTL-SDR Blog V4; CB base antenna; 50 Ω coax; lightning arrestor and grounding parts; UPS; Ethernet cable | $350–550 |
| 2. VHF/UHF scanning | Second RTL-SDR; discone; coax; FM band-stop filter | $150–250 |
| 3. Shortwave, Morse, numbers stations | HF SDR; outdoor long wire with 9:1 unun or active loop | $220–400 |
| 4. Meshtastic | Meshtastic node with 915 MHz antenna | $20–40 |
| Optional isolation | Small OpenWrt-capable router | $30–90 |

## Costs

One-time hardware: see the list above. Recurring:

| Item | Monthly |
|---|---|
| GitHub Pages, Render service, Firestore | $0 extra (existing services; usage fits free quotas) |
| Electricity, about 10–20 W around the clock (7–15 kWh) | About $1–5, depending on hardware and local rates |
| Internet | Existing T-Mobile service; uploads are small text |

If anything would add a recurring charge, it needs approval first.

## Phase 3 checklist (after hardware is chosen)

1. Install and test receivers and antennas.
2. Run RX-A on all CB channels and confirm channels 9 and 19 are logged continuously.
3. Build the adaptive scanner for RX-B, with coverage logging.
4. Add decoders one at a time, checking false-positive rates on real recordings.
5. Create the SQLite database from the reference schema; set up backups and retention.
6. Configure and test the publication policy on real traffic before any upload.
7. Merge the Firestore rules, set the Render variables, start the uploader.
8. Security test: port scan the station from the household LAN (expect nothing open); confirm the public API returns nothing about the station's network.
9. Pull the power and the internet cable; confirm recovery, queue drain and honest gap reporting.
