// src-tauri/src/karaoke/cdg_decoder.rs

#[derive(Clone, Debug)]
pub struct CDGPacket {
    pub instruction: u8,
    pub data: [u8; 16],
}

pub struct CDGDecoder;

impl CDGDecoder {
    pub fn decode(buffer: &[u8]) -> Vec<CDGPacket> {
        let mut packets = Vec::new();

        let mut i = 0;
        while i + 24 <= buffer.len() {
            let command = buffer[i];
            let instruction = buffer[i + 1];

            if command == 0x09 {
                let mut data = [0u8; 16];
                data.copy_from_slice(&buffer[i + 4..i + 20]);

                packets.push(CDGPacket { instruction, data });
            }

            i += 24;
        }

        packets
    }
}
