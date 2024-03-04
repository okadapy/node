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
      x * (ctx.canvas.width / 20),
      y * (ctx.canvas.width / 20),
      ctx.canvas.width / 20,
      ctx.canvas.width / 20
    );

    renderGrid(ctx);
  };

  useEffect(() => {
    const canvas = document.getElementById("main-canvas");
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerWidth;
    const side = ctx.canvas.width / 20;
    renderGrid(ctx);
    canvas.addEventListener("mousedown", (e) => {
      if (canPlacePixel == true) {
        setCanPlacePixel(false);
        const posx = Math.floor(e.offsetX / side),
          posy = Math.floor(e.offsetY / side);
        if (buffs.includes("bomb")) {
          socket.send(
            JSON.stringify({
              type: "bomb",
              x: posx,
              y: posy,
            })
          );
        } else {
          socket.send(
            JSON.stringify({
              type: "newpixel",
              x: posx,
              y: posy,
            })
          );
        }
      }
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
      if (data_json.type === "canclick") {
        setCanPlacePixel(true);
      } else if (data_json.type === "hasopponent") {
        setHasOpponent(true);
      } else if (data_json.type === "newpixel") {
        renderNewPixel(ctx, data_json.x, data_json.y, data_json.player);
        console.log("new pixel");
      } else if (data_json.type === "clearpixel") {
        renderNewPixel(ctx, data_json.x, data_json.y, null);
      } else if (data_json.type === "found") {
        if (data_json.value == "lightning") {
          buffs.push({ lightning: 5 });
        } else {
          buffs.push(data_json.value);
        }
        console.log(data_json);
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
