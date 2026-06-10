from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import models, schemas


# ──────────────── CATEGORIES ────────────────

def get_categories(db: Session):
    return db.query(models.Category).all()

def create_category(db: Session, cat: schemas.CategoryCreate):
    db_cat = models.Category(**cat.dict())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat


# ──────────────── PARTS ────────────────

def get_parts(db: Session, category_id: Optional[int] = None):
    q = db.query(models.Part).filter(models.Part.is_active == True)
    if category_id:
        q = q.filter(models.Part.category_id == category_id)
    return q.all()

def get_part(db: Session, part_id: int):
    return db.query(models.Part).filter(models.Part.id == part_id).first()

def create_part(db: Session, part: schemas.PartCreate):
    db_part = models.Part(**part.dict())
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part

def update_part(db: Session, part_id: int, part: schemas.PartUpdate):
    db_part = get_part(db, part_id)
    if not db_part:
        return None
    for key, val in part.dict(exclude_unset=True).items():
        setattr(db_part, key, val)
    db_part.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_part)
    return db_part

def delete_part(db: Session, part_id: int):
    db_part = get_part(db, part_id)
    if not db_part:
        return False
    db_part.is_active = False
    db.commit()
    return True


# ──────────────── PRICE HISTORY ────────────────

def get_price_history(db: Session, part_id: int):
    return db.query(models.PriceHistory).filter(
        models.PriceHistory.part_id == part_id
    ).order_by(models.PriceHistory.changed_at.desc()).all()

def update_part_price(db: Session, part_id: int, new_price: float, reason: Optional[str] = None):
    db_part = get_part(db, part_id)
    if not db_part:
        return None
    history = models.PriceHistory(
        part_id=part_id,
        old_price=db_part.current_price,
        new_price=new_price,
        reason=reason
    )
    db.add(history)
    db_part.current_price = new_price
    db_part.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_part)
    return db_part


# ──────────────── QUOTES ────────────────

def calculate_quote(db: Session, request: schemas.QuoteRequest):
    line_items = []
    subtotal = 0.0

    for item in request.items:
        part = get_part(db, item.part_id)
        if not part:
            continue
        line_total = part.current_price * item.quantity
        subtotal += line_total
        line_items.append(schemas.QuoteLineItem(
            part_id=part.id,
            part_name=part.name,
            sku=part.sku,
            category_name=part.category.name if part.category else "Uncategorized",
            quantity=item.quantity,
            unit_price=part.current_price,
            total_price=line_total
        ))

    margin_amount = subtotal * (request.margin_percent / 100)
    total = subtotal + margin_amount

    return schemas.QuoteResponse(
        items=line_items,
        subtotal=round(subtotal, 2),
        margin_amount=round(margin_amount, 2),
        margin_percent=request.margin_percent,
        total=round(total, 2),
        generated_at=datetime.utcnow()
    )

def save_quote(db: Session, quote_req: schemas.SavedQuoteCreate):
    calc = calculate_quote(db, schemas.QuoteRequest(
        items=quote_req.items, margin_percent=quote_req.margin_percent
    ))
    db_quote = models.SavedQuote(
        quote_name=quote_req.quote_name,
        customer_name=quote_req.customer_name,
        cycle_model=quote_req.cycle_model,
        total_price=calc.subtotal,
        margin_percent=quote_req.margin_percent,
        final_price=calc.total,
        notes=quote_req.notes
    )
    db.add(db_quote)
    db.flush()

    for item in calc.items:
        db_item = models.QuoteItem(
            quote_id=db_quote.id,
            part_id=item.part_id,
            part_name=item.part_name,
            part_sku=item.sku,
            category_name=item.category_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_quote)
    return db_quote

def get_saved_quotes(db: Session):
    return db.query(models.SavedQuote).order_by(models.SavedQuote.created_at.desc()).all()

def get_saved_quote(db: Session, quote_id: int):
    return db.query(models.SavedQuote).filter(models.SavedQuote.id == quote_id).first()

def delete_quote(db: Session, quote_id: int):
    q = get_saved_quote(db, quote_id)
    if not q:
        return False
    db.delete(q)
    db.commit()
    return True


# ──────────────── DASHBOARD ────────────────

def get_dashboard_stats(db: Session):
    total_parts = db.query(models.Part).filter(models.Part.is_active == True).count()
    total_categories = db.query(models.Category).count()
    total_quotes = db.query(models.SavedQuote).count()
    recent_quotes = db.query(models.SavedQuote).order_by(
        models.SavedQuote.created_at.desc()
    ).limit(5).all()
    avg_quote_value = db.query(models.SavedQuote).all()
    avg_val = sum(q.final_price for q in avg_quote_value) / len(avg_quote_value) if avg_quote_value else 0

    return {
        "total_parts": total_parts,
        "total_categories": total_categories,
        "total_quotes": total_quotes,
        "avg_quote_value": round(avg_val, 2),
        "recent_quotes": [
            {
                "id": q.id,
                "quote_name": q.quote_name,
                "customer_name": q.customer_name,
                "final_price": q.final_price,
                "created_at": q.created_at.isoformat()
            } for q in recent_quotes
        ]
    }


