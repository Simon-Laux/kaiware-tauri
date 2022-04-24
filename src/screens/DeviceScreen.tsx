import { useStore } from "../stores/AppState";

export function DeviceScreen({ device_id }: { device_id: string }) {
  const device = useStore((state) =>
    state.devices.find(({ serial }) => serial === device_id)
  );

  if (!device) {
    return <div>Internal Error, referenced device not found in app state</div>;
  }

  return (
    <div>
      <h2>
        [{device.serial}] {device.adbInfo.model}
      </h2>
    </div>
  );
}
