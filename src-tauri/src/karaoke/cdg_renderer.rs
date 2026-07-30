// src-tauri/src/karaoke/cdg_renderer.rs

use crate::karaoke::cdg_decoder::CDGPacket;


#[derive(Clone, Debug)]
pub struct CDGRenderer {
    pub width: usize,
    pub height: usize,
    pub buffer: Vec<u8>,
    pub palette: [[u8; 3]; 16],
}

impl CDGRenderer {
    pub fn new() -> Self {
        Self {
            width: 300,
            height: 216,
            buffer: vec![0; 300 * 216 * 3],
            palette: [[0, 0, 0]; 16],
        }
    }

    pub fn apply_packet(&mut self, packet: &CDGPacket) {
        match packet.instruction {
            1 => self.clear(),
            6 | 38 => self.draw_tile_block(&packet.data),
            30 | 31 => self.set_color_table(&packet.data),
            _ => {}
        }
    }

    fn clear(&mut self) {
        for px in self.buffer.iter_mut() {
            *px = 0;
        }
    }

    fn set_color_table(&mut self, data: &[u8; 16]) {
        for i in 0..16 {
            let r = (data[i] & 0x3F) << 2;
            let g = ((data[i] >> 6) | ((data[i] & 0x0F) << 2)) << 2;
            let b = (data[i] >> 4) << 4;

            self.palette[i] = [r, g, b];
        }
    }

    fn draw_tile_block(&mut self, data: &[u8; 16]) {
        let color = data[0] & 0x0F;
        let row = data[1] & 0x1F;
        let col = data[2] & 0x3F;

        let x = (col as usize) * 6;
        let y = (row as usize) * 12;

        let mut idx = 3;
        for r in 0..12 {
            let byte = data[idx];
            idx += 1;

            for bit in 0..6 {
                if byte & (1 << (5 - bit)) != 0 {
                    self.draw_pixel(x + bit, y + r, color);
                }
            }
        }
    }

    fn draw_pixel(&mut self, x: usize, y: usize, color: u8) {
        let offset = (y * self.width + x) * 3;
        let [r, g, b] = self.palette[color as usize];
        self.buffer[offset] = r;
        self.buffer[offset + 1] = g;
        self.buffer[offset + 2] = b;
    }
}
