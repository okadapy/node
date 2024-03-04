import React, { useCallback, useEffect, useState } from "react";

function App() {
  const [socket, setSocket] = useState(new WebSocket("ws://localhost:8000/ws"));
  const [hasOpponent, setHasOpponent] = useState(false);
  var buffs = [];
  var canPlacePixel = false;

  const setCanPlacePixel = (v) => {
    canPlacePixel = v;
  };

  const renderGrid = (ctx) => {
    const cw = ctx.canvas.width;
    const cells_per_row = 20;

    for (let i = 0; i <= cells_per_row; i++) {
      const x = i * (cw / cells_per_row);
      const y = i * (cw / cells_per_row);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cw);
      ctx.stroke();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }
  };

  const renderNewPixel = (ctx, x, y, player) => {
    if (player === 0) {
      ctx.fillStyle = "darkblue";
    } else if (player === null) {
      ctx.fillStyle = "white";
    } else ctx.fillStyle = "darkred";

    ctx.fillRect(
      x * Math.floor(ctx.canvas.width / 20),
      y * Math.floor(ctx.canvas.width / 20),
      ctx.canvas.width / 20,
      ctx.canvas.width / 20
    );
  };

  useEffect(() => {
    const canvas = document.getElementById("main-canvas");
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerWidth;
    const side = ctx.canvas.width / 20;
    renderGrid(ctx);
    canvas.addEventListener("mousedown", (e) => {
      const posx = Math.floor(e.offsetX / side),
        posy = Math.floor(e.offsetY / side);
      socket.send(
        JSON.stringify({
          type: "newpixel",
          x: posx,
          y: posy,
        })
      );
    });

    socket.onopen = () => {
      console.log("WS CONNECTED");
    };
    socket.onclose = () => {
      setHasOpponent(false);
      setCanPlacePixel(false);
    };

    socket.onmessage = (e) => {
      const data_json = JSON.parse(e.data);
      if (data_json.type == "canclick") {
      }
      if (data_json.type == "update") {
        console.log("Update recieved");
        console.log(data_json);
        for (var y = 0; y < data_json.data.length; y++) {
          for (var x = 0; x < data_json.data[y].length; x++) {
            renderNewPixel(ctx, x, y, data_json.data[y][x].player);
          }
        }

        renderGrid(ctx);
      }
    };
  }, []);

  return (
    <div id="app">
      <canvas id="main-canvas"></canvas>
      {canPlacePixel ? "Click!" : "Wait..."}
    </div>
  );
}

export default App;
