import { useStore } from "../stores/AppState";

export function HomeScreen({
  selectDevice,
}: {
  selectDevice: (serial: string) => void;
}) {
  const appState = useStore();

  return (
    <div>
      <h4>Devices:</h4>
      {appState.devices.map((device) => (
        <div
          key={device.serial}
          onClick={() => {
            selectDevice(device.serial);
          }}
        >
          {device.serial} - {device.adbInfo.device}, {device.adbInfo.model} [
          {device.isConnected ? "Connected" : "Disconnected"}]
        </div>
      ))}
    </div>
  );
}
