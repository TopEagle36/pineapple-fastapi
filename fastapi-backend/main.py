from dotenv import load_dotenv
import os
import time
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import aiohttp
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

# FastAPI application
app = FastAPI()

# CORS settings
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3034",
    "http://127.0.0.1:3034",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongodbURI = os.getenv('MONGODB_URI')
client = AsyncIOMotorClient(mongodbURI)
db = client.pineapple  # Database connection

# Pydantic model for incoming POST requests
class Post(BaseModel):
    address: str
    pineappleAmt: int
    query: str

# CHAT API settings
chat_api_key = os.getenv('CHATGPT_API_KEY')
endpoint = 'https://api.openai.com/v1/chat/completions'
amt_per_call = int(os.getenv('NEXT_PUBLIC_AMOUNT_PER_CALL', '10'))

async def get_response(query: str) -> str:
    async with aiohttp.ClientSession() as session:
        headers = {
            'Authorization': f'Bearer {chat_api_key}',
            'Content-Type': 'application/json',
        }
        payload = {
            'model': 'gpt-4',
            'messages': [{'role': 'user', 'content': query}],
            'max_tokens': 100,
        }
        async with session.post(endpoint, json=payload, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                message = ''.join(choice['message']['content'] for choice in data['choices'])
                return message
            else:
                print(f"Error fetching Chat response: {response.status}")
                raise HTTPException(status_code=response.status, detail="Error fetching Chat response")

class Agent:
    def __init__(self, db):
        self.db = db

    async def request_call(self, post: Post):
        timestamp = time.time()
        user_api_usage = await self.db.agents.find_one({"address": post.address})

        if user_api_usage:
            if timestamp - user_api_usage['timestamp'] >= 24 * 60 * 60:
                return await self._update_agent(user_api_usage, post, timestamp)
            else:
                if post.pineappleAmt - user_api_usage['usage'] >= amt_per_call:
                    return await self._update_usage(user_api_usage, post)
                else:
                    return JSONResponse(content={
                        "type": "limit reached",
                        "holding": post.pineappleAmt,
                        "usage": user_api_usage['usage'],
                        "message": '',
                    })
        else:
            return await self._create_new_agent(post, timestamp)

    async def _create_new_agent(self, post, timestamp):
        await self.db.agents.insert_one({
            "address": post.address,
            "holding": post.pineappleAmt,
            "usage": amt_per_call,
            "timestamp": timestamp,
        })
        message = await get_response(post.query)
        return JSONResponse(content={
            "type": "success",
            "holding": post.pineappleAmt,
            "usage": amt_per_call,
            "message": message,
        })

    async def _update_agent(self, user_api_usage, post, timestamp):
        update = {
            "$set": {
                "timestamp": timestamp,
                "holding": post.pineappleAmt,
                "usage": amt_per_call,
            }
        }
        await self.db.agents.update_one({"address": post.address}, update)
        message = await get_response(post.query)
        return JSONResponse(content={
            "type": "success",
            "holding": post.pineappleAmt,
            "usage": amt_per_call,
            "message": message,
        })

    async def _update_usage(self, user_api_usage, post):
        update = {
            "$set": {
                "holding": post.pineappleAmt,
                "usage": user_api_usage['usage'] + amt_per_call,
            }
        }
        await self.db.agents.update_one({"address": post.address}, update)
        message = await get_response(post.query)
        return JSONResponse(content={
            "type": "success",
            "holding": post.pineappleAmt,
            "usage": user_api_usage['usage'] + amt_per_call,
            "message": message,
        })

# Initialize the Agent
agent = Agent(db)

@app.get("/posts/")
async def get_posts():
    posts = await db.agents.find({}).to_list(length=None)
    return JSONResponse(content=posts)

@app.post("/posts/")
async def request_call(post: Post):
    return await agent.request_call(post)
