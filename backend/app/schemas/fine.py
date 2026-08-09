from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserRead


class FineRead(BaseModel):
    id: str
    user_id: str
    group_id: str
    fine_date: date
    amount: float
    status: str
    paid_at: Optional[datetime] = None
    user: Optional[UserRead] = None

    model_config = ConfigDict(from_attributes=True)


class FineVaultRead(BaseModel):
    id: str
    group_id: str
    month: date
    total_amount: float
    status: str
    settlement_note: Optional[str] = None
    settled_at: Optional[datetime] = None
    fines: Optional[List[FineRead]] = None

    model_config = ConfigDict(from_attributes=True)


class VaultSettleRequest(BaseModel):
    settlement_note: str
