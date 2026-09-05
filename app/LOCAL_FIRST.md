# Why VidyaSetu Mobile Is Local-First

VidyaSetu already exists as a web app. This mobile app is not a re-skin of it — it is
built on a different foundation: everything a child needs for a lesson lives on the
device first, and the server is something the app *syncs with*, not something it
*depends on* to function. This document explains why that foundation was the right
call for this product, and what it unlocks that a browser tab cannot.

## 1. A Dedicated App Removes the Distraction the Browser Adds

A child asked to "go do your lesson on the website" has to survive the browser first —
a URL bar that suggests other sites, browser tabs one swipe away, notifications from
whatever else is open, bookmarks to games. Every one of those is a decision point
where a 7-year-old can wander off task, and none of them is a decision an adult
supervising remotely gets to see happen.

A native app has none of that surface. It opens straight to sign-in — **there is no
landing page to browse past** — and once signed in, the only thing on screen is the
lesson, the quiz, or the progress the child came to see. The home-screen icon is the
same one every time, so "open VidyaSetu" is a single tap a child can be trusted with,
the way "open the calculator" is, instead of "open the browser, remember the site,
type it correctly." That's a small interaction-design detail with a large real-world
effect for exactly the age group this product is for.

## 2. Local-First Storage Is What Makes Offline & Regional Access Real

Two of the product's core promises — **regional-language support** and **usable
learning material outside city-grade connectivity** — only hold up if the app doesn't
quietly stop working the moment a signal drops. That's the actual argument for
building this local-first rather than online-first-with-a-fallback:

- **Lesson content and quiz questions are cached to the device** the moment they're
  fetched, so a chapter already opened stays fully usable — text, images, and the
  built-in check-your-understanding quiz — with zero connectivity. A student on a
  train, in a village with patchy coverage, or simply on a family phone with a
  pay-as-you-go data plan does not lose their lesson mid-sentence.
- **Every action the student takes is written to an on-device queue first**, not sent
  and forgotten: finishing a slide, completing a lesson, answering a diagnostic
  question. The queue is what the app actually treats as ground truth locally: the
  student's own dashboard reads *through* the queue, so their progress bar, points,
  and streak update immediately, on-device, even before the phone has synced anything.
- **Sync is opportunistic, not required.** The app tries to push the queue the moment
  something is recorded, again whenever the student returns to the app, and on a
  manual "Sync now" the student (or a parent, watching over their shoulder) can see
  from the Profile tab, which reports honestly how many updates are still waiting.
  Nothing is lost if the network never cooperates during a session — it just sends the
  next time it does.
- **Regional-language UI is bundled into the app itself**, not fetched per screen —
  English, Hindi, Bengali, Marathi, Punjabi, Urdu, Tamil, and Assamese all ship inside
  the install. Switching language is instant and works with no connection at all,
  which matters because the households most likely to prefer a regional language are
  often the same households least likely to have reliable data.

Put together, this is the actual meaning of "local-first" here: it is not a
performance optimization, it is what makes the regional-language and low-connectivity
parts of the product promise *true* rather than aspirational.

## 3. RunAnywhere: On-Device Speech, Not Cloud Speech

Reading and hearing a lesson matters as much as seeing it, especially for younger
students and for the sign-language-assist layer described below — but sending a
child's voice, or every lesson sentence, to a cloud speech API on every use has two
costs this product can't accept: it doesn't work offline, and it means a classroom's
audio is round-tripping to a third party.

**RunAnywhere** (runanywhere.ai) is the on-device speech SDK this app is built to run
on: text-to-speech and speech-to-text that execute the model *on the phone itself*, no
network call involved. That is why it fits a local-first app specifically — the same
reason lesson content is cached locally is the reason speech should run locally too:

- **Read-aloud works with zero connectivity**, exactly like the cached lesson text it
  reads — a student who has no signal still gets the lesson read to them.
- **Voice input never leaves the device**, which matters most for the exact users this
  product serves: children, whose voice data warrants the strongest protection, not
  the least.
- **Regional-language speech stays consistent with the regional-language UI** — the
  same on-device model family that reads a Hindi or Tamil sentence aloud is available
  without depending on which cloud STT/TTS vendor happens to support that language
  well this month.

