from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.schemas.contact import ContactCreate, ContactResponse
from src.services.contact_service import create_contact_inquiry

router = APIRouter(prefix="/contact", tags=["Contact"])


@router.post(
    "",
    response_model=ContactResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit contact form inquiry",
    description="Validates and persists a contact form submission from the landing page.",
)
async def submit_contact_form(
    data: ContactCreate,
    session: AsyncSession = Depends(get_session),
) -> ContactResponse:
    """
    Handle landing page contact form submission.
    """
    # Additional server-side checks for empty or whitespace-only values
    if not data.name or not data.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name field cannot be empty.",
        )
    if not data.email or not str(data.email).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address cannot be empty.",
        )
    if not data.message or not data.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message field cannot be empty.",
        )

    inquiry = await create_contact_inquiry(data, session)

    return ContactResponse(
        id=inquiry.id,
        name=inquiry.name,
        email=inquiry.email,
        message=inquiry.message,
        created_at=inquiry.created_at,
        status_message="Thank you! Your inquiry has been submitted successfully.",
    )
