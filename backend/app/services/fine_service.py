from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.fine import Fine
from app.models.fine_vault import FineVault


async def get_or_create_monthly_vault(
    db: AsyncSession, group_id: str, month_date: date
) -> FineVault:
    # First day of month
    first_day = date(month_date.year, month_date.month, 1)
    
    result = await db.execute(
        select(FineVault).where(
            FineVault.group_id == group_id,
            FineVault.month == first_day
        )
    )
    vault = result.scalar_one_or_none()
    
    if not vault:
        vault = FineVault(
            group_id=group_id,
            month=first_day,
            total_amount=0.00,
            status="open"
        )
        db.add(vault)
        await db.flush()
    
    return vault


async def create_fine_and_add_to_vault(
    db: AsyncSession, user_id: str, group_id: str, fine_date: date, amount: float
) -> Fine:
    fine = Fine(
        user_id=user_id,
        group_id=group_id,
        fine_date=fine_date,
        amount=amount,
        status="pending"
    )
    db.add(fine)
    
    vault = await get_or_create_monthly_vault(db, group_id, fine_date)
    vault.total_amount = float(vault.total_amount) + float(amount)
    
    return fine
