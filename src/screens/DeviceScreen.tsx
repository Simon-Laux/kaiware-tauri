import { invoke } from "@tauri-apps/api";
import { useEffect, useState } from "react";
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
        <tbody>
          {Object.keys(device.adbInfo).map((key) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{device.adbInfo[key as keyof Device["adbInfo"]]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>FirefoxOS / KaiOS Debug socket</h3>
      <p>{device.hasFirefoxOSDebugSocket ? "found" : "not found"}</p>

      <h3>Files</h3>
      <FileManager device_id={device_id} />
    </div>
  );
}

function FileManager({ device_id }: { device_id: string }) {
  const [path, set_path] = useState("/");
  const [displayed_path, set_displayed_path] = useState("/");
  const [entries, set_entries] = useState<DeviceDirEntry[]>([]);
  const [error, set_error] = useState<null | string>(null);

  useEffect(() => {
    set_error(null);
    invoke("adb_read_dir", { deviceSerial: device_id, path })
      .then((e) => {
        set_entries(e as DeviceDirEntry[]);
      })
      .catch((err) => {
        console.log(err);
        set_entries([]);
        set_error(JSON.stringify(err));
      })
      .finally(() => {
        set_displayed_path(path);
      });
  }, [device_id, path]);

  const navigateBack = () => {
    let p = path.split("/");
    p.pop();
    set_path(p.join("/") || "/");
  };

  return (
    <div>
      <button onClick={set_path.bind(null, "/")}>Goto /</button>
      <h6>Index of {displayed_path}</h6>
      <table>
        <thead>
          <tr>
            <td>[icon]</td>
            <td>Name</td>
            <td>Type</td>
            <td>Metadata?</td>
          </tr>
        </thead>
        <tbody>
          {displayed_path === "/" || (
            <tr key={"the_up_button"} onClick={navigateBack.bind(null)}>
              <td>..</td>
              <td>Up one directory</td>
              <td></td>
              <td></td>
            </tr>
          )}

          {entries.map((entry) => {
            let clickHandler = undefined;

            if (entry.meta.type === "Dir") {
              clickHandler = set_path.bind(
                null,
                (path === "/" ? path : path + "/") + entry.name
              );
            }

            return (
              <tr key={path + entry.name} onClick={clickHandler}>
                <td>{entry.meta.type.charAt(0)}</td>
                <td>{entry.name}</td>
                <td>{entry.meta.type}</td>
                <td>{JSON.stringify({ ...entry.meta, type: undefined })}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
