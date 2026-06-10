from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    parts = relationship("Part", back_populates="category")


class Part(Base):
    __tablename__ = "parts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    current_price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String, default="piece")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="parts")
    price_history = relationship("PriceHistory", back_populates="part", order_by="PriceHistory.changed_at.desc()")


class PriceHistory(Base):
    __tablename__ = "price_history"
    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey("parts.id"))
    old_price = Column(Float)
    new_price = Column(Float)
    reason = Column(String, nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)

    part = relationship("Part", back_populates="price_history")


class SavedQuote(Base):
    __tablename__ = "saved_quotes"
    id = Column(Integer, primary_key=True, index=True)
    quote_name = Column(String, nullable=False)
    customer_name = Column(String, nullable=True)
    cycle_model = Column(String, nullable=True)
    total_price = Column(Float, nullable=False)
    margin_percent = Column(Float, default=0.0)
    final_price = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("QuoteItem", back_populates="quote")


class QuoteItem(Base):
    __tablename__ = "quote_items"
    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("saved_quotes.id"))
    part_id = Column(Integer, ForeignKey("parts.id"))
    part_name = Column(String)
    part_sku = Column(String)
    category_name = Column(String)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float)
    total_price = Column(Float)

    quote = relationship("SavedQuote", back_populates="items")
    part = relationship("Part")
