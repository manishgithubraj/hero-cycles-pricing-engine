# Hero Cycles Pricing Engine — Full Documentation

**Role:** Full-Stack Engineer (Fresher) Assignment  
**Stack:** Python FastAPI + SQLite + React  
**Author:** [Your Name]

---

## Part 1 — Problem Breakdown

### Questions I Asked While Solving This

1. **Who are the primary users?**  
   Sales team members — likely non-technical. So the UI must be simple and intuitive.

2. **How many parts does a typical cycle configuration have?**  
   Assumed: 6–10 parts per cycle (frame, gears, tyres, brakes, handlebar, saddle, wheels + optional accessories).

3. **Can the same part appear in multiple configurations?**  
   Yes. A tyre model might be used in both a mountain bike and a city bike configuration.

4. **What happens to old quotes when a part price changes?**  
   Old saved quotes must retain the price at the time of creation — not update automatically. This is critical for sales accuracy.

5. **Does a cycle need exactly one of each part, or can quantities vary?**  
   Assumed quantities can vary (e.g. 2 tyres, multiple lights). Quantity selector implemented.

6. **How often do prices change?**  
   The brief says "every few months" — but the system should support changes at any time.

7. **Should we support discounts or only markup (margin)?**  
   Implemented margin percentage (markup). Discounts are a logical extension.

8. **Is there a need for user authentication / roles?**  
   Not specified. Assumed single-team use for now. Admin vs salesperson roles can be added later.

9. **Do we need to handle GST or other taxes?**  
   Not specified. Assumed prices are inclusive of all taxes for now.

10. **Should parts be versioned or just the current price stored?**  
    Both — current price stored on the Part, full price change history in a separate `price_history` table.

11. **What is the output format of a quote — PDF, email, screen?**  
    Implemented print-friendly quote export (browser print). PDF export is a future enhancement.

12. **Can a part be deleted if it's already in a saved quote?**  
    Soft delete (deactivate) implemented. Historical quote data is preserved.

---

### Assumptions Made

1. Prices are in Indian Rupees (₹).
2. One cycle = one configuration of parts (no bundles or sub-assemblies).
3. Margin % is applied as a simple percentage on top of parts subtotal.
4. Each part belongs to exactly one category.
5. SKU (Stock Keeping Unit) is unique per part — used as the business identifier.
6. No user authentication required for this version.
7. Tax is not calculated separately (prices are assumed tax-inclusive).
8. The database is SQLite for simplicity; can be swapped to PostgreSQL in production.
9. A "deleted" part is soft-deleted (deactivated) so historical quotes remain valid.
10. Quote prices are locked at time of saving — price updates don't affect past quotes.

---

## Part 2 — Conceptual Solution & Pseudocode

### System Architecture

```
┌─────────────────┐       HTTP/REST        ┌──────────────────────┐
│  React Frontend │ ◄────────────────────► │  FastAPI Backend      │
│  (Port 3000)    │                        │  (Port 8000)          │
└─────────────────┘                        └──────────┬───────────┘
                                                       │
                                               SQLAlchemy ORM
                                                       │
                                           ┌───────────▼──────────┐
                                           │    SQLite Database    │
                                           │   hero_cycles.db      │
                                           └──────────────────────┘
```

### Database Schema

```
categories
  id, name, description

parts
  id, name, sku (unique), category_id → categories
  current_price, description, unit
  is_active, created_at, updated_at

price_history
  id, part_id → parts
  old_price, new_price, reason, changed_at

saved_quotes
  id, quote_name, customer_name, cycle_model
  total_price, margin_percent, final_price
  notes, created_at

quote_items
  id, quote_id → saved_quotes
  part_id → parts
  part_name, part_sku, category_name   ← SNAPSHOT at time of save
  quantity, unit_price, total_price    ← SNAPSHOT at time of save
```

### Pseudocode — Core Quote Calculation

```
FUNCTION calculate_quote(selected_parts, margin_percent):
  subtotal = 0
  line_items = []

  FOR each (part_id, quantity) in selected_parts:
    part = fetch_part_by_id(part_id)
    IF part not found: SKIP

    line_total = part.current_price × quantity
    subtotal   = subtotal + line_total

    line_items.append({
      part_name: part.name,
      sku: part.sku,
      category: part.category.name,
      quantity: quantity,
      unit_price: part.current_price,
      total_price: line_total
    })

  margin_amount = subtotal × (margin_percent / 100)
  final_total   = subtotal + margin_amount

  RETURN {
    items: line_items,
    subtotal: subtotal,
    margin_amount: margin_amount,
    margin_percent: margin_percent,
    total: final_total,
    generated_at: now()
  }
```

