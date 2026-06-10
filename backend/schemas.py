from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class Category(CategoryCreate):
    id: int
    class Config:
        from_attributes = True


class PriceHistoryBase(BaseModel):
    old_price: float
    new_price: float
    reason: Optional[str] = None
    changed_at: datetime

class PriceHistory(PriceHistoryBase):
    id: int
    part_id: int
    class Config:
        from_attributes = True


class PartCreate(BaseModel):
    name: str
    sku: str
    category_id: int
    current_price: float = Field(gt=0)
    description: Optional[str] = None
    unit: str = "piece"

class PartUpdate(BaseModel):
    name: Optional[str] = None
    current_price: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class Part(BaseModel):
    id: int
    name: str
    sku: str
    category_id: int
    category: Optional[Category] = None
    current_price: float
    description: Optional[str] = None
    unit: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    price_history: List[PriceHistory] = []
    class Config:
        from_attributes = True


class PriceUpdate(BaseModel):
    new_price: float = Field(gt=0)
    reason: Optional[str] = None


class QuoteItemRequest(BaseModel):
    part_id: int
    quantity: int = Field(default=1, ge=1)

class QuoteRequest(BaseModel):
    items: List[QuoteItemRequest]
    margin_percent: float = Field(default=0.0, ge=0, le=100)

class QuoteLineItem(BaseModel):
    part_id: int
    part_name: str
    sku: str
    category_name: str
    quantity: int
    unit_price: float
    total_price: float

class QuoteResponse(BaseModel):
    items: List[QuoteLineItem]
    subtotal: float
    margin_amount: float
    margin_percent: float
    total: float
    generated_at: datetime


class SavedQuoteCreate(BaseModel):
    quote_name: str
    customer_name: Optional[str] = None
    cycle_model: Optional[str] = None
    items: List[QuoteItemRequest]
    margin_percent: float = 0.0
    notes: Optional[str] = None

class QuoteItemOut(BaseModel):
    id: int
    part_id: int
    part_name: str
    part_sku: str
    category_name: str
    quantity: int
    unit_price: float
    total_price: float
    class Config:
        from_attributes = True

class SavedQuote(BaseModel):
    id: int
    quote_name: str
    customer_name: Optional[str]
    cycle_model: Optional[str]
    total_price: float
    margin_percent: float
    final_price: float
    notes: Optional[str]
    created_at: datetime
    items: List[QuoteItemOut] = []
    class Config:
        from_attributes = True
