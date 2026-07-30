fn main() {
    // Copy Tauri config and perform other build-time tasks so OUT_DIR is populated.
    tauri_build::build();
}
