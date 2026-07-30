use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct CdgFrame {
    pub width: u32,
    pub height: u32,
    pub pixels: Vec<u8>, // RGBA
}
