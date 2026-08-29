"""
Structure-aware Chunking Engine for Educational Textbooks & Modules.

Features:
  - Recursive character text splitting (target: 800 chars, overlap: 150 chars).
  - Chapter boundary detection (regex & structural heading patterns).
  - Deterministic vector embedding generation for RAG search.
  - Word & token estimation.
"""

from __future__ import annotations

import math
import re
from typing import Any


DEFAULT_CHUNK_SIZE = 800
DEFAULT_CHUNK_OVERLAP = 150
DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " ", ""]


def estimate_tokens(text: str) -> int:
    """Estimate token count based on whitespace & punctuation splits (~1.3 tokens per word)."""
    words = len(text.split())
    return max(1, int(math.ceil(words * 1.3)))


def split_text_recursive(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
    separators: list[str] | None = None,
) -> list[dict[str, Any]]:
    """
    Recursively split text into chunks of target size with specified overlap.
    Preserves sentence and paragraph boundaries as much as possible.
    """
    if separators is None:
        separators = DEFAULT_SEPARATORS

    text = text.strip()
    if not text:
        return []

    if len(text) <= chunk_size:
        return [{
            "content": text,
            "char_count": len(text),
            "token_count": estimate_tokens(text),
            "start_char": 0,
            "end_char": len(text),
        }]

    # Find effective separator
    separator = separators[-1]
    for s in separators:
        if s == "":
            separator = ""
            break
        if s in text:
            separator = s
            break

    splits = text.split(separator) if separator != "" else list(text)

    chunks: list[dict[str, Any]] = []
    current_pieces: list[str] = []
    current_length = 0

    for piece in splits:
        piece_len = len(piece) + (len(separator) if current_pieces else 0)

        if current_length + piece_len > chunk_size and current_pieces:
            chunk_content = (separator.join(current_pieces)).strip()
            if chunk_content:
                chunks.append({
                    "content": chunk_content,
                    "char_count": len(chunk_content),
                    "token_count": estimate_tokens(chunk_content),
                })

            # Handle overlap: keep last N pieces that fit within overlap budget
            overlap_pieces: list[str] = []
            overlap_len = 0
            for p in reversed(current_pieces):
                p_len = len(p) + len(separator)
                if overlap_len + p_len <= overlap or not overlap_pieces:
                    overlap_pieces.insert(0, p)
                    overlap_len += p_len
                else:
                    break

            current_pieces = overlap_pieces
            current_length = sum(len(p) for p in current_pieces) + (len(separator) * max(0, len(current_pieces) - 1))

        current_pieces.append(piece)
        current_length += piece_len

    if current_pieces:
        chunk_content = (separator.join(current_pieces)).strip()
        if chunk_content:
            chunks.append({
                "content": chunk_content,
                "char_count": len(chunk_content),
                "token_count": estimate_tokens(chunk_content),
            })

    # Add character offsets
    cursor = 0
    for chunk in chunks:
        pos = text.find(chunk["content"][:30], cursor)
        if pos != -1:
            chunk["start_char"] = pos
            chunk["end_char"] = pos + len(chunk["content"])
            cursor = pos + max(1, len(chunk["content"]) - overlap)
        else:
            chunk["start_char"] = cursor
            chunk["end_char"] = cursor + len(chunk["content"])
            cursor += len(chunk["content"])

    return chunks


