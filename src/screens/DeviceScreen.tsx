import { Device, useStore } from "../stores/AppState";
import "./DeviceScreen.css";

export function DeviceScreen({ device_id }: { device_id: string }) {
  const device = useStore((state) =>
    state.devices.find(({ serial }) => serial === device_id)
  );

  if (!device) {
    return <div>Internal Error, referenced device not found in app state</div>;
  }

  return (
    <div>
      <h2 style={device.isConnected ? {} : { color: "grey" }}>
        <div
          className={"connection-dot"}
          style={{ backgroundColor: device.isConnected ? "green" : "red" }}
        />
        [{device.serial}] {device.adbInfo.model}
      </h2>

      <h3>ADB Device Info</h3>
      <table style={{ textAlign: "left" }}>
        {Object.keys(device.adbInfo).map((key) => (
          <tr>
            <td>{key}</td>
            <td>{device.adbInfo[key as keyof Device["adbInfo"]]}</td>
          </tr>
        ))}
      </table>

      <h3>FirefoxOS / KaiOS Debug socket</h3>
      <p>{device.hasFirefoxOSDebugSocket ? "found" : "not found"}</p>
    </div>
  );
}
