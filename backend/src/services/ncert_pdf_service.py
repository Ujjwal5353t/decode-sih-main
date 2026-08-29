"""
NCERT PDF Document Generation Service.
Generates printable, beautifully formatted PDF documents inline using ReportLab
for NCERT curriculum modules and textbooks.
"""

import io
import re
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer

from src.db.ncert_content import NCERT_CHAPTER_TEXT


def generate_ncert_pdf_bytes(subject: str, class_number: int, title: Optional[str] = None) -> bytes:
    """
    Builds and returns raw PDF bytes for an NCERT textbook / curriculum module.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    story = []
    styles = getSampleStyleSheet()

    # Custom Typography Styles
    title_style = ParagraphStyle(
        "NCERTTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        alignment=1,  # Center
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        "NCERTSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#475569"),
        alignment=1,
        spaceAfter=15,
    )

    chapter_heading = ParagraphStyle(
        "NCERTChapter",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e3a8a"),
        spaceBefore=14,
        spaceAfter=8,
    )

    body_style = ParagraphStyle(
        "NCERTBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8,
    )

    # Document Header
    book_title = title or f"NCERT Class {class_number} {subject}"
    story.append(Paragraph(f"<b>{book_title}</b>", title_style))
    story.append(Paragraph(f"National Council of Educational Research and Training &bull; Class {class_number} {subject}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=15))

    # Lookup chapter text
    raw_text = None
    clean_sub = subject.strip().lower()
    
    for (s_name, c_num), text in NCERT_CHAPTER_TEXT.items():
        if c_num == class_number and (s_name.lower() in clean_sub or clean_sub in s_name.lower()):
            raw_text = text
            break

    if not raw_text:
        # Fallback textbook text
        raw_text = (
            f"Chapter 1: Introduction to Class {class_number} {subject}\n"
            f"Welcome to the NCERT Class {class_number} {subject} curriculum module. "
            f"This textbook builds foundational understanding, critical thinking, "
            f"and practical problem solving aligned with national education standards.\n\n"
            f"Chapter 2: Core Concepts & Practice Exercises\n"
            f"Students will explore step-by-step concepts, illustrated examples, "
            f"and interactive practice problems to master key topics."
        )

    # Parse chapters and paragraphs
    paragraphs = raw_text.split("\n\n")
    for block in paragraphs:
        block = block.strip()
        if not block:
            continue

        if block.startswith("Chapter"):
            lines = block.split("\n", 1)
            ch_header = lines[0].strip()
            story.append(Paragraph(ch_header, chapter_heading))

            if len(lines) > 1 and lines[1].strip():
                body_text = lines[1].strip().replace("\n", " ")
                story.append(Paragraph(body_text, body_style))
        else:
            body_text = block.replace("\n", " ")
            story.append(Paragraph(body_text, body_style))

        story.append(Spacer(1, 4))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