# ──────────────── SEED DATA ────────────────

def seed_data(db: Session):
    if db.query(models.Category).count() > 0:
        return

    categories = [
        {"name": "Frame", "description": "Bicycle frames — the backbone of the cycle"},
        {"name": "Gear Set", "description": "Gear mechanisms and derailleurs"},
        {"name": "Tyres", "description": "Front and rear tyres"},
        {"name": "Brakes", "description": "Brake systems and pads"},
        {"name": "Handlebar", "description": "Handlebar and stem"},
        {"name": "Saddle", "description": "Seat and seat post"},
        {"name": "Wheels", "description": "Rims, spokes, and hubs"},
        {"name": "Accessories", "description": "Lights, bells, mudguards, etc."},
    ]

    cat_objs = {}
    for c in categories:
        obj = models.Category(**c)
        db.add(obj)
        db.flush()
        cat_objs[c["name"]] = obj.id

    parts = [
        # Frames
        ("Steel Frame - 26\"", "FRM-ST-26", "Frame", 1800, "Standard steel frame, 26 inch"),
        ("Aluminium Frame - 26\"", "FRM-AL-26", "Frame", 3200, "Lightweight aluminium frame"),
        ("Steel Frame - 28\"", "FRM-ST-28", "Frame", 2100, "Standard steel frame, 28 inch"),
        ("Aluminium Frame - 28\"", "FRM-AL-28", "Frame", 3800, "Premium aluminium frame, 28 inch"),
        # Gear Sets
        ("Single Speed Gear", "GR-SS-01", "Gear Set", 350, "Basic single speed drivetrain"),
        ("Shimano 7-Speed", "GR-SH-7S", "Gear Set", 1200, "Shimano 7-speed gear set"),
        ("Shimano 21-Speed", "GR-SH-21", "Gear Set", 2500, "Shimano 21-speed mountain gear"),
        # Tyres
        ("Standard Tyre 26x1.75\"", "TYR-ST-26", "Tyres", 220, "Basic road tyre pair"),
        ("Kenda Tyre 26x2.1\"", "TYR-KD-26", "Tyres", 380, "Kenda MTB tyre pair"),
        ("MRF Tyre 28x1.5\"", "TYR-MRF-28", "Tyres", 290, "MRF road tyre pair"),
        # Brakes
        ("V-Brake Set", "BRK-VB-01", "Brakes", 280, "Standard V-brake front and rear"),
        ("Disc Brake Set", "BRK-DS-01", "Brakes", 950, "Hydraulic disc brake set"),
        ("Caliper Brake Set", "BRK-CL-01", "Brakes", 320, "Road bike caliper brake set"),
        # Handlebars
        ("Flat Handlebar", "HB-FL-01", "Handlebar", 180, "Standard flat handlebar with stem"),
        ("Drop Handlebar", "HB-DR-01", "Handlebar", 420, "Road bike drop handlebar"),
        ("Riser Handlebar", "HB-RS-01", "Handlebar", 250, "MTB riser handlebar"),
        # Saddles
        ("Basic Saddle", "SDL-BS-01", "Saddle", 150, "Standard comfort saddle"),
        ("Gel Comfort Saddle", "SDL-GC-01", "Saddle", 380, "Gel padded comfort saddle"),
        ("Racing Saddle", "SDL-RC-01", "Saddle", 550, "Lightweight racing saddle"),
        # Wheels
        ("Steel Rim Set 26\"", "WHL-ST-26", "Wheels", 650, "Double-wall steel rim set"),
        ("Alloy Rim Set 26\"", "WHL-AL-26", "Wheels", 1100, "Lightweight alloy rim set"),
        ("Steel Rim Set 28\"", "WHL-ST-28", "Wheels", 720, "Double-wall steel rim 28 inch"),
        # Accessories
        ("Front LED Light", "ACC-LED-F", "Accessories", 120, "USB rechargeable front light"),
        ("Rear LED Light", "ACC-LED-R", "Accessories", 90, "USB rechargeable rear light"),
        ("Bell", "ACC-BL-01", "Accessories", 35, "Standard bicycle bell"),
        ("Mudguard Set", "ACC-MG-01", "Accessories", 180, "Full mudguard set front and rear"),
        ("Kickstand", "ACC-KS-01", "Accessories", 75, "Adjustable centre kickstand"),
    ]

    for name, sku, cat_name, price, desc in parts:
        part = models.Part(
            name=name, sku=sku,
            category_id=cat_objs[cat_name],
            current_price=price,
            description=desc
        )
        db.add(part)

    db.commit()
