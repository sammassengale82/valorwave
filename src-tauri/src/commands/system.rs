use serde::Serialize;
use sysinfo::System;

#[derive(Serialize)]
pub struct Metrics {
    pub cpu: f32,
    pub gpu: f32,
    pub latency: u32,
}

#[tauri::command]
pub fn get_system_metrics() -> Metrics {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu = sys.global_cpu_info().cpu_usage();
    let gpu = 0.0;
    let latency = 12;

    Metrics { cpu, gpu, latency }
}
