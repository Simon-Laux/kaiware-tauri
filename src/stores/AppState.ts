import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { unstable_batchedUpdates } from "react-dom";

import create from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface Device {
  /** the id of the device */
  serial: string;
  /** whether it is connected over adb */
  isConnected: boolean;
  /** optional information we might get from adb */
  adbInfo: ADBDevice["info"];
  hasFirefoxOSDebugSocket: boolean;
}

interface AppState {
  tauri_app_info: TauriAppState;
  devices: Device[];
  updateConnections: (currentADBDevices: ADBDevice[]) => void;
  manualRefresh: () => Promise<void>;
}

// see https://github.com/pmndrs/zustand for how work with zustand
export const useStore = create<AppState>()(
  devtools(
    persist((set, get) => ({
      tauri_app_info: { has_auto_detect_usb: false },
      devices: [],
      //increase: (by) => set((state) => ({ bears: state.bears + by })),
      updateConnections: (currentADBDevices) =>
        set((state) => {
          const knownDevices = state.devices;
          const knownDevicesSerialNumbers = state.devices.map(
            ({ serial }) => serial
          );
          // check for existing device changes (connect/disconnect)
          for (let device of knownDevices) {
            let deviceInCurrentDevices = currentADBDevices.find(
              ({ serial }) => serial === device.serial
            );
            device.isConnected = !!deviceInCurrentDevices;
            if (deviceInCurrentDevices) {
              device.adbInfo = deviceInCurrentDevices.info;
              device.hasFirefoxOSDebugSocket =
                deviceInCurrentDevices.has_firefox_os_socket;
            }
          }
          // check for new devices
          for (let new_device of currentADBDevices.filter(
            ({ serial }) => !knownDevicesSerialNumbers.includes(serial)
          )) {
            knownDevices.push({
              serial: new_device.serial,
              isConnected: true,
              adbInfo: new_device.info,
              hasFirefoxOSDebugSocket: new_device.has_firefox_os_socket,
            });
          }

          return { devices: knownDevices };
        }),
      manualRefresh: async () => {
        get().updateConnections(
          (await invoke("get_adb_devices")) as ADBDevice[]
        );
      },
    }))
  )
);

function sleep(time: number) {
  return new Promise((resolve, _reject) => setTimeout(resolve, time));
}

async function setup() {
  let app_state: TauriAppState = await invoke("get_app_state");

  unstable_batchedUpdates(() => {
    useStore.setState((state) => ({ ...state, tauri_app_info: app_state }));
  });

  if (app_state.has_auto_detect_usb) {
    // if autodetect usb is availible set it up

    let last_adb_device_count = 0;
    let is_searching = false;
    listen("usb-devices-changed", async () => {
      // new usb device added/removed: try to connect for 10sec
      // basically check if adb device list changed
      // debounced, do not start if still running
      if (is_searching) {
        return;
      }
      is_searching = true;

      let adb_devices: ADBDevice[];
      for (let i = 0; i < 20; i++) {
        adb_devices = (await invoke("get_adb_devices")) as ADBDevice[];
        if (adb_devices.length === last_adb_device_count) {
          await sleep(500);
        } else {
          break;
        }
      }
      //@ts-ignore //ignore, because typescript thinks we don't asign a value
      last_adb_device_count = adb_devices.length;
      unstable_batchedUpdates(() => {
        useStore.getState().updateConnections(adb_devices);
      });

      is_searching = false;
    });
  }
}

setup();
