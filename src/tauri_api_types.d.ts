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

type TauriAppState = {
  has_auto_detect_usb: boolean;
};
