"""Ksheer Dhara - Dairy Farm Inventory Management SaaS.

Backend: FastAPI + MongoDB (Motor async).
Auth: Mock OTP over mobile number. Token = uuid stored on Farm doc.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import random
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.getenv("MONGO_URL", "")
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
db = client[os.getenv("DB_NAME", "ksheer_dhara")]

app = FastAPI(title="Ksheer Dhara API")
api = APIRouter(prefix="/api")


# ---------- helpers ----------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).isoformat() if dt.tzinfo is None else dt.isoformat()


def today_key() -> str:
    return now_utc().strftime("%Y-%m-%d")


def month_key(dt: Optional[datetime] = None) -> str:
    return (dt or now_utc()).strftime("%Y-%m")


DEFAULT_PRODUCTS = [
    {"name": "Ghee", "unit": "kg", "icon": "food-variant", "price": 900},
    {"name": "Butter", "unit": "kg", "icon": "cheese", "price": 550},
    {"name": "Paneer", "unit": "kg", "icon": "food-drumstick", "price": 400},
    {"name": "Curd", "unit": "kg", "icon": "cup", "price": 80},
    {"name": "Cheese", "unit": "kg", "icon": "cheese-off", "price": 700},
    {"name": "Khoya", "unit": "kg", "icon": "food", "price": 500},
]


# ---------- models ----------
class SendOtpIn(BaseModel):
    mobile: str


class VerifyOtpIn(BaseModel):
    mobile: str
    code: str
    farm_name: Optional[str] = None
    owner_name: Optional[str] = None


class MilkLogIn(BaseModel):
    date: Optional[str] = None  # YYYY-MM-DD; default today
    produced_ltr: float
    delivered_ltr: float
    used_for_products_ltr: float = 0
    price_per_ltr: float = 60
    notes: Optional[str] = ""

class ProductIn(BaseModel):
    name: str
    unit: str = "kg"
    icon: str = "food"
    price_per_unit: float = 0
    stock: float = 0

class ProductStockIn(BaseModel):
    delta: float  # +add, -remove (production/consumption)
    note: Optional[str] = ""

class ProductSaleIn(BaseModel):
    qty: float
    price_per_unit: Optional[float] = None
    contact_id: Optional[str] = None

class ContactIn(BaseModel):
    name: str
    mobile: str  # e.g. +91XXXXXXXXXX
    daily_requirement_ltr: float = 0
    rate_per_ltr: float = 60

class MilkSkipIn(BaseModel):
    date: str  # YYYY-MM-DD
    qty_skipped: float

class CowIn(BaseModel):
    tag: str
    breed: Optional[str] = ""
    status: str = "Healthy"

class CowEventIn(BaseModel):
    type: str
    date: str
    notes: str

class FarmSettingsIn(BaseModel):
    upi_id: Optional[str] = None
    farm_name: Optional[str] = None

class BroadcastIn(BaseModel):
    message: str
    contact_ids: List[str]


# ---------- auth ----------
async def get_farm(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing auth token")
    token = authorization.split(" ", 1)[1].strip()
    farm = await db.farms.find_one({"token": token}, {"_id": 0})
    if not farm:
        raise HTTPException(401, "Invalid or expired token")
    return farm


# ---------- routes: auth ----------
@api.get("/")
async def root():
    return {"app": "Ksheer Dhara", "status": "ok"}


@api.post("/auth/send-otp")
async def send_otp(body: SendOtpIn):
    mobile = body.mobile.strip()
    if len(mobile) < 8:
        raise HTTPException(400, "Invalid mobile number")
    code = f"{random.randint(100000, 999999)}"
    await db.otps.update_one(
        {"mobile": mobile},
        {"$set": {
            "mobile": mobile,
            "code": code,
            "expires_at": now_utc() + timedelta(minutes=10),
            "created_at": now_utc(),
        }},
        upsert=True,
    )
    # Mock OTP -> return in response so frontend can display it (prototype)
    return {"sent": True, "mobile": mobile, "otp": code, "dev_note": "Mock OTP for prototype"}


@api.post("/auth/verify-otp")
async def verify_otp(body: VerifyOtpIn):
    mobile = body.mobile.strip()
    rec = await db.otps.find_one({"mobile": mobile}, {"_id": 0})
    if not rec:
        raise HTTPException(400, "OTP not requested")
    if rec["code"] != body.code.strip():
        raise HTTPException(400, "Invalid OTP")
    exp = rec["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now_utc():
        raise HTTPException(400, "OTP expired")

    farm = await db.farms.find_one({"mobile": mobile}, {"_id": 0})
    is_new = False
    if not farm:
        if not body.farm_name or not body.owner_name:
            # Signal frontend to collect farm registration
            return {"needs_registration": True, "mobile": mobile}
        farm_id = str(uuid.uuid4())
        token = str(uuid.uuid4())
        farm = {
            "id": farm_id,
            "mobile": mobile,
            "farm_name": body.farm_name.strip(),
            "owner_name": body.owner_name.strip(),
            "token": token,
            "created_at": iso(now_utc()),
        }
        await db.farms.insert_one(dict(farm))
        # Seed default products
        for p in DEFAULT_PRODUCTS:
            await db.products.insert_one({
                "id": str(uuid.uuid4()),
                "farm_id": farm_id,
                "name": p["name"],
                "unit": p["unit"],
                "icon": p["icon"],
                "price_per_unit": p["price"],
                "stock": 0.0,
                "created_at": iso(now_utc()),
            })
        is_new = True
    else:
        # rotate token on re-login
        token = str(uuid.uuid4())
        await db.farms.update_one({"id": farm["id"]}, {"$set": {"token": token}})
        farm["token"] = token

    await db.otps.delete_one({"mobile": mobile})
    farm.pop("_id", None)
    return {"needs_registration": False, "is_new": is_new, "token": token, "farm": farm}


@api.get("/farm/me")
async def me(farm=Depends(get_farm)):
    return {"farm": farm}


# ---------- routes: milk ----------
@api.post("/milk/log")
async def upsert_milk_log(body: MilkLogIn, farm=Depends(get_farm)):
    date = body.date or today_key()
    remaining = body.produced_ltr - body.delivered_ltr - body.used_for_products_ltr
    doc = {
        "id": str(uuid.uuid4()),
        "farm_id": farm["id"],
        "date": date,
        "month": date[:7],
        "produced_ltr": body.produced_ltr,
        "delivered_ltr": body.delivered_ltr,
        "used_for_products_ltr": body.used_for_products_ltr,
        "remaining_ltr": remaining,
        "price_per_ltr": body.price_per_ltr,
        "revenue": body.delivered_ltr * body.price_per_ltr,
        "notes": body.notes,
        "updated_at": iso(now_utc()),
    }
    existing = await db.milk_logs.find_one({"farm_id": farm["id"], "date": date}, {"_id": 0})
    if existing:
        doc["id"] = existing["id"]
        doc["created_at"] = existing.get("created_at", iso(now_utc()))
        await db.milk_logs.update_one({"id": doc["id"]}, {"$set": doc})
    else:
        doc["created_at"] = iso(now_utc())
        await db.milk_logs.insert_one(dict(doc))
    return {"log": doc}


async def get_expected_delivery(farm_id: str, date: str) -> dict:
    contacts = await db.contacts.find({"farm_id": farm_id}, {"_id": 0}).to_list(500)
    total_req = sum(float(c.get("daily_requirement_ltr", 0)) for c in contacts)
    skips = await db.milk_skips.find({"farm_id": farm_id, "date": date}, {"_id": 0}).to_list(500)
    total_skipped = sum(s.get("qty_skipped", 0) for s in skips)
    return {
        "total_req": total_req,
        "total_skipped": total_skipped,
        "expected_delivered": max(0.0, total_req - total_skipped)
    }

@api.get("/milk/today")
async def milk_today(farm=Depends(get_farm)):
    date = today_key()
    log = await db.milk_logs.find_one({"farm_id": farm["id"], "date": date}, {"_id": 0})
    expected = await get_expected_delivery(farm["id"], date)
    return {"log": log, "expected": expected}


@api.get("/milk/logs")
async def milk_logs(month: Optional[str] = None, farm=Depends(get_farm)):
    q = {"farm_id": farm["id"]}
    if month:
        q["month"] = month
    logs = await db.milk_logs.find(q, {"_id": 0}).sort("date", -1).to_list(400)
    return {"logs": logs}


# ---------- routes: products ----------
@api.get("/products")
async def list_products(farm=Depends(get_farm)):
    items = await db.products.find({"farm_id": farm["id"]}, {"_id": 0}).sort("name", 1).to_list(200)
    return {"products": items}


@api.post("/products")
async def create_product(body: ProductIn, farm=Depends(get_farm)):
    doc = {
        "id": str(uuid.uuid4()),
        "farm_id": farm["id"],
        "name": body.name.strip(),
        "unit": body.unit,
        "icon": body.icon,
        "price_per_unit": body.price_per_unit,
        "stock": body.stock,
        "created_at": iso(now_utc()),
    }
    await db.products.insert_one(dict(doc))
    return {"product": doc}


@api.patch("/products/{pid}/stock")
async def adjust_stock(pid: str, body: ProductStockIn, farm=Depends(get_farm)):
    prod = await db.products.find_one({"id": pid, "farm_id": farm["id"]}, {"_id": 0})
    if not prod:
        raise HTTPException(404, "Product not found")
    new_stock = max(0.0, float(prod["stock"]) + body.delta)
    await db.products.update_one({"id": pid}, {"$set": {"stock": new_stock}})
    await db.product_tx.insert_one({
        "id": str(uuid.uuid4()),
        "farm_id": farm["id"],
        "product_id": pid,
        "product_name": prod["name"],
        "type": "add" if body.delta >= 0 else "consume",
        "qty": abs(body.delta),
        "amount": 0.0,
        "date": today_key(),
        "month": month_key(),
        "note": body.note or "",
        "created_at": iso(now_utc()),
    })
    prod["stock"] = new_stock
    return {"product": prod}


@api.post("/products/{pid}/sale")
async def sell_product(pid: str, body: ProductSaleIn, farm=Depends(get_farm)):
    prod = await db.products.find_one({"id": pid, "farm_id": farm["id"]}, {"_id": 0})
    if not prod:
        raise HTTPException(404, "Product not found")
    if body.qty <= 0:
        raise HTTPException(400, "Quantity must be positive")
    if float(prod["stock"]) < body.qty:
        raise HTTPException(400, "Not enough stock")
    price = body.price_per_unit if body.price_per_unit is not None else float(prod["price_per_unit"])
    amount = price * body.qty
    new_stock = float(prod["stock"]) - body.qty
    await db.products.update_one({"id": pid}, {"$set": {"stock": new_stock}})
    tx = {
        "id": str(uuid.uuid4()),
        "farm_id": farm["id"],
        "product_id": pid,
        "product_name": prod["name"],
        "type": "sale",
        "qty": body.qty,
        "price_per_unit": price,
        "amount": amount,
        "contact_id": body.contact_id,
        "date": today_key(),
        "month": month_key(),
        "created_at": iso(now_utc()),
    }
    await db.product_tx.insert_one(dict(tx))
    return {"tx": tx, "new_stock": new_stock}


@api.delete("/products/{pid}")
async def delete_product(pid: str, farm=Depends(get_farm)):
    res = await db.products.delete_one({"id": pid, "farm_id": farm["id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Product not found")
    return {"deleted": True}


# ---------- routes: analytics ----------
@api.get("/analytics/monthly")
async def analytics(month: Optional[str] = None, farm=Depends(get_farm)):
    m = month or month_key()
    milk_logs = await db.milk_logs.find({"farm_id": farm["id"], "month": m}, {"_id": 0}).to_list(400)
    milk_revenue = sum(l.get("revenue", 0) for l in milk_logs)
    milk_produced = sum(l.get("produced_ltr", 0) for l in milk_logs)
    milk_delivered = sum(l.get("delivered_ltr", 0) for l in milk_logs)
    milk_used = sum(l.get("used_for_products_ltr", 0) for l in milk_logs)

    txs = await db.product_tx.find({"farm_id": farm["id"], "month": m, "type": "sale"}, {"_id": 0}).to_list(1000)
    product_revenue = sum(t.get("amount", 0) for t in txs)
    per_product: dict = {}
    for t in txs:
        k = t["product_name"]
        d = per_product.setdefault(k, {"name": k, "qty": 0.0, "revenue": 0.0})
        d["qty"] += t.get("qty", 0)
        d["revenue"] += t.get("amount", 0)

    # Simple cost model for net profit (prototype): 55% of revenue as gross margin
    milk_cost_rate = 0.55
    prod_cost_rate = 0.60
    milk_profit = milk_revenue * (1 - milk_cost_rate)
    product_profit = product_revenue * (1 - prod_cost_rate)

    # Daily series for chart
    daily = {}
    for l in milk_logs:
        daily.setdefault(l["date"], {"date": l["date"], "milk": 0, "products": 0})
        daily[l["date"]]["milk"] += l.get("revenue", 0)
    for t in txs:
        daily.setdefault(t["date"], {"date": t["date"], "milk": 0, "products": 0})
        daily[t["date"]]["products"] += t.get("amount", 0)
    series = sorted(daily.values(), key=lambda x: x["date"])

    return {
        "month": m,
        "milk": {
            "revenue": round(milk_revenue, 2),
            "profit": round(milk_profit, 2),
            "produced_ltr": round(milk_produced, 2),
            "delivered_ltr": round(milk_delivered, 2),
            "used_for_products_ltr": round(milk_used, 2),
        },
        "products": {
            "revenue": round(product_revenue, 2),
            "profit": round(product_profit, 2),
            "breakdown": list(per_product.values()),
        },
        "totals": {
            "revenue": round(milk_revenue + product_revenue, 2),
            "profit": round(milk_profit + product_profit, 2),
        },
        "series": series,
    }


# ---------- routes: contacts + broadcast ----------
@api.get("/contacts")
async def contacts(farm=Depends(get_farm)):
    items = await db.contacts.find({"farm_id": farm["id"]}, {"_id": 0}).sort("name", 1).to_list(500)
    return {"contacts": items}


@api.post("/contacts")
async def add_contact(body: ContactIn, farm=Depends(get_farm)):
    doc = {
        "id": str(uuid.uuid4()),
        "farm_id": farm["id"],
        "name": body.name.strip(),
        "mobile": body.mobile.strip(),
        "daily_requirement_ltr": body.daily_requirement_ltr,
        "rate_per_ltr": body.rate_per_ltr,
        "created_at": iso(now_utc()),
    }
    await db.contacts.insert_one(dict(doc))
    return {"contact": doc}


@api.delete("/contacts/{cid}")
async def del_contact(cid: str, farm=Depends(get_farm)):
    r = await db.contacts.delete_one({"id": cid, "farm_id": farm["id"]})
    if r.deleted_count == 0:
        raise HTTPException(404, "Contact not found")
    return {"deleted": True}


@api.post("/broadcast")
async def send_broadcast(body: BroadcastIn, farm=Depends(get_farm)):
    if not body.message.strip():
        raise HTTPException(400, "Message required")
    if not body.contact_ids:
        raise HTTPException(400, "Select at least one contact")

    recipients = await db.contacts.find(
        {"farm_id": farm["id"], "id": {"$in": body.contact_ids}}, {"_id": 0}
    ).to_list(500)

    # Twilio hook (activated when TWILIO_ACCOUNT_SID + AUTH_TOKEN + WHATSAPP_FROM are set)
    provider = "simulated"
    delivery = []
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_WHATSAPP_FROM")
    if twilio_sid and twilio_token and twilio_from:
        try:
            from twilio.rest import Client as TwClient  # type: ignore
            tw = TwClient(twilio_sid, twilio_token)
            provider = "twilio_whatsapp"
            for r in recipients:
                try:
                    msg = tw.messages.create(
                        from_=twilio_from,
                        body=body.message,
                        to=f"whatsapp:{r['mobile']}",
                    )
                    delivery.append({"contact_id": r["id"], "mobile": r["mobile"], "status": "queued", "sid": msg.sid})
                except Exception as e:
                    delivery.append({"contact_id": r["id"], "mobile": r["mobile"], "status": "failed", "error": str(e)})
        except Exception as e:
            provider = "simulated"
            delivery = [{"contact_id": r["id"], "mobile": r["mobile"], "status": "simulated"} for r in recipients]
    else:
        delivery = [{"contact_id": r["id"], "mobile": r["mobile"], "status": "simulated"} for r in recipients]

    doc = {
        "id": str(uuid.uuid4()),
        "farm_id": farm["id"],
        "message": body.message,
        "recipient_count": len(recipients),
        "provider": provider,
        "delivery": delivery,
        "created_at": iso(now_utc()),
    }
    await db.broadcasts.insert_one(dict(doc))
    return {"broadcast": doc}


@api.get("/broadcasts")
async def broadcasts(farm=Depends(get_farm)):
    items = await db.broadcasts.find({"farm_id": farm["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"broadcasts": items}


import calendar

@api.put("/farm/settings")
async def update_farm_settings(body: FarmSettingsIn, farm=Depends(get_farm)):
    updates = {}
    if body.upi_id is not None:
        updates["upi_id"] = body.upi_id.strip()
    if body.farm_name is not None:
        updates["farm_name"] = body.farm_name.strip()
    if updates:
        await db.farms.update_one({"id": farm["id"]}, {"$set": updates})
        farm.update(updates)
    return {"farm": farm}

@api.put("/contacts/{cid}")
async def update_contact(cid: str, body: ContactIn, farm=Depends(get_farm)):
    updates = {
        "name": body.name.strip(),
        "mobile": body.mobile.strip(),
        "daily_requirement_ltr": body.daily_requirement_ltr,
        "rate_per_ltr": body.rate_per_ltr,
    }
    res = await db.contacts.update_one({"id": cid, "farm_id": farm["id"]}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(404, "Contact not found")
    return {"contact": updates}

@api.post("/contacts/{cid}/skips")
async def add_skip(cid: str, body: MilkSkipIn, farm=Depends(get_farm)):
    doc = {
        "id": str(uuid.uuid4()),
        "farm_id": farm["id"],
        "contact_id": cid,
        "date": body.date,
        "month": body.date[:7],
        "qty_skipped": body.qty_skipped,
        "created_at": iso(now_utc()),
    }
    await db.milk_skips.insert_one(dict(doc))
    return {"skip": doc}

@api.get("/contacts/{cid}/skips")
async def get_skips(cid: str, month: str, farm=Depends(get_farm)):
    items = await db.milk_skips.find({"farm_id": farm["id"], "contact_id": cid, "month": month}, {"_id": 0}).to_list(100)
    return {"skips": items}

@api.get("/contacts/{cid}/bill")
async def generate_bill(cid: str, month: str, farm=Depends(get_farm)):
    contact = await db.contacts.find_one({"farm_id": farm["id"], "id": cid}, {"_id": 0})
    if not contact:
        raise HTTPException(404, "Customer not found")
        
    y, m = map(int, month.split('-'))
    today = now_utc()
    if today.year == y and today.month == m:
        days = today.day
    else:
        days = calendar.monthrange(y, m)[1]
        
    daily_req = float(contact.get("daily_requirement_ltr", 0))
    rate = float(contact.get("rate_per_ltr", 60))
    
    expected_ltr = days * daily_req
    
    skips = await db.milk_skips.find({"farm_id": farm["id"], "contact_id": cid, "month": month}, {"_id": 0}).to_list(100)
    total_skipped = sum(s["qty_skipped"] for s in skips)
    
    delivered_ltr = max(0.0, expected_ltr - total_skipped)
    milk_amount = delivered_ltr * rate
    
    txs = await db.product_tx.find({"farm_id": farm["id"], "contact_id": cid, "month": month, "type": "sale"}, {"_id": 0}).to_list(100)
    product_amount = sum(t["amount"] for t in txs)
    
    total_amount = milk_amount + product_amount
    
    return {
        "month": month,
        "contact": contact,
        "days_calculated": days,
        "expected_ltr": expected_ltr,
        "total_skipped_ltr": total_skipped,
        "delivered_ltr": delivered_ltr,
        "milk_amount": milk_amount,
        "products": txs,
        "product_amount": product_amount,
        "total_amount": total_amount,
        "farm_upi_id": farm.get("upi_id")
    }

@api.get("/cows")
async def list_cows(farm=Depends(get_farm)):
    items = await db.cows.find({"farm_id": farm["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"cows": items}

@api.post("/cows")
async def add_cow(body: CowIn, farm=Depends(get_farm)):
    doc = {
        "id": str(uuid.uuid4()),
        "farm_id": farm["id"],
        "tag": body.tag.strip(),
        "breed": body.breed.strip(),
        "status": body.status,
        "created_at": iso(now_utc()),
    }
    await db.cows.insert_one(dict(doc))
    return {"cow": doc}

@api.patch("/cows/{cid}/status")
async def update_cow_status(cid: str, body: dict, farm=Depends(get_farm)):
    status = body.get("status")
    await db.cows.update_one({"id": cid, "farm_id": farm["id"]}, {"$set": {"status": status}})
    
    event = {
        "id": str(uuid.uuid4()),
        "farm_id": farm["id"],
        "cow_id": cid,
        "type": "Status Change",
        "date": today_key(),
        "notes": f"Status updated to {status}",
        "created_at": iso(now_utc()),
    }
    await db.cow_events.insert_one(dict(event))
    return {"status": "ok"}

@api.post("/cows/{cid}/events")
async def add_cow_event(cid: str, body: CowEventIn, farm=Depends(get_farm)):
    event = {
        "id": str(uuid.uuid4()),
        "farm_id": farm["id"],
        "cow_id": cid,
        "type": body.type,
        "date": body.date,
        "notes": body.notes,
        "created_at": iso(now_utc()),
    }
    await db.cow_events.insert_one(dict(event))
    return {"event": event}

@api.get("/cows/{cid}/events")
async def get_cow_events(cid: str, farm=Depends(get_farm)):
    items = await db.cow_events.find({"farm_id": farm["id"], "cow_id": cid}, {"_id": 0}).sort("date", -1).to_list(500)
    return {"events": items}


# ---------- mount ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ksheer-dhara")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
