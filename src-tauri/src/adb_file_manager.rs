use mozdevice::{RemoteDirEntry, RemoteMetadata};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct DeviceDirEntry {
    name: String,
    meta: DeviceDirEntryKind,
}

impl From<RemoteDirEntry> for DeviceDirEntry {
    fn from(entry: RemoteDirEntry) -> Self {
        Self {
            name: entry.name,
            meta: entry.metadata.into(),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
pub enum DeviceDirEntryKind {
    File { mode: usize, size: usize },
    Dir,
    Symlink,
    CharacterSpecialFile,
    Socket,
    Block,
    NamedPipe,
}

impl From<RemoteMetadata> for DeviceDirEntryKind {
    fn from(metadata: RemoteMetadata) -> Self {
        match metadata {
            RemoteMetadata::RemoteFile(file_info) => DeviceDirEntryKind::File {
                mode: file_info.mode,
                size: file_info.size,
            },
            RemoteMetadata::RemoteDir => DeviceDirEntryKind::Dir,
            RemoteMetadata::RemoteSymlink => DeviceDirEntryKind::Symlink,
            RemoteMetadata::RemoteCharacterSpecialFile => DeviceDirEntryKind::CharacterSpecialFile,
            RemoteMetadata::RemoteSocket => DeviceDirEntryKind::Socket,
            RemoteMetadata::RemoteBlock => DeviceDirEntryKind::Block,
            RemoteMetadata::RemoteNamedPipe => DeviceDirEntryKind::NamedPipe,
        }
    }
}
