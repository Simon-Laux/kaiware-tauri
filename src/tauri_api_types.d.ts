type ADBDevice = {
  serial: string;
  info: {
    device?: string;
    model?: string;
    product?: string;
    transport_id?: string;
    usb?: string;
  };
  has_firefox_os_socket: boolean;
  is_adbd_root: boolean;
};

type TauriAppState = {
  has_auto_detect_usb: boolean;
};

type DeviceDirEntry = {
  name: string;
  meta:
    | { type: "File"; mode: number; size: number }
    | { type: "Dir" }
    | { type: "Symlink" }
    | { type: "CharacterSpecialFile" }
    | { type: "Socket" }
    | { type: "Block" }
    | { type: "NamedPipe" };
};