### Pseudocode — Save Quote (Price Snapshot)

```
FUNCTION save_quote(quote_name, customer, items, margin_percent):
  quote_result = calculate_quote(items, margin_percent)

  saved_quote = CREATE SavedQuote(
    quote_name, customer_name,
    total_price = quote_result.subtotal,
    margin_percent = margin_percent,
    final_price = quote_result.total
  )

  FOR each item in quote_result.items:
    CREATE QuoteItem(
      quote_id = saved_quote.id,
      part_name = item.part_name,    // snapshot — not a live foreign key
      unit_price = item.unit_price,  // locked at current price
      ...
    )

  RETURN saved_quote
```

### Pseudocode — Update Part Price

```
FUNCTION update_price(part_id, new_price, reason):
  part = fetch_part(part_id)
  old_price = part.current_price

  CREATE PriceHistory(
    part_id = part_id,
    old_price = old_price,
    new_price = new_price,
    reason = reason,
    changed_at = now()
  )

  UPDATE part.current_price = new_price
  RETURN updated_part
```

---

## Part 3 — Design Decisions & Features

### Features Built

| Feature | Description |
|---------|-------------|
| Parts Catalog | 27 pre-seeded parts across 8 categories |
| Category Filtering | Filter parts by category (chips + dropdown) |
| Search | Live search by part name or SKU |
| Quantity Control | Add multiple units of the same part |
| Live Quote Preview | Running total updates as you select parts |
| Margin Calculator | Add % markup on top of parts cost |
| Quote Calculation | Final itemized breakdown via API |
| Save Quote | Store quotes with customer + model info |
| Quote History | View, search, and manage all past quotes |
| Print Export | Browser-native print-friendly quote PDF |
| Parts Manager | Full CRUD — add, edit, deactivate parts |
| Price Updates | Update prices with reason tracking |
| Price History | Full audit trail of every price change |
| Dashboard | Stats + charts for parts and quotes |

### Tech Stack Rationale

| Choice | Why |
|--------|-----|
| FastAPI | Async, auto-generates Swagger docs, very fast |
| SQLite | Zero setup, perfect for local dev, swap to Postgres in prod |
| SQLAlchemy | ORM that makes DB queries safe and readable |
| React | Component-based, reactive — perfect for live quote updates |
| Recharts | Simple charting library, works great with React |

---

## Prompt Used to Generate Code

> *"I am building a Cycle Pricing Engine for Hero Cycles (Indian bicycle manufacturer) as a fresher full-stack assignment. Stack: Python FastAPI backend + React frontend. I need:*
> *1. FastAPI with SQLite — models for Category, Part, PriceHistory, SavedQuote, QuoteItem*
> *2. CRUD endpoints for parts + price update with history tracking*
> *3. Quote calculation endpoint that takes a list of (part_id, quantity) and returns itemized breakdown with margin support*
> *4. React frontend with: Dashboard (stats + charts), Pricing Engine (part selector + live quote), Parts Manager (add/edit/update price/view history), Quote History (view + print)*
> *5. Price snapshot — saved quotes must lock prices at time of creation*
> *Make it production-quality with proper error handling, clean CSS, and Indian Rupee formatting."*

---

## How to Run the Project

### Backend Setup

```bash
cd hero-cycles/backend
pip install -r requirements.txt
python main.py
# API runs at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Frontend Setup

```bash
cd hero-cycles/frontend
npm install
npm start
# App runs at http://localhost:3000
```

### First Time

The database is auto-seeded with 27 parts across 8 categories on first run.

---

## Future Enhancements

1. **User Authentication** — Sales rep login with JWT tokens
2. **PDF Export** — Generate proper PDF quotes using ReportLab
3. **GST Calculator** — Apply 12%/18% GST on final price
4. **Bundle Configs** — Pre-built cycle configs (e.g., "Basic City Bike") the salesperson can load
5. **Email Quotes** — Send quote directly to customer email
6. **Supplier Management** — Track which supplier each part comes from
7. **Bulk Price Update** — Upload CSV to update multiple prices at once
8. **Mobile App** — React Native version for field sales reps
9. **Role-Based Access** — Admin (can edit prices) vs Salesperson (can only quote)
10. **Analytics** — Which configurations are most quoted, revenue forecasting
