use rusb::{Context, Device, HotplugBuilder, UsbContext};
use tauri::Manager;
use tauri::{AppHandle, Runtime};

pub(crate) struct HotPlugHandler<R>
where
    R: Runtime,
{
    app: AppHandle<R>,
}

impl<T: UsbContext, R: Runtime> rusb::Hotplug<T> for HotPlugHandler<R> {
    fn device_arrived(&mut self, device: Device<T>) {
        println!("device arrived {:?}", device);
        match self.app.emit_all("usb-devices-changed", ()) {
            Ok(_) => {}
            Err(err) => println!("{:?}", err),
        }
    }

    fn device_left(&mut self, device: Device<T>) {
        println!("device left {:?}", device);
        match self.app.emit_all("usb-devices-changed", ()) {
            Ok(_) => {}
            Err(err) => println!("{:?}", err),
        }
    }
}

impl<R: Runtime> Drop for HotPlugHandler<R> {
    fn drop(&mut self) {
        println!("HotPlugHandler dropped");
    }
}

pub(crate) fn setup_usb_change_handler<R: Runtime>(
    context: Context,
    app: AppHandle<R>,
) -> rusb::Result<()> {
    if rusb::has_hotplug() {
        let mut _reg = Some(
            HotplugBuilder::new()
                .enumerate(true)
                .register::<Context, &Context>(&context, Box::new(HotPlugHandler { app }))?,
        );

        loop {
            context.handle_events(None).unwrap();
        }
        //context.unregister_callback(reg.unwrap());
        //Ok(())
    } else {
        eprint!("libusb hotplug api unsupported");
        Ok(())
    }
}
