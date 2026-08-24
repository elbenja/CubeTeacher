# Analytics

Design for instrumenting CubeTeacher with usage analytics. 2026-08-23,
revised 2026-08-24.

*(Filename says "posthog" for historical reasons — PostHog was the original
target and the SDD workspace keys off this name. Renamed at the end of the
run, not mid-flight.)*

## Why

CubeTeacher has 30+ cases across three groups and no idea which of them work.
Whether a case is too long, opened and abandoned, or never opened at all is
currently unknowable — the only feedback loop is the author using his own app.

Four questions are worth answering:

- **Content quality.** Which algorithms do people quit partway through, and at
  which move?
- **Audience.** How many people, and do they come back?
- **UI validation.** Is the notation legend used? The scrubber? The stack
  expander? Each was built on an assumption that has never been checked.
- **Learning progress.** Does anyone finish a whole method?

## Why GoatCounter, and what it costs

PostHog was the original target and would have answered all four. It is out:
its free plan allows one project, and the author's single project is committed
to other work. Of the free alternatives, GoatCounter asks the least — a script
tag, no server, no account juggling — and it runs on GitHub Pages unchanged.

The price is its data model. **GoatCounter records a path and an event flag.
It carries no properties.** Everything the original design expressed as a
property bag must flatten into path segments, and three capabilities are simply
unavailable:

- **No funnels.** `case → play → finish → complete` drop-off cannot be
  measured. Each step is countable on its own; the sequence is not.
- **No retention cohorts.** "Did the people who completed something come back"
  has no answer. The audience question degrades to a visitor count over time.
- **No cross-property breakdowns.** "Which cases do experienced users revisit"
  is unanswerable. There is no person, and nothing to break down by.

Dwell time degrades from a number to a bucket, for the same reason.

This is recorded plainly because the temptation later will be to read more into
the numbers than they hold. A path count is a count. It is not a funnel, and
two counts side by side are not a conversion rate — the same visitor is not
identifiable across two paths.

## Constraints

The app is a static page on GitHub Pages. No backend, no accounts, no server to
proxy through. Three consequences:

- **A "visitor" is GoatCounter's daily hash, not a person.** It is deliberately
  not stable across days. Counts are directional.
- **Ad blockers eat some traffic.** Less than they would eat of PostHog, but
  not none.
- **The site code ships in the repo.** `https://<code>.goatcounter.com/count`
  is a public endpoint by design. This is not a leak.

No cookies are set by GoatCounter, so no consent banner is required.

## Scope

In: the GoatCounter script tag, an `analytics.js` wrapper, the event paths
below, and reading them in the GoatCounter dashboard.

Out, stated so the boundary is unambiguous:

- Consent UI or an opt-out toggle. Nothing is stored on the visitor.
- Any attempt to reconstruct funnels or per-person history from path counts.
  The data does not support it; see above.
- Syncing `cubeteacher.done` / `.likes` anywhere. Progress stays local.
- Self-hosting GoatCounter, or a bespoke Worker-and-database pipeline. Both
  were considered and rejected as more operational weight than this project
  justifies.

## Architecture

Two modules. `analytics-core.mjs` holds every pure decision — the idle
heartbeat, the path builders, the per-case dedupe — with no DOM and no vendor,
unit-tested headlessly by `node --test`. `analytics.js` is the impure shell:
the send queue, the DOM listeners, the unload flush.
`CubeTeacher.dc.html` calls only `analytics.js`.

Three properties of the wrapper matter:

- **Fail-open.** Every entry point is a silent no-op when GoatCounter is
  absent, blocked, or not yet loaded. Analytics must never be the reason
  something in the app breaks.
- **One choke point for case views.** `selectAlg`, `selectVar` and `selectCase`
  all funnel into `loadCurrent()`, as does the initial mount. The case event
  fires from there and nowhere else.
- **Silent on localhost** unless `?gc=1` is in the URL, so development and
  verification runs do not pollute the data.

## The event paths

| Path | Fires when |
|---|---|
| `case/<case_id>` | a case opens |
| `done/<case_id>` | a variation is completed for the first time |
| `like/<case_id>` · `unlike/<case_id>` | a like is toggled |
| `quit/<case_id>/m<N>` | playback is abandoned at move N |
| `time/<case_id>/<bucket>` | a case closes; bucket ∈ `0-15s` `15-60s` `1-3m` `3m+` |
| `ui/<control>` | first use per case; control ∈ `legend` `scrub` `stack` `keyboard` `rotate` `reset` `replay` |
| `milestone/<pct>` | 25 / 50 / 75 / 100 percent of variations done |
| `section/<group>` | every case in a group is done |
| `fail/<reason>` | the render path throws |

