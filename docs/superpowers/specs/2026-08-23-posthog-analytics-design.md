# PostHog analytics

Design for instrumenting CubeTeacher with product analytics. 2026-08-23.

## Why

CubeTeacher has 30+ cases across three groups and no idea which of them work.
Whether a case is too long, opened and abandoned, or never opened at all is
currently unknowable — the only feedback loop is the author using his own app.

Four questions are worth paying for:

- **Content quality.** Which algorithms do people quit partway through, and at
  which move?
- **Audience.** How many people, and do they come back?
- **UI validation.** Is the notation legend used? The scrubber? The stack
  expander? Each was built on an assumption that has never been checked.
- **Learning progress.** Does anyone finish a whole method, and how long does
  it take them?

PostHog answers all four from one event stream. Retention and stickiness need
no bespoke events at all — they derive from whatever is already being sent.

## Constraints

The app is a static page on GitHub Pages. No backend, no accounts, no server to
proxy through. Everything below is client-side, and three consequences follow:

- **A "user" is an anonymous `distinct_id` in a first-party cookie.** Clearing
  site data or switching device makes a new person. Counts are directional.
- **Ad blockers eat a real share of traffic.** The standard mitigation is a
  reverse proxy on your own domain; GitHub Pages cannot host one. Accepted.
- **The project API key ships in the repo.** PostHog client keys are
  write-only and designed to be public. This is not a leak.

Cookies are used with no consent banner: anonymous, first-party, no PII, no
cross-site tracking.

## Scope

In: the PostHog snippet, an `analytics.js` wrapper, the events in the taxonomy
below, and the insights built in the PostHog UI.

Out, stated so the boundary is unambiguous:

- Consent UI, a cookie banner, or a settings toggle for opting out.
- `identify()`, accounts, or any cross-device identity.
- Session replay, surveys, and feature flags. All are available once the
  snippet lands and all are worth having later; none is wired here.
- Syncing `cubeteacher.done` / `.likes` to a server. Progress stays local.

## Architecture

A new `analytics.js` ES module, imported once by
[CubeTeacher.dc.html](../../../CubeTeacher.dc.html). It owns the PostHog init,
the super properties, the per-case timer, and the counters. Nothing else in the
app learns that PostHog exists — the rest of the codebase sees four functions:

```js
track(name, props)   // one discrete event
openCase(alg, vari)  // starts the timer; flushes the previous case first
closeCase(reason)    // flushes case_closed
bump(counter, n)     // increments a tier-2 counter in memory
```

Three properties of the wrapper matter:

- **Fail-open.** Every entry point is wrapped so that a blocked, failed or
  absent `window.posthog` is a silent no-op. An ad blocker must never break the
  cube. This is not defensive padding against an impossible case — for a
  measurable share of visitors `posthog` will genuinely be undefined.
- **One choke point for case views.** `selectAlg`, `selectVar` and `selectCase`
  all funnel into [`loadCurrent()`](../../../CubeTeacher.dc.html), as does the
  initial mount. `openCase` is called from there and nowhere else.
- **Silent on localhost.** `location.hostname` of `localhost` or `127.0.0.1`
  disables sending unless `?ph=1` is in the URL, so development and the
  browser-driven verification runs do not pollute the data.

The snippet itself goes in the `<head>`, copied verbatim from the project's
onboarding page (US Cloud — `https://us.i.posthog.com`), with one change:
`autocapture: false`. Autocapture on a canvas-heavy app produces thousands of
`$autocapture` clicks on structural divs and makes the taxonomy unreadable.
`$pageview`, `$pageleave` and web vitals stay on.

## Two tiers

The obvious instrumentation — one event per interaction — is wrong here. A
user stepping through a 14-move algorithm with the arrow keys would emit 14
events, and a study session would emit several hundred, nearly all noise. So
events split in two.

### Tier 1 — discrete events

Meaningful, low-frequency, each one a thing a person decided to do.

| Event | Properties | Fires at |
|---|---|---|
| `first_visit` | — | init, once ever |
| `case_opened` | case_id, case_name, group, variation, variation_index, move_count | `loadCurrent()` |
| `playback_started` | case_id, variation, replay_index, from_move | `play()` |
| `playback_finished` | case_id, variation, seconds | `play()` loop exit at end |
| `playback_abandoned` | case_id, variation, stopped_at_move, pct_through | `stopPlay()` mid-run |
| `algorithm_completed` | case_id, variation, first_time, via | `markDone()` |
| `variation_liked` | case_id, variation, likes_total | `toggleLike()` |
| `variation_unliked` | case_id, variation, likes_total | `toggleLike()` |
| `progress_milestone` | pct (25/50/75/100), cases_done | after `markDone()` |
| `section_completed` | group, cases, days_since_first_visit | after `markDone()` |
| `legend_opened` | first_time | `toggleLegend` |
| `legend_dismissed` | — | `dismissLegend` |
| `render_failed` | reason | the `catch` in `componentDidMount` |

`group` is the existing `beginner` / `advanced` / `patterns` value from
[algorithms.js](../../../algorithms.js), not a new concept.

