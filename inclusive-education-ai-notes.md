# Inclusive Education AI — Team Notes 📝

*(Hackathon project, quick brief for the team — not a formal doc, just so we're all on the same page)*

## The One-Liner

An AI that makes learning actually accessible — regional languages, offline-first, and built-in support for kids with different learning needs (dyslexia, ADHD, hearing/speech impairments etc).

**Why this matters for judging:** everyone's pitching "regional language AI tutor" this year. We stand out by (a) going deeper on assistive tech than just TTS/STT, and (b) closing the loop to teachers/parents, which basically nobody does.

---

## Our Core Features (the original 5)

1. **Adaptive Learning** — personalized profile per kid, test results reshape the curriculum, keep it on-demand so we don't overwhelm small kids with too much at once.
2. **Local-First Mobile App** — React Native + WatermelonDB, works fully offline, syncs when internet shows up. Maybe on-device LLM/TTS/STT if we can pull it off.
3. **Regional Language Support** — web + mobile, need to research good APIs.
4. **Life-Skills Modules** — manners, personal safety ("safe touch/bad touch"), cultural learning, gamified language learning (Duolingo-style).
5. **Specialized Support (ADHD etc.)** — diagnostic pre-test → adapts UI/delivery for that kid's needs.

---

## New Ideas — Sorted by "How Much Should We Build This"

### 🚀 Flagship ideas — pick ONE and go deep
- **Snap & Learn** — kid photographs *any* textbook page → OCR + AI turns it into a narrated, quizzed, translated mini-lesson on the spot. Huge for schools where all they have is a printed book.
- **Teacher/Parent AI Co-Pilot** — a LangGraph agent pipeline that turns a kid's progress into (a) an action list for the teacher and (b) a *voice* update for parents in their language (a lot of parents can't read a text dashboard).
- **Sign language layer** — even a scoped-down version (avatar demoing key signs + synced captions) is something almost nobody else will attempt.

### ⚡ Quick wins — cheap, still legit accessibility
- Dyslexia mode: OpenDyslexic font, adjustable spacing, karaoke-style word highlighting while reading.
- High-contrast / reduced-motion / colorblind-safe themes.
- Culturally localized examples (same math problem, different regional context — festivals, currency, food).
- **AAC-lite mode** (new idea) — simple tap-to-speak symbol board for non-verbal kids, using an open symbol set (ARASAAC). Cheap to add, opens up a whole new inclusion angle we hadn't covered.

### 🔮 Vision-only — mention in the pitch, don't actually build
- Local mesh sync between classroom devices (no internet at all needed).
- SMS/IVR fallback for kids without smartphones.

---

## What Already Exists Out There (so we don't reinvent it)

| Project | What it does | Where we can go further |
|---|---|---|
| **Kolibri** (Learning Equality) | Offline-first learning, used in 220+ countries, even refugee camps | No AI personalization or diagnosis — just content delivery |
| **DIKSHA** (India govt) | QR-coded textbooks → digital content, 36 languages | Only works on pages NCERT pre-linked. Ours works on *any* page |
| **Google Bolo / Read Along** | AI reading buddy, proven 64% reading gains in a UP pilot | Just reading practice, not a full curriculum |
| **Eneza Education** (Africa) | Lessons over plain SMS/USSD, works on any phone | Proves the low-bandwidth fallback idea actually works at scale |
| **NVIDIA "Signs"** | 3D avatar + AI teaches ASL | Standalone tool, not tied into a curriculum |
| **Proloquo2Go / AAC apps** | Symbol-based communication for non-verbal kids | Standalone communication app, not part of a learning platform |

**Takeaway:** every piece of what we're planning already exists *somewhere*, built by a specialized team. Nobody's combining offline + language + multi-disability support + the teacher/parent loop into one thing. That combination is our actual edge.

---

## Tech Stack Reminder
- **JS side:** React, Node.js, React Native
- **Python side:** FastAPI, LangChain, LangGraph, scikit-learn, pandas

## Next Step
Pick ONE flagship idea to build deep, treat the rest as quick wins / pitch talking points. Don't spread too thin.
