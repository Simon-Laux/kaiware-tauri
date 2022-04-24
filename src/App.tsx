import React, { useState } from "react";
import "./App.css";
import { useStore } from "./stores/AppState";
import { DeviceScreen } from "./screens/DeviceScreen";
import { HomeScreen } from "./screens/HomeScreen";

function App() {
  const appState = useStore();

  const [selectedDevice, selectDevice] = useState<null | string>();

  return (
    <div className="App">
      <header className="App-header">
        <p>
          {appState.tauri_app_info && JSON.stringify(appState.tauri_app_info)}
        </p>
        <button onClick={appState.manualRefresh}>refresh devices</button>
      </header>
      {selectedDevice && (
        <button onClick={(_) => selectDevice(null)}>Back</button>
      )}
      {selectedDevice ? (
        <DeviceScreen device_id={selectedDevice} />
      ) : (
        <HomeScreen
          selectDevice={(serial) => {
            selectDevice(serial);
          }}
        />
      )}
    </div>
  );
}

export default App;
