from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.websockets import WebSocket, WebSocketDisconnect
from fastapi.templating import Jinja2Templates
import asyncio
import random

app = FastAPI()
templates = Jinja2Templates("templates")

class Player:
    def __init__(self, websocket) -> None:
        self._socket = websocket
        self.boost = False
        self.bomb = False
        self.lightning = 0
        self.armor = False

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[(WebSocket, Player)] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast_new_pixel(self, x, y, websocket):
        for connection in self.active_connections:
            if connection == websocket:
                await connection.send_json(
                    {"type": "newpixel", "x": x, "y": y, "player": 0}
                )
                continue
            await connection.send_json(
                {"type": "newpixel", "x": x, "y": y, "player": 1}
            )

    async def broadcast_bomb(self, x, y):
        for connection in self.active_connections:
            for n_y in range(y-2, y+1):
                for n_x in range(x-2, x+1):
                    await connection.send_json({
                        "type": "clearpixel", "x": n_x, "y": n_y
                    })

    async def send_can_place(self, websocket, delay):
        await asyncio.sleep(delay)
        await websocket.send_json({"type": "canclick"})


manager = ConnectionManager()
players: dict[WebSocket, Player] = {}

@app.get("/", response_class=HTMLResponse)
async def index():
    return templates.TemplateResponse("index.html")


@app.websocket("/ws")
async def websocket_handler(websocket: WebSocket):
    await manager.connect(websocket)
    players[websocket] = Player(websocket)
    await websocket.send_json({"type": "canclick"})
        
    while True:
        try:
            data = await websocket.receive_json()
            if data["type"] == "newpixel":
                if players[websocket].boost:
                    await manager.send_can_place(websocket, 0)
                    players[websocket].boost = False
                    await websocket.send_json({"type": "used", "value": "boost"})
                elif players[websocket].lightning > 0:
                    asyncio.create_task(manager.send_can_place(websocket, 2))
                    players[websocket].lightning -= 1
                    await websocket.send_json({"type": "used", "value": "lightning", "remains": players[websocket].lightning})
                else:
                    asyncio.create_task(manager.send_can_place(websocket, 5))

            
                if random.random() > 0.9:
                    await websocket.send_json({"type": "found", "value": "bomb"})
                    players[websocket].bomb = True
                elif random.random() > 0.7:
                    await websocket.send_json({"type": "found", "value": "boost"})
                    players[websocket].boost = True
                elif random.random() > 0.6:
                    await websocket.send_json({"type": "found", "value": "lightning"})
                    players[websocket].lightning = 5

                await manager.broadcast_new_pixel(data["x"], data["y"], websocket)
            if data["type"] == "bomb": 
                await manager.broadcast_bomb(data["x"], data["y"])
        except WebSocketDisconnect as e:
            manager.disconnect(websocket)
            players.pop(websocket)
