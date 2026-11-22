# Cockpit interdiction alerts — 22 Nov 2026

PR #496: transient red INTERDICTED / WARP DRIVE DISRUPTED and green INTERDICTION CLEAR / WARP DRIVE AVAILABLE alerts, three seconds each, with last half second fading. The green alert requires an observed active-to-cleared transition of the same route; loading a cleared route or unrelated combat will not display it. Warnings are presentation only; no warp eligibility, combat or save rules changed.

Five focused Node checks pass, including existing interdiction spawn tests. Service worker build bumped. Fresh full CI required; not deployed.
