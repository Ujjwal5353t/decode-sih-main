# VidyaSetu — User Roles & Demo Credentials

This file contains demo login credentials and account details for all 5 roles supported in the system.

---

## 1. Platform Administrator (Superadmin)
- **Role**: `admin`
- **Email**: `admin003@gmail.com`
- **Password**: `123456789`
- **Access**: Superadmin dashboard for platform management and system status.

---

## 2. School Admin (Branch Administrator)
- **Role**: `school`
- **School Name**: `LPS Karkarduma`
- **Branch Name**: `LPS Karkarduma Branch`
- **Student Prefix**: `LKD`
- **Email**: `school@lps.edu`
- **Password**: `123456789`
- **Capabilities**:
  - Manage class curriculum modules (PDF, Image-to-PDF OCR, NCERT books).
  - View registered branch teachers and assign/de-assign class sections (e.g. `4A`).

---

## 3. Teacher
- **Role**: `teacher`
- **Name**: `Dr. Rajesh Sharma`
- **Phone Number**: `9876543210`
- **School Name**: `LPS Karkarduma`
- **Branch Name**: `LPS Karkarduma Branch`
- **Password**: `Password123!`
- **Assigned Class**: `Class 4, Section A` (`4A`)
- **Capabilities**:
  - View students enrolled in assigned classes.
  - Upload manual PDF assignments (Max 5 MB) with deadlines.
  - Generate adaptive AI Quizzes from uploaded class modules.
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
  - View school-uploaded curriculum modules.
  - View class assignments, open PDF documents, and submit attempts.
  - View graded scores and teacher feedback messages.

---

## 5. Student (Self-Enrolled — NCERT Mode)
- **Role**: `student`
- **Unique Student ID**: `SELF0002`
- **Email**: `testSelf@gmail.com`
- **Password**: `123456789`
- **Enrollment Mode**: `self`
- **Capabilities**: Access official NCERT-aligned curriculum modules for Classes 1–5.

---

## 6. Parent
- **Role**: `parent`
- **Email**: `parent1@gmail.com`
- **Password**: `123456789`
- **Linked Child**: `LKD0001`
- **Capabilities**: Link children using Unique Student ID and monitor learning progress.
