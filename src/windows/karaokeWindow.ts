// src/windows/karaokeWindow.ts
import { listen } from "@tauri-apps/api/event";

// ---------------------------
// CDG FRAME RENDERING
// ---------------------------
const cdgCanvas = document.getElementById("cdg-screen") as HTMLCanvasElement;
const cdgCtx = cdgCanvas?.getContext("2d");

listen("karaoke_frame", (event) => {
  if (!cdgCtx) return;

  const payload = event.payload as {
    width: number;
    height: number;
    data: number[];
  };

  const img = new ImageData(
    new Uint8ClampedArray(payload.data),
    payload.width,
    payload.height
  );

  cdgCtx.putImageData(img, 0, 0);
});

// ---------------------------
// SCORING OVERLAY
// ---------------------------
const scoreCanvas = document.createElement("canvas");
scoreCanvas.width = 300;
scoreCanvas.height = 216;
scoreCanvas.style.position = "absolute";
scoreCanvas.style.top = "0";
scoreCanvas.style.left = "0";
scoreCanvas.style.pointerEvents = "none";

document.body.appendChild(scoreCanvas);
const scoreCtx = scoreCanvas.getContext("2d");

listen("karaoke_score", (event) => {
  if (!scoreCtx) return;

  const { accuracy, timing } = event.payload as {
    accuracy: number;
    timing: number;
  };

  scoreCtx.clearRect(0, 0, 300, 216);

  const score = Math.round((accuracy * 0.7 + timing * 0.3) * 100);

  scoreCtx.fillStyle = "white";
  scoreCtx.font = "20px Arial";
  scoreCtx.fillText(`Score: ${score}`, 10, 30);

  let label = "Poor";
  if (score > 80) label = "Great!";
  else if (score > 60) label = "Good";

  scoreCtx.fillText(label, 10, 60);
});

// ---------------------------
// NOW SINGING / NEXT OVERLAY
// ---------------------------
const overlay = document.getElementById("karaoke-overlay")!;

listen("karaoke_now_singing", (event) => {
  const { now, next, song } = event.payload as {
    now: string;
    next: string;
    song?: string;
  };

  overlay.innerHTML = `
    <div class="karaoke-title-card fade-in">
      ${song ? `<div>${song}</div>` : ""}
    </div>
    <div class="karaoke-now fade-in">${now}</div>
    <div class="karaoke-next fade-in">Next: ${next || "—"}</div>
  `;

  setTimeout(() => {
    const nodes = overlay.querySelectorAll(".fade-in");
    nodes.forEach((n) => {
      n.classList.remove("fade-in");
      n.classList.add("fade-out");
    });
  }, 4000);
});
