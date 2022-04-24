#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{collections::BTreeMap, os::unix::thread, sync::Arc};

use adb_file_manager::DeviceDirEntry;
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

mod adb_file_manager;

#[tauri::command]
async fn adb_read_dir(
    device_serial: &str,
    path: &str,
) -> Result<Vec<DeviceDirEntry>, KaiwareError> {
    let device = mozdevice::Device::new(
        mozdevice::Host {
            ..Default::default()
        },
        device_serial.to_owned(),
        mozdevice::AndroidStorageInput::Auto,
    )?;
    let unix_path = mozdevice::UnixPath::new(path);

    Ok(device
        .list_dir_flat(unix_path, 0, "".to_string())?
        .into_iter()
        .map(|d| d.into())
        .collect())
}

#[derive(Debug, Serialize)]
struct ADBDevice {
    serial: String,
    info: BTreeMap<String, String>,
    has_firefox_os_socket: bool,
    is_adbd_root: bool,
}

#[tauri::command]
fn get_adb_devices() -> Result<Vec<ADBDevice>, KaiwareError> {
    let adb_server = mozdevice::Host {
        ..Default::default()
    };
    let devices: Vec<mozdevice::DeviceInfo> = adb_server.devices()?;

    println!("devices: {:?}", devices);

    let mut device_info: Vec<ADBDevice> = Vec::new();

    for info in devices {
        let device = mozdevice::Device::new(
            mozdevice::Host {
                ..Default::default()
            },
            info.serial.clone(),
            mozdevice::AndroidStorageInput::Auto,
        )?;
        let unix_path = mozdevice::UnixPath::new("/data/local/debugger-socket");

        device_info.push(ADBDevice {
            serial: info.serial.clone(),
            info: info.info.clone(),
            has_firefox_os_socket: device.path_exists(unix_path, false)?,
            is_adbd_root: device.adbd_root,
        });
    }

    Ok(device_info)
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
        .invoke_handler(tauri::generate_handler![
            get_adb_devices,
            get_app_state,
            adb_read_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    //TODO shudown usb handler on exit

    println!("EXIT?");
}

// Useful links
// - https://tauri.studio/docs/guides/command

mod usb_hotplug;

impl Drop for AppState {
    fn drop(&mut self) {
        println!("AppState dropped");
    }
}
