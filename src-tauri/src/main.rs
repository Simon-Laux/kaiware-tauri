#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{collections::BTreeMap, os::unix::thread, sync::Arc};

use mozdevice::DeviceError;
use serde::Serialize;
use tauri::{async_runtime, Manager};
use usb_hotplug::setup_usb_change_handler;

#[derive(Debug, Serialize)]
struct KaiwareError(String);

impl From<DeviceError> for KaiwareError {
    fn from(err: DeviceError) -> Self {
        KaiwareError(format!("{:?}", err))
    }
}

#[derive(Debug, Serialize)]
struct ADBDevice {
    serial: String,
    info: BTreeMap<String, String>,
}

#[tauri::command]
fn get_adb_devices() -> Result<Vec<ADBDevice>, KaiwareError> {
    let adb_server = mozdevice::Host {
        ..Default::default()
    };
    let devices: Vec<mozdevice::DeviceInfo> = adb_server.devices()?;

    println!("devices: {:?}", devices);

    Ok(devices
        .iter()
        .map(|info| ADBDevice {
            serial: info.serial.clone(),
            info: info.info.clone(),
        })
        .collect())
}

#[tauri::command]
fn get_app_state(state: tauri::State<AppState>) -> &AppState {
    state.inner()
}

#[derive(Debug, Serialize)]
struct AppState {
    has_auto_detect_usb: bool,
}

impl AppState {
    fn new() -> Self {
        AppState {
            has_auto_detect_usb: rusb::has_hotplug(), // todo also check if the hotplug listener is correctly setup
        }
    }
}

fn main() {
    let usb_context = rusb::Context::new().unwrap();
    let app = AppState::new();

    tauri::Builder::default()
        .manage(app)
        .setup(|app| {
            // register usb listener
            let app_handle1 = app.handle();
            std::thread::spawn(move || setup_usb_change_handler(usb_context, app_handle1));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_adb_devices, get_app_state])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    //TODO shudown usb handler on exit

    println!("EXIT?");
}

// Useful links
// - https://tauri.studio/docs/guides/command

mod adb_portforwarding;
mod usb_hotplug;

impl Drop for AppState {
    fn drop(&mut self) {
        println!("AppState dropped");
    }
}
