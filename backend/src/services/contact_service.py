from sqlalchemy.ext.asyncio import AsyncSession

from src.models.contact import ContactInquiry
from src.schemas.contact import ContactCreate


async def create_contact_inquiry(
    data: ContactCreate, session: AsyncSession
) -> ContactInquiry:
    """
    Creates and stores a new contact inquiry in the database.
    """
    inquiry = ContactInquiry(
        name=data.name,
        email=str(data.email),
        message=data.message,
    )
    session.add(inquiry)
    await session.flush()
    await session.refresh(inquiry)
    return inquiry
