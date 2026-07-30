// src-tauri/src/karaoke/cdg_player.rs

use crate::karaoke::cdg_decoder::CDGDecoder;
use crate::karaoke::cdg_renderer::CDGRenderer;

#[derive(Clone, Debug)]
pub struct CDGPlayer {
    packets: Vec<crate::karaoke::cdg_decoder::CDGPacket>,
    renderer: CDGRenderer,
    start_time_ms: f64,
}

impl CDGPlayer {
    pub fn new() -> Self {
        Self {
            packets: Vec::new(),
            renderer: CDGRenderer::new(),
            start_time_ms: 0.0,
        }
    }

    pub fn load(&mut self, data: &[u8]) {
        self.packets = CDGDecoder::decode(data);
    }

    pub fn start(&mut self, position_sec: f32) {
        self.start_time_ms = (position_sec as f64) * 1000.0;
    }

    pub fn seek(&mut self, position_sec: f32) {
        self.start_time_ms = (position_sec as f64) * 1000.0;
    }

    pub fn render_frame(&mut self, now_ms: f64) -> &[u8] {
        let elapsed = now_ms - self.start_time_ms;
        let packet_index = (elapsed * 0.3) as usize;

        if packet_index < self.packets.len() {
            self.renderer.apply_packet(&self.packets[packet_index]);
        }

        &self.renderer.buffer
    }
}
