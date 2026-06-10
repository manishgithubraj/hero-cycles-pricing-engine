from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uvicorn

from database import SessionLocal, engine
import models, schemas, crud

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hero Cycles Pricing Engine",
    description="API for managing cycle parts, pricing, and generating quotes",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ──────────────── CATEGORY ROUTES ────────────────

@app.get("/categories", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    return crud.get_categories(db)

@app.post("/categories", response_model=schemas.Category)
def create_category(cat: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db, cat)


# ──────────────── PART ROUTES ────────────────

@app.get("/parts", response_model=List[schemas.Part])
def get_parts(category_id: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.get_parts(db, category_id)

@app.get("/parts/{part_id}", response_model=schemas.Part)
def get_part(part_id: int, db: Session = Depends(get_db)):
    part = crud.get_part(db, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    return part

@app.post("/parts", response_model=schemas.Part)
def create_part(part: schemas.PartCreate, db: Session = Depends(get_db)):
    return crud.create_part(db, part)

@app.put("/parts/{part_id}", response_model=schemas.Part)
def update_part(part_id: int, part: schemas.PartUpdate, db: Session = Depends(get_db)):
    updated = crud.update_part(db, part_id, part)
    if not updated:
        raise HTTPException(status_code=404, detail="Part not found")
    return updated

@app.delete("/parts/{part_id}")
def delete_part(part_id: int, db: Session = Depends(get_db)):
    success = crud.delete_part(db, part_id)
    if not success:
        raise HTTPException(status_code=404, detail="Part not found")
    return {"message": "Part deleted successfully"}


# ──────────────── PRICE HISTORY ROUTES ────────────────

@app.get("/parts/{part_id}/price-history", response_model=List[schemas.PriceHistory])
def get_price_history(part_id: int, db: Session = Depends(get_db)):
    return crud.get_price_history(db, part_id)

@app.post("/parts/{part_id}/update-price", response_model=schemas.Part)
def update_price(part_id: int, price_update: schemas.PriceUpdate, db: Session = Depends(get_db)):
    updated = crud.update_part_price(db, part_id, price_update.new_price, price_update.reason)
    if not updated:
        raise HTTPException(status_code=404, detail="Part not found")
    return updated


# ──────────────── QUOTE ROUTES ────────────────

@app.post("/quotes/calculate", response_model=schemas.QuoteResponse)
def calculate_quote(request: schemas.QuoteRequest, db: Session = Depends(get_db)):
    return crud.calculate_quote(db, request)

@app.post("/quotes/save", response_model=schemas.SavedQuote)
def save_quote(quote: schemas.SavedQuoteCreate, db: Session = Depends(get_db)):
    return crud.save_quote(db, quote)

@app.get("/quotes", response_model=List[schemas.SavedQuote])
def get_quotes(db: Session = Depends(get_db)):
    return crud.get_saved_quotes(db)

@app.get("/quotes/{quote_id}", response_model=schemas.SavedQuote)
def get_quote(quote_id: int, db: Session = Depends(get_db)):
    quote = crud.get_saved_quote(db, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote

@app.delete("/quotes/{quote_id}")
def delete_quote(quote_id: int, db: Session = Depends(get_db)):
    success = crud.delete_quote(db, quote_id)
    if not success:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"message": "Quote deleted"}


# ──────────────── DASHBOARD ROUTES ────────────────

@app.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


# ──────────────── SEED DATA ────────────────

@app.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    crud.seed_data(db)
    return {"message": "Database seeded successfully"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
