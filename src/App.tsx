import React, { useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { invoke } from "@tauri-apps/api/tauri";
import { useStore } from "./stores/AppState";

function App() {
  const appState = useStore();

  const [app_state_string, set_app_state] = useState<TauriAppState | null>(
    null
  );

  useEffect(() => {
    invoke("get_app_state").then((v) => set_app_state(v as TauriAppState));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{app_state_string && JSON.stringify(app_state_string)}</p>
        <button onClick={appState.manualRefresh}>refresh devices</button>
        <h4>Devices:</h4>
        {appState.devices.map((device) => (
          <div key={device.serial}>
            {device.serial} - {device.adbInfo.device}, {device.adbInfo.model} [
            {device.isConnected ? "Connected" : "Disconnected"}]
          </div>
        ))}
      </header>
    </div>
  );
}

export default App;