def extract_chapters_and_chunks(
    full_text: str,
    default_module_title: str = "Class Module",
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[dict[str, Any]]:
    """
    Parses document text into chapters and splits each chapter into chunks.
    Detects patterns like 'Chapter 1: Title', 'Unit 2: ...', 'Lesson 3', etc.
    """
    full_text = full_text.strip()
    if not full_text:
        return []

    # Regex patterns for chapter headers
    chapter_pattern = re.compile(
        r"(?im)^(?:chapter|unit|lesson|section|chapter\s+-)\s*(\d+|[ivxlcdm]+)[:\s-]*(.*)$"
    )

    matches = list(chapter_pattern.finditer(full_text))

    raw_chapters: list[dict[str, Any]] = []

    if matches:
        for idx, match in enumerate(matches):
            ch_num_raw = match.group(1).strip()
            ch_num = int(ch_num_raw) if ch_num_raw.isdigit() else idx + 1
            ch_title_part = match.group(2).strip()
            ch_title = f"Chapter {ch_num}: {ch_title_part}" if ch_title_part else f"Chapter {ch_num}"

            start_pos = match.start()
            end_pos = matches[idx + 1].start() if idx + 1 < len(matches) else len(full_text)
            ch_text = full_text[start_pos:end_pos].strip()

            raw_chapters.append({
                "chapter_number": ch_num,
                "chapter_title": ch_title,
                "text": ch_text,
            })
    else:
        # Fallback: check for '# Chapter' markdown headings or split into equal logical chapters
        md_heading_pattern = re.compile(r"(?im)^#+\s+(.*?)$")
        md_matches = list(md_heading_pattern.finditer(full_text))

        if md_matches:
            for idx, match in enumerate(md_matches):
                ch_title = match.group(1).strip()
                start_pos = match.start()
                end_pos = md_matches[idx + 1].start() if idx + 1 < len(md_matches) else len(full_text)
                ch_text = full_text[start_pos:end_pos].strip()

                raw_chapters.append({
                    "chapter_number": idx + 1,
                    "chapter_title": ch_title if ch_title.startswith("Chapter") else f"Chapter {idx + 1}: {ch_title}",
                    "text": ch_text,
                })
        else:
            # Single or auto-numbered chapters if large text
            paras = [p.strip() for p in full_text.split("\n\n") if p.strip()]
            if len(full_text) > 4000 and len(paras) >= 4:
                # Divide into logical chapters
                chunks_per_ch = max(2, len(paras) // 3)
                for idx in range(0, len(paras), chunks_per_ch):
                    ch_num = (idx // chunks_per_ch) + 1
                    sub_paras = paras[idx : idx + chunks_per_ch]
                    first_line = sub_paras[0].split("\n")[0][:40]
                    raw_chapters.append({
                        "chapter_number": ch_num,
                        "chapter_title": f"Chapter {ch_num}: {first_line}...",
                        "text": "\n\n".join(sub_paras),
                    })
            else:
                raw_chapters.append({
                    "chapter_number": 1,
                    "chapter_title": f"Chapter 1: {default_module_title}",
                    "text": full_text,
                })

    all_chunks: list[dict[str, Any]] = []

    for ch in raw_chapters:
        ch_chunks = split_text_recursive(ch["text"], chunk_size=chunk_size, overlap=overlap)
        for idx, chunk in enumerate(ch_chunks):
            chunk_data = {
                "chapter_number": ch["chapter_number"],
                "chapter_title": ch["chapter_title"],
                "chunk_index": idx,
                "content": chunk["content"],
                "token_count": chunk["token_count"],
                "char_count": chunk["char_count"],
                "start_char": chunk.get("start_char", 0),
                "end_char": chunk.get("end_char", len(chunk["content"])),
                "embedding": generate_text_embedding(chunk["content"]),
            }
            all_chunks.append(chunk_data)

    return all_chunks


def _stable_hash(s: str) -> int:
    import hashlib
    return int(hashlib.md5(s.encode("utf-8")).hexdigest(), 16)


def generate_text_embedding(text: str, dim: int = 128) -> list[float]:
    """
    Generate normalized float vector embedding for similarity calculation.
    Uses n-gram hash term frequencies normalized to unit length.
    """
    vec = [0.0] * dim
    words = re.findall(r"\w+", text.lower())
    if not words:
        return vec

    for word in words:
        idx = _stable_hash(word) % dim
        vec[idx] += 1.0

    # Also hash character 3-grams for subword matching
    clean_text = text.lower()
    for i in range(len(clean_text) - 2):
        ngram = clean_text[i : i + 3]
        idx = _stable_hash(ngram) % dim
        vec[idx] += 0.5

    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [round(x / norm, 4) for x in vec]

    return vec


def calculate_cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)
