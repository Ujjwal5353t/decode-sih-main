"""
Files & Media proxy route for inline PDF viewing and downloading.
"""
import os
from fastapi import APIRouter, HTTPException, Query, Response, status
import httpx

router = APIRouter(prefix="/files", tags=["Files & Media"])


@router.get("/view-pdf", summary="View or stream a PDF document inline in browser")
async def view_pdf(url: str = Query(..., description="PDF URL or local path")):
    clean_url = url.strip()

    # 0. Handle NCERT pre-loaded module URLs (/ncert/...)
    if "/ncert/" in clean_url or clean_url.startswith("ncert/"):
        import re
        from src.services.ncert_pdf_service import generate_ncert_pdf_bytes

        class_num = 3
        num_match = re.search(r"class[-_ ]?(\d+)", clean_url, re.IGNORECASE)
        if num_match:
            class_num = int(num_match.group(1))

        subject = "Mathematics"
        if "evs" in clean_url.lower() or "environment" in clean_url.lower() or "looking" in clean_url.lower():
            subject = "EVS"
        elif "english" in clean_url.lower() or "marigold" in clean_url.lower():
            subject = "English"
        elif "hindi" in clean_url.lower() or "rimjhim" in clean_url.lower():
            subject = "Hindi"
        elif "math" in clean_url.lower():
            subject = "Mathematics"

        pdf_bytes = generate_ncert_pdf_bytes(subject, class_num)
        filename = f"NCERT_Class_{class_num}_{subject}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Cache-Control": "public, max-age=86400",
            },
        )

    # 1. Handle local uploads (/uploads/...)
    if "/uploads/" in clean_url:
        sub_path = clean_url.split("/uploads/", 1)[1]
        abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", sub_path))
        if os.path.exists(abs_path):
            with open(abs_path, "rb") as f:
                pdf_bytes = f.read()
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": "inline; filename=\"document.pdf\"",
                    "Cache-Control": "public, max-age=86400",
                },
            )

    # 2. Remote HTTP/HTTPS fetch
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File not found locally and invalid remote URL scheme.",
        )

    # Strip extra .pdf if present
    fetch_url = clean_url
    if fetch_url.endswith(".pdf.pdf"):
        fetch_url = fetch_url[:-4]

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(fetch_url, follow_redirects=True)
            if resp.status_code != 200 and fetch_url.endswith(".pdf"):
                fetch_url = fetch_url[:-4]
                resp = await client.get(fetch_url, follow_redirects=True)

            if resp.status_code != 200:
                raise HTTPException(
                    status_code=resp.status_code,
                    detail="Could not retrieve PDF file from storage provider.",
                )

            pdf_bytes = resp.content
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": "inline; filename=\"document.pdf\"",
                    "Cache-Control": "public, max-age=86400",
                },
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to stream PDF document: {str(e)}",
            )