`<case_id>` is the existing id from `algorithms.js` (`b-second-layer`,
`a-oll`, …). The variation label is deliberately **not** in the path: labels
are prose, they contain spaces and punctuation, and including them would
multiply a few dozen paths into a few hundred for a distinction the case-level
question does not need.

Sorted by count, the paths list is the "which algorithms get used" chart.
`quit/b-second-layer/m7` is the difficulty map, and remains the most valuable
single thing this instrumentation produces.

## The four fiddly bits

Everything above is mechanical. Four things are not, and getting them wrong
produces data that looks fine and is false.

**`time` buckets must exclude idle time.** The mechanism is a heartbeat, not a
stopwatch. A 1s interval adds a second only when the document is visible *and*
there has been user activity within the last 60s. Activity means a pointer
event, a keypress, or a playback step — playback counts, so watching a long
algorithm run is not mistaken for idling.

The tempting simpler version — start a stopwatch, stop it on
`visibilitychange`, clamp the segment to 60s — is wrong, and wrong in the
direction that looks fine. It clamps *active* viewing too: five minutes of
attentive study in a visible tab records 60 seconds. The clamp has to apply to
the idle gap, never to the elapsed segment.

**`ui/` events must dedupe per case.** Firing one hit per arrow press would put
hundreds of `ui/keyboard` hits in the log for a single study session and drown
every other path. Each `ui/` control fires at most once per case viewing. The
question is "is this control used at all", and a per-case boolean answers it;
a raw press count would answer a question nobody asked, badly.

**The unload event needs its own transport.** `time/` fires when a case closes,
including when the tab does. GoatCounter's `count()` issues an ordinary request
that is cancelled during unload, so the last — and most engaged — case of every
session would be the one that never arrives. The flush instead builds the count
URL by hand and sends it with `fetch(url, { keepalive: true, mode: 'no-cors' })`,
which survives unload. `navigator.sendBeacon` is not used: it POSTs, and the
count endpoint expects a GET.

**Events fired before the script loads must queue.** `count.js` is async, so
`window.goatcounter.count` does not exist for the first moments of the page —
exactly when the initial `case/` event fires. Calls made before then are held
in a queue and drained once the function appears, with a bounded number of
retries. Without the queue the first case view of every session is lost, which
is precisely the one most likely to matter.

## What this design deliberately does not have

No identity, no super properties, no per-visitor state, no `first_visit`
event, and no localStorage key of its own. All of them existed in the PostHog
version to enable breakdowns that GoatCounter cannot perform. Carrying them
forward would be writing code to produce data nothing can read.

## Reading the results

No dashboards to build — GoatCounter has one page. What to look at:

- **Paths sorted by count**, prefix-filtered: `case/` for what gets opened,
  `done/` for what gets finished, `quit/` for where people stop.
- **`quit/` paths for one case**, read together: the move numbers concentrate
  where the algorithm loses people.
- **`case/X` against `done/X`** as a rough ratio — with the caveat above that
  these are two counts, not a measured conversion.
- **`ui/` counts** against total `case/` counts: what fraction of case views
  touch each control.
- **The visitor graph** for audience.

## Verification

The project has no UI test runner; `validate.mjs` checks algorithm content,
which nothing here touches. Verification is therefore manual and must be
evidenced, not asserted — silently-not-firing instrumentation is worse than
none, because it produces confident empty charts.

Run locally with `?gc=1`, exercise every path, and for each event confirm the
network request leaves the browser and the hit appears in the GoatCounter
dashboard. The request is the proof; absence of a console error is not.

Specific cases that must be checked, because each has a way to fail silently:

- The very first `case/` event of a cold load arrives — proving the queue
  drains rather than dropping it.
- Opening a pattern with `open: 'end'` fires `case/` and does **not** fire
  `done/`.
- Switching cases mid-playback fires `quit/…/mN` and `time/…`, then `case/`
  for the new one.
- Closing the tab delivers `time/…` via the keepalive fetch.
- Pressing an arrow key twenty times produces exactly one `ui/keyboard`.
- Backgrounding the tab for two minutes does not advance the time bucket.
- Blocking `gc.zgo.at` in devtools leaves the app fully functional.
