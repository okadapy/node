import uvicorn
from app.server import app as server

# from app.bot import dp, bot
import asyncio

# async def start_bot():
#     print("Starting bot")
#     await dp.start_polling(bot)


async def start_server():
    print("starting server")
    uvicorn.run(server)


if __name__ == "__main__":
    try:
        uvicorn.run(server)
    except KeyboardInterrupt as e:
        print("Exiting")
