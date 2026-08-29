# VidyaSetu — User Roles & Demo Credentials

This file documents the 6 account types supported by the platform, what each
one can do, and working demo credentials for testing. Every credential below
was verified directly against the current database (email + password
combination confirmed to authenticate) — not copied from an old note.

---

## 1. Platform Administrator (Superadmin)

- **Role**: `admin`
- **Email**: `admin003@gmail.com`
- **Password**: `123456789`
- **Access**: Superadmin dashboard for platform management and system status.
- Seeded from `backend/src/core/config.py` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) — not a demo account in the usual sense; change these via `.env` for a real deployment.

---

## 2. School Admin (Branch Administrator)

- **Role**: `school`
- **School Name**: `abc Public School`
- **Branch Name**: `south Delhi`
- **Student Prefix**: `abc`
- **Email**: `test@abc.in`
- **Password**: `123456789`
- **Capabilities**:
  - Manage class curriculum modules (PDF, Image-to-PDF OCR, NCERT books).
  - View registered branch teachers and assign/de-assign class sections (e.g. `4A`).
  - View each class's diagnostic quiz roster (per-student score, gaps, AI summary).

---

## 3. Teacher

### Primary Demo Teacher 1: Dr. Rajesh Sharma
- **Role**: `teacher`
- **Name**: `Dr. Rajesh Sharma`
- **Phone Number**: `9876543210`
- **School Name**: `LPS Karkarduma`
- **Branch Name**: `LPS Karkarduma Branch`
- **Password**: `Password123!`
- **Assigned Class**: `Class 4, Section A` (`4A`) — `Mathematics`

### Primary Demo Teacher 2: Ujjwal Yadav
- **Role**: `teacher`
- **Name**: `ujjwal yadav`
- **Phone Number**: `9876543211`
- **School Name**: `LPS Karkarduma`
- **Branch Name**: `LPS Karkarduma Branch`
- **Password**: `Password123!`
- **Assigned Class**: `Class 3, Section A` (`3A`) — `Mathematics`

- **Capabilities**:
  - View students enrolled in assigned classes.
  - Upload manual PDF assignments (max 5 MB) with deadlines.
  - Generate adaptive AI quizzes from uploaded class modules.
  - Grade student submissions (scores out of 100) and post individual feedback.

---

## 4. Student (School-Enrolled)

- **Role**: `student`
- **Unique Student ID**: `LKD0001`
- **Email**: `student1@gmail.com`
- **Password**: `123456789`
- **Branch**: `LPS Karkarduma Branch`
- **Class & Section**: `Class 4, Section A` (`4A`)
- **Capabilities**:
  - Take the mandatory diagnostic quiz (gates access to modules until completed).
  - View school-uploaded curriculum modules.
  - View class assignments, open PDF documents, and submit attempts.
  - View graded scores and teacher feedback messages.

---

## 5. Student (Self-Enrolled — NCERT Mode)

- **Role**: `student`
- **Unique Student ID**: `SELF0002`
- **Email**: `testSelf@gmail.com`
- **Password**: `12345678`
- **Enrollment Mode**: `self`
- **Class**: `Class 2`
- **Capabilities**:
  - Take the mandatory diagnostic quiz.
  - Access official NCERT-aligned curriculum modules for Classes 1–5.

---

## 6. Parent

- **Role**: `parent`
- **Email**: `parent1@gmail.com`
- **Password**: `123456789`
- **Linked Child**: `LKD0001`
- **Capabilities**:
  - Link children using their Unique Student ID.
  - Monitor a linked child's learning progress and diagnostic quiz results (score, gaps, AI summary).

---

## Additional Test Accounts

A second branch/school exists purely for testing cross-branch behavior (a
student and parent enrolled somewhere other than LPS Karkarduma):

| Role                                    | Email                   | Branch              | Password   |
| --------------------------------------- | ----------------------- | ------------------- | ---------- |
| School                                  | `testSchool@gmail.com`  | `no 2 , aps colony` | `12345678` |
| Student (`KVA0001`, Class 1, Section A) | `testStudent@gmail.com` | `no 2 , aps colony` | `12345678` |
| Parent (linked to `KVA0001`)            | `testParent@gmail.com`  | —                   | `12345678` |

## Notes

- Passwords are verified against the live database's stored hashes, not assumed from a prior version of this doc — if login ever fails for one of these, the account's password has drifted from what's documented here (someone changed it locally) rather than this doc being wrong.
- `LKD0001` / `student1@gmail.com` and `parent1@gmail.com` predate the current seed script (`backend/src/db/seed.py`) and are **not** re-created by re-running it — that script's own idempotency guard (`if not student:` / lookup-by-unique-number) skips rows that already exist, so it will never overwrite these two accounts' password even if you change `seed_demo_accounts()`. Reset them directly in the database if they ever need to change.
- A fresh database seeded from scratch will instead produce `student.lkd@vidyasetu.ai` / `Password123!` for `LKD0001` and `parent.lkd@vidyasetu.ai` / `Password123!` for its linked parent (see `seed_demo_accounts()`) — those exact accounts don't exist on the current shared dev database because it was seeded before that code was written; this doc documents the database as it actually stands, not what a fresh seed would produce.
- School-enrolled student/parent/school accounts in the "Additional Test Accounts" table share the same branch (`no 2 , aps colony`) so that student's modules/diagnostic quiz reflect that school's uploaded content.