In this build, the read-aloud path is implemented and working (via Expo's on-device
speech engine as a stand-in with the exact same function signature RunAnywhere's SDK
would use), and speech-to-text is wired up to the same abstraction with RunAnywhere
named as the integration target — see `src/speech/speech.js`, which is the one file
that changes when the real SDK is dropped in. Every screen that speaks calls through
that one module, not a speech API directly, on purpose.

## 4. What a Dedicated Mobile App Makes Possible

Several things this product benefits from are hard or impossible in a browser tab, and
are a big part of why this is a native app and not just a mobile-responsive website:

- **Home-screen presence.** A single tappable icon is a lower barrier to "go learn"
  than "open a browser and navigate to a URL," for a child and for the parent handing
  them the phone.
- **A durable local queue survives app kills, phone restarts, and dead network** the
  way a browser tab's in-memory state does not — a lesson finished offline is still
  there to sync tomorrow, not lost if the tab (or the whole browser) closed first.
- **On-device speech and, eventually, on-device sign-language rendering** are natural
  fits for a native runtime with direct hardware access — a browser sandbox makes both
  meaningfully harder to do well offline.
- **One app, one identity per device.** No tab confusion between the student's lesson
  and a parent's dashboard signed in on the same shared family browser — separate,
  focused sessions.

## Every Product Feature, and Why It's Built This Way

- **Student profiling & adaptive diagnostic quiz** — a short quiz that adjusts to each
  answer and locates exactly which earlier concepts a student is shaky on, instead of
  guessing from a grade level alone. Runs with instant on-device feedback (sound,
  streaks, encouragement) so a child experiences it as a game, not a test — and the
  read-aloud button means a student who struggles to read the question isn't blocked
  by that alone.
- **Gaps folded into current-grade lessons, not a separate remedial track** — so a
  student who's shaky on 2nd-grade fractions doesn't get pulled out of their 4th-grade
  class content, they get it addressed on the way through.
- **Lessons as short slide-by-slide chapters** (concept → example → quick check),
  cached per-device the moment they're opened, so a chapter started on the bus keeps
  going after the tunnel.
- **School-enrolled mode** — a student attached to a school sees the modules and
  assignments their teacher has published for their class and section.
- **Self-educated mode** — a student with no partner school still gets full NCERT-based
  content, with a parent's dashboard standing in for the teacher view.
- **Teacher tools** — class rosters, per-class and per-student progress with mastery
  trend (improving/declining/stable/mastered), a class leaderboard, and the ability to
  spin up an AI-generated quiz assignment against a class's own published material
  in a couple of taps, from a phone, without needing to be at a desk.
- **Parent dashboard** — link a child by their student ID, then see the same mastery
  breakdown, open learning gaps, and diagnostic summary a teacher would — critical for
  the self-educated mode, where the parent *is* the only adult in the loop.
- **Gamification** — points, streaks, and a class leaderboard turn "did my progress go
  up" into something a child is motivated to check themselves, not just something an
  adult monitors.
- **Regional language switching** — see §2 above; a real, offline-capable feature, not
  a checkbox.
- **Sign-language assist layer** — a lightweight on-screen sign cue that appears
  alongside lesson text (see `src/components/SignLanguageAvatar.js`), standing in for
  the product's longer-term generative sign-avatar concept at hackathon scope, in the
  same position in the UI a fuller version would occupy.
- **On-device read-aloud (RunAnywhere integration point)** — see §3.
- **Local-first sync** — see §2; visible to the user, not hidden: the Profile tab
  always shows how many updates are waiting and lets anyone force a sync.

## A Note on Scope

This build focuses on the Student, Teacher, and Parent experience end-to-end. The
school-administrator workflows on the web app (bulk NCERT module upload with OCR,
school-identity verification, super-admin approval queues) are back-office, bulk-data
workflows that are genuinely better suited to a desktop browser and were left off the
phone deliberately, not by oversight. Speech-to-text and full production-grade
online/offline detection are stubbed for the same reason: this build is meant to
demonstrate the local-first architecture clearly on a single USB-tethered device, not
to duplicate every administrative surface of the web app.
