from dotenv import load_dotenv
import os
import time
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import aiohttp
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000",  # Allow your Next.js frontend
    "http://127.0.0.1:3000",  # Allow your Next.js frontend
    "http://localhost:3034",
    "http://127.0.0.1:3034",  # Allow your Next.js frontend
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
load_dotenv()
# MongoDB connection
mongodbURI = os.getenv('MONGODB_URI')
client = AsyncIOMotorClient(mongodbURI)
db = client.gpt_visits  # database connection

# Pydantic model for incoming POST requests
class Post(BaseModel):
    address: str
    pineappleAmt: int
    query: str

gpt_api_key = os.getenv('CHATGPT_API_KEY')
endpoint = 'https://api.openai.com/v1/chat/completions'
amt_per_call = int(os.getenv('NEXT_PUBLIC_AMOUNT_PER_CALL', '10'))

async def get_gpt_response(query: str) -> str:
    async with aiohttp.ClientSession() as session:
        headers = {
            'Authorization': f'Bearer {gpt_api_key}',
            'Content-Type': 'application/json',
        }
        payload = {
            'model': 'gpt-4',  # or 'gpt-3.5-turbo' if you have access
            'messages': [{'role': 'user', 'content': query}],
            'max_tokens': 100,  # Adjust as needed
        }
        async with session.post(endpoint, json=payload, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                message = ''.join(choice['message']['content'] for choice in data['choices'])
                return message
            else:
                print(f"Error fetching GPT response: {response.status}")
                raise HTTPException(status_code=response.status, detail="Error fetching GPT response")

@app.get("/posts/")
async def get_posts():
    posts = await db.posts.find({}).to_list(length=None)
    return JSONResponse(content=posts)

@app.post("/posts/")
async def create_post(post: Post):
    timestamp = time.time()  # Current time in seconds
    user_gpt_usage = await db.posts.find_one({"address": post.address})

    if user_gpt_usage:
        if timestamp - user_gpt_usage['timestamp'] >= 24 * 60 * 60:
            # Update if 24 hours have passed
            update = {
                "$set": {
                    "timestamp": timestamp,
                    "holding": post.pineappleAmt,
                    "usage": amt_per_call,
                }
            }
            await db.posts.update_one({"address": post.address}, update)
            message = await get_gpt_response(post.query)
            return JSONResponse(content={
                "type": "success",
                "holding": post.pineappleAmt,
                "usage": user_gpt_usage['usage'],
                "message": message,
            })
        else:
            if post.pineappleAmt - user_gpt_usage['usage'] >= amt_per_call:
                # Update usage
                update = {
                    "$set": {
                        "holding": post.pineappleAmt,
                        "usage": user_gpt_usage['usage'] + amt_per_call,
                    }
                }
                await db.posts.update_one({"address": post.address}, update)
                message = await get_gpt_response(post.query)
                return JSONResponse(content={
                    "type": "success",
                    "holding": post.pineappleAmt,
                    "usage": user_gpt_usage['usage'],
                    "message": message,
                })
            else:
                return JSONResponse(content={
                    "type": "limit reached",
                    "holding": post.pineappleAmt,
                    "usage": user_gpt_usage['usage'],
                    "message": '',
                })
    else:
        # Create a new entry
        await db.posts.insert_one({
            "address": post.address,
            "holding": post.pineappleAmt,
            "usage": amt_per_call,
            "timestamp": timestamp,
        })
        message = await get_gpt_response(post.query)
        return JSONResponse(content={
            "type": "success",
            "holding": post.pineappleAmt,
            "usage": amt_per_call,
            "message": message,
        })