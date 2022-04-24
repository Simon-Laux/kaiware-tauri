use std::str::FromStr;

use mozdevice::{AndroidStorageInput, DeviceError};
use serde::{Serialize, __private::de::IdentifierDeserializer};

#[derive(Debug, Serialize, PartialEq)]
pub enum ADBForwardingRule {
    /** forward from device to host */
    Forward {
        serial: String,
        local: String,
        remote: String,
    },
    /** reverse-forward from host to device */
    Reverse {
        serial: String,
        remote: String,
        local: String,
    },
}

#[derive(Debug, Serialize)]
pub struct ADBDeviceForwardingRules(Vec<ADBForwardingRule>);

impl ADBDeviceForwardingRules {
    pub async fn fetch(device_serial: &str) -> Result<Self, DeviceError> {
        let mut rules = Vec::new();
        let host = mozdevice::Host {
            ..Default::default()
        };

        // see https://cs.android.com/android/platform/superproject/+/master:packages/modules/adb/SERVICES.TXT
        // for the host_command docs
        let raw_forwards = host.execute_host_command(
            &format!("host-serial:{}:list-forward", device_serial),
            true,
            true,
        )?;
        // parse result
        if let Some(forwards) = parse_forward_list(&raw_forwards) {
            println!("forwards {:?}", forwards);
            rules.extend(forwards)
        } else {
            eprintln!("could not parse forward list {:?}", raw_forwards);
        }

        let raw_reverse_forwards = host.execute_host_command(
            &format!("host-serial:{}:reverse:list-forward", device_serial),
            true,
            true,
        )?;
        // parse result
        if let Some(forwards) = parse_forward_list(&raw_reverse_forwards) {
            println!("reverse-forwards {:?}", forwards);
            // rules.extend(forwards)
        } else {
            eprintln!(
                "could not parse reverse-forwards list {:?}",
                raw_reverse_forwards
            );
        }

        Ok(ADBDeviceForwardingRules(vec![]))
    }
}

fn parse_forward_list(input: &str) -> Option<Vec<ADBForwardingRule>> {
    let mut parsedRules: Vec<ADBForwardingRule> = Vec::new();
    for rule in input.split('\n') {
        if rule.is_empty() {
            continue;
        }
        let mut rule_parts = rule.split(' ');
        parsedRules.push(ADBForwardingRule::Forward {
            serial: rule_parts.next()?.to_owned(),
            local: rule_parts.next()?.to_owned(),
            remote: rule_parts.next()?.to_owned(),
        })
    }
    Some(parsedRules)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_forwarding() {
        assert_eq!(
            parse_forward_list("200006 tcp:25557 tcp:25555\n").unwrap(),
            vec![ADBForwardingRule::Forward {
                serial: "200006".to_owned(),
                local: "tcp:25557".to_owned(),
                remote: "tcp:25555".to_owned()
            }]
        );
        assert_eq!(
            parse_forward_list("200007 tcp:25557 tcp:25554\n200006 tcp:25557 tcp:25555\n").unwrap(),
            vec![
                ADBForwardingRule::Forward {
                    serial: "200007".to_owned(),
                    local: "tcp:25557".to_owned(),
                    remote: "tcp:25554".to_owned()
                },
                ADBForwardingRule::Forward {
                    serial: "200006".to_owned(),
                    local: "tcp:25557".to_owned(),
                    remote: "tcp:25555".to_owned()
                }
            ]
        );
    }

    use tauri::async_runtime;

    use crate::adb_portforwarding::ADBDeviceForwardingRules;

    #[test]
    fn live_test_during_dev() -> anyhow::Result<()> {
        async_runtime::block_on(async { super::ADBDeviceForwardingRules::fetch("your device serial here").await })?;
        assert!(false);
        Ok(())
    }
}
