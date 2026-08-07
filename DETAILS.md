# DETAILS

## Overview

An inclusive education AI platform built for a hackathon. The goal is to make learning accessible — going beyond basic text-to-speech / speech-to-text — by closing the feedback loop between students, teachers, and parents. Content and assessments are aligned with NCERT modules and standards authorized by the Central Board of Education (CBE).

## Core Flow

### 1. Student Profiling & Initial Assessment

- A profile is created for each child.
- An AI-generated adaptive diagnostic quiz identifies weak spots from previous classes/grades. The quiz adjusts in real time based on the student's responses (driven by the LangChain/LangGraph layer — see `ARCHITECTURE.md`).
- Identified gaps are compensated for *within* the current grade's modules, rather than as a separate remedial track — this matters most for interlinked subjects like math and science, where an unaddressed prior-grade gap would otherwise compound.

### 2. Learning Modes

**School-enrolled**
- Teachers can use pre-published NCERT modules, or upload their own material as PDFs or photographs (processed via OCR).
- Teachers can author their own assessments, or use the AI to generate them.

**Self-educated**
- For students not affiliated with a partner school, a parental dashboard tracks progress and performance in place of a teacher-facing view.

### 3. Cross-Cutting Features

- **Regional language support** — content and interface available in regional languages, not just English/Hindi.
- **Adaptive learning** — difficulty and pacing adjust to the individual student, not just at the initial assessment but on an ongoing basis.
- **Sign language layer** — a generative/live avatar demonstrates key signs alongside lesson content, rather than relying on a fixed prerecorded clip library.

## Compliance

Content, modules, and assessments are meant to stay aligned with NCERT curricula and standards authorized by the Central Board of Education. Any AI-generated content (quizzes, assessments, remedial material) should be traceable back to this standard rather than generated arbitrarily.

## Tech Stack (Summary)

- **Frontend:** Next.js
- **Backend:** FastAPI + uv
- **AI / OCR / Module Processing:** LangChain
- **Agent Pipeline:** LangGraph (translates student progress into actionable lists for teachers/parents)

Full architectural detail lives in `ARCHITECTURE.md`.

## Future / Stretch Features

*Proposed, not yet approved — for discussion.*

- **RAG-based doubt-solving chatbot** grounded in the ingested NCERT content, reusing the same LangChain OCR/module-ingestion pipeline so a student can ask "explain this" in context.
- **Weak-topic heatmap / analytics view** for teachers and parents — a visual rollup of the LangGraph actionable-list output, instead of a plain text list.
- **Low-bandwidth / offline-friendly mode** (text-first, lazy-loaded audio/video) given the platform's likely reach into low-connectivity areas.
- **Accessibility extras beyond sign language** — dyslexia-friendly font toggle, high-contrast/reduced-motion mode, screen-reader-friendly markup.
- **Weekly parent digest** (email/notification) summarizing progress, so the loop closes passively instead of requiring parents to check a dashboard.

## Open Questions

None blocking at this stage. Two things remain implementation details to be defined during build, not open product questions:
- The exact question-sourcing and grading rubric behind the adaptive diagnostic quiz.
- The sign-vocabulary coverage of the generative avatar (i.e., which signs it can reliably produce at hackathon scope).
