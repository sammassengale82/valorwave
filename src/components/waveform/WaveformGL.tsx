import React, { useEffect, useRef } from "react";
import { audioEngine } from "../../engine/audioEngine";

interface Hotcue {
  pos: number;
  color: string;
}

interface Beatgrid {
  bpm: number;
  beats?: number[];
}

interface WaveformGLProps {
  deckId: number;
  zoom?: number;
  scroll: number;
  peaks: Float32Array;
  hotcues?: Hotcue[];
  beatgrid?: Beatgrid | null;
  position: number;
  duration: number;
}

export const WaveformGL: React.FC<WaveformGLProps> = ({
  deckId,
  zoom = 1,
  scroll,
  peaks,
  hotcues = [],
  beatgrid = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  // Use refs to pass rapid scrolling/zooming state metrics straight to the render loop without re-triggering compilation
  const renderParamsRef = useRef({ zoom, scroll, beatgrid, hotcues, deckId });
  
  useEffect(() => {
    renderParamsRef.current = { zoom, scroll, beatgrid, hotcues, deckId };
  }, [zoom, scroll, beatgrid, hotcues, deckId]);

  /* =========================================================================
     1. MAIN SETUP EFFECT: Allocates GPU memory ONLY when the raw audio peaks change
     ========================================================================= */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks || peaks.length === 0) return;

    // Support sharp rendering across high-density Apple/Retina/4K screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    // CRITICAL: WebGL requires an explicit driver extension toggle to support Float32 data structures!
    const ext = gl.getExtension("OES_texture_float");
    if (!ext) {
      console.warn("OES_texture_float extension not supported by this browser client engine.");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.05, 0.05, 0.05, 1.0); // Slightly lightened matching VirtualDJ sleek track slots

    /* SHADER COMPILATION MODULES */
    const vsSource = `
      attribute float aIndex;
      uniform float uTotal;
      uniform float uZoom;
      uniform float uScroll;
      varying float vIndex;
      void main() {
        float visible = uTotal / uZoom;
        float start = uScroll * (uTotal - visible);
        float idx = start + aIndex;
        float x = (aIndex / visible) * 2.0 - 1.0;
        gl_Position = vec4(x, 0.0, 0.0, 1.0);
        vIndex = idx;
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform sampler2D uPeaks;
      uniform float uTotal;
      uniform float uHeight;
      varying float vIndex;
      void main() {
        float t = vIndex / uTotal;
        float v = texture2D(uPeaks, vec2(t, 0.0)).r;
        float y = gl_FragCoord.y / uHeight;
        float mid = 0.5;
        float amp = v * 0.5;
        if (y < mid - amp || y > mid + amp) discard;
        // Dynamic multitone frequency tracking layout layers colors
        vec3 color = v > 0.75 ? vec3(1.0, 0.3, 0.0) : v > 0.45 ? vec3(1.0, 0.75, 0.0) : vec3(0.0, 0.65, 1.0);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };

    const vs = compile(gl.VERTEX_SHADER, vsSource);
    const fs = compile(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    /* HIGH-PERFORMANCE PEAK TEXTURE MAPPING */
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // Crisp single pixel bars instead of blurry linear look
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      peaks.length,
      1,
      0,
      gl.LUMINANCE,
      gl.FLOAT,
      peaks
    );

    /* BUFFER ASSIGNMENT CHANNELS */
    const aIndexLoc = gl.getAttribLocation(program, "aIndex");
    const uTotalLoc = gl.getUniformLocation(program, "uTotal");
    const uZoomLoc = gl.getUniformLocation(program, "uZoom");
    const uScrollLoc = gl.getUniformLocation(program, "uScroll");
    const uHeightLoc = gl.getUniformLocation(program, "uHeight");

    const total = peaks.length;
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
    
    const indices = new Float32Array(total);
    for (let i = 0; i < total; i++) indices[i] = i;
    
    gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aIndexLoc);
    gl.vertexAttribPointer(aIndexLoc, 1, gl.FLOAT, false, 0, 0);

    gl.uniform1f(uTotalLoc, total);
    gl.uniform1f(uHeightLoc, canvas.height);

    /* =========================================================================
       2. LIGHTWEIGHT RE-PAINT LOOP: Only redraws vectors, leaves shader compilation alone
       ========================================================================= */
    let raf: number;
    
    const renderLoop = async () => {
      // Safely pull configuration properties from the mutable single instance ref frame
      const { zoom: currentZoom, scroll: currentScroll, beatgrid: currentGrid, hotcues: currentCues, deckId: currentDeck } = renderParamsRef.current;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uZoomLoc, currentZoom);
      gl.uniform1f(uScrollLoc, currentScroll);
      gl.drawArrays(gl.LINES, 0, total);

      /* DRAW 2D INTERACTION HUD CANVAS OVERLAYS */
      const overlay = overlayRef.current;
      if (overlay) {
        const oRect = overlay.getBoundingClientRect();
        overlay.width = oRect.width * dpr;
        overlay.height = oRect.height * dpr;
        const ctx = overlay.getContext("2d");
        
        if (ctx) {
          ctx.scale(dpr, dpr); // scale canvas coordinate space based on DPI values
          ctx.clearRect(0, 0, oRect.width, oRect.height);
          
          const duration = audioEngine.getDuration(currentDeck);

          /* DRAW BEATGRID */
          if (currentGrid?.beats && duration > 0) {
            ctx.strokeStyle = "rgba(255, 255, 0, 0.35)";
            ctx.lineWidth = 1;
            currentGrid.beats.forEach((beatSec: number) => {
              const pos = beatSec / duration;
              const rel = (pos - currentScroll) * currentZoom;
              if (rel >= 0 && rel <= 1) {
                const x = rel * oRect.width;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, oRect.height);
                ctx.stroke();
              }
            });
          }

          /* DRAW HOTCUES */
          if (duration > 0) {
            currentCues.forEach((hc) => {
              const pos = hc.pos / duration;
              const rel = (pos - currentScroll) * currentZoom;
              if (rel >= 0 && rel <= 1) {
                const x = rel * oRect.width;
                ctx.fillStyle = hc.color;
                ctx.fillRect(x - 2, 0, 4, oRect.height);
              }
            });
          }

          /* DRAW LIVE PLAYHEAD ANCHORS */
          const pos = await audioEngine.getPosition(currentDeck);
          if (duration > 0) {
            const rel = (pos / duration - currentScroll) * currentZoom;
            if (rel >= 0 && rel <= 1) {
              const x = rel * oRect.width;
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(x - 1, 0, 2, oRect.height);
            }
          }
        }
      }

      raf = requestAnimationFrame(renderLoop);
    };

    // Initialize the loop frame
    raf = requestAnimationFrame(renderLoop);

    /* RESOURCE TEARDOWN / GARBAGE CLEANUP */
    return () => {
      cancelAnimationFrame(raf);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteTexture(tex);
      gl.deleteBuffer(indexBuffer);
    };
  }, [peaks]); // ⭐ RE-RUNS AND COMPILES *ONLY* WHEN AUDIO BINARY DATA UPDATES

  return (
    <div className="waveform-container" style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }} />
      <canvas ref={overlayRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 2, pointerEvents: "none" }} />
    </div>
  );
};

export default WaveformGL;
