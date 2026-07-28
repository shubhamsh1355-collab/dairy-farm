# Ksheer Dhara — PRD

## Product
Dairy farm inventory & analytics SaaS mobile app (Expo, React Native) + FastAPI backend + MongoDB. Web-compatible via Expo web.

## Auth
Mock OTP over mobile number (prototype). Twilio WhatsApp Business API for broadcast (activates when TWILIO_ACCOUNT_SID/AUTH_TOKEN/WHATSAPP_FROM env vars are set; simulated otherwise).

## Core features
1. **Milk Log** — daily produced/delivered/used-for-products; remaining auto-calculated; per-day upsert; price/L for revenue.
2. **Products** — dairy stock: Ghee, Butter, Paneer, Curd, Cheese, Khoya (preloaded) + custom add. Add stock, sell (records tx), delete.
3. **Analytics** — monthly revenue + net profit (est.) split between Milk and Dairy Products, daily bar chart (14d), product breakdown.
4. **WhatsApp Broadcast** — customer contacts CRUD, compose message, multi-select recipients, bulk send (Twilio when configured, else simulated). History persisted.
5. **Multi-farm SaaS** — each farm isolated by farm_id derived from bearer token.

## Screens
Splash → Auth (mobile/otp/register) → Tabs (Home, Products, Analytics, Broadcast) + Log Milk + Profile.

## Design
Warm earthy palette (Deep Moss Green #275C3B + Terracotta #B55A30), farm imagery, glass hero over milk splash. MaterialCommunityIcons cow+water-drop logo.
