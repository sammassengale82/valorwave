// cdgDecoder.ts
// Low-level CDG packet parser

export interface CDGPacket {
  instruction: number;
  data: Uint8Array;
}

export class CDGDecoder {
  static PACKET_SIZE = 24;

  decode(buffer: ArrayBuffer): CDGPacket[] {
    const packets: CDGPacket[] = [];
    const view = new Uint8Array(buffer);

    for (let i = 0; i < view.length; i += CDGDecoder.PACKET_SIZE) {
      if (i + CDGDecoder.PACKET_SIZE > view.length) break;

      const command = view[i];
      const instruction = view[i + 1];

      // CDG packets always have command 0x09
      if (command !== 0x09) continue;

      const data = view.slice(i + 4, i + 20);
      packets.push({ instruction, data });
    }

    return packets;
  }
}
