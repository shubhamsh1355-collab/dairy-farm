import asyncio
import os
import time
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def test_conn():
    uri = os.getenv("MONGO_URL")
    print(f"Connecting to: {uri.split('@')[-1] if '@' in uri else uri}")
    
    while True:
        try:
            client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
            await client.admin.command('ping')
            print("SUCCESS! Connected to MongoDB Atlas!")
            return
        except Exception as e:
            if "TLSV1_ALERT_INTERNAL_ERROR" in str(e):
                print("Waiting for IP whitelist to activate...")
            else:
                print("ERROR:", e)
        time.sleep(5)

if __name__ == "__main__":
    asyncio.run(test_conn())
