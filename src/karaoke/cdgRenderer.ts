// cdgRenderer.ts
// Renders CDG packets to a Canvas 2D context

export class CDGRenderer {
  width = 300;
  height = 216;

  // CDG uses a 16-color palette
  palette: string[] = new Array(16).fill("#000000");

  // Pixel buffer
  buffer: Uint8ClampedArray;

  ctx: CanvasRenderingContext2D;
  imageData: ImageData;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    canvas.width = this.width;
    canvas.height = this.height;

    this.imageData = this.ctx.createImageData(this.width, this.height);
    this.buffer = this.imageData.data;
  }

  clear() {
    this.buffer.fill(0);
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  setColorTable(data: Uint8Array) {
    for (let i = 0; i < 16; i++) {
      const r = (data[i * 2] & 0x3F) << 2;
      const g = ((data[i * 2] >> 6) | ((data[i * 2 + 1] & 0x0F) << 2)) << 2;
      const b = (data[i * 2 + 1] >> 4) << 4;

      this.palette[i] = `rgb(${r}, ${g}, ${b})`;
    }
  }

  drawTile(x: number, y: number, color: number) {
    const idx = (y * this.width + x) * 4;
    const [r, g, b] = this.palette[color]
      .replace("rgb(", "")
      .replace(")", "")
      .split(",")
      .map((v) => parseInt(v.trim()));

    this.buffer[idx] = r;
    this.buffer[idx + 1] = g;
    this.buffer[idx + 2] = b;
    this.buffer[idx + 3] = 255;
  }

  applyPacket(packet: any) {
    const { instruction, data } = packet;

    switch (instruction) {
      case 1: // Memory preset
        this.clear();
        break;

      case 6: // Tile block
      case 38: // Tile block XOR
        this.drawTileBlock(data);
        break;

      case 30: // Color table low
      case 31: // Color table high
        this.setColorTable(data);
        break;

      default:
        break;
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }

  drawTileBlock(data: Uint8Array) {
    const color = data[0] & 0x0F;
    const row = data[1] & 0x1F;
    const col = data[2] & 0x3F;

    const x = col * 6;
    const y = row * 12;

    let idx = 3;
    for (let r = 0; r < 12; r++) {
      const byte = data[idx++];
      for (let bit = 0; bit < 6; bit++) {
        if (byte & (1 << (5 - bit))) {
          this.drawTile(x + bit, y + r, color);
        }
      }
    }
  }
}
