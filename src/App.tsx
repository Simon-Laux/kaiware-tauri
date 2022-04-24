import React, { useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";

type ADBDevice = {
  serial: string;
  info: {
    device?: string;
    model?: string;
    product?: string;
    transport_id?: string;
    usb?: string;
  };
};

function sleep(time: number) {
  return new Promise((resolve, _reject) => setTimeout(resolve, time));
}

// new usb device added: try to connect for 10sec
async function tryConnect(starting_length: number) {
  for (let i = 0; i < 20; i++) {
    if (
      ((await invoke("get_adb_devices")) as any[]).length === starting_length
    ) {
      await sleep(500);
    } else {
      break;
    }
  }
}

function App() {
  const currentDeviceCount = useRef(0);
  const [devices, setDevices] = useState<ADBDevice[]>([]);

  const command = async () => {
    let devices = (await invoke("get_adb_devices")) as ADBDevice[];
    setDevices(devices);
    currentDeviceCount.current = devices.length;
  };

  const [app_state_string, set_app_state] = useState("");

  useEffect(() => {
    invoke("get_app_state").then((v) => set_app_state(v as string));

    let is_searching = false;
    let unlisten: null | (() => void) = null;
    listen("usb-devices-changed", async () => {
      if (is_searching) {
        return;
      }
      is_searching = true;
      await tryConnect(currentDeviceCount.current);
      command();
      is_searching = false;
    }).then((u) => (unlisten = u));
    return () => {
      unlisten && unlisten();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{app_state_string}</p>
        <button onClick={command}>refresh devices</button>
        <h4>Devices:</h4>
        {devices.map((device) => (
          <div key={device.serial}>{device.serial} - {device.info.device}, {device.info.model}</div>
        ))}
      </header>
    </div>
  );
}

export default App;