### Tier 2 — counters, flushed as one summary

Steps, scrubs, keyboard use, resets, replays, cube rotation and stack expansion
increment an in-memory counter. They ship as properties of a single event when
the case is left or the tab goes away:

`case_closed` → case_id, variation, group, active_seconds, steps_manual,
steps_keyboard, scrubs, resets, replays, rotated, stack_expanded, reached_end,
completed

Two of those properties look alike and are not: `reached_end` means the last
move was reached during this viewing, `completed` means the variation is now
checked off — which may have happened on an earlier visit. A case with a high
`completed` and a low `reached_end` is being revisited for reference, not
learned.

`replay_index` on `playback_started` and `replays` on `case_closed` both count
plays of this variation within the current viewing, starting at 0. They are the
same counter read at two moments.

One event carries what two hundred would have, and it carries the two numbers
that actually matter: per-case dwell time, and the manual-study-versus-autoplay
ratio. Someone stepping move by move is learning; someone who only ever hits
play is browsing. Those are two different products and today they are
indistinguishable.

## The three fiddly bits

Everything above is mechanical. Three things are not, and getting them wrong
produces data that looks fine and is false.

**`active_seconds` must exclude idle time.** The timer accrues only while
`document.visibilityState === 'visible'`, and any single gap longer than 60s is
clamped to 60s. Without this, a tab left open overnight reports a nine-hour
study session and every dwell-time average is ruined by it.

**`case_closed` must survive the tab closing.** It flushes on `pagehide` and on
`visibilitychange` to hidden, using `posthog.capture(name, props, { transport:
'sendBeacon' })`. A normal XHR is cancelled during unload, so without this the
last — and most engaged — case of every session is silently lost.

**`via` on `algorithm_completed` has to be threaded.** `markDone` is called from
the engine's `onIndex` callback, which knows the index reached the end but not
how. `analytics.js` records the last transport interaction (`play`, `step`,
`scrub`, `jump`) as each is invoked, and `markDone` reads it. Note that
`creditArmed` already guards the `open: 'end'` patterns from self-completing on
load; the analytics event inherits that guard by firing inside `markDone`
rather than in `onIndex`.

## Identity and super properties

Anonymous `distinct_id`, default cookie persistence. No `identify()`, no PII —
there are no accounts to attach anything to.

Registered on every event via `posthog.register()`:

- `cases_done_count` — how far through the app this person is
- `likes_count`
- `app_version` — a hand-maintained constant in `analytics.js`

This is the part that makes the whole exercise worth doing. It lets any trend
be broken down by beginner-versus-experienced without a login: "which cases do
people with twenty completions come back to?" becomes a two-click question in
the PostHog UI rather than a new instrumentation project.

Deliberately **not** registered: `device_type`, `os`, `browser`, `viewport`,
`referrer`. PostHog captures all of these automatically as `$device_type`,
`$initial_referrer` and friends. A hand-rolled copy would be a second, worse
source of truth.

One new localStorage key, `cubeteacher.firstSeen`, holding an ISO date. It
exists solely to compute `days_since_first_visit` on `section_completed` —
how long a method takes to finish is the single most interesting derived
number here, and PostHog cannot reconstruct it from a cookie that may have
been cleared. It follows the existing `read`/`write` helpers and the
`cubetrainer.*` fallback convention.

## Insights to build in PostHog

No code. Listed so the instrumentation can be checked against its purpose —
every event above exists to feed one of these.

- **Trends**: `case_opened` and `algorithm_completed`, broken down by
  `case_id`. The two headline charts.
- **Funnel**: `case_opened` → `playback_started` → `playback_finished` →
  `algorithm_completed`. Drop-off from step 1 to 2 means a case looks
  unappealing; 2 to 3 means it is too long; 3 to 4 means the completion
  mechanic is not being reached.
- **Retention and stickiness** on `algorithm_completed` — returning users,
  free.
- **Trend on `playback_abandoned` broken down by `stopped_at_move`** — the
  difficulty map, and the most actionable chart in the project.
- **`case_closed` averages** for `active_seconds` and the manual-vs-autoplay
  ratio, broken down by `group`.

## Testing

The project has no test runner; `validate.mjs` checks algorithm content, not
UI, and nothing here touches algorithm content. Verification is therefore
manual and must be evidenced, not asserted — silently-not-firing
instrumentation is worse than none, because it produces confident empty charts.

Run locally with `?ph=1`, exercise every path, and confirm for each event:

1. It appears in PostHog's Activity feed with the expected properties.
2. The network request is visible in the browser pane — the proof is the
   request, not the absence of a console error.

Specific cases that must be checked, because each has a way to fail silently:

- Opening a pattern with `open: 'end'` fires `case_opened` and does **not**
  fire `algorithm_completed`.
- Switching cases mid-playback fires `playback_abandoned` and `case_closed`
  for the old case, then `case_opened` for the new one, in that order.
- Closing the tab fires `case_closed` via `sendBeacon`.
- Backgrounding the tab for two minutes adds at most 60s to `active_seconds`.
- Blocking `us.i.posthog.com` in devtools leaves the app fully functional.
