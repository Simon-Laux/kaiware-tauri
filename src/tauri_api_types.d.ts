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
};

type TauriAppState = {
  has_auto_detect_usb: boolean;
};
